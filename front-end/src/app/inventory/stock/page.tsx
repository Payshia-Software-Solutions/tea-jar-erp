"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, AlertCircle, ListOrdered, History, ChevronDown, ChevronRight, Calendar, Archive, Layers } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchReportStockBalance, fetchLocations, LocationStockBalanceRow, ServiceLocation } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/index";

export default function StockPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<LocationStockBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [locationId, setLocationId] = useState<number>(1);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Classify Batch Modal States
  const [classifyModalOpen, setClassifyModalOpen] = useState(false);
  const [classifyPartId, setClassifyPartId] = useState<number>(0);
  const [classifyPartName, setClassifyPartName] = useState<string>("");
  const [classifyMaxQty, setClassifyMaxQty] = useState<number>(0);
  const [classifyQty, setClassifyQty] = useState<string>("");
  const [classifyBatchNo, setClassifyBatchNo] = useState<string>("");
  const [classifyMfgDate, setClassifyMfgDate] = useState<string>("");
  const [classifyExpDate, setClassifyExpDate] = useState<string>("");
  const [classifySourceBatchId, setClassifySourceBatchId] = useState<number | null>(null);
  const [classifying, setClassifying] = useState(false);

  const handleClassifySubmit = async () => {
    if (!classifyQty || Number(classifyQty) <= 0) {
      toast({ title: "Validation Error", description: "Quantity must be greater than 0", variant: "destructive" });
      return;
    }
    if (Number(classifyQty) > classifyMaxQty) {
      toast({ title: "Validation Error", description: `Quantity cannot exceed unclassified stock (${classifyMaxQty})`, variant: "destructive" });
      return;
    }
    setClassifying(true);
    try {
      const payload = {
        part_id: classifyPartId,
        location_id: locationId,
        qty: Number(classifyQty),
        source_batch_id: classifySourceBatchId,
        batch_number: classifyBatchNo,
        mfg_date: classifyMfgDate,
        expiry_date: classifyExpDate
      };
      const res = await api('/api/part/classify_batch', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Classification failed');
      }
      toast({ title: "Success", description: "Stock successfully assigned to batch." });
      setClassifyModalOpen(false);
      void load({ locationId, q: query.trim() });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to classify batch", variant: "destructive" });
    } finally {
      setClassifying(false);
    }
  };

  // Movements are now shown on a separate page.

  const load = async (opts: { locationId?: number; q?: string } = {}) => {
    setLoading(true);
    try {
      const lid = Number(opts.locationId ?? locationId ?? 1) || 1;
      const q = String(opts.q ?? query ?? "");
      const data = await fetchReportStockBalance({ location_id: String(lid), q, batches: true } as any);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load stock", variant: "destructive" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

    const init = async () => {
      try {
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
          // No reachable locations
          setLocations([]);
          return;
        }
        setLocations(locs);

        const ls = Number(window.localStorage.getItem("location_id") || 0);
        const initId = (ls > 0 ? ls : (locs[0]?.id ?? 1));
        setLocationId(initId);
        await load({ locationId: initId, q: "" });
      } catch (e: any) {
        toast({ title: "Error", description: "Failed to load locations. Please check your permissions.", variant: "destructive" });
        setLocations([]);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let base = items;
    if (onlyLow) {
      base = base.filter((p: any) => {
        const qty = Number((p as any).location_stock_quantity ?? 0);
        return p.reorder_level !== null && p.reorder_level !== undefined && qty <= Number(p.reorder_level);
      });
    }
    return base;
  }, [items, onlyLow]);

  const totals = useMemo(() => {
    const totalQty = items.reduce((sum, p: any) => sum + Number((p as any).location_stock_quantity ?? 0), 0);
    const totalValue = items.reduce((sum, p) => {
      const cost = p.cost_price !== null && p.cost_price !== undefined ? Number(p.cost_price) : 0;
      const qty = Number((p as any).location_stock_quantity ?? 0);
      return sum + cost * qty;
    }, 0);
    return { totalQty, totalValue };
  }, [items]);

  const openMovements = (p: PartRow) => {
    router.push(`/inventory/stock/movements/${encodeURIComponent(String(p.id))}?location_id=${encodeURIComponent(String(locationId))}`);
  };

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Stock</h1>
          <p className="text-muted-foreground mt-1">Stock balances and movement history</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex px-3 py-1 bg-primary/10 text-primary border-primary/20">
            {totals.totalQty.toLocaleString()} Units
          </Badge>
          <Badge variant="outline" className="hidden sm:flex px-3 py-1 bg-muted/50">
            Value {totals.totalValue.toFixed(2)}
          </Badge>
          <Button variant={onlyLow ? "default" : "outline"} onClick={() => setOnlyLow((p) => !p)}>
            Low Stock
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-9 h-11"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void load({ locationId, q: query.trim() });
              }
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Location</div>
            <select
              className="h-11 min-w-[260px] rounded-md border bg-background px-3 text-sm"
              value={String(locationId)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLocationId(v);
                void load({ locationId: v, q: query.trim() });
              }}
            >
              {locations.map((l) => (
                <option key={l.id} value={String(l.id)}>{l.name}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={() => void load({ locationId, q: query.trim() })}>Search</Button>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading stock...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">No items</h3>
                <p className="text-muted-foreground max-w-xs">
                  {query ? "No results match your search." : "Create items and receive stock to see balances here."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>On Hand</TableHead>
                    <TableHead className="hidden md:table-cell">Cost</TableHead>
                    <TableHead className="hidden lg:table-cell">Value</TableHead>
                    <TableHead className="text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const cost = p.cost_price !== null && p.cost_price !== undefined ? Number(p.cost_price) : 0;
                    const qty = Number((p as any).location_stock_quantity ?? 0);
                    const sys = Number((p as any).system_stock_quantity ?? (p as any).stock_quantity ?? 0);
                    const value = cost * qty;
                    const low = p.reorder_level !== null && p.reorder_level !== undefined ? qty <= Number(p.reorder_level) : false;
                    const isExpanded = expandedItems.has(p.id);
                    const hasBatches = (Array.isArray(p.batches) && p.batches.length > 0) || qty > 0.0001;

                    return (
                      <React.Fragment key={p.id}>
                        <TableRow className={`group hover:bg-muted/10 transition-colors ${isExpanded ? 'bg-muted/5' : ''}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {hasBatches ? (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  onClick={() => toggleExpand(p.id)}
                                >
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </Button>
                              ) : (
                                <div className="w-7" />
                              )}
                              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                <ListOrdered className="w-5 h-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold truncate">{p.part_name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{p.sku ? `SKU: ${p.sku}` : `ITEM ID: #${p.id}`}</p>
                              </div>
                              {low ? <Badge variant="destructive" className="text-[10px] ml-2">Low</Badge> : null}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            <div>
                              {qty.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}{" "}
                              {p.unit ? <span className="text-xs text-muted-foreground font-normal">{p.unit}</span> : null}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-normal">System: {sys.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{cost ? cost.toFixed(2) : "-"}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{value ? value.toFixed(2) : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => void openMovements(p)}>
                              <History className="w-4 h-4" />
                              Movements
                            </Button>
                          </TableCell>
                        </TableRow>

                        {isExpanded && hasBatches && p.batches && (
                          <TableRow className="bg-slate-50/50 dark:bg-slate-900/20">
                            <TableCell colSpan={5} className="p-4 pl-14">
                              <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
                                <Table>
                                  <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-none">
                                      <TableHead className="h-9 text-[10px] uppercase tracking-widest font-black">Batch No</TableHead>
                                      <TableHead className="h-9 text-[10px] uppercase tracking-widest font-black">Dates</TableHead>
                                      <TableHead className="h-9 text-[10px] uppercase tracking-widest font-black text-right">Quantity</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {p.batches.map((b: any, bidx: number) => {
                                      const isUnclassified = b.is_unclassified === true || b.batch_number === 'UNCLASSIFIED';
                                      return (
                                        <TableRow key={b.id || bidx} className={`hover:bg-muted/10 border-border/50 ${isUnclassified ? 'bg-orange-50/20 dark:bg-orange-950/20' : ''}`}>
                                          <TableCell className="py-2">
                                            <div className="flex items-center gap-2">
                                              {isUnclassified ? (
                                                <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                                              ) : (
                                                <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                                              )}
                                              <span className={`text-xs font-mono font-bold tracking-tight ${isUnclassified ? 'text-orange-600 dark:text-orange-400 italic' : ''}`}>
                                                {isUnclassified ? 'UNCLASSIFIED' : b.batch_number}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            {isUnclassified ? (
                                              <span className="text-[10px] text-muted-foreground italic font-medium">Stock without assigned lot context</span>
                                            ) : (
                                              <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                                                {b.mfg_date && (
                                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>MFD: {b.mfg_date}</span>
                                                  </div>
                                                )}
                                                {b.expiry_date && (
                                                  <div className={`flex items-center gap-1.5 text-[10px] font-bold ${new Date(b.expiry_date) < new Date() ? 'text-rose-500' : 'text-muted-foreground'}`}>
                                                    <Layers className="w-3 h-3" />
                                                    <span>EXP: {b.expiry_date}</span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell className="py-2 text-right align-top">
                                            <div className={`text-xs font-black tabular-nums ${isUnclassified ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                                              {Number(b.quantity_on_hand).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                            </div>
                                            {isUnclassified && (
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="mt-2 h-7 text-[10px]"
                                                onClick={() => {
                                                  setClassifyPartId(p.id);
                                                  setClassifyPartName(p.part_name);
                                                  setClassifyMaxQty(Number(b.quantity_on_hand));
                                                  setClassifyQty(String(b.quantity_on_hand));
                                                  setClassifySourceBatchId(b.id || null);
                                                  setClassifyBatchNo("");
                                                  setClassifyMfgDate("");
                                                  setClassifyExpDate("");
                                                  setClassifyModalOpen(true);
                                                }}
                                              >
                                                Assign to Batch
                                              </Button>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={classifyModalOpen} onOpenChange={setClassifyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Batch</DialogTitle>
            <DialogDescription>
              Assign unclassified stock to a specific batch for {classifyPartName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="c-qty">Quantity (Max: {classifyMaxQty})</Label>
              <Input 
                id="c-qty"
                type="number"
                step="0.001"
                min="0.001"
                max={classifyMaxQty}
                value={classifyQty}
                onChange={(e) => setClassifyQty(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-batch">Batch Number</Label>
              <Input 
                id="c-batch"
                placeholder="Leave empty to auto-generate"
                value={classifyBatchNo}
                onChange={(e) => setClassifyBatchNo(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="c-mfg">Manufacture Date</Label>
                <Input 
                  id="c-mfg"
                  type="date"
                  value={classifyMfgDate}
                  onChange={(e) => setClassifyMfgDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-exp">Expiry Date</Label>
                <Input 
                  id="c-exp"
                  type="date"
                  value={classifyExpDate}
                  onChange={(e) => setClassifyExpDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassifyModalOpen(false)} disabled={classifying}>Cancel</Button>
            <Button onClick={handleClassifySubmit} disabled={classifying}>
              {classifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Assign Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
