"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { 
  fetchOrder, 
  fetchOrderParts, 
  fetchCompany, 
  contentUrl, 
  type OrderPartRow, 
  type CompanyRow 
} from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Printer, 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Wrench, 
  User, 
  Gauge,
  X,
  Tag,
  ClipboardList,
  Boxes,
  Building
} from "lucide-react";

type ChecklistDoneItem = { item: string; checked: boolean; comment?: string };

function safeChecklistDone(value: any): ChecklistDoneItem[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => ({
        item: String((v as any)?.item ?? ""),
        checked: Boolean((v as any)?.checked ?? false),
        comment: (v as any)?.comment ? String((v as any).comment) : "",
      }))
      .filter((v) => v.item);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return safeChecklistDone(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export default function OrderCompletionPrintPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;
  const auto = searchParams?.get("autoprint") === "1";

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [parts, setParts] = useState<OrderPartRow[]>([]);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const printedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [o, p, c] = await Promise.all([
          fetchOrder(String(id)),
          fetchOrderParts(String(id)),
          fetchCompany().catch(() => null)
        ]);
        setOrder(o);
        setParts(Array.isArray(p) ? p : []);
        setCompany(c);
      } finally {
        setLoading(false);
      }
    };
    if (id) void run();
  }, [id]);

  const data = useMemo(() => {
    const o: any = order || {};
    return {
      id: o.id ?? id,
      vehicleModel: String(o.vehicle_model || ""),
      vehicleIdentifier: String(o.vehicle_identifier || ""),
      mileage: o.mileage ?? "",
      priority: String(o.priority || "Medium"),
      status: String(o.status || "Completed"),
      createdAt: String(o.created_at || ""),
      expectedAt: String(o.expected_time || ""),
      completedAt: String(o.completed_at || ""),
      problem: String(o.problem_description || ""),
      comments: String(o.comments || ""),
      bay: String(o.location || ""),
      technician: String(o.technician || ""),
      locationName: String(o.location_name || ""),
      locationAddress: String(o.location_address || ""),
      locationPhone: String(o.location_phone || ""),
      locationTaxNo: String(o.location_tax_no || ""),
      completionComments: String(o.completion_comments || ""),
      departmentName: String(o.department_name || ""),
      checklistDone: safeChecklistDone(o.checklist_done_json),
    };
  }, [order, id]);

  const total = useMemo(() => {
    return parts.reduce((sum, l) => sum + (l.line_total ? Number(l.line_total) : 0), 0);
  }, [parts]);

  useEffect(() => {
    if (!auto || loading || !order || printedRef.current) return;
    printedRef.current = true;
    const t = window.setTimeout(() => window.print(), 1000);
    return () => window.clearTimeout(t);
  }, [auto, loading, order]);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(Number(amount));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Preparing Report...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-rose-500 font-bold text-lg">Order Not Found</p>
          <Button variant="outline" onClick={() => window.close()}>Close Window</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 print:bg-white">
      {/* Control Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 print:hidden px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Completion Report</span>
            <span className="text-slate-400 text-xs font-mono ml-2">RO#{data.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/orders/${id}`)} className="text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button size="sm" onClick={() => window.print()} className="bg-primary shadow-lg shadow-primary/20">
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
          </div>
        </div>
      </div>

      {/* Paper Area */}
      <div className="py-6 print:py-0">
        <div className="mx-auto w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none print:w-full print:border-none px-10 py-8 text-slate-900 border border-slate-200">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div className="space-y-2">
              {company?.logo_filename && (
                <img src={contentUrl('company', company.logo_filename)} alt="Logo" className="w-14 h-14 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase leading-none">Service Completion</h1>
                <p className="text-slate-900 font-black font-mono text-[10px] tracking-widest leading-none mt-2">ORDER ID: {data.id}</p>
                <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm inline-block border leading-none bg-slate-900 text-white border-slate-900 mt-2`}>
                  {data.status}
                </div>
              </div>
            </div>
            
            <div className="text-right space-y-0.5 max-w-xs pt-1">
              <p className="text-base font-black text-slate-900 uppercase leading-none">
                {company?.name || "ServiceBay Solutions"}
              </p>
              {data.locationName && (
                <p className="text-[11px] font-bold text-slate-600 leading-tight">
                  {data.locationName}
                </p>
              )}
              <div className="text-[10px] text-slate-500 whitespace-pre-line leading-tight">
                {data.locationAddress || company?.address || "Workshop Premises"}
                <div className="mt-1 space-y-0">
                  <div className="flex items-center justify-end gap-1.5 font-medium text-slate-700 italic underline underline-offset-1 decoration-slate-100">
                    <Phone className="w-2 h-2"/> {data.locationPhone || company?.phone}
                  </div>
                  {(data.locationTaxNo || company?.tax_no) && (
                    <div className="flex items-center justify-end gap-1.5 font-bold text-slate-900 uppercase text-[9px] mt-0.5">
                      {company?.tax_label || "TAX ID"}: {data.locationTaxNo || company?.tax_no}
                    </div>
                  )}
                  {company?.email && <div className="flex items-center justify-end gap-1.5 font-medium text-slate-700"><Mail className="w-2 h-2"/> {company.email}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-4 gap-4 py-4 border-b border-slate-100">
            {/* Column 1: Vehicle Info */}
            <div className="space-y-1">
              <h4 className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Vehicle & Dept</h4>
              <p className="text-[11px] font-black text-slate-900 leading-tight uppercase">{data.vehicleModel}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold uppercase tracking-tight">
                <Building className="w-2.5 h-2.5" /> {data.departmentName || "General Fleet"}
              </div>
            </div>

            {/* Column 2: Metrics */}
            <div className="space-y-1">
              <h4 className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Metrics & Location</h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
                <Gauge className="w-2.5 h-2.5" /> {data.mileage ? `${Number(data.mileage).toLocaleString()} KM` : "N/A"}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium uppercase tracking-tight">
                <MapPin className="w-2.5 h-2.5" /> {data.bay || "Unassigned"}
              </div>
            </div>

            {/* Column 3: Timeline */}
            <div className="space-y-1.5">
              <h4 className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Timeline</h4>
              <div className="grid grid-cols-[30px_1fr] items-center text-[9px]">
                <span className="text-slate-400 font-medium">Start:</span>
                <span className="text-slate-700 font-bold text-right truncate">
                  {data.createdAt ? format(new Date(data.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                </span>
              </div>
              <div className="grid grid-cols-[30px_1fr] items-center text-[9px]">
                <span className="text-slate-400 font-medium">Done:</span>
                <span className="text-slate-900 font-black text-right truncate">
                  {data.completedAt ? format(new Date(data.completedAt), 'dd/MM/yyyy HH:mm') : '-'}
                </span>
              </div>
            </div>

            {/* Column 4: Personnel */}
            <div className="space-y-1">
              <h4 className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Personnel</h4>
              <div className="text-[10px] font-black text-slate-800 uppercase tracking-tighter leading-none">
                {data.technician || 'Not Assigned'}
              </div>
            </div>
          </div>

          {/* Job Scope */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="p-4 border border-slate-200 bg-slate-50/50">
              <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Service Request</h4>
              <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                {data.problem || "General Inspection and Repair"}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="mb-6">
            <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
              <ClipboardList className="w-3 h-3" /> Technical Verification Checklist
            </h4>
            {data.checklistDone.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No checklist items recorded for this order.</p>
            ) : (
              <div className="border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                      <th className="py-2.5 px-4 w-1/3">Technical Task</th>
                      <th className="py-2.5 px-4">Observations & Remarks</th>
                      <th className="py-2.5 px-4 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.checklistDone.map((c, idx) => (
                      <tr key={`${c.item}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-700 uppercase tracking-tighter">
                          {c.item}
                        </td>
                        <td className="py-2.5 px-4 text-[10px] text-slate-500 italic font-medium">
                          {c.comment || "-"}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded leading-none inline-block min-w-[60px]",
                            c.checked ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                          )}>
                            {c.checked ? "PASSED" : "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Parts Used */}
          <div className="mb-6">
            <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
              <Boxes className="w-3 h-3" /> Inventory Issued
            </h4>
            {parts.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No inventory parts or lubricants were issued for this job.</p>
            ) : (
              <div className="border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                      <th className="py-2.5 px-4">Item Description</th>
                      <th className="py-2.5 px-4 text-center w-16">Qty</th>
                      <th className="py-2.5 px-4 text-right w-24">Unit Price</th>
                      <th className="py-2.5 px-4 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-4 font-bold text-slate-700 uppercase tracking-tighter">{p.part_name}</td>
                        <td className="py-2 px-4 text-center font-bold">{p.quantity}</td>
                        <td className="py-2 px-4 text-right font-medium text-slate-500">{formatCurrency(p.unit_price)}</td>
                        <td className="py-2 px-4 text-right font-black text-slate-900">{formatCurrency(p.line_total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/50">
                      <td colSpan={3} className="py-2.5 px-4 text-right font-black uppercase tracking-widest text-slate-500 text-[9px]">Total Inventory Value</td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900 text-sm tracking-tighter">{formatCurrency(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Completion Notes */}
          {data.completionComments && (
            <div className="mb-8 p-4 border-2 border-slate-100 bg-slate-50/30">
              <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Final Technical Remarks</h4>
              <p className="text-[11px] text-slate-700 leading-relaxed font-semibold italic">
                {data.completionComments}
              </p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-12 pt-12 border-t border-slate-100">
            <div className="text-center space-y-4">
              <div className="h-12 border-b border-slate-200 border-dashed" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Service Advisor</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-tighter font-medium">Verified by Workshop Officer</p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <div className="h-12 border-b border-slate-200 border-dashed" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Quality Inspection</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-tighter font-medium">Final Approval</p>
              </div>
            </div>
          </div>

          {/* Professional Footer */}
          <div className="mt-12 space-y-4">
            <div className="flex flex-col items-center justify-center pt-8 text-center space-y-2 border-t border-slate-100 opacity-60">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-900" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
                  {company?.name || "ServiceBay"} • Automotive Excellence Center
                </span>
              </div>
              <p className="text-[8px] text-slate-400 font-bold px-32 leading-tight uppercase tracking-widest">
                This is a computer generated technical completion report. All items mentioned above have been verified as per workshop standard operating procedures.
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
