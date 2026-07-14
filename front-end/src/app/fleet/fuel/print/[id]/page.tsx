"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { api, fetchCompany, contentUrl, type CompanyRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, X, Phone, Mail } from "lucide-react";
import { format } from "date-fns";

function PrintContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('autoprint') === '1';

  const [order, setOrder] = useState<any>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const printedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderRes, companyData] = await Promise.all([
          api(`/api/fuel/get-order/${id}`).then(res => res.json()),
          fetchCompany().catch(() => null)
        ]);
        if (orderRes.status === "success") {
          setOrder(orderRes.data);
        }
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
    if (autoPrint && !loading && order && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, loading, order]);

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

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-rose-500 font-bold">Error: Fuel Order Not Found</p>
          <Button variant="outline" onClick={() => window.close()}>Close Window</Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(Number(amount));
  };

  const docNo = `FO-${String(order.id).padStart(4, '0')}`;
  const formattedDate = format(new Date(order.created_at), "yyyy-MM-dd HH:mm");

  return (
    <div className="min-h-screen bg-slate-100/50 print:bg-white">
      {/* CSS style tag to set default page options */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5 landscape;
            margin: 4mm !important;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: white;
          }
        }
      `}</style>

      {/* 1. Control Bar (Hidden on Print) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 print:hidden px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Print Preview (A5 Landscape)</span>
            <span className="text-slate-400 text-xs font-mono ml-2">{docNo}</span>
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
        <div className="mx-auto w-[210mm] min-h-[148mm] bg-white shadow-2xl print:shadow-none print:w-full print:h-full print:border-none px-8 py-6 text-slate-900 border border-slate-200 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-2">
              <div className="space-y-1">
                {company?.logo_filename && (
                  <img src={contentUrl('company', company.logo_filename)} alt="Logo" className="w-10 h-10 object-contain" />
                )}
                <div>
                  <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Fuel Order</h1>
                  <p className="text-slate-400 font-mono text-[9px] tracking-widest leading-none">NO: {docNo}</p>
                </div>
              </div>
              
              <div className="text-right space-y-0.5 max-w-xs pt-1">
                <p className="text-sm font-black text-slate-900 uppercase leading-none">
                  {company?.name || "ServiceBay Solutions"}
                </p>
                <div className="text-[9px] text-slate-500 whitespace-pre-line leading-tight">
                  {company?.address || "Main Street, Colombo"}
                  <div className="mt-1 space-y-0">
                    <div className="flex items-center justify-end gap-1 font-medium text-slate-700 italic underline underline-offset-1 decoration-slate-100">
                      <Phone className="w-1.5 h-1.5"/> {company?.phone}
                    </div>
                    {company?.tax_no && (
                      <div className="flex items-center justify-end gap-1 font-bold text-slate-900 uppercase text-[8px] mt-0.5">
                        {company?.tax_label || "TAX ID"}: {company.tax_no}
                      </div>
                    )}
                    {company?.email && <div className="flex items-center justify-end gap-1 font-medium text-slate-700"><Mail className="w-1.5 h-1.5"/> {company.email}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-100">
              <div className="space-y-1">
                <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Vehicle & Driver Details</h4>
                <p className="text-xs font-black text-slate-900 leading-tight">Vehicle No: {order.vehicle_no || "N/A"}</p>
                <div className="text-[10px] text-slate-600 space-y-0.5 mt-0.5">
                  <p><span className="font-medium text-slate-400">Driver Name:</span> <span className="font-bold text-slate-800">{order.driver_name || "-"}</span></p>
                  <p><span className="font-medium text-slate-400">Odometer Mileage:</span> <span className="font-bold text-slate-800">{order.mileage} km</span></p>
                </div>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Order Information</h4>
                <div className="flex justify-between text-[10px] py-0.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Issue Date</span>
                  <span className="font-bold text-slate-700">{formattedDate}</span>
                </div>
                <div className="flex justify-between text-[10px] py-0.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Fuel Station</span>
                  <span className="font-bold text-slate-700">{order.station_name || "N/A"}</span>
                </div>
                <div className="flex justify-between text-[10px] py-0.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Created By</span>
                  <span className="font-bold text-slate-700">{order.created_by_name || "-"}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse mt-3 text-slate-900 text-[10px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[8px] tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-2 px-3 font-bold">Fuel Description</th>
                  <th className="py-2 px-3 text-right font-bold">Liters Issued</th>
                  <th className="py-2 px-3 text-right font-bold">Unit Price</th>
                  <th className="py-2 px-3 text-right font-bold">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{order.fuel_type_name || "N/A"}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">{order.liters} L</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(order.price_per_liter)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(order.total_cost)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals & Summary */}
            <div className="flex justify-end mt-3">
              <div className="w-[220px] space-y-1 text-[10px]">
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="font-mono text-slate-700">{formatCurrency(order.total_cost)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs font-black border-b-2 border-double border-slate-200">
                  <span className="text-primary uppercase tracking-tight">Grand Total</span>
                  <span className="font-mono text-primary">{formatCurrency(order.total_cost)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* Signatures */}
            <div className="mt-8 flex justify-between text-[10px] text-slate-400 font-medium">
              <div className="text-center w-[150px]">
                <div className="border-b border-slate-200 pb-1 mb-1"></div>
                <p>Prepared By</p>
              </div>
              <div className="text-center w-[150px]">
                <div className="border-b border-slate-200 pb-1 mb-1"></div>
                <p>Driver Signature</p>
              </div>
              <div className="text-center w-[150px]">
                <div className="border-b border-slate-200 pb-1 mb-1"></div>
                <p>Authorized Signature</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 border-t border-slate-100 pt-2 text-center">
              <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase">Thank you for pumping with us</p>
              <p className="text-[7px] text-slate-300 mt-0.5 font-mono">System Generated Document • Fleet Portal</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PrintOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <PrintContent />
    </Suspense>
  );
}
