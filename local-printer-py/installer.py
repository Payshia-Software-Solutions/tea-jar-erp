import os
import sys
import shutil
import winreg as reg
import win32com.client
import pythoncom
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import time

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

APP_NAME = "BizzFlow Printer"
EXE_NAME = "bizzflow-printer.exe"
# Updated to Program Files (x86) as requested
DEFAULT_INSTALL_DIR = os.path.join(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"), "BizzFlowPrinter")

class InstallerApp:
    def __init__(self, root):
        self.root = root
        self.root.title(f"{APP_NAME} Setup")
        self.root.geometry("500x350")
        self.root.resizable(False, False)
        
        self.install_dir = tk.StringVar(value=DEFAULT_INSTALL_DIR)
        self.current_page = 0
        self.frames = []
        
        self.setup_ui()
        self.show_page(0)

    def setup_ui(self):
        # Page 0: Welcome
        f0 = tk.Frame(self.root, padx=20, pady=20)
        tk.Label(f0, text=f"Welcome to {APP_NAME} Setup", font=("Arial", 16, "bold")).pack(pady=(20, 10))
        tk.Label(f0, text="This wizard will guide you through the installation of BizzFlow Local Print Service.", wraplength=450, justify="left").pack(pady=10)
        tk.Label(f0, text="Click Next to continue.", pady=20).pack(side="bottom")
        self.frames.append(f0)
        
        # Page 1: Path Selection
        f1 = tk.Frame(self.root, padx=20, pady=20)
        tk.Label(f1, text="Choose Install Location", font=("Arial", 12, "bold")).pack(anchor="w", pady=(0, 10))
        tk.Label(f1, text=f"Setup will install {APP_NAME} in the following folder. To install in a different folder, click Browse and select another folder.", wraplength=450, justify="left").pack(pady=10)
        
        path_frame = tk.Frame(f1)
        path_frame.pack(fill="x", pady=10)
        tk.Entry(path_frame, textvariable=self.install_dir).pack(side="left", fill="x", expand=True, padx=(0, 5))
        tk.Button(path_frame, text="Browse...", command=self.browse_path).pack(side="right")
        self.frames.append(f1)
        
        # Page 2: Installing
        f2 = tk.Frame(self.root, padx=20, pady=20)
        tk.Label(f2, text="Installing...", font=("Arial", 12, "bold")).pack(anchor="w", pady=(0, 10))
        self.progress = ttk.Progressbar(f2, mode="determinate", length=400)
        self.progress.pack(pady=20)
        self.status_label = tk.Label(f2, text="Preparing files...")
        self.status_label.pack()
        self.frames.append(f2)
        
        # Page 3: Finished
        f3 = tk.Frame(self.root, padx=20, pady=20)
        tk.Label(f3, text="Installation Complete", font=("Arial", 16, "bold")).pack(pady=(20, 10))
        tk.Label(f3, text=f"{APP_NAME} has been installed on your computer.", pady=10).pack()
        self.run_after = tk.BooleanVar(value=True)
        tk.Checkbutton(f3, text=f"Run {APP_NAME} now", variable=self.run_after).pack(pady=10)
        self.frames.append(f3)
        
        # Navigation Buttons
        self.nav_frame = tk.Frame(self.root, pady=10, padx=10)
        self.nav_frame.pack(side="bottom", fill="x")
        
        self.btn_cancel = tk.Button(self.nav_frame, text="Cancel", command=self.root.quit, width=10)
        self.btn_cancel.pack(side="right", padx=5)
        
        self.btn_next = tk.Button(self.nav_frame, text="Next >", command=self.next_page, width=10)
        self.btn_next.pack(side="right", padx=5)
        
        self.btn_back = tk.Button(self.nav_frame, text="< Back", command=self.back_page, width=10)
        self.btn_back.pack(side="right", padx=5)

    def show_page(self, page_index):
        for i, f in enumerate(self.frames):
            if i == page_index:
                f.place(relx=0, rely=0, relwidth=1, relheight=0.85)
            else:
                f.place_forget()
        
        self.btn_back.config(state="normal" if page_index in [1] else "disabled")
        if page_index == 3:
            self.btn_next.config(text="Finish", command=self.finish)
            self.btn_cancel.config(state="disabled")
        elif page_index == 2:
            self.btn_next.config(state="disabled")
            self.btn_back.config(state="disabled")
            self.btn_cancel.config(state="disabled")
            threading.Thread(target=self.run_install, daemon=True).start()
        else:
            self.btn_next.config(text="Next >", command=self.next_page, state="normal")

    def next_page(self):
        self.current_page += 1
        self.show_page(self.current_page)

    def back_page(self):
        self.current_page -= 1
        self.show_page(self.current_page)

    def browse_path(self):
        path = filedialog.askdirectory(initialdir=self.install_dir.get())
        if path:
            self.install_dir.set(os.path.join(path, "BizzFlowPrinter"))

    def run_install(self):
        pythoncom.CoInitialize()
        target_dir = self.install_dir.get()
        try:
            # 1. Create directory
            self.update_status("Creating directory...", 10)
            os.makedirs(target_dir, exist_ok=True)
            
            # 2. Copy files
            self.update_status("Copying application files...", 30)
            src_exe = get_resource_path(EXE_NAME)
            
            if os.path.exists(src_exe):
                shutil.copy2(src_exe, os.path.join(target_dir, EXE_NAME))
            else:
                # Fallback for dev
                src_exe_dev = os.path.join("dist", EXE_NAME)
                if os.path.exists(src_exe_dev):
                    shutil.copy2(src_exe_dev, os.path.join(target_dir, EXE_NAME))
                else:
                    raise Exception(f"Source file not found: {src_exe}")
            
            # 3. Create Shortcuts
            self.update_status("Creating shortcuts...", 60)
            self.create_shortcuts(target_dir)
            
            # 4. Registry for Add/Remove Programs
            self.update_status("Registering application...", 80)
            self.register_uninstall(target_dir)
            
            self.update_status("Finalizing...", 100)
            time.sleep(1)
            self.root.after(0, self.next_page)
            
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Installation Error", str(e)))
            self.root.after(0, self.root.quit)

    def update_status(self, text, val):
        self.root.after(0, lambda: self.status_label.config(text=text))
        self.root.after(0, lambda: self.progress.config(value=val))
        time.sleep(0.5)

    def create_shortcuts(self, target_dir):
        shell = win32com.client.Dispatch("WScript.Shell")
        exe_path = os.path.join(target_dir, EXE_NAME)
        
        # Desktop
        desktop = os.path.join(os.environ["USERPROFILE"], "Desktop")
        s1 = shell.CreateShortCut(os.path.join(desktop, f"{APP_NAME}.lnk"))
        s1.Targetpath = exe_path
        s1.WorkingDirectory = target_dir
        s1.IconLocation = exe_path
        s1.save()
        
        # Start Menu
        start_menu = os.path.join(os.environ["APPDATA"], "Microsoft", "Windows", "Start Menu", "Programs")
        app_menu = os.path.join(start_menu, APP_NAME)
        os.makedirs(app_menu, exist_ok=True)
        s2 = shell.CreateShortCut(os.path.join(app_menu, f"{APP_NAME}.lnk"))
        s2.Targetpath = exe_path
        s2.WorkingDirectory = target_dir
        s2.IconLocation = exe_path
        s2.save()

    def register_uninstall(self, target_dir):
        key_path = f"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{APP_NAME}"
        try:
            key = reg.CreateKey(reg.HKEY_CURRENT_USER, key_path)
            reg.SetValueEx(key, "DisplayName", 0, reg.REG_SZ, APP_NAME)
            reg.SetValueEx(key, "UninstallString", 0, reg.REG_SZ, f'"{os.path.join(target_dir, EXE_NAME)}" --uninstall')
            reg.SetValueEx(key, "DisplayIcon", 0, reg.REG_SZ, os.path.join(target_dir, EXE_NAME))
            reg.SetValueEx(key, "Publisher", 0, reg.REG_SZ, "BizzFlow")
            reg.SetValueEx(key, "DisplayVersion", 0, reg.REG_SZ, "1.0.0")
            reg.CloseKey(key)
        except: pass

    def finish(self):
        if self.run_after.get():
            exe_path = os.path.join(self.install_dir.get(), EXE_NAME)
            try:
                os.startfile(exe_path)
            except: pass
        self.root.quit()

if __name__ == "__main__":
    root = tk.Tk()
    app = InstallerApp(root)
    root.mainloop()
