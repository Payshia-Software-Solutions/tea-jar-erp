const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const puppeteer = require('puppeteer-core');
const ptp = require('pdf-to-printer');
const fs = require('fs');
const path = require('path');
const SysTray = require('systray2').default;
const { exec } = require('child_process');

/**
 * Finds the path to Chrome or Edge on Windows
 */
function getBrowserPath() {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

const app = express();
const configPath = path.join(__dirname, 'config.json');
let config = { printerName: 'Receipt-Printer', paperWidth: '80mm', port: 5001 };

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            config = { ...config, ...JSON.parse(data) };
        }
    } catch (e) { console.error('Load config error:', e); }
}
loadConfig();

const port = config.port || 5001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors()); // Enable pre-flight for all routes
app.use(bodyParser.json({ limit: '50mb' }));

// --- PRINT ENDPOINT ---
app.post('/print', async (req, res) => {
    const { html, printer = config.printerName, width = config.paperWidth } = req.body;
    if (!html) return res.status(400).json({ success: false, error: 'HTML content is required' });

    let browser;
    try {
        const executablePath = getBrowserPath();
        if (!executablePath) throw new Error('Chrome/Edge not found.');

        browser = await puppeteer.launch({
            executablePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        const widthPx = width.includes('80') ? 302 : 219;
        await page.setViewport({ width: widthPx, height: 1000 });
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfPath = path.join(__dirname, `temp_${Date.now()}.pdf`);
        await page.pdf({ path: pdfPath, width, printBackground: true, margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' } });
        await browser.close();

        await ptp.print(pdfPath, { printer });
        fs.unlinkSync(pdfPath);
        res.json({ success: true });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- ADMIN GUI (Lightweight HTML) ---
app.get('/', async (req, res) => {
    let printerOptions = '';
    try {
        const printers = await ptp.getPrinters();
        printerOptions = printers.map(p => 
            `<option value="${p.name}" ${p.name === config.printerName ? 'selected' : ''}>${p.name}</option>`
        ).join('');
    } catch (e) {
        printerOptions = `<option value="${config.printerName}">${config.printerName}</option>`;
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>BizzFlow Printer Manager</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f7f6; color: #333; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 380px; }
                h1 { margin: 0 0 20px; font-size: 20px; color: #1a56db; text-align: center; }
                .field { margin-bottom: 20px; }
                label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #666; }
                select, input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; background: #fafafa; font-size: 14px; }
                select:focus { border-color: #1a56db; outline: none; background: white; }
                button { width: 100%; padding: 14px; background: #1a56db; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; font-size: 15px; transition: all 0.2s; }
                button:hover { background: #1e429f; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(26, 86, 219, 0.2); }
                .status { text-align: center; font-size: 12px; margin-top: 25px; color: #057a55; display: flex; align-items: center; justify-content: center; gap: 8px; border-top: 1px solid #eee; padding-top: 20px; }
                .dot { width: 10px; height: 10px; background: #31c48d; border-radius: 50%; box-shadow: 0 0 0 4px rgba(49, 196, 141, 0.1); }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🖨 Printer Manager</h1>
                <form action="/save" method="POST">
                    <div class="field">
                        <label>SELECT THERMAL PRINTER</label>
                        <select name="printerName">
                            <option value="">-- Choose a printer --</option>
                            ${printerOptions}
                        </select>
                    </div>
                    <div class="field">
                        <label>PAPER WIDTH</label>
                        <select name="paperWidth">
                            <option value="80mm" ${config.paperWidth === '80mm' ? 'selected' : ''}>80mm (Standard)</option>
                            <option value="58mm" ${config.paperWidth === '58mm' ? 'selected' : ''}>58mm (Small)</option>
                        </select>
                    </div>
                    <button type="submit">Apply & Save Settings</button>
                </form>
                <div class="status">
                    <div class="dot"></div> 
                    Service is active on port ${port}
                </div>
            </div>
        </body>
        </html>
    `);
});

app.post('/save', bodyParser.urlencoded({ extended: true }), (req, res) => {
    config.printerName = req.body.printerName;
    config.paperWidth = req.body.paperWidth;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.send('<script>alert("Settings Saved! Restarting service..."); window.location.href="/";</script>');
    process.exit(0); // PM2 will restart it
});

app.get('/printers', async (req, res) => {
    try { res.json({ success: true, data: await ptp.getPrinters() }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SYSTEM TRAY ---
const trayConfig = {
    menu: {
        items: [
            { title: 'BizzFlow Printer: Online', enabled: false },
            { title: 'Open Settings', tooltip: 'Configure Printer', callback: { click: () => exec(`start http://localhost:${port}`) } },
            { title: '---', enabled: false },
            { title: 'Restart Service', callback: { click: () => process.exit(0) } },
            { title: 'Exit', callback: { click: () => { tray.kill(); process.exit(0); } } }
        ]
    },
    icon: fs.readFileSync(path.join(__dirname, 'icon.png')).toString('base64'),
    tooltip: 'BizzFlow Printer Service'
};

let tray;
try {
    // Check if icon exists, if not use a fallback empty string or throw
    if (fs.existsSync(path.join(__dirname, 'icon.png'))) {
        tray = new SysTray(trayConfig);
        tray.ready(() => {
            console.log('Tray is ready');
            tray.on('click', (item) => {
                if (item.callback && item.callback.click) item.callback.click();
            });
        });
    }
} catch (e) { console.log('Tray failed to start:', e.message); }

app.listen(port, '0.0.0.0', () => {
    console.log(`Print Service + GUI running at http://localhost:${port}`);
});
