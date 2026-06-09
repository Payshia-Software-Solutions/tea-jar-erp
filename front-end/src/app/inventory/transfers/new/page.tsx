"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createTransfer, fetchLocations, fetchParts, fetchPartLocationStock, fetchRequisition, fetchRequisitions, fetchInventoryBatches, type LocationStock, type ServiceLocationRow, type PartRow, type StockRequisitionRow , formatPartLabel } from "@/lib/api";
import { Plus, Trash2, Layers } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";

type Line = { 
  part_id: string; 
  qty: string; 
  batch_id?: string; 
  batches?: any[]; 
  requested?: number; 
  fulfilled?: number 
};

export default function NewTransferPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<ServiceLocationRow[]>([]);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [fromLoc, setFromLoc] = useState<string>("");
  const [toLoc, setToLoc] = useState<string>("");
  const [requisitions, setRequisitions] = useState<StockRequisitionRow[]>([]);
  const [reqId, setReqId] = useState<string>("");
  const [loadingReq, setLoadingReq] = useState(false);
  const autoLoadedRef = useRef(false);
  const [stockByPartId, setStockByPartId] = useState<Record<string, LocationStock>>({});
  const [loadingStockIds, setLoadingStockIds] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ part_id: "", qty: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const [locs, items, reqs] = await Promise.all([fetchLocations(), fetchParts(""), fetchRequisitions()]);
        setLocations(Array.isArray(locs) ? locs : []);
        setParts(Array.isArray(items) ? items : []);
        setRequisitions(Array.isArray(reqs) ? reqs : []);
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load data", variant: "destructive" });
      }
    };
    void run();
  }, []);

  useEffect(() => {
    if (fromLoc && toLoc && fromLoc === toLoc) setToLoc("");
  }, [fromLoc, toLoc]);

  useEffect(() => {
    if (!fromLoc) return;
    if (toLoc) return;
    const alt = locations.find((l) => String(l.id) !== String(fromLoc));
    if (alt) setToLoc(String(alt.id));
  }, [fromLoc, toLoc, locations]);

  const addLine = () => setLines((prev) => [...prev, { part_id: "", qty: "" }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const locationOptions = useMemo(() => {
    return (locations ?? []).map((l) => ({
      value: String(l.id),
      label: `${l.name}${l.location_type ? ` (${l.location_type})` : ""}`,
      keywords: `${l.name} ${l.location_type ?? ""}`,
    }));
  }, [locations]);

  const requisitionOptions = useMemo(() => {
    return (requisitions ?? [])
      .map((r) => ({
        value: String(r.id),
        label: `${r.requisition_number} • ${r.to_location_name ?? `Loc ${r.to_location_id}`} • ${r.status}`,
        keywords: `${r.requisition_number} ${r.to_location_name ?? ""} ${r.status}`,
      }));
  }, [requisitions]);

  const partOptions = useMemo(() => {
    return (parts ?? []).map((p) => ({
      value: String(p.id),
      label: formatPartLabel(p),
      keywords: `${p.part_name} ${p.sku ?? ""} ${(p as any).part_number ?? ""} ${(p as any).barcode_number ?? ""}`,
    }));
  }, [parts]);

  const fromLocName = useMemo(() => {
    const row = locations.find((l) => String(l.id) === String(fromLoc));
    return row?.name ? String(row.name) : "";
  }, [locations, fromLoc]);

  const clearLines = () => {
    setLines([{ part_id: "", qty: "" }]);
    setStockByPartId({});
    setLoadingStockIds({});
  };

  const onChangeFromLoc = (v: string) => {
    if (v === fromLoc) return;
    const hasAny = lines.some((l) => (String(l.part_id || "").trim() !== "") || (Number(l.qty) > 0));
    if (hasAny) {
      const ok = window.confirm("Changing From Location will clear all items in this transfer. Continue?");
      if (!ok) return;
      clearLines();
      toast({ title: "Items cleared", description: "Transfer lines were cleared because the From Location changed." });
    }
    setFromLoc(v);
    setStockByPartId({});
    setLoadingStockIds({});
  };

  const loadStockAndBatches = async (partId: string, lineIdx: number) => {
    if (!fromLoc || !partId) return;
    
    // Load general stock data
    if (!stockByPartId[partId] && !loadingStockIds[partId]) {
      setLoadingStockIds((p) => ({ ...p, [partId]: true }));
      try {
        const s = await fetchPartLocationStock(partId, fromLoc);
        setStockByPartId((prev) => ({ ...prev, [partId]: s }));
      } catch {} finally {
        setLoadingStockIds((p) => {
          const next = { ...p };
          delete next[partId];
          return next;
        });
      }
    }

    // Load available batches for this specific line
    try {
      const b = await fetchInventoryBatches(partId, fromLoc);
      setLines(prev => {
        const next = [...prev];
        if (next[lineIdx]) next[lineIdx].batches = b;
        return next;
      });
    } catch {}
  };

  const canSave = useMemo(() => {
    if (!fromLoc || !toLoc || fromLoc === toLoc) return false;
    return lines.some((l) => l.part_id && Number(l.qty) > 0);
  }, [fromLoc, toLoc, lines]);

  const totals = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;
    for (const l of lines) {
      const qty = Number(l.qty);
      if (!l.part_id || !Number.isFinite(qty) || qty <= 0) continue;
      totalQty += qty;
      const p = parts.find((x) => String(x.id) === String(l.part_id));
      const unitCost = Number((p as any)?.cost_price ?? (p as any)?.price ?? 0);
      if (Number.isFinite(unitCost) && unitCost > 0) totalValue += unitCost * qty;
    }
    return { totalQty, totalValue };
  }, [lines, parts]);

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        requisition_id: reqId ? Number(reqId) : undefined,
        from_location_id: Number(fromLoc),
        to_location_id: Number(toLoc),
        notes: notes.trim() || undefined,
        items: lines
          .filter((l) => l.part_id && Number(l.qty) > 0)
          .map((l) => ({ 
            part_id: Number(l.part_id), 
            qty: Number(l.qty),
            batch_id: l.batch_id ? Number(l.batch_id) : undefined 
          })),
      };
      const res = await createTransfer(payload);
      toast({ title: "Created", description: "Transfer request created." });
      const id = res?.data?.id;
      if (id) router.push(`/inventory/transfers/${encodeURIComponent(String(id))}`);
      else router.push("/inventory/transfers");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create transfer", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const loadRequest = async () => {
    if (!reqId) return;
    setLoadingReq(true);
    try {
      const data = await fetchRequisition(String(reqId));
      const hdr = (data as any)?.requisition ?? null;
      const its = Array.isArray((data as any)?.items) ? (data as any).items : [];
      if (!hdr) throw new Error("Request not found");

      const fromId = String(hdr.from_location_id ?? "");
      if (fromId && fromId !== "0") {
        setFromLoc(fromId);
        setStockByPartId({});
        setLoadingStockIds({});
      }

      const toId = String(hdr.to_location_id ?? "");
      setToLoc(toId);

      const nextLines: Line[] = its.map((it: any) => {
        const req = Number(it.qty_requested ?? 0);
        const ful = Number(it.qty_fulfilled ?? 0);
        const remaining = Math.max(0, req - ful);
        return {
          part_id: String(it.part_id),
          qty: remaining > 0 ? String(remaining) : "",
          requested: req,
          fulfilled: ful,
        };
      });
      setLines(nextLines.length ? nextLines : [{ part_id: "", qty: "" }]);
      
      try {
        const sourceLoc = (fromId && fromId !== "0") ? fromId : fromLoc;
        if (sourceLoc) {
          const ids = Array.from(new Set(nextLines.map((l) => String(l.part_id || "").trim()).filter(Boolean)));
          const pairs = await Promise.all(ids.map((pid) => fetchPartLocationStock(pid, sourceLoc).then((s) => ({ pid, s })).catch(() => null)));
          const next: Record<string, LocationStock> = {};
          for (const p of pairs) {
            if (!p) continue;
            next[p.pid] = p.s;
          }
          setStockByPartId(next);
        }
      } catch {}
      toast({ title: "Loaded", description: "Request loaded into transfer." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load request", variant: "destructive" });
    } finally {
      setLoadingReq(false);
    }
  };

  useEffect(() => {
    const pre = searchParams?.get("req");
    if (!pre) return;
    if (reqId) return;
    setReqId(String(pre));
  }, [searchParams, reqId]);

  useEffect(() => {
    const pre = searchParams?.get("req");
    if (!pre) return;
    if (String(reqId) !== String(pre)) return;
    if (autoLoadedRef.current) return;
    if (!reqId) return;
    autoLoadedRef.current = true;
    void loadRequest();
  }, [searchParams, reqId]);

  useEffect(() => {
    if (!fromLoc) return;
    const ids = Array.from(new Set(lines.map((l) => String(l.part_id || "").trim()).filter(Boolean)));
    if (ids.length === 0) return;
    void (async () => {
      try {
        const pairs = await Promise.all(ids.map((pid) => fetchPartLocationStock(pid, fromLoc).then((s) => ({ pid, s })).catch(() => null)));
        const next: Record<string, LocationStock> = {};
        for (const p of pairs) {
          if (!p) continue;
          next[p.pid] = p.s;
        }
        setStockByPartId(next);
      } catch {}
    })();
  }, [fromLoc]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">New Stock Transfer</h1>
          <p className="text-muted-foreground mt-1">Create a transfer request between locations</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/inventory/transfers")}>Back</Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Header</CardTitle>
          <CardDescription>Load from a request or select locations manually</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-9 space-y-2">
              <Label>Request (optional)</Label>
              <SearchableSelect
                value={reqId}
                onValueChange={setReqId}
                options={requisitionOptions}
                placeholder="Select request..."
                searchPlaceholder="Search requests..."
              />
              <p className="text-xs text-muted-foreground">If selected, To Location and item list will be loaded from the request.</p>
            </div>
            <div className="md:col-span-3">
              <Button variant="outline" className="w-full" onClick={() => void loadRequest()} disabled={!reqId || loadingReq}>
                {loadingReq ? "Loading..." : "Load Request"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Location</Label>
              <SearchableSelect
                value={fromLoc}
                onValueChange={onChangeFromLoc}
                options={locationOptions}
                placeholder="Select source..."
                searchPlaceholder="Search locations..."
              />
            </div>
            <div className="space-y-2">
              <Label>To Location</Label>
              <SearchableSelect
                value={toLoc}
                onValueChange={(v) => {
                  if (reqId) return;
                  setToLoc(v);
                }}
                options={locationOptions}
                placeholder="Select destination..."
                searchPlaceholder="Search locations..."
              />
              {fromLoc && toLoc && fromLoc === toLoc ? (
                <p className="text-xs text-destructive">From and To locations must be different.</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden mt-6">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Items</CardTitle>
              <CardDescription>Choose parts and quantities to transfer</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Transfer Value</div>
              <div className="text-lg font-bold">{totals.totalValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total Qty: {totals.totalQty.toFixed(3)}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {lines.map((line, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/50 relative group">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5 space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item</Label>
                    <SearchableSelect
                      value={line.part_id}
                      onValueChange={(val) => {
                        const next = [...lines];
                        next[idx] = { ...next[idx], part_id: val, batch_id: "" };
                        setLines(next);
                        if (val && fromLoc) void loadStockAndBatches(val, idx);
                      }}
                      options={partOptions}
                      placeholder="Select item..."
                      searchPlaceholder="Search items..."
                    />
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Batch (Optional)</Label>
                    <SearchableSelect
                      value={line.batch_id || ""}
                      onValueChange={(val) => {
                        const next = [...lines];
                        next[idx] = { ...next[idx], batch_id: val };
                        setLines(next);
                      }}
                      options={(line.batches || []).map(b => ({
                        value: String(b.id),
                        label: `${b.batch_number} (Exp: ${b.expiry_date || 'N/A'}, Qty: ${Number(b.quantity_on_hand).toFixed(1)})`,
                        keywords: `${b.batch_number} ${b.expiry_date}`
                      }))}
                      placeholder={line.batches?.length ? "Auto (FIFO)" : "No batches available"}
                      disabled={!line.part_id || !line.batches?.length}
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={line.qty}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = { ...next[idx], qty: e.target.value };
                        setLines(next);
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="md:col-span-1 pt-6 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeLine(idx)} 
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {line.part_id && (
                <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
                  {(() => {
                    const p = parts.find((x) => String(x.id) === String(line.part_id));
                    const onHand = Number((p as any)?.stock_quantity ?? 0);
                    const unitCost = Number((p as any)?.cost_price ?? (p as any)?.price ?? 0);
                    const locStock = stockByPartId[String(line.part_id)] ?? null;
                    const locLoading = Boolean(loadingStockIds[String(line.part_id)]);
                    return (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3 link-3" />
                          <span>
                            {fromLocName ? `${fromLocName}: ` : "Source: "}
                            <span className="text-foreground font-medium">
                              {locLoading ? "Loading..." : (locStock ? Number(locStock.available ?? 0).toFixed(3) : "—")}
                            </span>
                            {locStock && (
                              <span className="opacity-80 ml-1">
                                (OH: {Number(locStock.on_hand).toFixed(1)}, Res: {Number(locStock.reserved).toFixed(1)})
                              </span>
                            )}
                          </span>
                        </div>
                        <div>
                          System total: <span className="text-foreground font-medium">{onHand.toFixed(1)}</span>
                        </div>
                        <div>
                          Unit: <span className="text-foreground font-medium">{(p as any)?.unit ?? "-"}</span>
                        </div>
                        <div>
                          Line Value: <span className="text-foreground font-medium">{(unitCost * (Number(line.qty) || 0)).toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" className="gap-2 border-dashed" onClick={addLine}>
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
            <div className="flex flex-col items-end gap-1">
              {!canSave ? (
                <div className="text-xs text-muted-foreground italic">
                  {!fromLoc || !toLoc ? "Select locations" : "Add some items"}
                </div>
              ) : null}
              <Button size="lg" onClick={submit} disabled={!canSave || saving} className="px-8 shadow-sm">
                {saving ? "Creating..." : "Create Transfer"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
