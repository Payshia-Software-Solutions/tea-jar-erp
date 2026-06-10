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
import { fetchLocations, fetchParts, fetchReportItemMovements, type PartRow, type ServiceLocationRow } from "@/lib/api";
import { Download, FileSpreadsheet, ExternalLink, Loader2 } from "lucide-react";
import { downloadExcelGeneric as downloadCsv } from "@/lib/excel-export";

function qtyFmt(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function todayLocalDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ItemMovementsReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const initialPartId = searchParams?.get("part_id") ?? "";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [partId, setPartId] = useState<string>(initialPartId);
  const [locationId, setLocationId] = useState<string>("all");
  const [movementType, setMovementType] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [ready, setReady] = useState(false);

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

  const loadParts = async () => {
    const rows = await fetchParts("");
    setParts(Array.isArray(rows) ? (rows as PartRow[]) : []);
  };

  const partOptions = useMemo(() => {
    return parts
      .map((p) => ({
        value: String(p.id),
        label: `${p.part_name}${p.sku ? ` (${p.sku})` : ""}`,
        keywords: `${p.part_name} ${p.sku ?? ""} ${p.brand_name ?? ""}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [parts]);

  const selectedPart = useMemo(() => {
    const pid = Number(partId);
    if (!pid) return null;
    return parts.find((p) => Number(p.id) === pid) ?? null;
  }, [parts, partId]);

  const load = async () => {
    const pid = Number(partId);
    if (!pid) {
      setRows([]);
      if (!isPrint) toast({ title: "Select an item", description: "Choose an item first, then click Run.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await fetchReportItemMovements({
        partId: pid,
        locationId: locationId === "all" ? "all" : Number(locationId),
        from: fromDate || undefined,
        to: toDate || undefined,
        movementType: movementType || undefined,
        limit: 500,
        offset: 0,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load item movements", variant: "destructive" });
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

    void Promise.all([loadLocations(), loadParts()]).then(() => {
      // allow state to set before auto-run (print mode or deep link)
      setTimeout(() => {
        setReady(true);
        if (initialPartId) void load();
        else setLoading(false);
      }, 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-run (debounced) when filters change so search feels responsive.
  useEffect(() => {
    if (!ready) return;
    if (!partId) return;
    const t = window.setTimeout(() => void load(), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, partId, locationId, movementType, fromDate, toDate]);

  const typeOptions = useMemo(
    () => [
      { value: "", label: "All Types" },
      { value: "GRN", label: "GRN" },
      { value: "ADJUSTMENT", label: "Adjustment" },
      { value: "ORDER_ISSUE", label: "Order Issue" },
      { value: "TRANSFER_OUT", label: "Transfer Out" },
      { value: "TRANSFER_IN", label: "Transfer In" },
    ],
    []
  );

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    if (partId) qs.set("part_id", partId);
    qs.set("location_id", locationId);
    if (movementType) qs.set("movement_type", movementType);
    if (fromDate) qs.set("from", fromDate);
    if (toDate) qs.set("to", toDate);
    return `/reports/item-movements?${qs.toString()}`;
  }, [partId, locationId, movementType, fromDate, toDate]);

  return (
    <ReportShell
      title="Item Movement Report"
      subtitle="Movements for a selected item (All or location-wise). Default: last 30 days."
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={!partId}
            onClick={() => (partId ? window.open(printHref, "_blank", "noopener,noreferrer") : null)}
          >
            Print
          </Button>
          <Button
            type="button"
            disabled={!partId}
            onClick={() => (partId ? window.open(printHref, "_blank", "noopener,noreferrer") : null)}
          >
            Export PDF
          </Button>
        </>
      }
      printMeta={
        <div className="space-y-1">
          <div><span className="font-semibold">Item:</span> {selectedPart ? `${selectedPart.part_name}${selectedPart.sku ? ` (${selectedPart.sku})` : ""}` : "-"}</div>
          <div><span className="font-semibold">Location:</span> {locationId === "all" ? "All" : locationId}</div>
          <div><span className="font-semibold">Period:</span> {fromDate || "-"} to {toDate || "-"}</div>
          {movementType ? <div><span className="font-semibold">Type:</span> {movementType}</div> : null}
          <div><span className="font-semibold">Rows:</span> {rows.length}</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Select an item, then filter by location, date range and type</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <div className="text-xs text-muted-foreground mb-1">Item</div>
              <SearchableSelect
                value={partId}
                onValueChange={setPartId}
                options={partOptions}
                placeholder="Select item..."
                searchPlaceholder="Search items (name/SKU/brand)..."
                emptyText="No items"
              />
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
              <div className="text-xs text-muted-foreground mb-1">Type</div>
              <SearchableSelect
                value={movementType}
                onValueChange={setMovementType}
                options={typeOptions}
                placeholder="All Types"
                searchPlaceholder="Search types..."
              />
            </div>
            <div className="md:col-span-1">
              <div className="text-xs text-muted-foreground mb-1">From</div>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <div className="text-xs text-muted-foreground mb-1">To</div>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="md:col-span-1 flex justify-end">
              <Button onClick={() => void load()} disabled={loading || !partId} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Run
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Rows: {rows.length}</Badge>
              <Badge variant="outline">Period: {fromDate || "-"} to {toDate || "-"}</Badge>
            </div>
            <Button variant="outline" onClick={() => downloadCsv(`item-movements-${todayLocalDate()}.csv`, rows)} disabled={loading || rows.length === 0 || !partId}>
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Movements</CardTitle>
          <CardDescription>Ref column links to the document when available</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!partId && !loading ? (
            <div className="py-16 text-center text-muted-foreground">Select an item to view movements.</div>
          ) : loading ? (
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
                    <th className="text-left px-4 py-3">When</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-left px-4 py-3">Item</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-right px-4 py-3">Qty</th>
                    <th className="text-left px-4 py-3">Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => {
                    const qty = Number(r.qty_change ?? 0);
                    return (
                      <tr key={r.id} className="border-t hover:bg-muted/10">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {r.created_at ? new Date(String(r.created_at).replace(" ", "T")).toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.location_name ?? r.location_id ?? "-"}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.part_name ?? "-"}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.brand_name ? `${r.brand_name} - ` : ""}
                            {r.sku ? `SKU: ${r.sku}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.movement_type ?? "-"}</td>
                        <td className={`px-4 py-3 text-right font-bold tabular-nums ${qty < 0 ? "text-destructive" : "text-green-700"}`}>
                          {qtyFmt(qty)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="truncate">
                              {r.doc_no ? r.doc_no : (r.ref_table ? `${r.ref_table}#${r.ref_id}` : "-")}
                            </span>
                            {r.ref_url ? (
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Open">
                                <Link href={String(r.ref_url)} target="_blank">
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                          {r.notes ? <div className="text-[11px]">{String(r.notes)}</div> : null}
                        </td>
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
