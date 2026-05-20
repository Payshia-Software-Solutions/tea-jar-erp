# BizzFlow Local Print Service

This service enables **Silent Printing** for your POS thermal printers. It acts as a bridge between the BizzFlow web application and your local Windows printers.

## Installation

1.  **Install Node.js:** If you don't have it, download and install it from [nodejs.org](https://nodejs.org/).
2.  **Navigate to this folder:** Open your terminal (Command Prompt or PowerShell) and go to the `local-printer` directory.
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Start the Service:**
    ```bash
    npm start
    ```

## Usage

Once the service is running at `http://localhost:3001`, the BizzFlow POS will automatically send receipts directly to your default printer without showing any dialog boxes.

### Configuration
- By default, it uses your **Windows Default Printer**.
- It supports both **80mm** and **58mm** thermal paper.
- Ensure your printer is set up and working in Windows first.

## Keeping it running
You can minimize the terminal window while you work. For a permanent setup, you can use a tool like `pm2` to run it in the background or add a shortcut to your Windows "Startup" folder.
