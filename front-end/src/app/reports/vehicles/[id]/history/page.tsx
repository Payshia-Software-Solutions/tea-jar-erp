"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ReportShell } from "../../../_components/report-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchReportVehicleHistory, fetchVehicle, type VehicleRow } from "@/lib/api";
import { Download, FileSpreadsheet, ExternalLink, Loader2 } from "lucide-react";
import { downloadExcelGeneric as downloadCsv } from "@/lib/excel-export";

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function VehicleHistoryReportPage() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const id = Number(params?.id ?? 0);

  const [vehicle, setVehicle] = useState<VehicleRow | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [v, h] = await Promise.all([
        fetchVehicle(String(id)).catch(() => null),
        fetchReportVehicleHistory({ vehicleId: id, from: fromDate || undefined, to: toDate || undefined }),
      ]);
      setVehicle((v as any) ?? null);
      setRows(Array.isArray(h) ? h : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load maintenance history", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    let count = rows.length;
    let partsValue = 0;
    for (const r of rows) partsValue += Number(r.parts_value ?? 0) || 0;
    return { count, partsValue: Math.round(partsValue * 100) / 100 };
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    if (fromDate) qs.set("from", fromDate);
    if (toDate) qs.set("to", toDate);
    return `/reports/vehicles/${encodeURIComponent(String(id))}/history?${qs.toString()}`;
  }, [id, fromDate, toDate]);

  return (
    <ReportShell
      title="Vehicle Maintenance History"
      subtitle={vehicle ? `${vehicle.make} ${vehicle.model} • VIN: ${vehicle.vin}` : `Vehicle ID #${id}`}
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1">
          <div><span className="font-semibold">Period:</span> {fromDate || "-"} to {toDate || "-"}</div>
          <div><span className="font-semibold">Orders:</span> {totals.count} (Parts value: {money(totals.partsValue)})</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Date range (created date)</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <div className="text-xs text-muted-foreground mb-1">From</div>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <div className="text-xs text-muted-foreground mb-1">To</div>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="md:col-span-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => downloadCsv(`vehicle-${id}-history.csv`, rows)} disabled={loading || rows.length === 0}>
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
            <Badge variant="outline">Orders: {totals.count}</Badge>
            <Badge variant="outline">Parts Value (info): {money(totals.partsValue)}</Badge>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">History</CardTitle>
          <CardDescription>Orders related to this vehicle</CardDescription>
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
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Created</th>
                    <th className="text-left px-4 py-3">Completed</th>
                    <th className="text-right px-4 py-3">Parts (info)</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium">#{r.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.location_name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.status ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {r.created_at ? new Date(String(r.created_at).replace(" ", "T")).toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {r.completed_at ? new Date(String(r.completed_at).replace(" ", "T")).toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(Number(r.parts_value ?? 0))}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Open order">
                          <Link href={`/orders/${encodeURIComponent(String(r.id))}`} target="_blank">
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
