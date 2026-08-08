"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../_components/report-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchLocations, 
  fetchMaterialIssuesSummaryReport,
  type ServiceLocationRow 
} from "@/lib/api";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
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

interface IssuedItemRecord {
  part_id: number;
  part_name: string;
  sku: string | null;
  unit: string | null;
  total_qty_issued: number | string;
  avg_unit_cost: number | string;
  total_cost_value: number | string;
}

async function downloadExcel(filename: string, rows: Array<IssuedItemRecord>, meta: { fromLocation: string; toLocation: string; period: string }) {
  if (rows.length === 0) return;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Material Issues Summary");

  // Title
  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Material Issues Summary Report";
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1e293b" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  // Meta
  ws.mergeCells("A2:F2");
  ws.getCell("A2").value = `From Location: ${meta.fromLocation} | To Location (Cost Center): ${meta.toLocation}`;
  ws.getCell("A2").font = { name: "Arial", size: 11, bold: true };
  ws.mergeCells("A3:F3");
  ws.getCell("A3").value = `Period: ${meta.period}`;
  ws.getCell("A3").font = { name: "Arial", size: 11, italic: true };

  ws.addRow([]); // Spacer

  // Header Row
  const headerRow = ws.addRow(["Material / Item", "SKU", "Unit", "Total Qty Issued", "Average Cost", "Total Cost Value"]);
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10b981" } }; // Emerald bg
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" }
    };
  });

  let grandTotal = 0;

  // Rows
  rows.forEach((r) => {
    const qty = Number(r.total_qty_issued);
    const avgCost = Number(r.avg_unit_cost);
    const totalCost = Number(r.total_cost_value);
    grandTotal += totalCost;

    const row = ws.addRow([
      r.part_name,
      r.sku || "-",
      r.unit || "-",
      qty,
      avgCost,
      totalCost
    ]);
    row.getCell(4).numFmt = '#,##0.000';
    row.getCell(5).numFmt = '#,##0.00';
    row.getCell(6).numFmt = '#,##0.00';
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
    });
  });

  // Grand Total Row
  const totalRow = ws.addRow([
    "Grand Total Cost Value",
    "",
    "",
    "",
    "",
    grandTotal
  ]);
  totalRow.getCell(6).numFmt = '#,##0.00';
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, name: "Arial", size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }; // Slate-200 tint
  });

  // Columns Width
  ws.columns = [
    { width: 45 }, { width: 25 }, { width: 15 }, { width: 20 }, { width: 20 }, { width: 20 }
  ];

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), filename);
}

export default function MaterialIssuesSummaryReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<IssuedItemRecord[]>([]);
  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);

  // Filters State
  const [locationId, setLocationId] = useState<string>(() => searchParams?.get("location_id") ?? "all");
  const [costCenterId, setCostCenterId] = useState<string>(() => searchParams?.get("cost_center_id") ?? "all");
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
      const data = await fetchMaterialIssuesSummaryReport({
        location_id: locationId === "all" ? "all" : locationId,
        cost_center_id: costCenterId,
        from,
        to
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLocations().then(() => void load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grandTotalCost = useMemo(() => {
    return rows.reduce((sum, r) => sum + Number(r.total_cost_value), 0);
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("location_id", locationId);
    qs.set("cost_center_id", costCenterId);
    qs.set("from", from);
    qs.set("to", to);
    return `/reports/material-issues-summary?${qs.toString()}`;
  }, [locationId, costCenterId, from, to]);

  const fromLocationLabel = useMemo(() => {
    return locations.find((o) => o.value === locationId)?.label ?? (locationId === "all" ? "All Locations" : locationId);
  }, [locations, locationId]);

  const toLocationLabel = useMemo(() => {
    return locations.find((o) => o.value === costCenterId)?.label ?? (costCenterId === "all" ? "All Cost Centers" : costCenterId);
  }, [locations, costCenterId]);

  return (
    <ReportShell
      title="Material Issues Summary Report"
      subtitle="Summary of items issued from stock to production or cost centers"
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1 text-sm">
          <div><span className="font-semibold">From Location:</span> {fromLocationLabel}</div>
          <div><span className="font-semibold">To Location (Cost Center):</span> {toLocationLabel}</div>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">From Location</div>
                <SearchableSelect
                  value={locationId}
                  onValueChange={setLocationId}
                  options={locations}
                  placeholder="Select location..."
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">To Location (Cost Center)</div>
                <SearchableSelect
                  value={costCenterId}
                  onValueChange={setCostCenterId}
                  options={locations.map(o => o.value === "all" ? { value: "all", label: "All Cost Centers" } : o)}
                  placeholder="Select cost center..."
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
                  onClick={() => void downloadExcel(`material-issues-${from}-to-${to}.xlsx`, rows, { fromLocation: fromLocationLabel, toLocation: toLocationLabel, period: `${from} to ${to}` })} 
                  className="h-9 gap-1"
                  disabled={loading || rows.length === 0}
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
                <th className="px-4 py-3 text-left">Material / Item</th>
                <th className="px-4 py-3 text-left w-36">SKU</th>
                <th className="px-4 py-3 text-left w-24">Unit</th>
                <th className="px-4 py-3 text-right w-36">Total Qty Issued</th>
                <th className="px-4 py-3 text-right w-36">Average Cost</th>
                <th className="px-4 py-3 text-right w-40">Total Cost Value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => {
                const qty = Number(r.total_qty_issued);
                const avgCost = Number(r.avg_unit_cost);
                const totalCost = Number(r.total_cost_value);
                return (
                  <tr key={r.part_id} className="hover:bg-muted/10 transition-colors font-medium">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-semibold">
                      {r.part_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.sku || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.unit || "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {qty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                      {avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">
                    {loading ? "Loading data..." : "No material issue records found for this period and location."}
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-muted/30 border-t font-semibold">
                <tr>
                  <td className="px-4 py-3 text-left" colSpan={3}>Grand Total Cost Value</td>
                  <td></td>
                  <td></td>
                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold text-base">
                    {grandTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>
    </ReportShell>
  );
}
