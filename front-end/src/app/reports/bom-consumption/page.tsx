"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../_components/report-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchLocations, 
  fetchBOMConsumptionReport,
  type ServiceLocationRow 
} from "@/lib/api";
import { Download, Loader2, FileSpreadsheet, ChevronDown, ChevronRight } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function firstDayOfMonth() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function todayLocalDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface RawRecord {
  ingredient_id: number;
  ingredient_name: string;
  ingredient_sku: string | null;
  ingredient_unit: string | null;
  finished_id: number;
  finished_name: string;
  finished_sku: string | null;
  finished_qty_sold: number;
  theoretical_qty: number;
}

type GroupedRow = {
  ingredient_id: number;
  ingredient_name: string;
  ingredient_sku: string | null;
  ingredient_unit: string | null;
  total_qty: number;
  breakdown: Array<{
    finished_id: number;
    finished_name: string;
    finished_sku: string | null;
    finished_qty_sold: number;
    qty: number;
  }>;
};

async function downloadExcel(filename: string, rows: Array<GroupedRow>, meta: { location: string; period: string }) {
  if (rows.length === 0) return;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("BOM Stock Consumption");

  // Title
  ws.mergeCells("A1:E1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "BOM Stock Consumption Report";
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1e293b" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  // Meta
  ws.mergeCells("A2:E2");
  ws.getCell("A2").value = `Location: ${meta.location}`;
  ws.getCell("A2").font = { name: "Arial", size: 11, bold: true };
  ws.mergeCells("A3:E3");
  ws.getCell("A3").value = `Period: ${meta.period}`;
  ws.getCell("A3").font = { name: "Arial", size: 11, italic: true };

  ws.addRow([]); // Spacer

  // Header Row
  const headerRow = ws.addRow(["Material / Ingredient", "SKU", "Unit", "Theoretical Qty Consumed", "Details / Breakdown"]);
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10b981" } }; // Emerald bg
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" }
    };
  });

  // Rows
  rows.forEach((r) => {
    // Ingredient Main Row
    const row = ws.addRow([
      r.ingredient_name,
      r.ingredient_sku || "-",
      r.ingredient_unit || "-",
      Number(r.total_qty),
      "Summary Total"
    ]);
    row.getCell(4).numFmt = '#,##0.000';
    row.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } }; // Light emerald tint
    });

    // Breakdown Rows
    r.breakdown.forEach((b) => {
      const bRow = ws.addRow([
        `   └─ ${b.finished_name}`,
        b.finished_sku || "-",
        r.ingredient_unit || "-",
        Number(b.qty),
        `Finished Sales Qty: ${b.finished_qty_sold}`
      ]);
      bRow.getCell(4).numFmt = '#,##0.000';
      bRow.eachCell((cell) => {
        cell.font = { size: 10, italic: true, color: { argb: "FF475569" } };
      });
    });
  });

  // Columns Width
  ws.columns = [
    { width: 45 }, { width: 25 }, { width: 15 }, { width: 25 }, { width: 30 }
  ];

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), filename);
}

export default function BOMConsumptionReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  
  const [loading, setLoading] = useState(true);
  const [rawRows, setRawRows] = useState<RawRecord[]>([]);
  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Filters State
  const [locationId, setLocationId] = useState<string>(() => searchParams?.get("location_id") ?? "all");
  const [from, setFrom] = useState<string>(() => searchParams?.get("from") ?? firstDayOfMonth());
  const [to, setTo] = useState<string>(() => searchParams?.get("to") ?? todayLocalDate());

  const decodeToken = () => {
    try {
      const token = window.localStorage.getItem("auth_token");
      if (!token) return null;
      const part = token.split(".")[1];
      return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
      return null;
    }
  };

  const loadLocations = async () => {
    try {
      const tokenJson: any = decodeToken();
      const role = String(tokenJson?.role ?? "");
      if (role === "Admin") {
        const locRows = await fetchLocations();
        const opts = Array.isArray(locRows)
          ? (locRows as ServiceLocationRow[])
              .map((l) => ({ value: String(l.id), label: String(l.name ?? "") }))
              .filter((o) => o.value !== "0" && o.label)
          : [];
        setLocations([{ value: "all", label: "All Locations" }, ...opts]);
        return;
      }
      const allowed = Array.isArray(tokenJson?.allowed_locations) ? tokenJson.allowed_locations : [];
      const opts = allowed
        .map((x: any) => ({ value: String(x?.id), label: String(x?.name ?? "") }))
        .filter((o: any) => Number(o.value) > 0 && o.label);
      setLocations([{ value: "all", label: "All Allowed Locations" }, ...opts]);
    } catch (e) {
      console.error("Failed to load locations", e);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBOMConsumptionReport({
        location_id: locationId === "all" ? "all" : locationId,
        from,
        to
      });
      setRawRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRawRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLocations().then(() => void load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group Raw Records by Ingredient
  const groupedRows = useMemo(() => {
    const summaryMap = new Map<number, GroupedRow>();
    
    rawRows.forEach((r) => {
      if (!summaryMap.has(r.ingredient_id)) {
        summaryMap.set(r.ingredient_id, {
          ingredient_id: r.ingredient_id,
          ingredient_name: r.ingredient_name,
          ingredient_sku: r.ingredient_sku,
          ingredient_unit: r.ingredient_unit,
          total_qty: 0,
          breakdown: []
        });
      }
      const item = summaryMap.get(r.ingredient_id)!;
      item.total_qty += Number(r.theoretical_qty);
      item.breakdown.push({
        finished_id: r.finished_id,
        finished_name: r.finished_name,
        finished_sku: r.finished_sku,
        finished_qty_sold: Number(r.finished_qty_sold),
        qty: Number(r.theoretical_qty)
      });
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.total_qty - a.total_qty);
  }, [rawRows]);

  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("location_id", locationId);
    qs.set("from", from);
    qs.set("to", to);
    return `/reports/bom-consumption?${qs.toString()}`;
  }, [locationId, from, to]);

  const locationLabel = useMemo(() => {
    return locations.find((o) => o.value === locationId)?.label ?? (locationId === "all" ? "All Locations" : locationId);
  }, [locations, locationId]);

  return (
    <ReportShell
      title="BOM Stock Consumption Report"
      subtitle="Theoretical raw material consumption based on sales volume and BOM formulations"
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1 text-sm">
          <div><span className="font-semibold">Location:</span> {locationLabel}</div>
          <div><span className="font-semibold">Period:</span> {from} to {to}</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden mb-6 bg-muted/10">
          <CardHeader className="border-b bg-muted/20 py-3">
            <CardTitle className="text-base font-semibold">Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Location</div>
                <SearchableSelect
                  value={locationId}
                  onValueChange={setLocationId}
                  options={locations}
                  placeholder="Select location..."
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">From Date</div>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">To Date</div>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => void load()} className="flex-1 h-9" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Filter
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => void downloadExcel(`bom-consumption-${from}-to-${to}.xlsx`, groupedRows, { location: locationLabel, period: `${from} to ${to}` })} 
                  className="h-9 gap-1"
                  disabled={loading || groupedRows.length === 0}
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left w-12"></th>
                <th className="px-4 py-3 text-left">Material / Ingredient</th>
                <th className="px-4 py-3 text-left w-36">SKU</th>
                <th className="px-4 py-3 text-left w-24">Unit</th>
                <th className="px-4 py-3 text-right w-48">Theoretical Qty Consumed</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {groupedRows.map((r) => {
                const isExpanded = expandedIds.has(r.ingredient_id);
                return (
                  <React.Fragment key={r.ingredient_id}>
                    {/* Ingredient Summary Row */}
                    <tr 
                      onClick={() => toggleExpand(r.ingredient_id)}
                      className="hover:bg-muted/10 cursor-pointer transition-colors font-medium bg-emerald-50/20 dark:bg-emerald-950/5"
                    >
                      <td className="px-4 py-3 text-center">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground inline" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground inline" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-semibold">
                        {r.ingredient_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.ingredient_sku || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.ingredient_unit || "-"}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {r.total_qty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                      </td>
                    </tr>

                    {/* Breakdown Rows */}
                    {isExpanded && r.breakdown.map((b, bIdx) => (
                      <tr 
                        key={`${r.ingredient_id}-b-${bIdx}`} 
                        className="bg-muted/5 border-l-4 border-emerald-500 hover:bg-muted/15 transition-colors"
                      >
                        <td></td>
                        <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 pl-8">
                          <span className="text-muted-foreground mr-1">└─ Contributor:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{b.finished_name}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {b.finished_sku || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          Sales Qty: <span className="font-bold text-slate-700 dark:text-slate-300">{b.finished_qty_sold}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-right text-slate-800 dark:text-slate-200 pr-12 font-medium">
                          {b.qty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              {groupedRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">
                    {loading ? "Loading data..." : "No material consumption records found for this period and location."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </ReportShell>
  );
}
