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
import { fetchDepartments, fetchReportVehicles, type DepartmentRow } from "@/lib/api";
import { Download, FileSpreadsheet, ExternalLink, Loader2 } from "lucide-react";
import { downloadExcelGeneric as downloadCsv } from "@/lib/excel-export";

export default function VehicleReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [deptOptions, setDeptOptions] = useState<Array<{ value: string; label: string }>>([{ value: "", label: "All Departments" }]);

  const loadDepts = async () => {
    try {
      const d = await fetchDepartments();
      const rows = Array.isArray(d) ? (d as DepartmentRow[]) : [];
      setDeptOptions([{ value: "", label: "All Departments" }, ...rows.map((x) => ({ value: String(x.id), label: String(x.name ?? "") }))]);
    } catch {
      setDeptOptions([{ value: "", label: "All Departments" }]);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchReportVehicles({
        q: query.trim() || undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load vehicle report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDepts().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = String(r.department_name ?? "Unassigned");
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    if (query.trim()) qs.set("q", query.trim());
    if (departmentId) qs.set("department_id", departmentId);
    return `/reports/vehicles?${qs.toString()}`;
  }, [query, departmentId]);

  return (
    <ReportShell
      title="Vehicle Report"
      subtitle="Vehicle register with department filter and exports."
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1">
          {query.trim() ? <div><span className="font-semibold">Search:</span> {query.trim()}</div> : null}
          {departmentId ? <div><span className="font-semibold">Department ID:</span> {departmentId}</div> : null}
          <div><span className="font-semibold">Vehicles:</span> {rows.length}</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Search and department</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-7">
              <div className="text-xs text-muted-foreground mb-1">Search</div>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Make, model, VIN..." />
            </div>
            <div className="md:col-span-4">
              <div className="text-xs text-muted-foreground mb-1">Department</div>
              <SearchableSelect value={departmentId} onValueChange={setDepartmentId} options={deptOptions} placeholder="All Departments" searchPlaceholder="Search..." />
            </div>
            <div className="md:col-span-1 flex justify-end">
              <Button onClick={() => void load()} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Run
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">Vehicles: {rows.length}</Badge>
              {byDept.map(([k, v]) => (
                <Badge key={k} variant="outline">{k}: {v}</Badge>
              ))}
            </div>
            <Button variant="outline" onClick={() => downloadCsv("vehicles.csv", rows)} disabled={loading || rows.length === 0}>
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Vehicles</CardTitle>
          <CardDescription>Open maintenance history for a vehicle</CardDescription>
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
                    <th className="text-left px-4 py-3">Vehicle</th>
                    <th className="text-left px-4 py-3">Department</th>
                    <th className="text-left px-4 py-3">VIN</th>
                    <th className="text-right px-4 py-3">Year</th>
                    <th className="text-right px-4 py-3">History</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium">
                        <div>{r.make} {r.model}</div>
                        <div className="text-[11px] text-muted-foreground">Vehicle ID: #{r.id}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.department_name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.vin ?? "-"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{r.year ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="outline" className="gap-2">
                          <Link href={`/reports/vehicles/${encodeURIComponent(String(r.id))}/history`}>
                            Open
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
