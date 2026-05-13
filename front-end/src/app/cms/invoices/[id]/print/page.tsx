"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { fetchInvoiceDetails, fetchCompany, contentUrl, type CompanyRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, X, Phone, Mail, MapPin } from "lucide-react";

function PrintContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('autoprint') === '1';
  const taxInclusive = searchParams.get('tax_inclusive') === '1';

  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const printedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoiceData, companyData] = await Promise.all([
          fetchInvoiceDetails(id),
          fetchCompany().catch(() => null)
        ]);
        setInvoice(invoiceData);
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
    if (autoPrint && !loading && invoice && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, loading, invoice]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Preparing Document...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-rose-500 font-bold">Error: Invoice Not Found</p>
          <Button variant="outline" onClick={() => window.close()}>Close Window</Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(Number(amount));
  };

  const balance = Number(invoice.grand_total) - Number(invoice.paid_amount);

  const getShortTaxName = (name: string) => {
    const upper = (name || "").toUpperCase();
    if (upper.includes("SOCIAL SECURITY CONTRIBUTION LEVY")) return "SSCL";
    if (upper.includes("VALUE ADDED TAX")) return "VAT";
    return name;
  };

  return (
    <div className="min-h-screen bg-slate-100/50 print:bg-white">
      {/* 1. Control Bar (Hidden on Print) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 print:hidden px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Print Preview</span>
            <span className="text-slate-400 text-xs font-mono ml-2">INV-{invoice.invoice_no}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.close()} className="text-slate-500 hover:text-slate-900">
              <X className="w-4 h-4 mr-2" /> Close
            </Button>
            <Button size="sm" onClick={() => window.print()} className="bg-primary shadow-lg shadow-primary/20">
              <Printer className="w-4 h-4 mr-2" /> Print Document
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Paper Area */}
      <div className="py-6 print:py-0">
        <div className="mx-auto w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none print:w-full print:border-none px-12 py-10 text-slate-900 border border-slate-200">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div className="space-y-1">
              {company?.logo_filename && (
                <img src={contentUrl('company', company.logo_filename)} alt="Logo" className="w-14 h-14 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Invoice</h1>
                <p className="text-slate-400 font-mono text-[10px] tracking-widest leading-none">NO: {invoice.invoice_no}</p>
              </div>
            </div>
            
            <div className="text-right space-y-0.5 max-w-xs pt-1">
              <p className="text-base font-black text-slate-900 uppercase leading-none">
                {company?.name || "ServiceBay Solutions"}
              </p>
              {invoice.location_name && (
                <p className="text-[11px] font-bold text-slate-600 leading-tight">
                  {invoice.location_name}
                </p>
              )}
              <div className="text-[10px] text-slate-500 whitespace-pre-line leading-tight">
                {invoice.location_address || company?.address || "Main Street, Colombo"}
                <div className="mt-1 space-y-0">
                  <div className="flex items-center justify-end gap-1.5 font-medium text-slate-700 italic underline underline-offset-1 decoration-slate-100">
                    <Phone className="w-2 h-2"/> {invoice.location_phone || company?.phone}
                  </div>
                  {(invoice.location_tax_no || company?.tax_no) && (
                    <div className="flex items-center justify-end gap-1.5 font-bold text-slate-900 uppercase text-[9px] mt-0.5">
                      {invoice.location_tax_label || company?.tax_label || "TAX ID"}: {invoice.location_tax_no || company?.tax_no}
                    </div>
                  )}
                  {company?.email && <div className="flex items-center justify-end gap-1.5 font-medium text-slate-700"><Mail className="w-2 h-2"/> {company.email}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Billed To</h4>
                <p className="text-sm font-black text-slate-900 leading-tight">{invoice.customer_name}</p>
                <div className="text-[11px] text-slate-600 space-y-0 mt-0.5">
                  <p className="font-semibold text-slate-800">{invoice.customer_phone}</p>
                  {invoice.billing_address && <p className="whitespace-pre-line leading-snug">{invoice.billing_address}</p>}
                </div>
              </div>

              {invoice.shipping_address && invoice.shipping_address !== invoice.billing_address && (
                <div className="space-y-1">
                  <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Shipping Address</h4>
                  <div className="text-[11px] text-slate-600">
                    <p className="whitespace-pre-line leading-snug">{invoice.shipping_address}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] py-0.5 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Issue Date</span>
                <span className="font-bold text-slate-700">{new Date(invoice.created_at || invoice.issue_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>
              <div className="flex justify-between text-[11px] py-0.5 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Due Date</span>
                <span className="font-bold text-slate-700">{invoice.due_date}</span>
              </div>
              {invoice.order_id && (
                <div className="flex justify-between text-[11px] py-0.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Order Ref</span>
                  <span className="font-black text-primary italic">#{invoice.order_id}</span>
                </div>
              )}
              {invoice.online_order_id && (
                <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5">
                  <div className="flex justify-between text-[11px] py-0.5">
                    <span className="text-slate-400 font-medium uppercase text-[9px] tracking-widest">Sales Channel</span>
                    <span className="font-black text-emerald-600">WEB</span>
                  </div>
                  <div className="flex justify-between text-[11px] py-0.5">
                    <span className="text-slate-400 font-medium uppercase text-[9px] tracking-widest">Web Order No</span>
                    <span className="font-black text-slate-800">{invoice.web_order_no || invoice.online_order_id}</span>
                  </div>
                </div>
              )}
              {invoice.order_type === 'dine_in' && (
                <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5">
                  {invoice.table_name && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Table</span>
                      <span className="font-bold text-slate-700">{invoice.table_name}</span>
                    </div>
                  )}
                  {invoice.steward_name && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Steward</span>
                      <span className="font-bold text-slate-700">{invoice.steward_name}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2">
                <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded inline-block border leading-none
                   ${invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}
                `}>
                  {invoice.status}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-[9px] font-black uppercase tracking-widest">
                  <th className="py-3 font-black">Description & Details</th>
                  <th className="py-3 text-center w-12">Qty</th>
                  <th className="py-3 text-right w-24">Unit Price</th>
                  <th className="py-3 text-right w-24">Discount</th>
                  <th className="py-3 text-right w-24">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item: any) => {
                  const totalTaxPercent = (invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.rate_percent || 0), 0);
                  let displayPrice = Number(item.unit_price);
                  let displayDiscount = Number(item.discount || 0);
                  let displayLineTotal = Number(item.line_total);

                  if (taxInclusive && totalTaxPercent > 0) {
                    displayPrice = displayPrice * (1 + totalTaxPercent / 100);
                    displayDiscount = displayDiscount * (1 + totalTaxPercent / 100);
                    displayLineTotal = displayLineTotal * (1 + totalTaxPercent / 100);
                  }

                  return (
                    <tr key={item.id}>
                      <td className="py-2.5">
                        <div className="font-bold text-slate-800 uppercase leading-tight">{item.description}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-tighter leading-none">
                          {item.item_type}
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-medium">{item.quantity}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(displayPrice)}</td>
                      <td className="py-2.5 text-right font-medium text-rose-500">
                        {displayDiscount > 0 ? `-${formatCurrency(displayDiscount)}` : "-"}
                      </td>
                      <td className="py-2.5 text-right font-black text-slate-900">{formatCurrency(displayLineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
            <div className="w-72 space-y-3">
              <div className="space-y-1 pb-3 border-b border-slate-100 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="font-bold tabular-nums">LKR {Number(invoice.subtotal).toFixed(2)}</span>
                </div>

                {(() => {
                  const taxSum = (invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
                  const inferredDiscount = Number(invoice.subtotal) + taxSum - Number(invoice.grand_total);
                  const actualDiscount = Number(invoice.discount_total) > 0 ? Number(invoice.discount_total) : (inferredDiscount > 0.01 ? inferredDiscount : 0);
                  
                  if (actualDiscount > 0 || invoice.applied_promotion_name) {
                    return (
                      <div className="flex justify-between items-center text-rose-600">
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Discount {invoice.applied_promotion_name ? `(${invoice.applied_promotion_name})` : ''}
                        </span>
                        <span className="font-bold tabular-nums">-LKR {actualDiscount.toFixed(2)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {invoice.applied_taxes && invoice.applied_taxes.length > 0 ? (
                  invoice.applied_taxes.map((tax: any) => (
                    <div key={tax.id} className="flex justify-between items-center text-slate-600">
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {getShortTaxName(tax.tax_code || tax.tax_name)} {Number(tax.rate_percent) > 0 ? `(${Number(tax.rate_percent)}%)` : ''}
                      </span>
                      <span className="font-bold tabular-nums">LKR {Number(tax.amount).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  Number(invoice.tax_total) > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Tax Total</span>
                      <span className="font-bold tabular-nums">LKR {Number(invoice.tax_total).toFixed(2)}</span>
                    </div>
                  )
                )}
                {Number(invoice.shipping_fee) > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Shipping ({invoice.shipping_provider_name || 'Standard'})</span>
                    <span className="font-bold tabular-nums">+LKR {Number(invoice.shipping_fee).toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="font-black text-slate-900 uppercase text-base tracking-tighter">Grand Total</span>
                <span className="font-black text-slate-900 text-2xl tracking-tighter tabular-nums">{formatCurrency(invoice.grand_total)}</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60">
                  <span>Paid Amount</span>
                  <span className="text-slate-900">{formatCurrency(invoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-black tracking-tighter border-t border-slate-200 pt-2.5">
                  <span className="uppercase text-[10px] font-bold pt-1">Balance Due</span>
                  <span className="text-primary underline underline-offset-4 decoration-primary/20">{formatCurrency(balance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms / Footer */}
          <div className="mt-8 space-y-6">
            {invoice.notes && (
              <div className="space-y-1">
                <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Notes & Terms</h5>
                <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed italic pr-12">
                  {invoice.notes}
                </p>
              </div>
            )}
            
            <div className="flex flex-col items-center justify-center pt-8 text-center space-y-2 border-t border-slate-50 opacity-40">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-900" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
                  {company?.name || "ServiceBay"} • Automotive Excellence
                </span>
              </div>
              <p className="text-[8px] text-slate-400 font-medium px-32 leading-tight uppercase tracking-widest">
                Thank you for your business. Please make payments to "{company?.name || "ServiceBay"}" within the due date to avoid interest charges.
              </p>
            </div>
          </div>

        </div>
      </div>
      
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .min-h-screen {
            min-height: auto !important;
            background: none !important;
          }
          .bg-slate-100\\/50, .py-10, .shadow-2xl, .border-slate-200 {
            background: none !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .mx-auto {
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoicePrintPage() {
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
