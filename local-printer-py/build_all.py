import os
import subprocess
import shutil
import sys

def build():
    python_exe = sys.executable
    print(f"Using Python: {python_exe}")
    
    print("Step 1: Building main application...")
    # Build main app
    subprocess.run([
        python_exe, "-m", "PyInstaller",
        "--onefile", 
        "--noconsole", 
        "--name", "bizzflow-printer", 
        "main.py"
    ], check=True)
    
    print("Step 2: Building installer wizard...")
    # Build installer with the main app EXE embedded
    # Using ; as separator for Windows
    subprocess.run([
        python_exe, "-m", "PyInstaller",
        "--onefile", 
        "--noconsole", 
        "--uac-admin",
        "--name", "Setup", 
        "--add-data", "dist/bizzflow-printer.exe;.", 
        "installer.py"
    ], check=True)
    
    print("\nSuccess! Your installer is ready at dist/Setup.exe")

if __name__ == "__main__":
    build()
