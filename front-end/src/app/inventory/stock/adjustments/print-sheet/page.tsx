"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchLocations, fetchLocationStockBalances } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt3(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export default function InventoryCountSheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const loc = searchParams?.get("loc");
  const locId = loc ? Number(loc) : null;
  const isBlind = searchParams?.get("blind") === "1";
  const auto = searchParams?.get("autoprint") === "1";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const printedRef = useRef(false);

  const selectedLocation = useMemo(() => {
    if (!locId) return null;
    return locations.find(l => Number(l.id) === locId) || { id: locId, name: `Location #${locId}` };
  }, [locId, locations]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [locsData, itemsData] = await Promise.all([
          fetchLocations().catch(() => []),
          locId ? fetchLocationStockBalances(locId).catch(() => []) : Promise.resolve([])
        ]);
        setLocations(Array.isArray(locsData) ? locsData : []);
        setItems(Array.isArray(itemsData) ? itemsData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [locId]);

  useEffect(() => {
    if (!auto) return;
    if (loading) return;
    if (items.length === 0) return;
    if (printedRef.current) return;
    printedRef.current = true;

    const t = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(t);
  }, [auto, loading, items]);

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          html,
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 10pt !important;
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
            border: 0.5pt solid #888 !important;
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
          <div className="font-semibold text-sm">
            {isBlind ? "Blind Inventory Count Sheet" : "Standard Inventory Count Sheet"} - A4
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Form
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Print Sheet
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
              Loading stock details...
            </div>
          ) : !locId ? (
            <div className="py-24 text-center text-muted-foreground font-medium">
              No inventory location specified. Please go back and select a location first.
            </div>
          ) : items.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground font-medium">
              No active items found in the database for the selected location.
            </div>
          ) : (
            <div className="flex flex-col min-h-full text-[11px] text-slate-800">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-5">
                <div>
                  <div className="text-xl font-black tracking-tighter text-slate-900 uppercase">BizzFlow</div>
                  <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">
                    Inventory Control Division
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black uppercase tracking-tight text-slate-900">
                    {isBlind ? "Blind Count Sheet" : "Inventory Count Sheet"}
                  </div>
                  <div className="mt-0.5 text-[9px] font-bold text-muted-foreground">
                    DATE GENERATED: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="grid grid-cols-3 gap-4 mb-5 border-b border-dashed border-slate-200 pb-3 font-medium">
                <div>
                  <div className="text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-tighter">Inventory Location</div>
                  <div className="text-slate-900 font-bold">{selectedLocation?.name || `Loc: #${locId}`}</div>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-tighter">Audit Type</div>
                  <div className="text-slate-900 font-bold uppercase">
                    {isBlind ? "🚫 Blind Count (Values Hidden)" : "📋 Reference Count (Values Shown)"}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-tighter">Total SKU Types</div>
                  <div className="text-slate-900 font-bold">{items.length} Items</div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-slate-50 border rounded-lg mb-6 print:mb-4 text-[10px] leading-relaxed border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wide block mb-1">Audit Instructions:</span>
                Please perform a physical count of the stock items listed below. Write the physical counted quantity in the <strong>Handwritten Count</strong> box. Highlight any major variances or visual defects under the remarks section. When complete, sign and date this document before submitting.
              </div>

              {/* Items Table */}
              <div className="flex-grow mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[8px] font-bold">
                      <th className="px-1.5 py-2 w-[35px] text-center">#</th>
                      <th className="px-1.5 py-2 text-left">Item Description</th>
                      {!isBlind && <th className="px-1.5 py-2 w-[80px] text-right">System Qty</th>}
                      <th className="px-1.5 py-2 w-[160px] text-center font-bold bg-slate-800 text-white border-l border-slate-950">
                        Handwritten Count
                      </th>
                      <th className="px-1.5 py-2 text-left w-[180px]">Discrepancy / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((it, idx) => {
                      const system = Number(it.stock_quantity ?? 0);
                      return (
                        <tr key={it.id || idx} className="h-12">
                          <td className="px-1.5 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-1.5 py-2 max-w-[280px]">
                            <div className="font-bold text-slate-900 truncate">{it.part_name}</div>
                            <div className="text-[8px] text-slate-500 uppercase tracking-tighter">
                              {it.sku ? `SKU: ${it.sku}` : `ID: ${it.id}`} {it.unit ? `| ${it.unit}` : ""}
                            </div>
                          </td>
                          {!isBlind && (
                            <td className="px-1.5 py-2 text-right font-mono tabular-nums text-slate-600">
                              {fmt3(system)}
                            </td>
                          )}
                          <td className="px-1.5 py-2 text-center border-l-2 border-r-2 border-slate-300 bg-slate-50/50">
                            {/* Empty box for write-in */}
                            <div className="h-7 w-28 mx-auto border border-dashed border-slate-400 bg-white rounded flex items-center justify-center font-bold text-slate-300">
                              [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                            </div>
                          </td>
                          <td className="px-1.5 py-2 text-slate-300 border-r border-slate-200">
                            {/* Blank line for remarks */}
                            <div className="h-px bg-slate-200 w-full mt-4"></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Minimal Signatures */}
              <div className="grid grid-cols-3 gap-10 mt-auto pt-6 text-[8px] uppercase font-black tracking-widest text-slate-300">
                <div>
                  <div className="w-full border-t-2 border-slate-300 mt-6 mb-1"></div>
                  <div className="text-slate-400 font-bold">COUNTED BY (SIGNATURE)</div>
                  <div className="text-[7px] text-slate-400 mt-0.5">DATE: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / 2026</div>
                </div>
                <div>
                  <div className="w-full border-t-2 border-slate-300 mt-6 mb-1"></div>
                  <div className="text-slate-400 font-bold">SUPERVISED BY (SIGNATURE)</div>
                  <div className="text-[7px] text-slate-400 mt-0.5">DATE: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / 2026</div>
                </div>
                <div>
                  <div className="w-full border-t-2 border-slate-300 mt-6 mb-1"></div>
                  <div className="text-slate-400 font-bold">AUTHORIZED RECONCILIATION</div>
                  <div className="text-[7px] text-slate-400 mt-0.5">DATE: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / 2026</div>
                </div>
              </div>

              {/* Minimal Footer */}
              <div className="mt-8 text-[7px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between italic tracking-tighter">
                <div>AUDIT LOCATION: {selectedLocation?.name} | PAGE TYPE: {isBlind ? "BLIND" : "STANDARD"}</div>
                <div>BIZZFLOW WAREHOUSE MANAGEMENT SYSTEM</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
