"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../../_components/report-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { fetchLocations, fetchTaxReport, type ServiceLocationRow } from "@/lib/api";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { downloadExcelGeneric as downloadCsv } from "@/lib/excel-export";

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

export default function TaxReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
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

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchTaxReport({
        location_id: locationId === "all" ? "all" : locationId,
        from,
        to,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load tax report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLocations().then(() => void load());
  }, []);

  const totals = useMemo(() => {
    let tax = 0;
    let taxable = 0;
    for (const r of rows) {
      tax += Number(r.total_tax ?? 0);
      taxable += Number(r.total_taxable ?? 0);
    }
    return { tax, taxable };
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("location_id", locationId);
    qs.set("from", from);
    qs.set("to", to);
    return `/reports/sales/tax?${qs.toString()}`;
  }, [locationId, from, to]);

  const locationLabel = useMemo(() => {
    return locations.find((o) => o.value === locationId)?.label ?? (locationId === "all" ? "All" : locationId);
  }, [locations, locationId]);

  return (
    <ReportShell
      title="Tax Summary Report"
      subtitle="Breakdown of taxes collected on sales"
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
        <Card className="border-none shadow-md overflow-hidden mb-6">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <div className="text-xs text-muted-foreground mb-1">Location</div>
                <SearchableSelect
                  value={locationId}
                  onValueChange={setLocationId}
                  options={locations}
                  placeholder="Select location..."
                />
              </div>
              <div className="md:col-span-3">
                <div className="text-xs text-muted-foreground mb-1">From</div>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="md:col-span-3">
                <div className="text-xs text-muted-foreground mb-1">To</div>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Button className="w-full" onClick={() => void load()} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Run
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Tax Types: {rows.length}</Badge>
                <Badge variant="outline">Taxable Amount: {money(totals.taxable)}</Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Total Tax: {money(totals.tax)}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadCsv(`tax-report-${from}-to-${to}.csv`, rows)} disabled={loading || rows.length === 0}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-3">Tax Name</th>
                  <th className="text-right px-4 py-3">Taxable Amount</th>
                  <th className="text-right px-4 py-3 font-bold">Tax Collected</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">No tax data found.</td></tr>
                ) : (
                  <>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-muted/5">
                        <td className="px-4 py-3 font-medium">{r.tax_name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{money(Number(r.total_taxable))}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-primary">{money(Number(r.total_tax))}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20 font-bold">
                      <td className="px-4 py-3">TOTAL TAX LIABILITY</td>
                      <td className="px-4 py-3 text-right">{money(totals.taxable)}</td>
                      <td className="px-4 py-3 text-right text-primary">{money(totals.tax)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </ReportShell>
  );
}
