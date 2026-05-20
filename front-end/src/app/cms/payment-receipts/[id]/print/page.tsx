"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { fetchPaymentReceiptDetails, fetchCompany, contentUrl, type CompanyRow } from "@/lib/api";
import { silentPrint, isPrinterServiceAvailable } from "@/lib/api/silent-print";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, X, Phone, Mail, MapPin, Receipt, CheckCircle2, CreditCard, Banknote, Building2 } from "lucide-react";

function PrintContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('autoprint') === '1';

  const [receipt, setReceipt] = useState<any>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const printedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [receiptData, companyData] = await Promise.all([
          fetchPaymentReceiptDetails(id),
          fetchCompany().catch(() => null)
        ]);
        setReceipt(receiptData);
        setCompany(companyData);
      } catch (error) {
        console.error("Failed to load print data", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  useEffect(() => {
    if (autoPrint && !loading && receipt && !printedRef.current) {
      printedRef.current = true;
      
      const trySilentPrint = async () => {
        const isAvailable = await isPrinterServiceAvailable();
        if (isAvailable) {
          // Get the HTML content specifically for the receipt
          const receiptEl = document.querySelector('.receipt');
          if (receiptEl) {
            const html = `
              <html>
                <head>
                  <style>
                    body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 0; }
                    .receipt { width: 100%; max-width: 80mm; margin: 0 auto; padding: 4px 0; font-size: 11px; color: #000; }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { font-weight: bold; }
                    .hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
                    .hr-solid { border: none; border-top: 1px solid #000; margin: 5px 0; }
                    .row { display: flex; justify-content: space-between; margin: 1px 0; }
                    .shop-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
                    .tag { font-size: 10px; color: #333; }
                  </style>
                </head>
                <body>
                  <div class="receipt">
                    ${receiptEl.innerHTML}
                  </div>
                </body>
              </html>
            `;
            const success = await silentPrint(html);
            if (success) {
              window.close();
              return;
            }
          }
        }
        
        // Fallback to standard print dialog
        window.print();
      };

      const timer = setTimeout(() => {
        void trySilentPrint();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, loading, receipt]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Preparing Receipt...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-rose-500 font-bold">Error: Receipt Not Found</p>
          <Button variant="outline" onClick={() => window.close()}>Close Window</Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(Number(amount));
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash': return <Banknote className="w-5 h-5 text-emerald-500" />;
      case 'Card': return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'Cheque': return <Receipt className="w-5 h-5 text-amber-500" />;
      default: return <Building2 className="w-5 h-5 text-violet-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/50 print:bg-white">
      {/* 1. Control Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 print:hidden px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Receipt Preview</span>
            <span className="text-slate-400 text-xs font-mono ml-2">{receipt.receipt_no}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.close()} className="text-slate-500 hover:text-slate-900">
              <X className="w-4 h-4 mr-2" /> Close
            </Button>
            <Button size="sm" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
              <Printer className="w-4 h-4 mr-2" /> Print Receipt
            </Button>
          </div>
        </div>
      </div>

      {/* POS Thermal View */}
      <style>{`
        @page {
          size: 80mm auto;
          margin: 4mm 3mm;
        }
        @media print {
          html, body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: white; font-family: 'Courier New', Courier, monospace; }
        .receipt { width: 100%; max-width: 80mm; margin: 0 auto; padding: 4px 0; font-size: 11px; color: #000; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        .hr-solid { border: none; border-top: 1px solid #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; margin: 1px 0; }
        .shop-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
        .tag { font-size: 10px; color: #333; }
        .preview-wrap { min-height: 100vh; background: #e5e7eb; display: flex; align-items: flex-start; justify-content: center; padding: 24px; }
        .preview-paper { background: white; width: 80mm; padding: 6px 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); min-height: 200px; }
      `}</style>

      {/* Screen Preview Wrapper (hidden on print) */}
      <div className="no-print preview-wrap">
        <div>
          <div className="preview-paper">
            <div className="receipt">
              <ReceiptBody receipt={receipt} company={company} />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button onClick={() => window.print()} className="bg-blue-700 hover:bg-blue-800 text-white mr-2">
              🖨 Print Receipt
            </Button>
            <Button variant="outline" onClick={() => window.close()}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Print-only version */}
      <div style={{ display: 'none' }} className="print-only">
        <div className="receipt">
          <ReceiptBody receipt={receipt} company={company} />
        </div>
      </div>

      <style>{`
        @media print {
          .preview-wrap { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function ReceiptBody({ receipt, company }: any) {
  return (
    <>
      {/* Store Header */}
      <div className="center">
        {company?.name && <div className="shop-name">{company.name}</div>}
        {company?.phone && <div className="tag">Tel: {company.phone}</div>}
        {company?.address && <div className="tag">{company.address}</div>}
      </div>

      <hr className="hr-solid" />

      {/* Title */}
      <div className="center bold" style={{ fontSize: '13px', margin: '4px 0' }}>PAYMENT RECEIPT</div>

      {/* Receipt Meta */}
      <div className="row"><span>Receipt#</span><span className="bold">{receipt.receipt_no}</span></div>
      <div className="row"><span>Date</span><span>{new Date(receipt.payment_date).toLocaleDateString('en-GB')}</span></div>
      <div className="row"><span>Invoice#</span><span className="bold">{receipt.invoice_no}</span></div>
      
      <hr className="hr" />

      {/* Customer */}
      <div className="bold" style={{ marginBottom: '2px' }}>CUSTOMER:</div>
      <div className="row"><span>Name</span><span className="bold">{receipt.customer_name}</span></div>
      {receipt.customer_phone && <div className="row"><span>Phone</span><span>{receipt.customer_phone}</span></div>}

      <hr className="hr" />

      {/* Amount Section */}
      <div className="center" style={{ padding: '8px 0' }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Total Amount Received</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0' }}>
          LKR {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="bold italic">({receipt.payment_method})</div>
      </div>

      <hr className="hr" />

      {/* Payment Details */}
      {receipt.payment_method === 'Card' && (
        <div style={{ fontSize: '10px' }}>
          <div className="row"><span>Card Type</span><span>{receipt.card_type}</span></div>
          {receipt.card_last4 && <div className="row"><span>Card No</span><span>**** {receipt.card_last4}</span></div>}
          {receipt.card_auth_code && <div className="row"><span>Auth Code</span><span>{receipt.card_auth_code}</span></div>}
          {receipt.card_bank_name && <div className="row"><span>Bank</span><span>{receipt.card_bank_name}</span></div>}
        </div>
      )}

      {receipt.payment_method === 'Cheque' && (
        <div style={{ fontSize: '10px' }}>
          <div className="row"><span>Cheque No</span><span>#{receipt.cheque_no_last6}</span></div>
          <div className="row"><span>Bank</span><span>{receipt.cheque_bank_name}</span></div>
          <div className="row"><span>Cheque Date</span><span>{receipt.cheque_date ? new Date(receipt.cheque_date).toLocaleDateString('en-GB') : "N/A"}</span></div>
        </div>
      )}

      {receipt.notes && (
        <div style={{ marginTop: '6px', fontSize: '10px', fontStyle: 'italic', opacity: 0.8 }}>
          Notes: {receipt.notes}
        </div>
      )}

      <hr className="hr-solid" />

      {/* Footer */}
      <div className="center tag" style={{ marginTop: '8px' }}>
        <div>Thank you for your business!</div>
        <div style={{ marginTop: '4px', fontStyle: 'italic' }}>*** Digitally Verified ***</div>
        <div style={{ marginTop: '4px', fontSize: '9px', opacity: 0.7 }}>Printed: {new Date().toLocaleString('en-GB')}</div>
      </div>
    </>
  );
}

export default function ReceiptPrintPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <PrintContent />
    </Suspense>
  );
}
