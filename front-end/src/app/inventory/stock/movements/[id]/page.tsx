"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchLocations, fetchPart, fetchPartLocationStock, fetchPartMovements, type LocationStock, type PartRow, type ServiceLocation } from "@/lib/api";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

function qtyFmt(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export default function StockMovementsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;

  const [part, setPart] = useState<PartRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [locationId, setLocationId] = useState<number>(1);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [selectedMovementId, setSelectedMovementId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalMovements, setTotalMovements] = useState(0);
  const [locStock, setLocStock] = useState<LocationStock | null>(null);
  const [locStockLoading, setLocStockLoading] = useState(false);

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

  const loadMovements = async (pid: string, locId: number, from?: string, to?: string, pageNum: number = 1) => {
    setMovementsLoading(true);
    setMovements([]);
    setSelectedMovementId(null);
    try {
      const offset = (pageNum - 1) * pageSize;
      const data = await fetchPartMovements(
        pid,
        pageSize,
        locId,
        (from ?? fromDate) || undefined,
        (to ?? toDate) || undefined,
        offset
      );
      
      let rows: any[] = [];
      if (data && data.data && Array.isArray(data.data)) {
        rows = data.data;
        setTotalMovements(Number(data.total) || 0);
      } else if (Array.isArray(data)) {
        rows = data;
        setTotalMovements(data.length);
      }
      
      setMovements(rows);
      const first = rows.length > 0 ? rows[0] : null;
      if (first && typeof first.id === "number") setSelectedMovementId(first.id);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load movements", variant: "destructive" });
    } finally {
      setMovementsLoading(false);
    }
  };

  const loadLocationStock = async (pid: string, locId: number) => {
    setLocStockLoading(true);
    try {
      const s = await fetchPartLocationStock(pid, locId);
      setLocStock(s ?? null);
    } catch {
      setLocStock(null);
    } finally {
      setLocStockLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      setLoading(true);
      try {
        // Default period: last 30 days
        const today = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const d0 = new Date(today);
        d0.setDate(d0.getDate() - 30);
        const defaultFrom = fmt(d0);
        const defaultTo = fmt(today);
        setFromDate(defaultFrom);
        setToDate(defaultTo);

        const tokenJson: any = decodeToken();
        const role = String(tokenJson?.role ?? "").toLowerCase();
        const allowed = Array.isArray(tokenJson?.allowed_locations) ? tokenJson.allowed_locations : [];
        const allowedLocs = allowed
          .map((x: any) => ({ id: Number(x?.id), name: String(x?.name ?? "") }))
          .filter((x: any) => x.id > 0 && x.name);

        let locs: Array<{ id: number; name: string }> = [];
        if (role === "admin") {
          const rows = await fetchLocations();
          locs = Array.isArray(rows)
            ? (rows as ServiceLocation[]).map((l) => ({ id: Number(l.id), name: String(l.name ?? "") })).filter((l) => l.id > 0 && l.name)
            : [];
        } else {
          locs = allowedLocs;
        }
        if (locs.length === 0) {
          setLocations([]);
          setLoading(false);
          return;
        }
        setLocations(locs);

        const fromQuery = Number(searchParams?.get("location_id") || 0);
        const ls = Number(window.localStorage.getItem("location_id") || 0);
        const initLoc = (fromQuery > 0 ? fromQuery : (ls > 0 ? ls : (locs[0]?.id ?? 1)));
        setLocationId(initLoc);

        const p = await fetchPart(String(id));
        setPart((p as any) ?? null);

        // Load movements after default dates are set
        await loadMovements(String(id), initLoc, defaultFrom, defaultTo, 1);
        setPage(1);
        await loadLocationStock(String(id), initLoc);
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load part/movements", variant: "destructive" });
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (!fromDate || !toDate) return;
    void loadMovements(String(id), locationId, undefined, undefined, 1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const selected = useMemo(() => movements.find((x) => x.id === selectedMovementId) ?? null, [movements, selectedMovementId]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => router.push("/inventory/stock")}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Stock Movements</h1>
            <p className="text-muted-foreground mt-1">
              {part ? `${part.part_name}${part.sku ? ` (${part.sku})` : ""}` : "Movement history"}
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">From</div>
            <input
              type="date"
              className="h-9 w-[150px] rounded-md border bg-background px-3 text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={loading || movementsLoading}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">To</div>
            <input
              type="date"
              className="h-9 w-[150px] rounded-md border bg-background px-3 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={loading || movementsLoading}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Location</div>
            <select
              className="h-9 min-w-[260px] rounded-md border bg-background px-3 text-sm"
              value={String(locationId)}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v) || v <= 0) return;
                setLocationId(v);
                if (id) {
                  setPage(1);
                  void loadMovements(String(id), v, undefined, undefined, 1);
                  void loadLocationStock(String(id), v);
                }
              }}
              disabled={loading || movementsLoading}
            >
              {locations.map((l) => (
                <option key={l.id} value={String(l.id)}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">Movements</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Ref</TableHead>
                    <TableHead className="hidden md:table-cell">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Loading movements...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">No movements</TableCell>
                    </TableRow>
                  ) : (
                    movements.map((m) => {
                      const isSel = selectedMovementId === m.id;
                      const refLabel = String(m.ref_label ?? (m.ref_table ? `${m.ref_table}#${m.ref_id ?? ""}` : "-"));
                      return (
                        <TableRow
                          key={m.id}
                          className={isSel ? "bg-muted/30" : "cursor-pointer hover:bg-muted/10"}
                          onClick={() => setSelectedMovementId(m.id)}
                        >
                          <TableCell className="font-mono text-xs">{m.id}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{m.movement_type}</Badge></TableCell>
                          <TableCell className={`font-bold ${Number(m.qty_change) < 0 ? "text-destructive" : "text-green-700"}`}>
                            {qtyFmt(Number(m.qty_change))}
                          </TableCell>
                          <TableCell className="text-sm">
                            {m.ref_url ? (
                              <Link
                                href={String(m.ref_url)}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {refLabel}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">{refLabel}</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {m.created_at ? new Date(String(m.created_at).replace(" ", "T")).toLocaleString() : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {movements.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalMovements)} of {totalMovements}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => {
                    const newPage = page - 1;
                    setPage(newPage);
                    void loadMovements(String(id), locationId, undefined, undefined, newPage);
                  }}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page * pageSize >= totalMovements} onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    void loadMovements(String(id), locationId, undefined, undefined, newPage);
                  }}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">Quick View</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!selected ? (
                <div className="text-sm text-muted-foreground">Select a movement to preview the reference document.</div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Reference</div>
                    <div className="font-semibold">{String(selected.ref_label ?? "-")}</div>
                    <div className="text-xs text-muted-foreground">{selected.ref_type ?? ""}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Location</div>
                      <div className="font-medium">{selected.location_name ? String(selected.location_name) : "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">When</div>
                      <div className="font-medium">
                        {selected.created_at ? new Date(String(selected.created_at).replace(" ", "T")).toLocaleString() : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Type</div>
                      <div className="font-medium">{String(selected.movement_type ?? "-")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Qty</div>
                      <div className={`font-bold ${Number(selected.qty_change) < 0 ? "text-destructive" : "text-green-700"}`}>
                        {qtyFmt(Number(selected.qty_change))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">User</div>
                      <div className="font-medium text-xs">{selected.created_by_name ? String(selected.created_by_name) : "-"}</div>
                    </div>
                  </div>

                  {selected.movement_type === "GRN" ? (
                    <div className="rounded-md bg-background border p-3 text-sm space-y-1">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Quick View</div>
                      <div><span className="text-muted-foreground">Supplier:</span> <span className="font-medium">{selected.grn_supplier_name ?? "-"}</span></div>
                      <div><span className="text-muted-foreground">Received:</span> <span className="font-medium">{selected.grn_received_at ?? "-"}</span></div>
                      <div><span className="text-muted-foreground">PO:</span> <span className="font-medium">{selected.grn_po_number ?? "-"}</span></div>
                    </div>
                  ) : selected.movement_type === "ADJUSTMENT" ? (
                    <div className="rounded-md bg-background border p-3 text-sm space-y-1">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Quick View</div>
                      <div><span className="text-muted-foreground">Adjusted:</span> <span className="font-medium">{selected.adjustment_at ?? "-"}</span></div>
                      <div><span className="text-muted-foreground">Reason:</span> <span className="font-medium">{selected.adjustment_reason ?? "-"}</span></div>
                    </div>
                  ) : selected.movement_type === "ORDER_ISSUE" ? (
                    <div className="rounded-md bg-background border p-3 text-sm space-y-1">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Quick View</div>
                      <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{selected.vehicle_identifier ?? selected.vehicle_model ?? "-"}</span></div>
                      <div><span className="text-muted-foreground">Priority:</span> <span className="font-medium">{selected.order_priority ?? "-"}</span></div>
                      <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{selected.order_status ?? "-"}</span></div>
                      <div><span className="text-muted-foreground">Expected:</span> <span className="font-medium">{selected.order_expected_time ?? "-"}</span></div>
                    </div>
                  ) : null}

                  {selected.ref_url ? (
                    <Button asChild className="w-full gap-2">
                      <Link href={String(selected.ref_url)} target="_blank">
                        Open Document
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">Current Stock</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {locStockLoading ? (
                <div className="text-sm text-muted-foreground">Loading current stock...</div>
              ) : !locStock ? (
                <div className="text-sm text-muted-foreground">No stock summary available.</div>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Available</div>
                    <div className="font-bold">{qtyFmt(Number(locStock.available ?? 0))}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">On Hand</div>
                    <div className="font-bold">{qtyFmt(Number(locStock.on_hand ?? 0))}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Reserved</div>
                    <div className="font-bold">{qtyFmt(Number(locStock.reserved ?? 0))}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
