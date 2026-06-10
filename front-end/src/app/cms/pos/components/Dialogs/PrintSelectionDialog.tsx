"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { usePOS } from "../../context/POSContext";

export const PrintSelectionDialog: React.FC = () => {
  const { 
    printSelectionOpen, 
    setPrintSelectionOpen, 
    lastInvoiceId,
    reloadData 
  } = usePOS();

  const [isPrinting, setIsPrinting] = React.useState<string | null>(null);
  const [targetPrinter, setTargetPrinter] = React.useState<string>("");
  
  const handlePrint = async (type: 'standard' | 'inclusive') => {
    if (!lastInvoiceId) return;
    setIsPrinting(type);
    
    const baseReceiptUrl = `/cms/invoices/${lastInvoiceId}/receipt`;
    const url = type === 'inclusive' ? `${baseReceiptUrl}?tax_inclusive=1` : baseReceiptUrl;
    
    // Check for Windows + Silent Bridge
    const isWindows = !/Android/i.test(navigator.userAgent);
    const { isPrinterServiceAvailable, silentPrint } = await import("@/lib/api/silent-print");
    const bridgeAvailable = await isPrinterServiceAvailable();

    try {
        // 1. Lookup the printer name mapping AND Global Printing Mode
        const settingsRes = await fetch('http://localhost/rapair-management/server/public/api/printer/get_settings');
        const settingsData = await settingsRes.json();
        
        let printingMode = "Silent";
        if (settingsData.success && settingsData.data) {
            const mapping = settingsData.data.find((m: any) => m.printer_type === 'Receipt');
            if (mapping) setTargetPrinter(mapping.printer_name);

            const modeSetting = settingsData.data.find((m: any) => m.printer_type === 'PrintingMode');
            if (modeSetting) printingMode = modeSetting.printer_name;
        }

        if (printingMode === 'Browser' || !bridgeAvailable || !isWindows) {
            // Add autoprint=1 ONLY for browser mode so it opens the dialog automatically
            const browserUrl = url.includes('?') ? `${url}&autoprint=1` : `${url}?autoprint=1`;
            const w = 400; const h = 600;
            const left = (window.screen.width / 2) - (w / 2);
            const top = (window.screen.height / 2) - (h / 2);
            window.open(browserUrl, 'ReceiptPrint', `width=${w},height=${h},top=${top},left=${left}`);
            setIsPrinting(null);
            setPrintSelectionOpen(false);
            return;
        }

        // 2. Create a hidden iframe to capture the rendered receipt HTML
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.src = url;

        // 3. Wait for the receipt content to be fully rendered
        await new Promise((resolve) => {
            const checkInterval = setInterval(async () => {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (doc && doc.querySelector('.receipt')) {
                    clearInterval(checkInterval);
                    
                    setTimeout(async () => {
                        const styles = Array.from(doc.querySelectorAll('style')).map(s => s.outerHTML).join('\n');
                        const clone = doc.body.cloneNode(true) as HTMLElement;
                        clone.querySelectorAll('nextjs-portal, .no-print, button, .print\\:hidden, #__next-build-watcher').forEach(el => el.remove());
                        
                        const body = clone.innerHTML;
                        const fullHtml = `<html><head>${styles}</head><body>${body}</body></html>`;
                        
                        const result = await silentPrint(fullHtml, 'Receipt', '80mm', `Invoice #${lastInvoiceId}`);
                        if (result.printer) setTargetPrinter(result.printer);
                        
                        document.body.removeChild(iframe);
                        resolve(true);
                    }, 500);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkInterval);
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
                resolve(false);
            }, 10000);
        });
        
        setTimeout(() => setPrintSelectionOpen(false), 500);
    } catch (error) {
        console.error("Print failed:", error);
        const w = 400; const h = 600;
        const left = (window.screen.width / 2) - (w / 2);
        const top = (window.screen.height / 2) - (h / 2);
        window.open(url, 'ReceiptPrint', `width=${w},height=${h},top=${top},left=${left}`);
    } finally {
        setIsPrinting(null);
    }
  };

  return (
    <Dialog open={printSelectionOpen} onOpenChange={setPrintSelectionOpen}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                CHECKOUT SUCCESSFUL!
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
                Invoice #{lastInvoiceId} has been processed. Select your preferred receipt format to print.
              </DialogDescription>
            </div>
          </div>

          <div className="grid gap-4">
            <Button
              variant="outline"
              className={`h-24 justify-start p-6 space-x-6 border-2 transition-all relative overflow-hidden group ${
                isPrinting === 'standard' ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800'
              }`}
              onClick={() => handlePrint('standard')}
              disabled={isPrinting !== null}
            >
              <div className={`p-3 rounded-xl transition-colors ${
                isPrinting === 'standard' ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10'
              }`}>
                {isPrinting === 'standard' ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Printer className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-primary" />}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {isPrinting === 'standard' ? `PRINTING TO ${targetPrinter.toUpperCase()}...` : 'STANDARD RECEIPT'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Item prices shown without tax. Taxes listed separately at bottom.</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className={`h-24 justify-start p-6 space-x-6 border-2 transition-all relative overflow-hidden group ${
                isPrinting === 'inclusive' ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800'
              }`}
              onClick={() => handlePrint('inclusive')}
              disabled={isPrinting !== null}
            >
              <div className={`p-3 rounded-xl transition-colors ${
                isPrinting === 'inclusive' ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10'
              }`}>
                {isPrinting === 'inclusive' ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <FileText className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-primary" />}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {isPrinting === 'inclusive' ? `PRINTING TO ${targetPrinter.toUpperCase()}...` : 'TAX INCLUSIVE RECEIPT'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Each item price includes applicable taxes for clarity.</span>
              </div>
            </Button>
          </div>

          <div className="flex justify-center pt-2">
            <Button 
              variant="ghost" 
              className="text-slate-500 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white"
              onClick={() => {
                setPrintSelectionOpen(false);
                reloadData();
              }}
            >
              Skip Printing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
