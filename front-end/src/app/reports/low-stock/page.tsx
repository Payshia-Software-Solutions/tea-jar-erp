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
import { fetchLocations, fetchReportLowStock, type ServiceLocationRow } from "@/lib/api";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { downloadExcelGeneric as downloadCsv } from "@/lib/excel-export";

function qtyFmt(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export default function LowStockReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
  const [locationId, setLocationId] = useState<string>("all");
  const [query, setQuery] = useState("");

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
      const data = await fetchReportLowStock({
        locationId: locationId === "all" ? "all" : Number(locationId),
        q: query.trim() || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load low stock report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLocations().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const criticalCount = useMemo(() => rows.filter((r) => Number(r.qty ?? 0) <= 0).length, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("location_id", locationId);
    if (query.trim()) qs.set("q", query.trim());
    return `/reports/low-stock?${qs.toString()}`;
  }, [locationId, query]);

  return (
    <ReportShell
      title="Low Stock Report"
      subtitle="Items at/below reorder level (All or location-wise)."
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1">
          <div><span className="font-semibold">Location:</span> {locationId === "all" ? "All" : locationId}</div>
          {query.trim() ? <div><span className="font-semibold">Search:</span> {query.trim()}</div> : null}
          <div><span className="font-semibold">Rows:</span> {rows.length} (Zero/Negative: {criticalCount})</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Location and search</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6">
              <div className="text-xs text-muted-foreground mb-1">Search</div>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Item name or SKU..." />
            </div>
            <div className="md:col-span-6">
              <div className="text-xs text-muted-foreground mb-1">Location</div>
              <SearchableSelect
                value={locationId}
                onValueChange={setLocationId}
                options={locations}
                placeholder="Select location..."
                searchPlaceholder="Search locations..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Items: {rows.length}</Badge>
              <Badge variant="outline">Zero/Negative: {criticalCount}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => downloadCsv("low-stock.csv", rows)} disabled={loading || rows.length === 0}>
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
              <Button onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Run
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Low Stock Items</CardTitle>
          <CardDescription>Click an item to open movements</CardDescription>
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
                    <th className="text-left px-4 py-3">Item</th>
                    <th className="text-left px-4 py-3">Brand</th>
                    <th className="text-left px-4 py-3">SKU</th>
                    <th className="text-left px-4 py-3">Unit</th>
                    <th className="text-right px-4 py-3">Qty</th>
                    <th className="text-right px-4 py-3">Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => {
                    const q = Number(r.qty ?? 0);
                    const low = Number.isFinite(q) && q <= 0;
                    return (
                      <tr key={r.part_id} className="border-t hover:bg-muted/10">
                        <td className="px-4 py-3 font-medium">
                          <Link className="hover:underline" href={`/inventory/stock/movements/${encodeURIComponent(String(r.part_id))}`}>
                            {r.part_name ?? "-"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.brand_name ?? "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.sku ?? "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.unit ?? "-"}</td>
                        <td className={`px-4 py-3 text-right font-bold tabular-nums ${low ? "text-destructive" : ""}`}>{qtyFmt(q)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{r.reorder_level ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </ReportShell>
  );
}
