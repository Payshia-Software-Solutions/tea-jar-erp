"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../../_components/report-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchLocationSalesReport } from "@/lib/api";
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

export default function LocationSalesReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [from, setFrom] = useState<string>(() => searchParams?.get("from") ?? firstDayOfMonth());
  const [to, setTo] = useState<string>(() => searchParams?.get("to") ?? todayLocalDate());

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchLocationSalesReport({ from, to });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load location sales", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    let invoices = 0;
    let sales = 0;
    let paid = 0;
    for (const r of rows) {
      invoices += Number(r.invoice_count ?? 0);
      sales += Number(r.total_sales ?? 0);
      paid += Number(r.total_paid ?? 0);
    }
    return { invoices, sales, paid };
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("from", from);
    qs.set("to", to);
    return `/reports/sales/locations?${qs.toString()}`;
  }, [from, to]);

  return (
    <ReportShell
      title="Location-wise Sales Report"
      subtitle="Sales performance breakdown by service location"
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1 text-sm">
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
              <div className="md:col-span-5">
                <div className="text-xs text-muted-foreground mb-1">From</div>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="md:col-span-5">
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
                <Badge variant="outline">Locations: {rows.length}</Badge>
                <Badge variant="outline">Total Invoices: {totals.invoices}</Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Grand Total: {money(totals.sales)}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadCsv(`location-sales-${from}-to-${to}.csv`, rows)} disabled={loading || rows.length === 0}>
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
                  <th className="text-left px-4 py-3">Location Name</th>
                  <th className="text-center px-4 py-3">Invoice Count</th>
                  <th className="text-right px-4 py-3 font-bold">Total Sales</th>
                  <th className="text-right px-4 py-3">Total Paid</th>
                  <th className="text-right px-4 py-3">Outstanding</th>
                  <th className="text-right px-4 py-3">Sales Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No data found.</td></tr>
                ) : (
                  <>
                    {rows.map((r, i) => {
                      const share = totals.sales > 0 ? (Number(r.total_sales) / totals.sales) * 100 : 0;
                      return (
                        <tr key={i} className="border-b hover:bg-muted/5">
                          <td className="px-4 py-3 font-medium">{r.location_name}</td>
                          <td className="px-4 py-3 text-center">{r.invoice_count}</td>
                          <td className="px-4 py-3 text-right font-bold">{money(Number(r.total_sales))}</td>
                          <td className="px-4 py-3 text-right text-green-600">{money(Number(r.total_paid))}</td>
                          <td className="px-4 py-3 text-right text-rose-600">{money(Number(r.total_sales) - Number(r.total_paid))}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div className="bg-primary h-full" style={{ width: `${share}%` }}></div>
                              </div>
                              <span className="text-[10px] tabular-nums font-mono">{share.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-muted/20 font-bold">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-center">{totals.invoices}</td>
                      <td className="px-4 py-3 text-right">{money(totals.sales)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{money(totals.paid)}</td>
                      <td className="px-4 py-3 text-right text-rose-600">{money(totals.sales - totals.paid)}</td>
                      <td className="px-4 py-3 text-right">100.0%</td>
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
