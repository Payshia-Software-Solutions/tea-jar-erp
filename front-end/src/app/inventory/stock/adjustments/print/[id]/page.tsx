"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { fetchStockAdjustmentBatch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt3(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export default function StockAdjustmentPrintPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;
  const auto = searchParams?.get("autoprint") === "1";
  const loc = searchParams?.get("loc");
  const locId = loc ? Number(loc) : null;

  const [loading, setLoading] = useState(true);
  const [hdr, setHdr] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const printedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data: any = await fetchStockAdjustmentBatch(String(id));
        setHdr(data?.adjustment ?? null);
        setItems(Array.isArray(data?.items) ? data.items : []);
      } finally {
        setLoading(false);
      }
    };
    if (id) void run();
  }, [id, locId]);

  const totalVariance = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.qty_change ?? 0), 0);
  }, [items]);

  useEffect(() => {
    if (!auto) return;
    if (loading) return;
    if (!hdr) return;
    if (printedRef.current) return;
    printedRef.current = true;

    const t = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(t);
  }, [auto, loading, hdr]);

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          html,
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 11pt !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .A4-sheet {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 0.5pt solid #ccc !important;
            padding: 6pt !important;
            text-align: left;
          }
          th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="print:hidden sticky top-0 z-10 bg-background/90 backdrop-blur border-b">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-semibold">Stock Adjustment Report - A4</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/inventory/stock/adjustments/${encodeURIComponent(String(id))}`)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print Report
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-muted/10 min-h-screen py-10 print:bg-white print:py-0">
        <div className={cn(
          "mx-auto w-[210mm] max-w-full bg-white border shadow-lg rounded-sm p-[15mm] transition-all duration-300",
          "print:w-full print:border-0 print:shadow-none print:rounded-none print:p-0"
        )}>
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading adjustment details...
            </div>
          ) : !hdr ? (
            <div className="py-24 text-center text-muted-foreground font-medium">
              The requested stock adjustment document does not exist or is inaccessible.
            </div>
          ) : (
            <div className="flex flex-col min-h-full text-[11px]">
              {/* Header */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-5">
                <div>
                  <div className="text-xl font-black tracking-tighter text-slate-900 uppercase">ServiceBay</div>
                  <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">
                    Inventory Control Division
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black uppercase tracking-tight text-slate-900">Stock Adjustment Advice</div>
                  <div className="mt-0.5 flex items-center justify-end gap-3 text-[9px] font-bold">
                    <div>REF: <span className="text-primary">{hdr.adjustment_number ?? `#${id}`}</span></div>
                    <div>DATE: {hdr.adjusted_at ? new Date(String(hdr.adjusted_at).replace(" ", "T")).toLocaleDateString() : "-"}</div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="grid grid-cols-3 gap-4 mb-5 border-b border-dashed border-slate-200 pb-3 font-medium">
                <div>
                  <div className="text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-tighter">Inventory Location</div>
                  <div className="text-slate-900">{hdr.location_name ?? `Loc: #${hdr.location_id}`}</div>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-tighter">Adjustment By</div>
                  <div className="text-slate-900">{hdr.created_by_name ?? "System User"}</div>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-tighter">Main Reason</div>
                  <div className="text-slate-900 italic font-semibold">{hdr.reason ?? "General Correction"}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-grow mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[8px] font-bold">
                      <th className="px-1.5 py-1.5 w-[30px] text-center">#</th>
                      <th className="px-1.5 py-1.5 text-left">Part Description</th>
                      <th className="px-1.5 py-1.5 w-[80px] text-center">Batch</th>
                      <th className="px-1.5 py-1.5 w-[60px] text-right">System</th>
                      <th className="px-1.5 py-1.5 w-[60px] text-right">Phys.</th>
                      <th className="px-1.5 py-1.5 w-[60px] text-right">Var.</th>
                      <th className="px-1.5 py-1.5 w-[70px] text-right">Cost</th>
                      <th className="px-1.5 py-1.5 w-[80px] text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => {
                      const system = Number(it.system_stock ?? 0);
                      const physical = Number(it.physical_stock ?? system);
                      const variance = Number(it.qty_change ?? 0);
                      const cost = Number(it.unit_cost ?? 0);
                      const lineValue = variance * cost;
                      return (
                        <tr key={it.id || idx}>
                          <td className="px-1.5 py-1.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-1.5 py-1.5">
                            <div className="font-bold text-slate-900">{it.part_name}</div>
                            <div className="text-[8px] text-slate-500 uppercase tracking-tighter">
                              {it.sku ? `SKU: ${it.sku}` : `ID: ${it.part_id}`} {it.unit ? `| ${it.unit}` : ""}
                            </div>
                          </td>
                          <td className="px-1.5 py-1.5 text-center">
                            <span className="font-mono text-[8px] font-bold text-slate-600 bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                              {it.batch_number ?? "UNBATCHED"}
                            </span>
                          </td>
                          <td className="px-1.5 py-1.5 text-right tabular-nums">{fmt3(system)}</td>
                          <td className="px-1.5 py-1.5 text-right tabular-nums">{fmt3(physical)}</td>
                          <td className={cn(
                            "px-1.5 py-1.5 text-right font-black tabular-nums",
                            variance > 0 ? "text-blue-700 font-bold" : variance < 0 ? "text-red-700 font-bold" : "text-slate-400 font-normal"
                          )}>
                            {variance > 0 ? "+" : ""}{fmt3(variance)}
                          </td>
                          <td className="px-1.5 py-1.5 text-right tabular-nums text-slate-500">
                            {cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={cn(
                            "px-1.5 py-1.5 text-right font-bold tabular-nums",
                            lineValue > 0 ? "text-blue-700" : lineValue < 0 ? "text-red-700" : "text-slate-900"
                          )}>
                            {lineValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 text-[10px]">
                    <tr className="bg-slate-50 font-black">
                      <td colSpan={5} className="px-2 py-2 text-right uppercase tracking-widest text-[8px]">Adjustment Totals</td>
                      <td className={cn(
                        "px-1.5 py-2 text-right tabular-nums",
                        totalVariance > 0 ? "text-blue-600" : totalVariance < 0 ? "text-red-600" : ""
                      )}>
                        {totalVariance > 0 ? "+" : ""}{fmt3(totalVariance)}
                      </td>
                      <td className="px-1.5 py-2 border-l border-slate-200"></td>
                      <td className={cn(
                        "px-1.5 py-2 text-right tabular-nums text-xs",
                        items.reduce((s, x) => s + (Number(x.qty_change ?? 0) * Number(x.unit_cost ?? 0)), 0) > 0 
                          ? "text-blue-700" 
                          : items.reduce((s, x) => s + (Number(x.qty_change ?? 0) * Number(x.unit_cost ?? 0)), 0) < 0 
                            ? "text-red-700" 
                            : "text-slate-900"
                      )}>
                        {items.reduce((s, x) => s + (Number(x.qty_change ?? 0) * Number(x.unit_cost ?? 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Minimal Signatures */}
              <div className="grid grid-cols-3 gap-10 mt-auto pt-4 text-[8px] uppercase font-black tracking-widest text-slate-300">
                <div>
                  <div className="w-full border-t border-slate-200 mt-6 mb-1"></div>
                  <div>PREPARED BY</div>
                </div>
                <div>
                  <div className="w-full border-t border-slate-200 mt-6 mb-1"></div>
                  <div>VERIFIED BY</div>
                </div>
                <div>
                  <div className="w-full border-t border-slate-200 mt-6 mb-1"></div>
                  <div>AUTHORIZED</div>
                </div>
              </div>

              {/* Minimal Footer */}
              <div className="mt-6 text-[7px] text-slate-400 border-t border-slate-50 pt-1.5 flex justify-between italic tracking-tighter">
                <div>SYSTEM RECORD: ADJ-{id} | GENERATED: {new Date().toLocaleString()}</div>
                <div>SERVICEBAY INVENTORY CONTROL</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
