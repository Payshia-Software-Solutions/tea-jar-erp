/**
 * Silent Print Utility
 * Sends HTML content to the local print service
 */
export const silentPrint = async (html: string, printerNameOrType?: string, paperWidth: '80mm' | '58mm' = '80mm', docName: string = 'BizzFlow Print Job') => {
  // Detect if we are on Android
  const isAndroid = /Android/i.test(navigator.userAgent);
  let targetPrinter = printerNameOrType;

  // If a Type is provided (e.g., 'KOT', 'Receipt') instead of a hardware name, fetch the mapping from ERP
  if (printerNameOrType && ['Receipt', 'KOT', 'Bar', 'Label'].includes(printerNameOrType)) {
      try {
          const res = await fetch(`http://localhost/rapair-management/server/public/api/printer/get_settings`);
          const data = await res.json();
          if (data.success) {
              const mapping = data.data.find((s: any) => s.printer_type === printerNameOrType);
              if (mapping) {
                  targetPrinter = mapping.printer_name;
              }
          }
      } catch (e) {
          console.error('Failed to lookup printer mapping:', e);
      }
  }

  if (isAndroid) {
    try {
      const encodedHtml = btoa(unescape(encodeURIComponent(html)));
      const intentUrl = `intent:${encodedHtml}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.text_type=html;end;`;
      window.location.href = intentUrl;
      return { success: true, printer: 'Android RawBT' };
    } catch (error) {
      console.error('Android RawBT print failed:', error);
      return { success: false, printer: 'Android RawBT' };
    }
  }

  try {
    const response = await fetch('http://127.0.0.1:5001/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html,
        printer: targetPrinter,
        width: paperWidth,
        title: docName
      }),
    });

    const data = await response.json();
    return { success: data.success, printer: targetPrinter || 'Default Printer' };
  } catch (error) {
    console.error('Silent print failed:', error);
    return { success: false, printer: targetPrinter || 'Default Printer' };
  }
};

/**
 * Checks if the local print service is running
 */
export const isPrinterServiceAvailable = async () => {
  if (/Android/i.test(navigator.userAgent)) return true;

  const endpoints = ['http://127.0.0.1:5001/printers', 'http://localhost:5001/printers'];
  for (const url of endpoints) {
      try {
          const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000) });
          if (response.ok) return true;
      } catch (e) {}
  }
  return false;
};
