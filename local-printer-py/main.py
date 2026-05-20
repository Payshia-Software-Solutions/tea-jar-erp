import os
import sys
import json
import threading
import socket
import win32print
import win32api
import win32con
import winreg as reg
import tempfile
import queue
from flask import Flask, request, jsonify
from flask_cors import CORS
import pystray
from PIL import Image, ImageDraw
import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
from datetime import datetime
import win32com.client

app = Flask(__name__)
CORS(app)

# Configuration
CONFIG_FILE = 'config.json'
LOG_FILE = 'print_history.log'
DEFAULT_CONFIG = {
    "printerName": "",
    "port": 5001,
    "paperWidth": "80mm",
    "useBrowserPrint": False,
    "runAtStartup": False
}

gui_queue = queue.Queue()

def log_print(title, printer, status):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] DOC: {title} | PRINTER: {printer} | STATUS: {status}\n"
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(log_entry)
    except: pass

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return {**DEFAULT_CONFIG, **json.load(f)}
        except: return DEFAULT_CONFIG
    return DEFAULT_CONFIG

def save_config(config_data):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config_data, f, indent=4)

config = load_config()

# --- UTILS ---
def set_startup(enabled=True):
    key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    app_name = "BizzFlowPrinter"
    
    # Use the current executable path
    if getattr(sys, 'frozen', False):
        exe_path = sys.executable
    else:
        exe_path = f'"{sys.executable}" "{os.path.abspath(sys.argv[0])}"'
    
    try:
        key = reg.OpenKey(reg.HKEY_CURRENT_USER, key_path, 0, reg.KEY_SET_VALUE)
        if enabled:
            reg.SetValueEx(key, app_name, 0, reg.REG_SZ, exe_path)
        else:
            try:
                reg.DeleteValue(key, app_name)
            except FileNotFoundError:
                pass
        reg.CloseKey(key)
        return True
    except Exception as e:
        print(f"Error setting startup: {e}")
        return False

def create_desktop_shortcut():
    try:
        desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
        path = os.path.join(desktop, "BizzFlow Printer.lnk")
        
        if getattr(sys, 'frozen', False):
            target = sys.executable
            arguments = ""
        else:
            target = sys.executable
            arguments = f'"{os.path.abspath(sys.argv[0])}"'
            
        shell = win32com.client.Dispatch("WScript.Shell")
        shortcut = shell.CreateShortCut(path)
        shortcut.Targetpath = target
        shortcut.Arguments = arguments
        shortcut.WorkingDirectory = os.path.dirname(os.path.abspath(sys.argv[0]))
        shortcut.IconLocation = target
        shortcut.save()
        return True
    except Exception as e:
        print(f"Error creating shortcut: {e}")
        return False

# --- PRINTING LOGIC ---
def get_windows_printers():
    printers = []
    try:
        raw_printers = win32print.EnumPrinters(2 | 4)
        for p in raw_printers:
            printers.append(p[2])
    except: pass
    return printers

def silent_print_pdf(pdf_path, printer_name, doc_title="Unknown"):
    try:
        try:
            h_printer = win32print.OpenPrinter(printer_name)
            win32print.ClosePrinter(h_printer)
        except Exception as e:
            log_print(doc_title, printer_name, f"FAILED: {str(e)}")
            return False, f"Cannot connect to '{printer_name}'."

        win32api.ShellExecute(0, "printto", pdf_path, f'"{printer_name}"', ".", 0)
        log_print(doc_title, printer_name, "SUCCESS")
        return True, "Success"
    except Exception as e:
        log_print(doc_title, printer_name, f"ERROR: {str(e)}")
        return False, str(e)

# --- API ENDPOINTS ---
@app.route('/settings', methods=['GET'])
def get_settings():
    return jsonify({"success": True, "data": config})

@app.route('/printers', methods=['GET'])
def list_printers():
    return jsonify({
        "success": True,
        "data": [{"name": p} for p in get_windows_printers()]
    })

@app.route('/print', methods=['POST'])
def print_job():
    if config.get("useBrowserPrint"):
        return jsonify({"success": False, "message": "Browser printing is enabled in settings."})

    data = request.json
    html_content = data.get('html', '')
    target_printer = data.get('printer', config['printerName'])
    doc_title = data.get('title', 'BizzFlow Print Job')
    
    if not target_printer:
        return jsonify({"success": False, "message": "No printer selected"})

    # Queue the UI update on the main thread
    gui_queue.put(lambda: show_print_status(html_content, target_printer, doc_title))
    return jsonify({"success": True, "printer": target_printer})

# --- GUI COMPONENTS ---
def show_print_status(html_content, target_printer, doc_title):
    status_window = tk.Toplevel(root)
    status_window.title("BizzFlow Print Manager")
    status_window.geometry("350x180")
    status_window.attributes("-topmost", True)
    status_window.overrideredirect(True)
    
    ws = status_window.winfo_screenwidth()
    hs = status_window.winfo_screenheight()
    status_window.geometry(f"+{int(ws - 370)}+{int(hs - 250)}")

    bg_color = "#f8f9fa"
    accent_color = "#0066cc"
    
    main_frame = tk.Frame(status_window, bg=accent_color, bd=1)
    main_frame.place(relx=0, rely=0, relwidth=1, relheight=1)
    content = tk.Frame(main_frame, bg=bg_color)
    content.place(relx=0.01, rely=0.01, relwidth=0.98, relheight=0.98)
    
    header = tk.Frame(content, bg=accent_color, height=30)
    header.pack(fill="x")
    tk.Label(header, text="BIZZFLOW PRINT MANAGER", font=("Arial", 8, "bold"), fg="white", bg=accent_color).pack(pady=5)

    body = tk.Frame(content, bg=bg_color, padx=20, pady=15)
    body.pack(fill="both", expand=True)
    tk.Label(body, text=doc_title[:30] + "..." if len(doc_title) > 30 else doc_title, font=("Arial", 12, "bold"), bg=bg_color, fg="#333").pack(anchor="w")
    
    status_var = tk.StringVar(value="Printing...")
    status_label = tk.Label(body, textvariable=status_var, font=("Arial", 9), bg=bg_color, fg="#666")
    status_label.pack(anchor="w", pady=(2, 10))

    progress_bg = tk.Frame(body, bg="#ddd", height=6)
    progress_bg.pack(fill="x")
    progress_fg = tk.Frame(progress_bg, bg=accent_color, height=6, width=10)
    progress_fg.place(x=0, y=0)

    def process():
        try:
            edge_paths = [
                r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                "msedge.exe"
            ]
            edge_cmd = "msedge"
            for p in edge_paths:
                if os.path.exists(p) or p == "msedge.exe":
                    edge_cmd = f'"{p}"'
                    break

            with tempfile.NamedTemporaryFile(suffix=".html", delete=False) as f:
                f.write(html_content.encode('utf-8'))
                temp_html = f.name

            cmd = f'{edge_cmd} --headless --print-to-pdf="{temp_html}.pdf" "{temp_html}"'
            subprocess.run(cmd, shell=True)
            
            pdf_path = f"{temp_html}.pdf"
            if not os.path.exists(pdf_path):
                raise Exception("Failed to generate PDF")

            progress_fg.config(width=250)
            
            success, msg = silent_print_pdf(pdf_path, target_printer, doc_title)
            
            if success:
                status_var.set("Success!")
                progress_fg.config(bg="#28a745", width=310)
                wait_time = 2000
            else:
                status_var.set("Failed")
                progress_fg.config(bg="#dc3545")
                # We need to call messagebox on main thread or via gui_queue
                # But since we are in a thread, we use gui_queue for safety
                gui_queue.put(lambda: messagebox.showerror("Error", msg))
                wait_time = 3000
            
            def cleanup():
                import time
                time.sleep(30)
                try:
                    if os.path.exists(temp_html): os.unlink(temp_html)
                    if os.path.exists(pdf_path): os.unlink(pdf_path)
                except: pass
            threading.Thread(target=cleanup, daemon=True).start()
        except Exception as e:
            status_var.set("Error")
            wait_time = 3000
        finally:
            status_window.after(wait_time, status_window.destroy)

    threading.Thread(target=process, daemon=True).start()

settings_window = None

def show_settings():
    global settings_window
    if settings_window is not None:
        try:
            settings_window.lift()
            return
        except:
            settings_window = None

    settings_window = tk.Toplevel(root)
    settings_window.title("BizzFlow Printer Settings")
    settings_window.geometry("450x550")
    settings_window.protocol("WM_DELETE_WINDOW", lambda: close_settings())
    
    main_frame = ttk.Frame(settings_window, padding="20")
    main_frame.pack(fill="both", expand=True)

    ttk.Label(main_frame, text="BizzFlow Local Print Service", font=("Arial", 14, "bold")).pack(pady=(0, 20))

    # Printer Selection
    ttk.Label(main_frame, text="Default Printer:").pack(anchor="w")
    printer_var = tk.StringVar(value=config['printerName'])
    printer_dropdown = ttk.Combobox(main_frame, textvariable=printer_var)
    printer_dropdown['values'] = get_windows_printers()
    printer_dropdown.pack(fill="x", pady=(5, 15))

    # Port
    ttk.Label(main_frame, text="Server Port:").pack(anchor="w")
    port_var = tk.StringVar(value=str(config['port']))
    ttk.Entry(main_frame, textvariable=port_var).pack(fill="x", pady=(5, 15))

    # Browser Print Toggle
    browser_print_var = tk.BooleanVar(value=config.get('useBrowserPrint', False))
    ttk.Checkbutton(main_frame, text="Use Browser Default Printing (Show Print Dialog)", variable=browser_print_var).pack(anchor="w", pady=(5, 10))

    # Startup Toggle
    startup_var = tk.BooleanVar(value=config.get('runAtStartup', False))
    ttk.Checkbutton(main_frame, text="Run at Startup", variable=startup_var).pack(anchor="w", pady=(5, 15))

    def save():
        try:
            config['printerName'] = printer_var.get()
            config['port'] = int(port_var.get())
            config['useBrowserPrint'] = browser_print_var.get()
            config['runAtStartup'] = startup_var.get()
            
            save_config(config)
            set_startup(config['runAtStartup'])
            
            messagebox.showinfo("Success", "Settings saved successfully!")
            close_settings()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save settings: {e}")

    def close_settings():
        global settings_window
        settings_window.destroy()
        settings_window = None

    def view_logs():
        if os.path.exists(LOG_FILE):
            os.startfile(LOG_FILE)
        else:
            messagebox.showinfo("Logs", "No print history found yet.")

    def install_shortcut():
        if create_desktop_shortcut():
            messagebox.showinfo("Success", "Desktop shortcut created!")
        else:
            messagebox.showerror("Error", "Failed to create shortcut.")

    ttk.Button(main_frame, text="Save Settings", command=save).pack(fill="x", pady=5)
    ttk.Button(main_frame, text="View Print Logs", command=view_logs).pack(fill="x", pady=5)
    ttk.Button(main_frame, text="Create Desktop Shortcut", command=install_shortcut).pack(fill="x", pady=5)

def run_server():
    try:
        app.run(host='0.0.0.0', port=config['port'], debug=False, use_reloader=False)
    except Exception as e:
        print(f"Server error: {e}")

def create_tray():
    image = Image.new('RGB', (64, 64), color=(0, 102, 204))
    d = ImageDraw.Draw(image)
    d.text((10, 20), "BIZ", fill=(255, 255, 255))

    def on_settings(icon, item):
        gui_queue.put(show_settings)

    def on_exit(icon, item):
        icon.stop()
        gui_queue.put(root.destroy)

    def on_logs(icon, item):
        if os.path.exists(LOG_FILE):
            os.startfile(LOG_FILE)

    menu = pystray.Menu(
        pystray.MenuItem("Settings", on_settings),
        pystray.MenuItem("View Logs", on_logs),
        pystray.MenuItem("Exit", on_exit)
    )
    
    icon = pystray.Icon("BizzFlowPrinter", image, "BizzFlow Printer Bridge", menu)
    icon.run()

def check_gui_queue():
    try:
        while True:
            callback = gui_queue.get_nowait()
            callback()
    except queue.Empty:
        pass
    root.after(100, check_gui_queue)

if __name__ == '__main__':
    # Initialize Root but hide it
    root = tk.Tk()
    root.withdraw()
    
    # Check for GUI requests every 100ms
    root.after(100, check_gui_queue)
    
    # Start background tasks
    threading.Thread(target=run_server, daemon=True).start()
    threading.Thread(target=create_tray, daemon=True).start()
    
    # Ensure startup setting is applied on launch
    if config.get('runAtStartup'):
        set_startup(True)
    
    # Main Loop (on main thread)
    root.mainloop()
    os._exit(0)
