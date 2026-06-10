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
import { fetchLocations, fetchReportStockBalance, type ServiceLocationRow } from "@/lib/api";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
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

export default function StockBalanceReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
  const [locationId, setLocationId] = useState<string>(() => searchParams?.get("location_id") ?? "all");
  const [group, setGroup] = useState<"item" | "location">(() => (searchParams?.get("group") === "location" ? "location" : "item"));
  const [query, setQuery] = useState(() => searchParams?.get("q") ?? "");
  const [asOf, setAsOf] = useState<string>(() => searchParams?.get("as_of") ?? todayLocalDate());

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
      const data = await fetchReportStockBalance({
        locationId: locationId === "all" ? "all" : Number(locationId),
        group,
        q: query.trim() || undefined,
        asOf: asOf || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load stock balance report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // When opening via Print/PDF URL, apply filters from the query string.
    const initLoc = searchParams?.get("location_id") ?? "all";
    const initGroup = searchParams?.get("group") === "location" ? "location" : "item";
    const initQ = searchParams?.get("q") ?? "";
    const initAsOf = searchParams?.get("as_of") ?? todayLocalDate();

    setLocationId(initLoc);
    setGroup(initGroup);
    setQuery(initQ);
    setAsOf(initAsOf);

    void loadLocations().then(() => {
      // Use init* values for the first load so Print/PDF uses the URL filter reliably.
      setLoading(true);
      return fetchReportStockBalance({
        locationId: initLoc === "all" ? "all" : Number(initLoc),
        group: initGroup,
        q: initQ.trim() || undefined,
        asOf: initAsOf || undefined,
      })
        .then((data) => setRows(Array.isArray(data) ? data : []))
        .catch((e: any) => {
          setRows([]);
          toast({ title: "Error", description: e?.message || "Failed to load stock balance report", variant: "destructive" });
        })
        .finally(() => setLoading(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    let qty = 0;
    let value = 0;
    for (const r of rows) {
      const q = Number(r.qty ?? 0);
      const cost = Number(r.cost_price ?? 0);
      if (Number.isFinite(q)) qty += q;
      if (Number.isFinite(q) && Number.isFinite(cost)) value += q * cost;
    }
    return { qty, value: Math.round(value * 100) / 100 };
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("location_id", locationId);
    qs.set("group", group);
    if (query.trim()) qs.set("q", query.trim());
    if (asOf) qs.set("as_of", asOf);
    return `/reports/stock-balance?${qs.toString()}`;
  }, [locationId, group, query, asOf]);

  const locationLabel = useMemo(() => {
    const v = String(locationId ?? "");
    return locations.find((o) => o.value === v)?.label ?? (v === "all" ? "All" : v);
  }, [locations, locationId]);

  return (
    <ReportShell
      title="Stock Balance Report"
      subtitle="All items (All or location-wise). Uses stock movements ledger."
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1">
          <div><span className="font-semibold">Location:</span> {locationLabel}</div>
          <div><span className="font-semibold">View:</span> {group === "location" ? "By Location" : "Total by Item"}</div>
          <div><span className="font-semibold">As Of:</span> {asOf || "-"}</div>
          {query.trim() ? <div><span className="font-semibold">Search:</span> {query.trim()}</div> : null}
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Search, location and as-of date</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5">
              <div className="text-xs text-muted-foreground mb-1">Search</div>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, SKU, barcode..." />
            </div>
            <div className="md:col-span-3">
              <div className="text-xs text-muted-foreground mb-1">Location</div>
              <SearchableSelect
                value={locationId}
                onValueChange={setLocationId}
                options={locations}
                placeholder="Select location..."
                searchPlaceholder="Search locations..."
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">View</div>
              <SearchableSelect
                value={group}
                onValueChange={(v) => setGroup((v as any) === "location" ? "location" : "item")}
                options={[
                  { value: "item", label: "Total by Item" },
                  { value: "location", label: "By Location" },
                ]}
                placeholder="Total by Item"
                searchPlaceholder="Search..."
              />
            </div>
            <div className="md:col-span-3">
              <div className="text-xs text-muted-foreground mb-1">As Of</div>
              <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Items: {rows.length}</Badge>
              <Badge variant="outline">Total Qty: {qtyFmt(totals.qty)}</Badge>
              <Badge variant="outline">Value (info): {money(totals.value)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => downloadCsv(`stock-balance-${asOf || "today"}.csv`, rows)} disabled={loading || rows.length === 0}>
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
          <CardTitle className="text-lg">Balances</CardTitle>
          <CardDescription>Click an item to open its stock movements</CardDescription>
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
                    {group === "location" ? <th className="text-left px-4 py-3">Location</th> : null}
                    <th className="text-left px-4 py-3">Item</th>
                    <th className="text-left px-4 py-3">Brand</th>
                    <th className="text-left px-4 py-3">SKU</th>
                    <th className="text-left px-4 py-3">Unit</th>
                    <th className="text-right px-4 py-3">Qty</th>
                    <th className="text-right px-4 py-3">Reorder</th>
                    <th className="text-right px-4 py-3">Cost</th>
                    <th className="text-right px-4 py-3">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => {
                    const q = Number(r.qty ?? 0);
                    const cost = Number(r.cost_price ?? 0);
                    const value = Number.isFinite(q) && Number.isFinite(cost) ? Math.round(q * cost * 100) / 100 : 0;
                    const key = group === "location" ? `${r.location_id}-${r.part_id}` : String(r.part_id);
                    return (
                      <tr key={key} className="border-t hover:bg-muted/10">
                        {group === "location" ? (
                          <td className="px-4 py-3 text-muted-foreground">{r.location_name ?? r.location_id ?? "-"}</td>
                        ) : null}
                        <td className="px-4 py-3 font-medium">
                          <Link className="hover:underline" href={`/inventory/stock/movements/${encodeURIComponent(String(r.part_id))}`}>
                            {r.part_name ?? "-"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.brand_name ?? "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.sku ?? "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.unit ?? "-"}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{qtyFmt(q)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{r.reorder_level ?? "-"}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{money(cost)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(value)}</td>
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
