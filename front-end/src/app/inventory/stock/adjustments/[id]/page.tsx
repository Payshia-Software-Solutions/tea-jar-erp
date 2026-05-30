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
  fetchStockAdjustmentBatch,
  type StockAdjustmentBatchItem,
} from "@/lib/api";
import {
  ArrowLeft,
  ArrowLeftRight,
  Loader2,
  MapPin,
  User,
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

export default function StockAdjustmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [hdr, setHdr] = useState<any>(null);
  const [items, setItems] = useState<StockAdjustmentBatchItem[]>([]);
  const [locations, setLocations] = useState<AllowedLocation[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await fetchStockAdjustmentBatch(String(id));
      setHdr(data?.adjustment ?? null);
      setItems(Array.isArray(data?.items) ? (data.items as any) : []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load adjustment", variant: "destructive" });
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="outline" className="gap-2 shrink-0 mt-1" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <ArrowLeftRight className="w-6 h-6 text-primary" />
                  {hdr?.adjustment_number ? hdr.adjustment_number : `Adjustment #${id}`}
                </h1>
                <Badge
                  variant="outline"
                  className="font-semibold capitalize px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  Committed
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{hdr?.reason ?? "Stock adjustment batch"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden md:flex items-center gap-2 mr-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Select
                value={locationId ? String(locationId) : ""}
                onValueChange={(v) => {
                  const n = Number(v);
                  setLocationId(Number.isFinite(n) && n > 0 ? n : null);
                }}
                disabled={locations.length === 0}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button asChild variant="outline">
              <Link href="/inventory/stock/adjustments">All Adjustments</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary">
              <Link href={`/inventory/stock/adjustments/print/${id}`} target="_blank">Print Report</Link>
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Header</CardTitle>
              <CardDescription>Audit info</CardDescription>
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
                  <div className="text-xs text-muted-foreground">Adjusted At</div>
                  <div className="font-semibold mt-1">
                    {hdr.adjusted_at ? new Date(String(hdr.adjusted_at).replace(" ", "T")).toLocaleString() : "-"}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="font-semibold mt-1">{hdr.location_name ?? `#${hdr.location_id ?? "-"}`}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Reason</div>
                  <div className="font-semibold mt-1">{hdr.reason ?? "-"}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4 md:col-span-2">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="font-semibold mt-1">{hdr.notes ?? "-"}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Created By
                  </div>
                  <div className="font-semibold mt-1">{hdr.created_by_name ?? "-"}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Total Variance Qty</div>
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
            <CardTitle>Lines</CardTitle>
            <CardDescription>
              Official adjustments committed to inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-14 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-muted-foreground py-14 text-center">No lines</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                     <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="w-[140px]">System</TableHead>
                      <TableHead className="w-[140px]">Physical</TableHead>
                      <TableHead className="w-[140px]">Variance</TableHead>
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
                        <TableCell className="font-semibold">{fmt3(Number(it.system_stock ?? 0))}</TableCell>
                        <TableCell className="font-semibold">{fmt3(Number(it.physical_stock ?? (Number(it.system_stock ?? 0) + Number(it.qty_change ?? 0))))}</TableCell>
                        <TableCell className={`font-bold ${Number(it.qty_change) < 0 ? "text-destructive" : Number(it.qty_change) > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                          {Number(it.qty_change) > 0 ? "+" : ""}
                          {fmt3(Number(it.qty_change))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{it.notes ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/5 font-bold">
                      <TableCell className="text-right">Total Variance</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell className={`font-bold ${totalQty < 0 ? "text-destructive" : totalQty > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {Number(totalQty) > 0 ? "+" : ""}
                        {fmt3(Number(totalQty))}
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
