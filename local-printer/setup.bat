@echo off
set "targetDir=%~dp0"
set "exePath=%targetDir%bizzflow-printer.exe"
set "startupFolder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "shortcutPath=%startupFolder%\BizzFlow-Printer.lnk"

echo Setting up BizzFlow Printer Service...
echo Source: %exePath%
echo Destination: %shortcutPath%

powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%shortcutPath%');$s.TargetPath='%exePath%';$s.WorkingDirectory='%targetDir%';$s.WindowStyle=7;$s.Save()"

echo Done! The printer service will now start automatically when you log in.
echo You can also start it now by double-clicking bizzflow-printer.exe
pause
