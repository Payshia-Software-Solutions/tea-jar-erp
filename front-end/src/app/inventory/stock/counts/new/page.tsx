"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createStockCount, fetchLocations, fetchParts, fetchPartBatches, fetchLocationStockBalances, type PartRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  ChevronsUpDown,
  Loader2,
  MapPin,
  MinusCircle,
  Plus,
  Search,
  Trash2,
  Printer,
} from "lucide-react";

function nowLocalDatetime() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Line = { 
  key: string; 
  part_id: number; 
  batch_id: number | null;
  physical_stock: number | ""; 
  notes?: string; 
  include_when_zero?: boolean 
};

function fmt3(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function newKey() {
  try {
    return (globalThis as any)?.crypto?.randomUUID?.() ?? `k_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  } catch {
    return `k_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 850;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.error("Audio Context is blocked.", err);
  }
}

export default function NewStockCountPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parts, setParts] = useState<PartRow[]>([]);

  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [locationId, setLocationId] = useState<number | null>(null);

  const [adjustedAt, setAdjustedAt] = useState(nowLocalDatetime());
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [activeLineKey, setActiveLineKey] = useState<string | null>(null);
  const [itemBatches, setItemBatches] = useState<Record<number, any[]>>({});
  const [fetchingBatches, setFetchingBatches] = useState<Record<number, boolean>>({});
  const [batchPrompt, setBatchPrompt] = useState<{key: string | null, pid: number, name: string, batches: any[], isScan?: boolean, totalStock?: number} | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editQuery, setEditQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");

  const preselectPartId = useMemo(() => {
    const raw = sp?.get("part_id") ?? "";
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [sp]);

  useEffect(() => {
    const LS_LOC_KEY = "stock_adj_location_id";
    const decodeJwtPayload = (token: string) => {
      try {
        const part = token.split(".")[1];
        return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
      } catch {
        return null;
      }
    };

    void (async () => {
      try {
        const token = window.localStorage.getItem("auth_token") ?? "";
        const payload = token ? decodeJwtPayload(token) : null;
        const role = String(payload?.role ?? "");
        const lsLoc = Number(window.localStorage.getItem(LS_LOC_KEY) ?? "");
        const fallbackLoc = Number(window.localStorage.getItem("location_id") ?? "");

        if (role === "Admin") {
          const locs = await fetchLocations();
          const cleaned = Array.isArray(locs)
            ? locs.map((l: any) => ({ id: Number(l?.id), name: String(l?.name ?? "") })).filter((x: any) => x.id > 0 && x.name)
            : [];
          setLocations(cleaned);
          const init = Number.isFinite(lsLoc) && lsLoc > 0 ? lsLoc : (Number.isFinite(fallbackLoc) && fallbackLoc > 0 ? fallbackLoc : null);
          setLocationId(init && cleaned.some((l: any) => l.id === init) ? init : (cleaned[0]?.id ?? null));
          return;
        }

        const allowed = Array.isArray(payload?.allowed_locations)
          ? payload.allowed_locations
              .map((x: any) => ({ id: Number(x?.id), name: String(x?.name ?? "") }))
              .filter((x: any) => x.id > 0 && x.name)
          : [];
        const tokenLocId = payload?.location_id ? Number(payload.location_id) : 1;
        const tokenLocName = payload?.location_name ? String(payload.location_name) : "Main";
        const finalAllowed = allowed.length > 0 ? allowed : [{ id: tokenLocId, name: tokenLocName }];
        setLocations(finalAllowed);
        const init = Number.isFinite(lsLoc) && lsLoc > 0 ? lsLoc : (Number.isFinite(fallbackLoc) && fallbackLoc > 0 ? fallbackLoc : tokenLocId);
        setLocationId(finalAllowed.some((l: any) => l.id === init) ? init : finalAllowed[0].id);
      } catch {
        setLocations([]);
        setLocationId(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!locationId) return;
    try {
      window.localStorage.setItem("stock_adj_location_id", String(locationId));
    } catch {}
  }, [locationId]);

  useEffect(() => {
    if (!locationId) return;
    const run = async () => {
      setLoading(true);
      try {
        const p = await fetchLocationStockBalances(locationId);
        setParts(Array.isArray(p) ? p : []);
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load items", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [locationId]);

  useEffect(() => {
    if (!preselectPartId) return;
    setLines([{ key: newKey(), part_id: preselectPartId, batch_id: null, physical_stock: "", notes: "" }]);
  }, [preselectPartId]);

  const addEmptyLine = () => setLines((p) => [...p, { key: newKey(), part_id: 0, batch_id: null, physical_stock: "", notes: "" }]);
  const removeLine = (key: string) => setLines((p) => p.filter((x) => x.key !== key));

  const handleScannedBarcode = (barcodeVal: string) => {
    const cleaned = barcodeVal.trim().toLowerCase();
    if (!cleaned) return;

    const part = parts.find((p) => 
      String(p.barcode_number || "").toLowerCase() === cleaned ||
      String(p.sku || "").toLowerCase() === cleaned ||
      String(p.part_number || "").toLowerCase() === cleaned ||
      String(p.id) === cleaned
    );

    if (!part) {
      toast({
        title: "Item Not Found",
        description: `Barcode "${barcodeVal}" does not match any product in inventory.`,
        variant: "destructive",
      });
      return;
    }

    playBeep();

    const incrementOrAdd = (batchId: number | null) => {
      const existingIndex = lines.findIndex((l) => Number(l.part_id) === Number(part.id) && l.batch_id === batchId);
      if (existingIndex > -1) {
        const existingLine = lines[existingIndex];
        const newStock = existingLine.physical_stock === "" ? 1 : Number(existingLine.physical_stock) + 1;
        setLines((prev) => 
          prev.map((line, idx) => idx === existingIndex ? { ...line, physical_stock: newStock } : line)
        );
        toast({ title: "Quantity Incremented", description: `${part.part_name} count increased to ${newStock}.` });
        setActiveLineKey(existingLine.key);
      } else {
        const key = newKey();
        setLines((prev) => [...prev, { key, part_id: Number(part.id), batch_id: batchId, physical_stock: 1, notes: "" }]);
        setActiveLineKey(key);
        toast({ title: "Item Added", description: `${part.part_name} added to count list.` });
      }
    };

      void loadBatchesForPart(Number(part.id)).then((batches) => {
        if (batches && batches.length > 0) {
          setBatchPrompt({ key: null, pid: Number(part.id), name: part.part_name, batches, isScan: true, totalStock: Number(part.stock_quantity ?? 0) });
        } else {
          incrementOrAdd(null);
        }
      });
  };

  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (isInput) return;
      
      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      if (diff > 50) {
        buffer = "";
      }

      if (e.key === "Enter") {
        if (buffer.length > 2) {
          handleScannedBarcode(buffer);
          e.preventDefault();
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [parts, lines]);

  const loadBatchesForPart = async (pid: number) => {
    if (!pid || !locationId) return null;
    if (itemBatches[pid]) return itemBatches[pid];
    setFetchingBatches(prev => ({ ...prev, [pid]: true }));
    try {
      const b = await fetchPartBatches(pid, locationId);
      setItemBatches(prev => ({ ...prev, [pid]: b }));
      return b;
    } catch {
      return null;
    } finally {
      setFetchingBatches(prev => ({ ...prev, [pid]: false }));
    }
  };

  const setOtherItemsToZero = (keepKey?: string | null) => {
    const fallbackKey =
      keepKey ??
      activeLineKey ??
      (lines.find((l) => Number(l.part_id) > 0)?.key ?? null) ??
      (lines[0]?.key ?? null);

    if (!fallbackKey) {
      toast({ title: "Add an item first", description: "Add at least 1 item first.", variant: "destructive" });
      return;
    }

    const keep = lines.find((l) => l.key === fallbackKey) ?? null;
    if (!keep) return;

    const keepFinalKey =
      Number(keep.part_id) > 0 ? keep.key : (lines.find((l) => Number(l.part_id) > 0)?.key ?? keep.key);

    const existingByPartId = new Map<number, (typeof lines)[number]>();
    for (const ln of lines) {
      if (Number(ln.part_id) > 0) existingByPartId.set(Number(ln.part_id), ln);
    }

    const keepLine = lines.find((l) => l.key === keepFinalKey) ?? keep;
    const keepPartId = Number(keepLine.part_id) > 0 ? Number(keepLine.part_id) : null;

    const out: (typeof lines)[number][] = [];

    for (const p of parts) {
      const pid = Number((p as any)?.id);
      if (!Number.isFinite(pid) || pid <= 0) continue;

      const existing = existingByPartId.get(pid);
      if (existing) {
        if (keepPartId !== null && pid === keepPartId && existing.key === keepFinalKey) {
          out.push({ ...existing, include_when_zero: false });
        } else {
          out.push({ ...existing, physical_stock: 0, include_when_zero: true });
        }
      } else {
        out.push({
          key: newKey(),
          part_id: pid,
          batch_id: null,
          physical_stock: 0,
          notes: "",
          include_when_zero: true,
        });
      }
    }

    for (const ln of lines) {
      if (!(Number(ln.part_id) > 0)) out.push(ln);
    }

    setActiveLineKey(keepFinalKey);
    setLines(out);
    toast({ title: "Updated", description: `Added ${Math.max(0, out.length - lines.length)} items and set others to 0` });
  };

  const filteredAddParts = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter((p) => {
      const name = String(p.part_name ?? "").toLowerCase();
      const sku = String(p.sku ?? "").toLowerCase();
      const unit = String(p.unit ?? "").toLowerCase();
      return name.includes(q) || sku.includes(q) || unit.includes(q) || String(p.id).includes(q);
    });
  }, [parts, addQuery]);

  const filteredEditParts = useMemo(() => {
    const q = editQuery.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter((p) => {
      const name = String(p.part_name ?? "").toLowerCase();
      const sku = String(p.sku ?? "").toLowerCase();
      const unit = String(p.unit ?? "").toLowerCase();
      return name.includes(q) || sku.includes(q) || unit.includes(q) || String(p.id).includes(q);
    });
  }, [parts, editQuery]);

  const openAddItem = () => {
    setAddQuery("");
    setAddOpen(true);
  };

  const addPart = (pid: number) => {
    if (pid <= 0) return;
    const pInfo = parts.find(x => Number(x.id) === pid);
    const key = newKey();
    setLines((p) => [...p, { key, part_id: pid, batch_id: null, physical_stock: "", notes: "" }]);
    setAddOpen(false);
    void loadBatchesForPart(pid).then((batches) => {
      if (batches && batches.length > 0) {
        setBatchPrompt({ key, pid, name: pInfo?.part_name ?? "Item", batches, totalStock: Number(pInfo?.stock_quantity ?? 0) });
      }
    });
  };

  const changePart = (key: string, pid: number) => {
    if (pid <= 0) return;
    setLines((p) => p.map((x) => (x.key === key ? { ...x, part_id: pid, batch_id: null } : x)));
    setEditKey(null);
    void loadBatchesForPart(pid);
  };

  const submit = async () => {
    const clean = lines
      .map((l) => ({
        part_id: Number(l.part_id),
        batch_id: l.batch_id,
        physical_stock: l.physical_stock === "" ? null : Math.round(Number(l.physical_stock) * 1000) / 1000,
        notes: l.notes?.trim() ? l.notes.trim() : undefined,
        include_when_zero: Boolean(l.include_when_zero),
      }))
      .filter((l) => l.part_id > 0 && l.physical_stock !== null)
      .map((l) => ({
        part_id: l.part_id,
        batch_id: l.batch_id,
        physical_stock: l.physical_stock as number,
        notes: l.notes,
        include_when_zero: l.include_when_zero,
      }));

    if (clean.length === 0) {
      toast({ title: "Validation", description: "Add at least 1 item and enter physical stock", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await createStockCount(
        {
          adjusted_at: adjustedAt ? adjustedAt : undefined,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
          items: clean,
        },
        locationId ?? undefined
      );
      const id = (res as any)?.data?.id;
      toast({ title: "Count Session Created", description: "Counts saved as pending manager approval." });
      router.push(`/inventory/stock/counts/${encodeURIComponent(String(id))}`);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Submit failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-primary" />
                New Stock Count (Stock Take)
              </h1>
              <p className="text-muted-foreground mt-1">Conduct physical stock auditing session</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/inventory/stock/counts">All Count Sheets</Link>
          </Button>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Session Header</CardTitle>
            <CardDescription>Define auditing context</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Location</Label>
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <Select
                value={locationId ? String(locationId) : ""}
                onValueChange={(v) => {
                  const n = Number(v);
                  setLocationId(Number.isFinite(n) && n > 0 ? n : null);
                }}
                disabled={locations.length === 0 || saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
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
            <div className="space-y-2">
              <Label>Count Taken At</Label>
              <Input type="datetime-local" value={adjustedAt} onChange={(e) => setAdjustedAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Session Title / Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Annual stock take 2026" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Aduiting Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div>
              <CardTitle>Count Lines</CardTitle>
              <CardDescription>Scan barcodes or select items to enter physical counts.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setOtherItemsToZero(null)}
                disabled={saving || loading || parts.length === 0 || lines.length === 0}
              >
                Set Other Items to 0
              </Button>
              <Popover open={addOpen} onOpenChange={setAddOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" onClick={openAddItem} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[520px] p-3">
                  <div className="flex items-center gap-2 pb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={addQuery}
                        onChange={(e) => setAddQuery(e.target.value)}
                        placeholder="Search item..."
                        className="pl-8 h-10"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[320px] pr-2">
                    <div className="space-y-1">
                      {filteredAddParts.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-10 text-center">No items found</div>
                      ) : (
                        filteredAddParts.map((p) => {
                          const label = p.sku ? `${p.part_name} (${p.sku})` : p.part_name;
                          const selected = lines.some((l) => String(l.part_id) === String(p.id));
                          const brand = p.brand_name || p.brand || "";
                          const price = p.price || p.cost_price || 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => addPart(Number(p.id))}
                              className={cn(
                                "w-full flex flex-col text-left rounded-xl border px-3 py-2 transition-colors",
                                selected ? "bg-primary/5 border-primary/40" : "hover:bg-muted/40 border-transparent"
                              )}
                            >
                              <div className="flex justify-between items-start w-full">
                                <div className="font-semibold text-sm">{label}</div>
                                <div className="font-bold text-sm tabular-nums">LKR {Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                              {brand && <div className="text-xs text-muted-foreground mt-0.5">{brand}</div>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary" disabled={!locationId}>
                    <Printer className="w-4 h-4" />
                    Print Count Sheet
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[200px] p-2 space-y-1">
                  <button 
                    type="button"
                    className="w-full text-left px-2.5 py-2 hover:bg-muted rounded-md text-xs font-semibold"
                    onClick={() => {
                      window.open(`/inventory/stock/adjustments/print-sheet?loc=${locationId}&blind=1&autoprint=1`, "_blank");
                    }}
                  >
                    🚫 Blind Count Sheet
                  </button>
                  <button 
                    type="button"
                    className="w-full text-left px-2.5 py-2 hover:bg-muted rounded-md text-xs font-semibold"
                    onClick={() => {
                      window.open(`/inventory/stock/adjustments/print-sheet?loc=${locationId}&blind=0&autoprint=1`, "_blank");
                    }}
                  >
                    📋 Standard Count Sheet
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 bg-muted/10 p-2.5 rounded-lg border border-dashed">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Scan barcode or type SKU..."
                      className="pl-8 h-9 text-xs bg-background"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleScannedBarcode(barcodeInput);
                          setBarcodeInput("");
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground italic">
                    (Keyboard scanning is active. Standard USB/Wireless barcode guns function automatically)
                  </span>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead className="w-[140px]">Location Stock</TableHead>
                        <TableHead className="w-[160px]">Physical Count</TableHead>
                        <TableHead className="w-[140px]">Variance</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                            Start adding items using "Add Item", barcode scanning, or "Set Other Items to 0" to initialize counts.
                          </TableCell>
                        </TableRow>
                      ) : null}

                      {lines.map((l) => {
                        const part = parts.find((p) => String(p.id) === String(l.part_id));
                        const label = part ? (part.sku ? `${part.part_name} (${part.sku})` : part.part_name) : null;
                        
                        const batches = part ? (itemBatches[part.id] || []) : [];
                        const selectedBatch = l.batch_id ? batches.find((b: any) => b.id === l.batch_id) : null;

                        const systemStock = selectedBatch 
                          ? Number(selectedBatch.quantity_on_hand ?? 0)
                          : (batches.length > 0 ? Number(batches.find(b => Number(b.id) === 0)?.quantity_on_hand ?? 0) : Number(part?.stock_quantity ?? 0));

                        const physical = l.physical_stock === "" ? null : Number(l.physical_stock);
                        const variance = physical === null ? null : Number((physical - systemStock).toFixed(3));
                        return (
                          <TableRow
                            key={l.key}
                            className={cn(activeLineKey === l.key ? "bg-muted/20" : "")}
                            onClick={() => {
                              setActiveLineKey(l.key);
                              if (part && !itemBatches[part.id]) void loadBatchesForPart(part.id);
                            }}
                          >
                            <TableCell>
                              <Popover
                                open={editKey === l.key}
                                onOpenChange={(open) => {
                                  setEditKey(open ? l.key : null);
                                  if (open) setActiveLineKey(l.key);
                                  if (open) setEditQuery("");
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn("w-full justify-between gap-2 text-left font-normal", !label && "border-dashed text-muted-foreground")}
                                  >
                                    <span className="truncate">{label || "Select item..."}</span>
                                    <ChevronsUpDown className="w-4 h-4 opacity-70" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-[520px] p-3">
                                  <div className="flex items-center gap-2 pb-3">
                                    <Input
                                      value={editQuery}
                                      onChange={(e) => setEditQuery(e.target.value)}
                                      placeholder="Search item..."
                                      className="h-10"
                                    />
                                  </div>
                                  <ScrollArea className="h-[320px] pr-2">
                                    <div className="space-y-1">
                                      {filteredEditParts.map((p) => {
                                        const label = p.sku ? `${p.part_name} (${p.sku})` : p.part_name;
                                        const brand = p.brand_name || p.brand || "";
                                        const price = p.price || p.cost_price || 0;
                                        return (
                                        <button
                                          key={p.id}
                                          type="button"
                                          onClick={() => changePart(l.key, Number(p.id))}
                                          className="w-full flex flex-col text-left rounded-xl border px-3 py-2 hover:bg-muted/40 border-transparent transition-colors"
                                        >
                                          <div className="flex justify-between items-start w-full">
                                            <div className="font-semibold text-sm">{label}</div>
                                            <div className="font-bold text-sm tabular-nums">LKR {Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                          </div>
                                          {brand && <div className="text-xs text-muted-foreground mt-0.5">{brand}</div>}
                                        </button>
                                      )})}
                                    </div>
                                  </ScrollArea>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                            <TableCell>
                              {part ? (
                                <Select
                                  value={l.batch_id ? String(l.batch_id) : "unbatched"}
                                  onValueChange={(v) => {
                                    const bid = v === "unbatched" ? null : Number(v);
                                    setLines(prev => prev.map(x => x.key === l.key ? { ...x, batch_id: bid } : x));
                                  }}
                                >
                                  <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unbatched">Total/Unbatched</SelectItem>
                                    {batches.map((b: any) => (
                                      <SelectItem key={b.id} value={String(b.id)}>
                                        {b.batch_number} (stock: {fmt3(Number(b.quantity_on_hand))})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="font-mono text-sm font-semibold">{fmt3(systemStock)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="any"
                                className="h-9 font-semibold"
                                placeholder="0"
                                value={l.physical_stock}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLines(prev => prev.map(x => x.key === l.key ? { ...x, physical_stock: val === "" ? "" : Number(val) } : x));
                                }}
                              />
                            </TableCell>
                            <TableCell className={cn(
                              "font-mono text-sm font-bold",
                              variance === null && "text-muted-foreground",
                              variance !== null && variance < 0 && "text-destructive",
                              variance !== null && variance > 0 && "text-emerald-700",
                              variance === 0 && "text-muted-foreground"
                            )}>
                              {variance === null ? "-" : (variance > 0 ? `+${fmt3(variance)}` : fmt3(variance))}
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-9 text-xs"
                                placeholder="Notes"
                                value={l.notes || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLines(prev => prev.map(x => x.key === l.key ? { ...x, notes: val } : x));
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeLine(l.key)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={submit} className="bg-primary hover:bg-primary/95 text-white" disabled={saving || lines.length === 0}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Count Session
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!batchPrompt} onOpenChange={(o) => { if (!o) setBatchPrompt(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Batch for {batchPrompt?.name}</DialogTitle>
            <DialogDescription>
              This item tracks FIFO/Expiry. Please select the correct batch to record the count.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2 max-h-[300px] overflow-auto">
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-2 border-primary/20 bg-primary/5"
              onClick={() => {
                if (batchPrompt?.isScan) {
                  const existingIndex = lines.findIndex((l) => Number(l.part_id) === batchPrompt.pid && l.batch_id === null);
                  if (existingIndex > -1) {
                    const existingLine = lines[existingIndex];
                    const newStock = existingLine.physical_stock === "" ? 1 : Number(existingLine.physical_stock) + 1;
                    setLines((prev) => prev.map((line, idx) => idx === existingIndex ? { ...line, physical_stock: newStock } : line));
                    toast({ title: "Quantity Incremented", description: `${batchPrompt.name} (Unbatched) count increased to ${newStock}.` });
                    setActiveLineKey(existingLine.key);
                  } else {
                    const key = newKey();
                    setLines((prev) => [...prev, { key, part_id: batchPrompt.pid, batch_id: null, physical_stock: 1, notes: "" }]);
                    setActiveLineKey(key);
                    toast({ title: "Item Added", description: `${batchPrompt.name} (Unbatched) added to count list.` });
                  }
                } else {
                  if (batchPrompt?.key) {
                    setLines(prev => prev.map(l => l.key === batchPrompt.key ? { ...l, batch_id: null } : l));
                  }
                }
                setBatchPrompt(null);
              }}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Total/Unbatched</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  Location Stock: {batchPrompt ? fmt3(Number(batchPrompt.batches.find(b => Number(b.id) === 0)?.quantity_on_hand ?? 0)) : "0.000"}
                </span>
              </div>
            </Button>
            {batchPrompt?.batches.filter(b => Number(b.id) !== 0).map(b => (
              <Button
                key={b.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => {
                  if (batchPrompt.isScan) {
                    const existingIndex = lines.findIndex((l) => Number(l.part_id) === batchPrompt.pid && l.batch_id === b.id);
                    if (existingIndex > -1) {
                      const existingLine = lines[existingIndex];
                      const newStock = existingLine.physical_stock === "" ? 1 : Number(existingLine.physical_stock) + 1;
                      setLines((prev) => prev.map((line, idx) => idx === existingIndex ? { ...line, physical_stock: newStock } : line));
                      toast({ title: "Quantity Incremented", description: `${batchPrompt.name} count increased to ${newStock}.` });
                      setActiveLineKey(existingLine.key);
                    } else {
                      const key = newKey();
                      setLines((prev) => [...prev, { key, part_id: batchPrompt.pid, batch_id: b.id, physical_stock: 1, notes: "" }]);
                      setActiveLineKey(key);
                      toast({ title: "Item Added", description: `${batchPrompt.name} added to count list.` });
                    }
                  } else {
                    if (batchPrompt.key) {
                      setLines(prev => prev.map(l => l.key === batchPrompt.key ? { ...l, batch_id: b.id } : l));
                    }
                  }
                  setBatchPrompt(null);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Batch: {b.batch_number}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Location Stock: {fmt3(Number(b.quantity_on_hand ?? 0))}</span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
