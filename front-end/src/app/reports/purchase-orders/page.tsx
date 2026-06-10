"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../_components/report-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchPurchaseOrders } from "@/lib/api";
import { Download, FileSpreadsheet, ExternalLink, Loader2 } from "lucide-react";
import { downloadExcelGeneric as downloadCsv } from "@/lib/excel-export";

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PurchaseOrderReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchaseOrders(query.trim());
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load purchase orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    let open = 0;
    let closed = 0;
    for (const r of rows) {
      const st = String(r.status ?? "");
      if (st === "Closed") closed++;
      else open++;
    }
    return { open, closed };
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    if (query.trim()) qs.set("q", query.trim());
    return `/reports/purchase-orders?${qs.toString()}`;
  }, [query]);

  return (
    <ReportShell
      title="Purchase Orders Report"
      subtitle="PO list and quick export (uses purchasing data)."
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1">
          {query.trim() ? <div><span className="font-semibold">Search:</span> {query.trim()}</div> : null}
          <div><span className="font-semibold">POs:</span> {rows.length} (Open: {totals.open}, Closed: {totals.closed})</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Search by PO No, supplier, status</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Search</div>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="PO number, supplier, status..." />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => downloadCsv("purchase-orders.csv", rows)} disabled={loading || rows.length === 0}>
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
              <Button onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Run
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Badge variant="outline">POs: {rows.length}</Badge>
            <Badge variant="outline">Open: {totals.open}</Badge>
            <Badge variant="outline">Closed: {totals.closed}</Badge>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Purchase Orders</CardTitle>
          <CardDescription>Open print in new tab</CardDescription>
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
                    <th className="text-left px-4 py-3">PO</th>
                    <th className="text-left px-4 py-3">Supplier</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Ordered</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium">{r.po_number ?? `#${r.id}`}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.supplier_name ?? r.supplier_id ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.location_name ?? r.location_id ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.status ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.ordered_at ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Open print">
                          <Link href={`/inventory/purchase-orders/print/${encodeURIComponent(String(r.id))}`} target="_blank">
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
