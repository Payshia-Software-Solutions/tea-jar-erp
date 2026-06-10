"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../_components/report-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { fetchLocations, fetchReportStockTransfers, type ServiceLocationRow } from "@/lib/api";
import { Download, FileSpreadsheet, ExternalLink, Loader2 } from "lucide-react";
import { downloadExcelGeneric as downloadCsv } from "@/lib/excel-export";

function qtyFmt(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayLocalDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function StockTransferReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
  const [locationId, setLocationId] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [status, setStatus] = useState<string>("");

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
        ? (locRows as ServiceLocationRow[]).map((l) => ({ value: String(l.id), label: String(l.name ?? "") })).filter((o) => o.label)
        : [];
      setLocations([{ value: "all", label: "All Locations" }, ...opts]);
      return;
    }
    const allowed = Array.isArray(tokenJson?.allowed_locations) ? tokenJson.allowed_locations : [];
    const opts = allowed.map((x: any) => ({ value: String(x?.id), label: String(x?.name ?? "") })).filter((o: any) => Number(o.value) > 0 && o.label);
    setLocations([{ value: "all", label: "All Allowed Locations" }, ...opts]);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchReportStockTransfers({
        locationId: locationId === "all" ? "all" : Number(locationId),
        from: fromDate || undefined,
        to: toDate || undefined,
        status: status || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load stock transfer report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // default period: last 30 days
    const today = new Date();
    const d0 = new Date(today);
    d0.setDate(d0.getDate() - 30);
    const fmt = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    setFromDate(fmt(d0));
    setToDate(fmt(today));

    void loadLocations().then(() => setTimeout(() => void load(), 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All Status" },
      { value: "Requested", label: "Requested" },
      { value: "Received", label: "Received" },
      { value: "Cancelled", label: "Cancelled" },
    ],
    []
  );

  const totals = useMemo(() => {
    let qty = 0;
    let value = 0;
    for (const r of rows) {
      qty += Number(r.total_qty ?? 0) || 0;
      value += Number(r.total_value_info ?? 0) || 0;
    }
    return { qty, value: Math.round(value * 100) / 100 };
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("location_id", locationId);
    if (status) qs.set("status", status);
    if (fromDate) qs.set("from", fromDate);
    if (toDate) qs.set("to", toDate);
    return `/reports/stock-transfers?${qs.toString()}`;
  }, [locationId, status, fromDate, toDate]);

  return (
    <ReportShell
      title="Stock Transfer Report"
      subtitle="Transfers by date/status, All or location-wise (from/to)."
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1">
          <div><span className="font-semibold">Location Scope:</span> {locationId === "all" ? "All" : locationId}</div>
          <div><span className="font-semibold">Period:</span> {fromDate || "-"} to {toDate || "-"}</div>
          {status ? <div><span className="font-semibold">Status:</span> {status}</div> : null}
          <div><span className="font-semibold">Transfers:</span> {rows.length} (Total Qty: {qtyFmt(totals.qty)}, Value: {money(totals.value)})</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Location scope, date range, status</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <div className="text-xs text-muted-foreground mb-1">Location Scope</div>
              <SearchableSelect
                value={locationId}
                onValueChange={setLocationId}
                options={locations}
                placeholder="Select location..."
                searchPlaceholder="Search locations..."
              />
            </div>
            <div className="md:col-span-3">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <SearchableSelect value={status} onValueChange={setStatus} options={statusOptions} placeholder="All Status" searchPlaceholder="Search..." />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">From</div>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">To</div>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="md:col-span-1 flex justify-end">
              <Button onClick={() => void load()} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Run
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Transfers: {rows.length}</Badge>
              <Badge variant="outline">Total Qty: {qtyFmt(totals.qty)}</Badge>
              <Badge variant="outline">Value (info): {money(totals.value)}</Badge>
            </div>
            <Button variant="outline" onClick={() => downloadCsv(`stock-transfers-${todayLocalDate()}.csv`, rows)} disabled={loading || rows.length === 0}>
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Transfers</CardTitle>
          <CardDescription>Open transfer details from the Ref link</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 inline-block animate-spin mr-2" />
              Loading...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No results.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3">Transfer</th>
                    <th className="text-left px-4 py-3">From</th>
                    <th className="text-left px-4 py-3">To</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Qty</th>
                    <th className="text-right px-4 py-3">Value (info)</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium">{r.transfer_number ?? `#${r.id}`}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.from_location_name ?? r.from_location_id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.to_location_name ?? r.to_location_id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.status ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{qtyFmt(Number(r.total_qty ?? 0))}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(Number(r.total_value_info ?? 0))}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Open">
                          <Link href={`/inventory/transfers/${encodeURIComponent(String(r.id))}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </ReportShell>
  );
}
