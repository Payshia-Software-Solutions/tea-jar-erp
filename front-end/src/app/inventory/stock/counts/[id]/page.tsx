"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchLocations,
  fetchStockCount,
  approveStockCount,
  rejectStockCount,
  type StockAdjustmentBatchItem,
} from "@/lib/api";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LS_LOC_KEY = "stock_adj_location_id";
type AllowedLocation = { id: number; name: string };

function decodeJwtPayload(token: string): any | null {
  try {
    const part = token.split(".")[1];
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function fmt3(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export default function StockCountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [hdr, setHdr] = useState<any>(null);
  const [items, setItems] = useState<StockAdjustmentBatchItem[]>([]);
  const [locations, setLocations] = useState<AllowedLocation[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [isAdminOrManager, setIsAdminOrManager] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await fetchStockCount(String(id), locationId ?? undefined);
      setHdr(data?.adjustment ?? null);
      setItems(Array.isArray(data?.items) ? (data.items as any) : []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load count sheet", variant: "destructive" });
      setHdr(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const token = window.localStorage.getItem("auth_token") ?? "";
        const payload = token ? decodeJwtPayload(token) : null;
        const role = String(payload?.role ?? "");
        const permissions = Array.isArray(payload?.permissions) ? payload.permissions : [];
        const isCommitCapable = role === "Admin" || permissions.includes("stock.adjust");
        setIsAdminOrManager(isCommitCapable);

        const lsLoc = Number(window.localStorage.getItem(LS_LOC_KEY) ?? "");
        const fallbackLoc = Number(window.localStorage.getItem("location_id") ?? "");

        if (role === "Admin") {
          const locs = await fetchLocations();
          const cleaned: AllowedLocation[] = Array.isArray(locs)
            ? locs
                .map((l: any) => ({ id: Number(l?.id), name: String(l?.name ?? "") }))
                .filter((x: AllowedLocation) => x.id > 0 && x.name)
            : [];
          setLocations(cleaned);
          const init = (Number.isFinite(lsLoc) && lsLoc > 0 ? lsLoc : (Number.isFinite(fallbackLoc) && fallbackLoc > 0 ? fallbackLoc : null));
          setLocationId(init && cleaned.some((l) => l.id === init) ? init : (cleaned[0]?.id ?? null));
          return;
        }

        const allowed: AllowedLocation[] = Array.isArray(payload?.allowed_locations)
          ? payload.allowed_locations
              .map((x: any) => ({ id: Number(x?.id), name: String(x?.name ?? "") }))
              .filter((x: AllowedLocation) => x.id > 0 && x.name)
          : [];
        const tokenLocId = payload?.location_id ? Number(payload.location_id) : 1;
        const tokenLocName = payload?.location_name ? String(payload.location_name) : "Main";
        const finalAllowed = allowed.length > 0 ? allowed : [{ id: tokenLocId, name: tokenLocName }];
        setLocations(finalAllowed);
        const init = Number.isFinite(lsLoc) && lsLoc > 0 ? lsLoc : (Number.isFinite(fallbackLoc) && fallbackLoc > 0 ? fallbackLoc : tokenLocId);
        setLocationId(finalAllowed.some((l) => l.id === init) ? init : finalAllowed[0].id);
      } catch {
        setLocations([]);
        setLocationId(null);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (!locationId) return;
    try {
      window.localStorage.setItem(LS_LOC_KEY, String(locationId));
    } catch {}
    void load();
  }, [id, locationId]);

  const totalQty = useMemo(() => items.reduce((sum, it: any) => sum + Number(it.qty_change ?? 0), 0), [items]);
  const totalCostValue = useMemo(() => items.reduce((sum, it: any) => sum + (Number(it.qty_change ?? 0) * Number(it.unit_cost ?? 0)), 0), [items]);
  const totalSellingValue = useMemo(() => items.reduce((sum, it: any) => sum + (Number(it.qty_change ?? 0) * Number(it.selling_price ?? 0)), 0), [items]);

  const handleApprove = async () => {
    if (committing) return;
    setCommitting(true);
    try {
      await approveStockCount(id);
      toast({ title: "Approved & Adjusted", description: "This stock count has been committed. Inventory balances updated successfully." });
      void load();
    } catch (e: any) {
      toast({ title: "Approval Failed", description: e?.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setCommitting(false);
    }
  };

  const handleReject = async () => {
    if (committing) return;
    setCommitting(true);
    try {
      await rejectStockCount(id);
      toast({ title: "Session Rejected", description: "Count session rejected successfully." });
      void load();
    } catch (e: any) {
      toast({ title: "Rejection Failed", description: e?.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        {/* Banner Alert for Pending Status */}
        {hdr?.status === "Pending" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-800 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-semibold text-sm">Count Session Pending Approval</div>
                <div className="text-xs text-amber-700 mt-0.5">
                  These counts have NOT changed active inventory stock balances. Review and commit them below.
                </div>
              </div>
            </div>
            {isAdminOrManager && (
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-500/30 text-rose-700 bg-rose-50/50 hover:bg-rose-100/80"
                  onClick={handleReject}
                  disabled={committing}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject Count
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  onClick={handleApprove}
                  disabled={committing}
                >
                  {committing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  Approve & Commit Adjustments
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Banner for Rejected Status */}
        {hdr?.status === "Rejected" && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-800 shadow-sm">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="font-semibold text-sm">Count Session Rejected</div>
              <div className="text-xs text-rose-700 mt-0.5">
                This count batch was rejected and did not modify any stock balances.
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="outline" className="gap-2 shrink-0 mt-1" onClick={() => router.push("/inventory/stock/counts")}>
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-primary" />
                  {hdr?.count_number ? hdr.count_number : `Count Sheet #${id}`}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-semibold capitalize px-2.5 py-1 text-xs rounded-full",
                    hdr?.status === "Approved" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    ((hdr?.status === "Pending") || !hdr?.status) && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    hdr?.status === "Rejected" && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}
                >
                  {hdr?.status || "Pending"}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{hdr?.reason ?? "Stock audit counts session"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline">
              <Link href="/inventory/stock/counts">All Count Sheets</Link>
            </Button>
            <Button asChild>
              <Link href="/inventory/stock/counts/new">New Count</Link>
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Count Sheet Header</CardTitle>
              <CardDescription>Auditing metadata</CardDescription>
            </div>
            <Badge variant="outline" className="bg-muted/40">
              {items.length} lines
            </Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-14 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : !hdr ? (
              <div className="text-sm text-muted-foreground py-14 text-center">Not found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Date Counted</div>
                  <div className="font-semibold mt-1">
                    {hdr.counted_at ? new Date(String(hdr.counted_at).replace(" ", "T")).toLocaleString() : "-"}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Audited Location</div>
                  <div className="font-semibold mt-1">{hdr.location_name ?? `#${hdr.location_id ?? "-"}`}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Session Title</div>
                  <div className="font-semibold mt-1">{hdr.reason ?? "-"}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4 md:col-span-2">
                  <div className="text-xs text-muted-foreground">Audit Notes</div>
                  <div className="font-semibold mt-1">{hdr.notes ?? "-"}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Counted By (Operator)
                  </div>
                  <div className="font-semibold mt-1">{hdr.created_by_name ?? "-"}</div>
                </div>
                {hdr.status === "Approved" && (
                  <div className="rounded-lg border bg-muted/10 p-4">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-600" /> Committed By (Manager)
                    </div>
                    <div className="font-semibold mt-1 text-emerald-700">{hdr.approved_by_name ?? "-"}</div>
                  </div>
                )}
                {hdr.status === "Approved" && (
                  <div className="rounded-lg border bg-muted/10 p-4">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600" /> Committed At
                    </div>
                    <div className="font-semibold mt-1 text-emerald-700">
                      {hdr.approved_at ? new Date(String(hdr.approved_at).replace(" ", "T")).toLocaleString() : "-"}
                    </div>
                  </div>
                )}
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Total Audited Variance</div>
                  <div className={`font-bold mt-1 ${totalQty < 0 ? "text-destructive" : totalQty > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                    {totalQty > 0 ? "+" : ""}
                    {fmt3(totalQty)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Audited Items</CardTitle>
            <CardDescription>
              {hdr?.status === "Pending"
                ? "Physical stock counts relative to system stock level snapshots"
                : "Official adjustments applied to inventory"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-14 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-muted-foreground py-14 text-center">No lines recorded.</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Item Master</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="w-[140px] text-right">System Stock</TableHead>
                      <TableHead className="w-[140px] text-right">Physical Count</TableHead>
                      <TableHead className="w-[140px] text-right">Audited Variance</TableHead>
                      <TableHead className="w-[120px] text-right">Cost Price</TableHead>
                      <TableHead className="w-[120px] text-right">Selling Price</TableHead>
                      <TableHead className="w-[120px] text-right">Cost Value</TableHead>
                      <TableHead className="w-[120px] text-right">Selling Value</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it: any) => (
                      <TableRow key={it.id} className="hover:bg-muted/10">
                        <TableCell>
                          <Link href={`/inventory/items/${it.part_id}`} className="font-semibold hover:underline">
                            {it.part_name}
                          </Link>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            {it.sku ? `SKU: ${it.sku}` : `ITEM ID: #${it.part_id}`} {it.unit ? `| ${it.unit}` : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] font-bold">{it.batch_number ?? "Total/Unbatched"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-right">{fmt3(Number(it.system_stock ?? 0))}</TableCell>
                        <TableCell className="font-semibold text-right">{fmt3(Number(it.physical_stock ?? (Number(it.system_stock ?? 0) + Number(it.qty_change ?? 0))))}</TableCell>
                        <TableCell className={`font-bold text-right ${Number(it.qty_change) < 0 ? "text-destructive" : Number(it.qty_change) > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                          {Number(it.qty_change) > 0 ? "+" : ""}
                          {fmt3(Number(it.qty_change))}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-muted-foreground">
                          {Number(it.unit_cost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {Number(it.selling_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`font-semibold text-right ${(Number(it.qty_change) * Number(it.unit_cost)) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {(Number(it.qty_change ?? 0) * Number(it.unit_cost ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`font-semibold text-right ${(Number(it.qty_change) * Number(it.selling_price)) < 0 ? "text-destructive" : "text-emerald-600"}`}>
                          {(Number(it.qty_change ?? 0) * Number(it.selling_price ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{it.notes ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/5 font-bold">
                      <TableCell className="text-right">Total Net Variance</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell className={`font-bold text-right ${totalQty < 0 ? "text-destructive" : totalQty > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {Number(totalQty) > 0 ? "+" : ""}
                        {fmt3(Number(totalQty))}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className={`font-bold text-right ${totalCostValue < 0 ? "text-destructive" : totalCostValue > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {totalCostValue > 0 ? "+" : ""}
                        {totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`font-bold text-right ${totalSellingValue < 0 ? "text-destructive" : totalSellingValue > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {totalSellingValue > 0 ? "+" : ""}
                        {totalSellingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
