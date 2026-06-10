"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../../_components/report-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchLocations, 
  fetchAgingReport,
  type ServiceLocationRow,
  type AgingReportRow
} from "@/lib/api";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import { downloadExcelGeneric } from "@/lib/excel-export";

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayLocalDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AgingReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AgingReportRow[]>([]);

  // Master Data Options
  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);

  // Filters State
  const [locationId, setLocationId] = useState<string>(() => searchParams?.get("location_id") ?? "all");
  const [asOfDate, setAsOfDate] = useState<string>(() => searchParams?.get("date") ?? todayLocalDate());

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
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAgingReport({
        location_id: locationId,
        date: asOfDate
      });
      setRows(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    loadData();
  }, [locationId, asOfDate]);

  const handleExportExcel = async () => {
    try {
      const exportRows = rows.map(r => ({
        "Customer Name": r.customer_name || "-",
        "Phone": r.customer_phone || "-",
        "Total Outstanding": Number(r.total_outstanding) || 0,
        "0 - 30 Days": Number(r.days_0_30) || 0,
        "31 - 60 Days": Number(r.days_31_60) || 0,
        "61 - 90 Days": Number(r.days_61_90) || 0,
        "Over 90 Days": Number(r.days_over_90) || 0
      }));

      // Add Grand Totals
      const sumOut = rows.reduce((acc, curr) => acc + Number(curr.total_outstanding), 0);
      const sum0 = rows.reduce((acc, curr) => acc + Number(curr.days_0_30), 0);
      const sum31 = rows.reduce((acc, curr) => acc + Number(curr.days_31_60), 0);
      const sum61 = rows.reduce((acc, curr) => acc + Number(curr.days_61_90), 0);
      const sum90 = rows.reduce((acc, curr) => acc + Number(curr.days_over_90), 0);

      exportRows.push({
        "Customer Name": "GRAND TOTAL",
        "Phone": "",
        "Total Outstanding": sumOut,
        "0 - 30 Days": sum0,
        "31 - 60 Days": sum31,
        "61 - 90 Days": sum61,
        "Over 90 Days": sum90
      });

      await downloadExcelGeneric(`Aging_Report_As_Of_${asOfDate}.xlsx`, exportRows);
      toast({ title: "Success", description: "Excel file downloaded" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to export", variant: "destructive" });
    }
  };

  const currentLocName = locations.find((x) => x.value === locationId)?.label || "All Locations";
  const printMeta = `Location: ${currentLocName} | As Of Date: ${asOfDate}`;

  const sumOut = rows.reduce((acc, curr) => acc + Number(curr.total_outstanding), 0);
  const sum0 = rows.reduce((acc, curr) => acc + Number(curr.days_0_30), 0);
  const sum31 = rows.reduce((acc, curr) => acc + Number(curr.days_31_60), 0);
  const sum61 = rows.reduce((acc, curr) => acc + Number(curr.days_61_90), 0);
  const sum90 = rows.reduce((acc, curr) => acc + Number(curr.days_over_90), 0);

  return (
    <ReportShell
      title="Accounts Receivable Aging"
      subtitle="Outstanding balances grouped by age"
      printMeta={printMeta}
      actions={
        <>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
        </>
      }
    >
      <div className="print:hidden space-y-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium">Location</label>
                <SearchableSelect options={locations} value={locationId} onValueChange={setLocationId} placeholder="All Locations" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium">As Of Date</label>
                <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} onClick={(e) => { try { (e.target as any).showPicker(); } catch {} }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-md shadow-sm overflow-auto">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading aging data...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium text-right text-slate-800">Total Outstanding</th>
                <th className="px-4 py-3 font-medium text-right">0 - 30 Days</th>
                <th className="px-4 py-3 font-medium text-right">31 - 60 Days</th>
                <th className="px-4 py-3 font-medium text-right text-orange-600">61 - 90 Days</th>
                <th className="px-4 py-3 font-medium text-right text-destructive">Over 90 Days</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No outstanding balances found.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.customer_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{row.customer_name || '-'}</div>
                      <div className="text-xs text-muted-foreground">{row.customer_phone || 'No phone'}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800">{money(Number(row.total_outstanding))}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{Number(row.days_0_30) > 0 ? money(Number(row.days_0_30)) : '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{Number(row.days_31_60) > 0 ? money(Number(row.days_31_60)) : '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-orange-600 font-medium">{Number(row.days_61_90) > 0 ? money(Number(row.days_61_90)) : '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-destructive">{Number(row.days_over_90) > 0 ? money(Number(row.days_over_90)) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-muted/40 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="px-4 py-3 text-slate-800">GRAND TOTAL</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{money(sumOut)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{money(sum0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{money(sum31)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-orange-600">{money(sum61)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">{money(sum90)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </ReportShell>
  );
}
