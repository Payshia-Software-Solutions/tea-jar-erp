"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fetchLocations, fetchParts, fetchPartLocationStock, fetchInventoryBatches, type ServiceLocationRow, type PartRow, type LocationStock , formatPartLabel } from "@/lib/api";
import { createIssueNote } from "@/lib/api/inventory";
import { Plus, Trash2, Layers } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";

type Line = { 
  part_id: string; 
  qty: string; 
  batch_id?: string; 
  batches?: any[]; 
};

export default function NewIssueNotePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [locations, setLocations] = useState<ServiceLocationRow[]>([]);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [fromLoc, setFromLoc] = useState<string>("");
  const [costCenterId, setCostCenterId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ part_id: "", qty: "" }]);
  const [saving, setSaving] = useState(false);

  const [stockByPartId, setStockByPartId] = useState<Record<string, LocationStock>>({});
  const [loadingStockIds, setLoadingStockIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const run = async () => {
      try {
        const [locs, items] = await Promise.all([fetchLocations(), fetchParts("")]);
        setLocations(Array.isArray(locs) ? locs : []);
        setParts(Array.isArray(items) ? items : []);
        
        // Auto select first location if available
        if (Array.isArray(locs) && locs.length > 0) {
          setFromLoc(String(locs[0].id));
          if (locs.length > 1) {
            setCostCenterId(String(locs[1].id));
          }
        }
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load data", variant: "destructive" });
      }
    };
    void run();
  }, []);

  const addLine = () => setLines((prev) => [...prev, { part_id: "", qty: "" }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const locationOptions = useMemo(() => {
    return (locations ?? []).map((l) => ({
      value: String(l.id),
      label: `${l.name}${l.location_type ? ` (${l.location_type})` : ""}`,
      keywords: `${l.name} ${l.location_type ?? ""}`,
    }));
  }, [locations]);

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
      const ok = window.confirm("Changing Store Location will clear all items. Continue?");
      if (!ok) return;
      clearLines();
    }
    setFromLoc(v);
    setStockByPartId({});
    setLoadingStockIds({});
    if (costCenterId === v) {
      setCostCenterId("");
    }
  };

  const loadStockAndBatches = async (partId: string, lineIdx: number) => {
    if (!fromLoc || !partId) return;
    
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

    try {
      const b = await fetchInventoryBatches(partId, fromLoc);
      setLines(prev => {
        const next = [...prev];
        if (next[lineIdx]) next[lineIdx].batches = b;
        return next;
      });
    } catch {}
  };

  const totals = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;
    for (const l of lines) {
      const qty = Number(l.qty);
      if (!l.part_id || !Number.isFinite(qty) || qty <= 0) continue;
      totalQty += qty;
      const p = parts.find((x) => String(x.id) === String(l.part_id));
      const unitCost = Number(p?.cost_price ?? p?.price ?? 0);
      if (Number.isFinite(unitCost) && unitCost > 0) totalValue += unitCost * qty;
    }
    return { totalQty, totalValue };
  }, [lines, parts]);

  const canSave = useMemo(() => {
    if (!fromLoc || !costCenterId || fromLoc === costCenterId) return false;
    return lines.some((l) => l.part_id && Number(l.qty) > 0);
  }, [fromLoc, costCenterId, lines]);

  const submit = async (immediateIssue = false) => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        location_id: Number(fromLoc),
        cost_center_id: Number(costCenterId),
        notes: notes.trim() || undefined,
        immediate_issue: immediateIssue,
        items: lines
          .filter((l) => l.part_id && Number(l.qty) > 0)
          .map((l) => ({ 
            part_id: Number(l.part_id), 
            qty_issued: Number(l.qty),
            batch_id: l.batch_id ? Number(l.batch_id) : undefined 
          })),
      };
      const res = await createIssueNote(payload);
      toast({ title: "Success", description: immediateIssue ? "Stock issued successfully." : "Issue Note draft saved." });
      const id = res?.data?.id;
      if (id) router.push(`/inventory/issue-notes/${encodeURIComponent(String(id))}`);
      else router.push("/inventory/issue-notes");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to save issue note", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">New Issue Note</h1>
          <p className="text-muted-foreground mt-1">Record material issuance to a cost center</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/inventory/issue-notes")}>Back</Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Details</CardTitle>
          <CardDescription>Specify source store and target cost center</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Store / Location</Label>
              <SearchableSelect
                value={fromLoc}
                onValueChange={onChangeFromLoc}
                options={locationOptions}
                placeholder="Select source location..."
                searchPlaceholder="Search locations..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cost Center (Target Location)</Label>
              <SearchableSelect
                value={costCenterId}
                onValueChange={setCostCenterId}
                options={locationOptions}
                placeholder="Select cost center location..."
                searchPlaceholder="Search locations..."
              />
              {fromLoc && costCenterId && fromLoc === costCenterId ? (
                <p className="text-xs text-destructive">Source and cost center locations must be different.</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks..." />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden mt-6">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Ingredients / Raw Items</CardTitle>
              <CardDescription>Select ingredients and quantities to issue</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Est. Total Cost</div>
              <div className="text-lg font-bold">Rs. {totals.totalValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total Qty: {totals.totalQty.toFixed(2)}</div>
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
                      placeholder="Select ingredient..."
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
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty to Issue</Label>
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
                    const onHand = Number(p?.stock_quantity ?? 0);
                    const unitCost = Number(p?.cost_price ?? p?.price ?? 0);
                    const locStock = stockByPartId[String(line.part_id)] ?? null;
                    const locLoading = Boolean(loadingStockIds[String(line.part_id)]);
                    return (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3 link-3" />
                          <span>
                            {fromLocName ? `${fromLocName}: ` : "Store: "}
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
                          Unit: <span className="text-foreground font-medium">{p?.unit ?? "-"}</span>
                        </div>
                        <div>
                          Est. Cost: <span className="text-foreground font-medium">Rs. {(unitCost * (Number(line.qty) || 0)).toFixed(2)}</span>
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
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => void submit(false)} 
                disabled={!canSave || saving}
              >
                Save as Draft
              </Button>
              <Button 
                size="lg" 
                onClick={() => void submit(true)} 
                disabled={!canSave || saving}
              >
                {saving ? "Processing..." : "Issue Materials"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
