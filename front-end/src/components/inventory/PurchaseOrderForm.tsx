"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  createPurchaseOrder, 
  updatePurchaseOrder,
  fetchPartsForSupplier, 
  fetchSupplier, 
  fetchSuppliers, 
  fetchLocations,
  type PartRow, 
  type PurchaseOrderItemRow, 
  type ServiceLocationRow,
  type SupplierRow, 
  type TaxRow,
  type InventoryCollectionRow,
  formatPartLabel
} from "@/lib/api";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { calculateTaxes } from "@/lib/tax-calc";
import { FileText, Loader2, Plus, Trash2, Save, Printer } from "lucide-react";

interface PurchaseOrderFormProps {
  editId?: string;
  initialData?: {
    supplier_id: string;
    notes: string;
    ordered_at: string;
    expected_at: string;
    items: PurchaseOrderItemRow[];
  };
}

function todayLocalDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toMysqlDatetimeFromDate(v: string) {
  if (!v) return null;
  // If it's just a date YYYY-MM-DD, add time
  if (v.length === 10) return `${v} 00:00:00`;
  return v.replace("T", " ");
}

export function PurchaseOrderForm({ editId, initialData }: PurchaseOrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [locations, setLocations] = useState<ServiceLocationRow[]>([]);
  const [currentLocation, setCurrentLocation] = useState<ServiceLocationRow | null>(null);
  const [originalSupplierTaxes, setOriginalSupplierTaxes] = useState<TaxRow[]>([]);
  const [supplierTaxes, setSupplierTaxes] = useState<TaxRow[]>([]);

  const [form, setForm] = useState({
    supplier_id: initialData?.supplier_id || "",
    location_id: initialData?.location_id || "",
    notes: initialData?.notes || "",
    ordered_at: initialData?.ordered_at || todayLocalDate(),
    expected_at: initialData?.expected_at || "",
    items: initialData?.items || [{ part_id: 0, qty_ordered: 1, unit_cost: 0 } as PurchaseOrderItemRow],
  });

  // Sync with initialData if it changes (e.g. after fetch in parent)
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [supRows, locRows] = await Promise.all([fetchSuppliers(), fetchLocations()]);
        setSuppliers(Array.isArray(supRows) ? supRows : []);
        setLocations(Array.isArray(locRows) ? locRows : []);
        
        // Identify current location
        const lsLocId = initialData?.location_id || (typeof window !== 'undefined' ? window.localStorage.getItem("location_id") : null);
        if (lsLocId && Array.isArray(locRows)) {
           const found = (locRows as ServiceLocationRow[]).find(l => String(l.id) === lsLocId);
           if (found) {
             setCurrentLocation(found);
             setForm(p => ({ ...p, location_id: String(found.id) }));
           }
        }
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load suppliers", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const sid = Number(form.supplier_id);
    if (!Number.isFinite(sid) || sid <= 0) {
      setParts([]);
      setSupplierTaxes([]);
      return;
    }
    void (async () => {
      try {
        const [partRows, sup] = await Promise.all([fetchPartsForSupplier(sid, ""), fetchSupplier(String(sid))]);
        setParts(Array.isArray(partRows) ? partRows : []);
        setOriginalSupplierTaxes(Array.isArray((sup as any)?.taxes) ? ((sup as any).taxes as TaxRow[]) : []);
      } catch (e: any) {
        setParts([]);
        setOriginalSupplierTaxes([]);
        toast({ title: "Error", description: e?.message || "Failed to load supplier details", variant: "destructive" });
      }
    })();
  }, [form.supplier_id]);

  useEffect(() => {
    setSupplierTaxes(originalSupplierTaxes);
  }, [originalSupplierTaxes]);

  // Sync currentLocation when form.location_id changes
  useEffect(() => {
    if (!form.location_id) {
      setCurrentLocation(null);
      return;
    }
    const found = locations.find(l => String(l.id) === form.location_id);
    if (found) setCurrentLocation(found);
  }, [form.location_id, locations]);

  const partById = useMemo(() => {
    const m = new Map<number, PartRow>();
    for (const p of parts) m.set(Number(p.id), p);
    return m;
  }, [parts]);

  const totalAmount = useMemo(() => {
    let sum = 0;
    for (const it of form.items) {
      const qty = Number(it.qty_ordered);
      const unitCost = Number(it.unit_cost);
      if (!Number.isFinite(qty) || !Number.isFinite(unitCost)) continue;
      sum += qty * unitCost;
    }
    return Math.round(sum * 100) / 100;
  }, [form.items]);

  const taxCalc = useMemo(() => calculateTaxes(totalAmount, supplierTaxes), [totalAmount, supplierTaxes]);

  const addLine = () =>
    setForm((p) => ({
      ...p,
      items: [...p.items, { part_id: 0, qty_ordered: 1, unit_cost: 0 }],
    }));

  const removeLine = (idx: number) =>
    setForm((p) => ({
      ...p,
      items: p.items.filter((_, i) => i !== idx),
    }));

  const canSave = useMemo(() => {
    const supplierId = Number(form.supplier_id);
    if (!Number.isFinite(supplierId) || supplierId <= 0) return false;
    const validLines = form.items.some((it) => Number(it.part_id) > 0 && Number(it.qty_ordered) > 0);
    return validLines;
  }, [form]);

  const selectedPartIds = useMemo(() => {
    const s = new Set<number>();
    for (const it of form.items) {
      const id = Number(it.part_id);
      if (Number.isFinite(id) && id > 0) s.add(id);
    }
    return s;
  }, [form.items]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplierId = Number(form.supplier_id);

    const items = form.items
      .map((it) => ({
        part_id: Number(it.part_id),
        qty_ordered: Math.round(Number(it.qty_ordered) * 1000) / 1000,
        unit_cost: Number(it.unit_cost),
      }))
      .filter((it) => it.part_id > 0 && it.qty_ordered > 0);

    if (!supplierId || items.length === 0) {
      toast({ title: "Validation", description: "Select a supplier and add at least 1 item line.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplier_id: supplierId,
        location_id: Number(form.location_id) || undefined,
        notes: form.notes?.trim() ? form.notes.trim() : undefined,
        ordered_at: toMysqlDatetimeFromDate(form.ordered_at),
        expected_at: toMysqlDatetimeFromDate(form.expected_at),
        items,
      };

      if (editId) {
        await updatePurchaseOrder(editId, payload as any);
        toast({ title: "Updated", description: "Purchase order updated successfully" });
      } else {
        const res = await createPurchaseOrder(payload as any);
        const createdId = (res as any)?.data?.id;
        toast({ title: "Created", description: "Purchase order created successfully" });
        
        if (createdId) {
          const url = `/inventory/purchase-orders/print/${encodeURIComponent(String(createdId))}?autoprint=1`;
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }

      router.push("/inventory/purchase-orders");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const money = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle>PO Details</CardTitle>
          <CardDescription>Supplier, dates and reference notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <SearchableSelect 
                  value={form.supplier_id} 
                  onValueChange={(v) => setForm((p) => ({ ...p, supplier_id: v }))}
                  options={suppliers.map(s => ({
                    value: String(s.id),
                    label: s.name,
                    keywords: s.email || ""
                  }))}
                  placeholder="Select supplier..."
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Location</Label>
                <Select value={form.location_id} onValueChange={(v) => setForm((p) => ({ ...p, location_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordered Date</Label>
                <Input
                  type="date"
                  value={form.ordered_at.split(' ')[0]}
                  onChange={(e) => setForm((p) => ({ ...p, ordered_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Date</Label>
                <Input
                  type="date"
                  value={form.expected_at?.split(' ')[0]}
                  onChange={(e) => setForm((p) => ({ ...p, expected_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Add parts and specify quantities</CardDescription>
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={addLine} disabled={saving || loading}>
            <Plus className="w-4 h-4" /> Add Line
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-[140px]">Qty</TableHead>
                  <TableHead className="w-[180px]">Unit Cost</TableHead>
                  <TableHead className="w-[160px] text-right">Amount</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.items.map((it, idx) => {
                  const selected = it.part_id ? partById.get(Number(it.part_id)) : null;
                  const qty = Number(it.qty_ordered);
                  const unitCost = Number(it.unit_cost);
                  const lineAmount = Number.isFinite(qty) && Number.isFinite(unitCost) ? Math.round(qty * unitCost * 100) / 100 : 0;
                  return (
                    <TableRow key={idx} className="align-top">
                      <TableCell>
                        <div className="space-y-2">
                          <SearchableSelect
                            value={String(it.part_id || "")}
                            onValueChange={(v) => {
                              const partId = Number(v);
                              if (partId > 0 && form.items.some((x, i) => i !== idx && Number(x.part_id) === partId)) {
                                toast({ title: "Duplicate item", description: "This item is already added.", variant: "destructive" });
                                return;
                              }
                              const p = partById.get(partId);
                              setForm((prev) => ({
                                ...prev,
                                items: prev.items.map((x, i) =>
                                  i === idx ? { ...x, part_id: partId, unit_cost: p?.cost_price || 0 } : x
                                ),
                              }));
                            }}
                            options={parts.map(p => ({
                              value: String(p.id),
                              label: formatPartLabel(p),
                              keywords: p.sku || ""
                            }))}
                            placeholder="Search item..."
                          />
                          {selected && <div className="text-[11px] text-muted-foreground">Unit Cost hint: {selected.cost_price?.toLocaleString()}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.001" value={String(it.qty_ordered ?? "")} onChange={(e) => setForm(p => ({ ...p, items: p.items.map((x, i) => i === idx ? { ...x, qty_ordered: Number(e.target.value) } : x) }))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" value={String(it.unit_cost ?? "")} onChange={(e) => setForm(p => ({ ...p, items: p.items.map((x, i) => i === idx ? { ...x, unit_cost: Number(e.target.value) } : x) }))} />
                      </TableCell>
                      <TableCell className="text-right align-middle font-semibold tabular-nums">{money(lineAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)} disabled={form.items.length <= 1} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-end mt-6 space-y-3">
            <div className="rounded-lg border bg-muted/20 px-4 py-3 min-w-[300px] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{money(totalAmount)}</span>
              </div>
              {taxCalc.lines.map(t => (
                <div key={t.tax_id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t.code} ({t.rate_percent}%)</span>
                  <span className="font-semibold tabular-nums">{money(t.amount)}</span>
                </div>
              ))}
              
              <div className="pt-2 border-t flex justify-between">
                <span className="font-bold">Grand Total</span>
                <span className="font-bold text-xl text-primary tabular-nums">{money(taxCalc.grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/inventory/purchase-orders")} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={!canSave || saving || loading} className="gap-2 px-8">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editId ? "Update Purchase Order" : "Create Purchase Order"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
