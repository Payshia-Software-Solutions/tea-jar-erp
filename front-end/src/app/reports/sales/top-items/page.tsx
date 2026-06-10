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
import { fetchLocations, fetchTopSellingItemsReport, type ServiceLocationRow } from "@/lib/api";
import { Download, FileSpreadsheet, Loader2, TrendingUp } from "lucide-react";
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

export default function TopItemsReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
  const [locationId, setLocationId] = useState<string>(() => searchParams?.get("location_id") ?? "all");
  const [from, setFrom] = useState<string>(() => searchParams?.get("from") ?? firstDayOfMonth());
  const [to, setTo] = useState<string>(() => searchParams?.get("to") ?? todayLocalDate());
  const [limit, setLimit] = useState<number>(20);

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
      const data = await fetchTopSellingItemsReport({
        location_id: locationId === "all" ? "all" : locationId,
        from,
        to,
        limit,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load top items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLocations().then(() => void load());
  }, []);

  const totals = useMemo(() => {
    let revenue = 0;
    let qty = 0;
    for (const r of rows) {
      revenue += Number(r.total_revenue ?? 0);
      qty += Number(r.total_qty ?? 0);
    }
    return { revenue, qty };
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("location_id", locationId);
    qs.set("from", from);
    qs.set("to", to);
    qs.set("limit", String(limit));
    return `/reports/sales/top-items?${qs.toString()}`;
  }, [locationId, from, to, limit]);

  return (
    <ReportShell
      title="Top Selling Items Report"
      subtitle="Identify your most popular products and services"
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1 text-sm">
          <div><span className="font-semibold">Location:</span> {locationId === "all" ? "All" : locationId}</div>
          <div><span className="font-semibold">Period:</span> {from} to {to}</div>
          <div><span className="font-semibold">Top:</span> {limit} items</div>
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
              <div className="md:col-span-3">
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
              <div className="md:col-span-1">
                <div className="text-xs text-muted-foreground mb-1">Limit</div>
                <Input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
              </div>
              <div className="md:col-span-2">
                <Button className="w-full" onClick={() => void load()} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Run
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Top Items by Quantity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="text-left px-4 py-3">Description</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-right px-4 py-3">Qty Sold</th>
                      <th className="text-right px-4 py-3">Revenue</th>
                      <th className="text-right px-4 py-3">Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Loading...</td></tr>
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No data found.</td></tr>
                    ) : (
                      rows.map((r, i) => {
                        const share = totals.revenue > 0 ? (Number(r.total_revenue) / totals.revenue) * 100 : 0;
                        return (
                          <tr key={i} className="border-b hover:bg-muted/5">
                            <td className="px-4 py-3 font-medium">{r.description}</td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="text-[10px] uppercase">{r.item_type}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-bold tabular-nums">{Number(r.total_qty).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{money(Number(r.total_revenue))}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-[10px] tabular-nums font-mono">{share.toFixed(1)}%</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-sm uppercase tracking-wider">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-center py-4">
                <div className="text-xs text-muted-foreground uppercase mb-1">Total Revenue (Top {limit})</div>
                <div className="text-3xl font-black text-primary">{money(totals.revenue)}</div>
              </div>
              <div className="space-y-2">
                {useMemo(() => {
                  const byType: Record<string, number> = {};
                  rows.forEach(r => {
                    byType[r.item_type] = (byType[r.item_type] || 0) + Number(r.total_revenue);
                  });
                  return Object.entries(byType).sort((a,b) => b[1] - a[1]).map(([type, rev]) => {
                    const p = (rev / totals.revenue) * 100;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>{type}</span>
                          <span>{money(rev)} ({p.toFixed(1)}%)</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${p}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                }, [rows, totals.revenue])}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ReportShell>
  );
}
