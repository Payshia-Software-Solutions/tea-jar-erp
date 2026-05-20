"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchPosDayLedger, fetchCompany, fetchLocations } from "@/lib/api";
import { silentPrint, isPrinterServiceAvailable } from "@/lib/api/silent-print";
import { Loader2 } from "lucide-react";

function DayEndPrintContent() {
  const searchParams = useSearchParams();
  const locationId = searchParams.get('location_id');
  const autoPrint = searchParams.get('autoprint') === '1';

  const [ledger, setLedger] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(true);
  const printedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      if (!locationId) return;
      try {
        const [ledgerData, companyData, locations] = await Promise.all([
          fetchPosDayLedger(locationId),
          fetchCompany().catch(() => null),
          fetchLocations().catch(() => [])
        ]);
        setLedger(ledgerData);
        setCompany(companyData);
        
        const loc = (locations as any[]).find(l => String(l.id) === String(locationId));
        if (loc) setLocationName(loc.name);
      } catch (error) {
        console.error("Failed to load day end data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [locationId]);

  useEffect(() => {
    if (autoPrint && !loading && ledger && !printedRef.current) {
      printedRef.current = true;
      
      const trySilentPrint = async () => {
        const isAvailable = await isPrinterServiceAvailable();
        if (isAvailable) {
          const receiptEl = document.querySelector('.receipt');
          if (receiptEl) {
            const html = `
              <html>
                <head>
                  <style>
                    body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 0; color: #000; }
                    .receipt { width: 100%; max-width: 80mm; margin: 0 auto; padding: 4px 2px; font-size: 11px; }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { font-weight: bold; }
                    .hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
                    .hr-thick { border: none; border-top: 2px solid #000; margin: 8px 0; }
                    .row { display: flex; justify-content: space-between; margin: 2px 0; }
                    .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
                    .net-intake { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 8px 0; border-top: 1px solid #000; padding-top: 6px; }
                    .shop-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
                    .title { font-size: 14px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; }
                    .event-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
                    .event-table th { border-bottom: 1px solid #000; text-align: left; padding: 4px 0; }
                    .event-table td { padding: 4px 0; vertical-align: top; }
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
        
        // Fallback
        window.print();
      };

      const timer = setTimeout(() => {
        void trySilentPrint();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, loading, ledger]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500 font-bold">Data not found for this location.</p>
      </div>
    );
  }

  const fmt = (n: number | string) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const now = new Date();

  return (
    <>
      <style>{`
        @page {
          size: 80mm auto;
          margin: 4mm 2mm;
        }
        @media print {
          html, body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: white; font-family: 'Courier New', Courier, monospace; color: #000; }
        .receipt { width: 100%; max-width: 80mm; margin: 0 auto; padding: 4px 2px; font-size: 11px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .hr-thick { border: none; border-top: 2px solid #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
        .net-intake { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 8px 0; border-top: 1px solid #000; padding-top: 6px; }
        .shop-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
        .title { font-size: 14px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; }
        .event-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
        .event-table th { border-bottom: 1px solid #000; text-align: left; padding: 4px 0; }
        .event-table td { padding: 4px 0; vertical-align: top; }
        
        .preview-wrap { min-height: 100vh; background: #f3f4f6; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; }
        .preview-paper { background: white; width: 80mm; padding: 10px 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); min-height: 300px; }
      `}</style>

      {/* Screen Preview */}
      <div className="no-print preview-wrap">
        <div className="flex flex-col items-center gap-6">
           <div className="preview-paper">
             <div className="receipt">
                <ReceiptBody ledger={ledger} company={company} locationName={locationName} fmt={fmt} now={now} />
             </div>
           </div>
           <div className="flex gap-3">
             <button
               onClick={() => window.print()}
               className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all"
             >
               🖨 Print Summary
             </button>
             <button
               onClick={() => window.close()}
               className="bg-white border-2 border-slate-200 text-slate-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
             >
               Close
             </button>
           </div>
        </div>
      </div>

      {/* Print-only version */}
      <div style={{ display: 'none' }} className="print-only">
        <div className="receipt">
          <ReceiptBody ledger={ledger} company={company} locationName={locationName} fmt={fmt} now={now} />
        </div>
      </div>

      <style>{`
        @media print {
          .preview-wrap { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>
    </>
  );
}

function ReceiptBody({ ledger, company, locationName, fmt, now }: any) {
  return (
    <>
      <div className="center">
        <div className="shop-name">{company?.name || "ServiceBay"}</div>
        <div style={{ fontSize: '10px' }}>{locationName}</div>
        {company?.address && <div style={{ fontSize: '9px' }}>{company.address}</div>}
        <div className="hr-thick" />
        <div className="title">DAY END SUMMARY</div>
      </div>

      <div className="row"><span>Date:</span><span className="bold">{now.toLocaleDateString('en-GB')}</span></div>
      <div className="row"><span>Time:</span><span>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
      
      <div className="hr" />

      <div className="summary-row">
        <span>Total Sales (Invoices)</span>
        <span className="bold">LKR {fmt(ledger.summary.sales)}</span>
      </div>
      <div className="summary-row">
        <span>Stock Returns</span>
        <span className="bold">-LKR {fmt(ledger.summary.returns)}</span>
      </div>
      <div className="summary-row">
        <span>Total Refunds Issued</span>
        <span className="bold">-LKR {fmt(ledger.summary.refunds)}</span>
      </div>

      <div className="net-intake">
        <span>TOTAL INTAKE</span>
        <span>LKR {fmt(ledger.summary.net)}</span>
      </div>

      <div className="hr" />
      <div className="bold" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Summary</div>
      {Object.entries(ledger.summary.methods || {}).map(([method, amount]: any) => (
        <div className="row" key={method}>
          <span>{method}</span>
          <span className="bold">LKR {fmt(amount as number)}</span>
        </div>
      ))}

      <div className="net-intake" style={{ background: '#000', color: '#fff', padding: '4px 2px' }}>
        <span>CASH ON HAND</span>
        <span>LKR {fmt(ledger.summary.methods?.['Cash'] || 0)}</span>
      </div>

      <div className="hr-thick" />
      <div className="bold center" style={{ fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>TRANSACTION LOG</div>

      <table className="event-table">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>Time</th>
            <th style={{ width: '45%' }}>Doc / Type</th>
            <th style={{ width: '35%', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(ledger.events || []).map((ev: any, i: number) => {
            const time = new Date(ev.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const isNegative = ev.type === 'Return' || ev.type === 'Refund';
            return (
              <tr key={i}>
                <td>{time}</td>
                <td>
                  <div className="bold">{ev.doc_no}</div>
                  <div style={{ fontSize: '8px', color: '#666' }}>{ev.type} - {ev.customer_name}</div>
                </td>
                <td className="right bold">
                  {isNegative ? '-' : ''}{fmt(ev.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="hr" />
      <div className="center" style={{ marginTop: '15px', fontSize: '10px' }}>
        <div className="bold italic">--- END OF REPORT ---</div>
        <div style={{ marginTop: '10px', fontSize: '8px' }}>Printed via ServiceBay POS Management</div>
        <div style={{ marginTop: '4px', fontSize: '8px' }}>{now.toLocaleString()}</div>
      </div>
    </>
  );
}

export default function DayEndPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <DayEndPrintContent />
    </Suspense>
  );
}
