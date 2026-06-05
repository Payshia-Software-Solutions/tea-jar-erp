"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import {
  createGrn,
  fetchParts,
  fetchPurchaseOrder,
  fetchPurchaseOrders,
  fetchLocations,
  fetchSupplier,
  fetchSuppliers,
  type GrnItemRow,
  type PartRow,
  type PurchaseOrderRow,
  type ServiceLocationRow,
  type SupplierRow,
  type TaxRow,
} from "@/lib/api";
import { ArrowLeft, ClipboardCheck, Loader2, PackageCheck, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { calculateTaxes } from "@/lib/tax-calc";

function nowLocalDatetime() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewGrnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const prefillDoneRef = useRef(false);
  const autoLoadedPoIdRef = useRef<number | null>(null);
  const [poLocationId, setPoLocationId] = useState<number | null>(null);
  const [poLocationName, setPoLocationName] = useState<string>("");
  const [locationOptions, setLocationOptions] = useState<ServiceLocationRow[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingPo, setLoadingPo] = useState(false);

  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
  const [originalSupplierTaxes, setOriginalSupplierTaxes] = useState<TaxRow[]>([]);
  const [supplierTaxes, setSupplierTaxes] = useState<TaxRow[]>([]);

  const [form, setForm] = useState({
    supplier_id: "",
    purchase_order_id: "",
    received_at: nowLocalDatetime(),
    notes: "",
    items: [{ part_id: 0, qty_received: 1, unit_cost: 0, batch_number: "", mfg_date: "", expiry_date: "" } as any as GrnItemRow],
  });

  // When a PO is selected (even before details are loaded), lock certain fields on the form.
  const isPoMode = useMemo(() => Number(form.purchase_order_id || 0) > 0, [form.purchase_order_id]);

  const partsById = useMemo(() => {
    const m = new Map<number, PartRow>();
    for (const p of parts) m.set(Number(p.id), p);
    return m;
  }, [parts]);

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: String(s.id), label: String(s.name ?? ""), keywords: `${s.email ?? ""} ${s.phone ?? ""}` })),
    [suppliers]
  );
  const locationSelectOptions = useMemo(
    () => locationOptions.map((l) => ({ value: String(l.id), label: String(l.name ?? "") })),
    [locationOptions]
  );
  const poOptions = useMemo(
    () =>
      purchaseOrders.map((po) => ({
        value: String(po.id),
        label: `${po.po_number}${po.supplier_name ? ` - ${po.supplier_name}` : ""}`,
        keywords: `${po.status ?? ""} ${po.location_name ?? ""}`,
      })),
    [purchaseOrders]
  );
  const partOptions = useMemo(
    () =>
      parts.map((p) => ({
        value: String(p.id),
        label: p.sku ? `${p.part_name} (${p.sku})` : p.part_name,
        keywords: `${p.sku ?? ""} ${p.part_number ?? ""} ${p.barcode_number ?? ""}`,
      })),
    [parts]
  );

  const selectedPartIds = useMemo(() => {
    const s = new Set<string>();
    for (const it of form.items) {
      const v = String(it.part_id || "").trim();
      if (v) s.add(v);
    }
    return s;
  }, [form.items]);

  const money = (n: number) =>
    (Number.isFinite(n) ? n : 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const subTotal = useMemo(() => {
    let sum = 0;
    for (const it of form.items) {
      const qty = Number(it.qty_received ?? 0);
      const unit = Number(it.unit_cost ?? 0);
      if (!Number.isFinite(qty) || !Number.isFinite(unit)) continue;
      sum += qty * unit;
    }
    return Math.round(sum * 100) / 100;
  }, [form.items]);

  const taxCalc = useMemo(() => calculateTaxes(subTotal, supplierTaxes), [subTotal, supplierTaxes]);

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

    const run = async () => {
      setLoading(true);
      try {
        const tokenJson: any = typeof window !== "undefined" ? decodeToken() : null;
        const role = String(tokenJson?.role ?? "");

        // Locations for this page selector.
        let locs: ServiceLocationRow[] = [];
        if (role === "Admin") {
          const rows = await fetchLocations();
          locs = Array.isArray(rows) ? (rows as ServiceLocationRow[]) : [];
        } else {
          const allowed = Array.isArray(tokenJson?.allowed_locations) ? tokenJson.allowed_locations : [];
          locs = allowed;
        }
        setLocationOptions(locs);

        // Default selected location from localStorage (topbar) or token.
        const lsIdRaw = typeof window !== "undefined" ? window.localStorage.getItem("location_id") : null;
        const tokenLoc = tokenJson?.location_id ? Number(tokenJson.location_id) : 1;
        const initId = lsIdRaw ? Number(lsIdRaw) : tokenLoc;
        const safeId = Number.isFinite(initId) && initId > 0 ? initId : 1;
        setSelectedLocationId(safeId);

        const [supRows, partRows, poRows] = await Promise.all([fetchSuppliers(), fetchParts(""), fetchPurchaseOrders("")]);
        setSuppliers(Array.isArray(supRows) ? supRows : []);
        setParts(Array.isArray(partRows) ? partRows : []);
        const openAndApprovedOnly = Array.isArray(poRows)
          ? (poRows as PurchaseOrderRow[]).filter((po) => {
              const s = String((po as any)?.status ?? "").toLowerCase();
              return s === "approved" || s === "partially received" || s === "sent";
            })
          : [];
        setPurchaseOrders(openAndApprovedOnly);
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load master data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const sid = Number(form.supplier_id || 0);
    if (!sid || !Number.isFinite(sid)) {
      setOriginalSupplierTaxes([]);
      return;
    }
    void (async () => {
      try {
        const sup = await fetchSupplier(String(sid));
        setOriginalSupplierTaxes(Array.isArray((sup as any)?.taxes) ? ((sup as any).taxes as TaxRow[]) : []);
      } catch {
        setOriginalSupplierTaxes([]);
      }
    })();
  }, [form.supplier_id]);

  useEffect(() => {
    setSupplierTaxes(originalSupplierTaxes);
  }, [originalSupplierTaxes]);

  useEffect(() => {
    // Ensure selectedLocationId always points to a valid option (non-PO GRNs must be able to choose locations).
    if (locationOptions.length === 0) return;
    if (isPoMode) return;
    const current = selectedLocationId ?? null;
    const exists = current ? locationOptions.some((l) => l.id === current) : false;
    if (!exists) {
      setSelectedLocationId(locationOptions[0].id);
      try {
        window.localStorage.setItem("location_id", String(locationOptions[0].id));
        window.localStorage.setItem("location_name", String(locationOptions[0].name));
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationOptions, isPoMode]);

  const onChangeLocation = async (locId: number) => {
    if (!Number.isFinite(locId) || locId <= 0) return;
    const loc = locationOptions.find((l) => l.id === locId);
    setSelectedLocationId(locId);

    try {
      // Keep global context consistent (header, other API calls).
      window.localStorage.setItem("location_id", String(locId));
      if (loc?.name) window.localStorage.setItem("location_name", String(loc.name));
    } catch {
      // ignore
    }

    // Clear any PO selection when switching locations (POs are location-scoped).
    setForm((p) => ({
      ...p,
      supplier_id: "",
      purchase_order_id: "",
      received_at: nowLocalDatetime(),
      items: [{ part_id: 0, qty_received: 1, unit_cost: 0 } as GrnItemRow],
    }));
    setPoLocationId(null);
    setPoLocationName("");
    autoLoadedPoIdRef.current = null;

    // Reload POs for the new location context.
    try {
      const poRows = await fetchPurchaseOrders("");
      const openAndApprovedOnly = Array.isArray(poRows)
        ? (poRows as PurchaseOrderRow[]).filter((po) => {
            const s = String((po as any)?.status ?? "").toLowerCase();
            return s === "approved" || s === "partially received" || s === "sent";
          })
        : [];
      setPurchaseOrders(openAndApprovedOnly);
    } catch {
      setPurchaseOrders([]);
    }
  };

  useEffect(() => {
    if (prefillDoneRef.current) return;
    const poParam = searchParams?.get("po");
    const poId = poParam ? Number(poParam) : 0;
    if (!poId || !Number.isFinite(poId)) return;
    if (loading) return;

    prefillDoneRef.current = true;
    setForm((p) => ({ ...p, purchase_order_id: String(poId) }));
    // Load PO items after we set the id.
    window.setTimeout(() => void loadPoItems(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading]);

  useEffect(() => {
    // When PO is selected, lock the GRN date/time to "now" and reset PO-derived metadata.
    const poId = Number(form.purchase_order_id || 0);
    if (poId > 0) {
      setForm((p) => ({ ...p, received_at: nowLocalDatetime() }));
    } else {
      setPoLocationId(null);
      setPoLocationName("");
      autoLoadedPoIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.purchase_order_id]);

  useEffect(() => {
    // Auto-load PO items when a PO is selected (so supplier/location/lines are locked immediately).
    if (loading) return;
    if (loadingPo) return;
    const poId = Number(form.purchase_order_id || 0);
    if (!poId || !Number.isFinite(poId)) return;
    if (autoLoadedPoIdRef.current === poId) return;
    autoLoadedPoIdRef.current = poId;
    void loadPoItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.purchase_order_id, loading, loadingPo]);

  const addLine = () => setForm((p) => ({ ...p, items: [...p.items, { part_id: 0, qty_received: 1, unit_cost: 0, batch_number: "", mfg_date: "", expiry_date: "" } as any as GrnItemRow] }));
  const removeLine = (idx: number) => setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const poSelected = useMemo(() => {
    const id = Number(form.purchase_order_id);
    if (!id) return null;
    return purchaseOrders.find((p) => Number(p.id) === id) ?? null;
  }, [form.purchase_order_id, purchaseOrders]);

  const loadPoItems = async () => {
    const poId = Number(form.purchase_order_id);
    if (!poId) {
      toast({ title: "Select PO", description: "Select a purchase order first.", variant: "destructive" });
      return;
    }
    setLoadingPo(true);
    try {
      const data: any = await fetchPurchaseOrder(String(poId));
      const po: any = data?.purchase_order ?? null;
      const items: any[] = Array.isArray(data?.items) ? data.items : [];

      const nextSupplierId = po?.supplier_id ? String(po.supplier_id) : form.supplier_id;
      const nextLocId = po?.location_id ? Number(po.location_id) : null;
      const nextLocName = po?.location_name ? String(po.location_name) : "";

      // Default receive qty = remaining = ordered - received
      const mapped: GrnItemRow[] = items
        .map((it) => {
          const partId = Number(it.part_id);
          const ordered = Number(it.qty_ordered ?? 0);
          const received = Number(it.received_qty ?? 0);
          const remaining = Math.max(0, ordered - received);
          const unitCost = Number(it.unit_cost ?? 0);
          return {
            part_id: partId,
            qty_received: remaining > 0 ? remaining : 0,
            unit_cost: Number.isFinite(unitCost) ? unitCost : 0,
            batch_number: "",
            mfg_date: "",
            expiry_date: "",
          };
        })
        .filter((x) => x.part_id > 0);

      setForm((p) => ({
        ...p,
        supplier_id: nextSupplierId,
        received_at: nowLocalDatetime(),
        items: mapped.length > 0 ? mapped : [{ part_id: 0, qty_received: 1, unit_cost: 0 }],
      }));

      setPoLocationId(nextLocId && Number.isFinite(nextLocId) ? nextLocId : null);
      setPoLocationName(nextLocName);
      if (nextLocId && Number.isFinite(nextLocId) && nextLocId > 0) {
        setSelectedLocationId(nextLocId);
        try {
          window.localStorage.setItem("location_id", String(nextLocId));
          if (nextLocName) window.localStorage.setItem("location_name", String(nextLocName));
        } catch {
          // ignore
        }
      }

      toast({ title: "Loaded", description: `Loaded ${mapped.length} PO lines.` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load PO items", variant: "destructive" });
    } finally {
      setLoadingPo(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplierId = Number(form.supplier_id);
    const poId = form.purchase_order_id.trim() ? Number(form.purchase_order_id) : null;

    const items = form.items
      .map((it) => ({
        part_id: Number(it.part_id),
        qty_received: Number(it.qty_received),
        unit_cost: Number(it.unit_cost),
        batch_number: (it as any).batch_number || null,
        mfg_date: (it as any).mfg_date || null,
        expiry_date: (it as any).expiry_date || null,
      }))
	      .map((it) => ({
	        ...it,
	        qty_received: Number.isFinite(it.qty_received) ? Math.round(it.qty_received * 1000) / 1000 : 0,
	      }))
	      .filter((it) => it.part_id > 0 && it.qty_received > 0 && Number.isFinite(it.unit_cost));

    if (!supplierId || !form.received_at || items.length === 0) {
      toast({ title: "Validation", description: "Supplier, Received At, and at least 1 item line are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await createGrn(
        {
          supplier_id: supplierId,
          purchase_order_id: poId,
          received_at: form.received_at,
          notes: form.notes.trim() || undefined,
          items,
          subtotal: subTotal,
          tax_total: taxCalc.totalTax,
        },
        poId ? (poLocationId ?? null) : (selectedLocationId ?? null)
      );
      const id = (res as any)?.data?.id;
      toast({ title: "Created", description: `GRN created${id ? ` (#${id})` : ""} and stock updated` });
      router.push("/inventory/grn");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Create failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const partLabel = (id: number) => {
    const p = partsById.get(id);
    if (!p) return "Select item...";
    return p.sku ? `${p.part_name} (${p.sku})` : p.part_name;
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
                <PackageCheck className="w-6 h-6 text-primary" />
                New GRN
              </h1>
              <p className="text-muted-foreground mt-1">Receive stock and update average cost price</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/inventory/grn">All GRNs</Link>
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader>
              <CardTitle>Header</CardTitle>
              <CardDescription>Supplier, PO link and received time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Purchase Order (optional)</Label>
                    <div className="flex gap-2">
                      <SearchableSelect
                        value={form.purchase_order_id}
                        onValueChange={(v) => setForm((p) => ({ ...p, purchase_order_id: v }))}
                        options={poOptions}
                        placeholder="Select PO..."
                        searchPlaceholder="Search PO..."
                        disabled={saving || loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 px-3"
                        onClick={() => void loadPoItems()}
                        disabled={loadingPo || saving || loading || !form.purchase_order_id}
                        title="Load PO Items"
                      >
                        {loadingPo ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    </div>
                    {poSelected ? (
                      <div className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{poSelected.po_number}</span> ({poSelected.status})
                        {poSelected.location_name ? (
                          <>
                            {" "}
                            <span className="font-semibold text-foreground">{poSelected.location_name}</span>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <SearchableSelect
                      value={form.supplier_id}
                      onValueChange={(v) => setForm((p) => ({ ...p, supplier_id: v }))}
                      options={supplierOptions}
                      placeholder="Supplier..."
                      searchPlaceholder="Search supplier..."
                      disabled={isPoMode || (Boolean(form.purchase_order_id) && loadingPo) || saving || loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <SearchableSelect
                      value={String((isPoMode ? (poLocationId ?? selectedLocationId ?? "") : (selectedLocationId ?? "")) || "")}
                      onValueChange={(v) => void onChangeLocation(Number(v))}
                      options={locationSelectOptions}
                      placeholder="Location..."
                      searchPlaceholder="Search location..."
                      disabled={isPoMode || locationOptions.length === 0 || saving || loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Received At</Label>
                    <Input
                      type="datetime-local"
                      value={form.received_at}
                      onChange={(e) => setForm((p) => ({ ...p, received_at: e.target.value }))}
                      required
                      disabled={isPoMode}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-3">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                    {isPoMode ? (
                      <div className="text-[11px] text-muted-foreground">Location and time are locked when receiving against a PO.</div>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Received Items</CardTitle>
                <CardDescription>Receiving updates stock and calculates average cost price automatically</CardDescription>
              </div>
              <Button type="button" variant="outline" className="gap-2" onClick={addLine} disabled={saving || loading || isPoMode}>
                <Plus className="w-4 h-4" />
                Add Line
              </Button>
            </CardHeader>
            <CardContent>
              {isPoMode ? (
                <div className="mb-3 text-[11px] text-muted-foreground">
                  PO item list is locked. You can edit Qty and Unit Cost only.
                  {poLocationName ? (
                    <span>
                      {" "}
                      Location: <span className="font-semibold text-foreground">{poLocationName}</span>
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="align-middle px-3">Item</TableHead>
                      <TableHead className="w-[80px] text-right align-middle px-3">Qty</TableHead>
                      <TableHead className="w-[100px] text-right align-middle px-3">Unit Cost</TableHead>
                      <TableHead className="w-[240px] align-middle px-3">Batch No</TableHead>
                      <TableHead className="w-[200px] align-middle px-3">Dates (Mfg/Exp)</TableHead>
                      <TableHead className="w-[40px] align-middle px-3" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.map((it, idx) => (
                      <TableRow key={idx} className="align-middle">
                        <TableCell className="p-2 align-middle">
                          <div className="space-y-1">
                            <SearchableSelect
                              value={it.part_id ? String(it.part_id) : ""}
                              onValueChange={(v) => {
                                // Prevent duplicate selection
                                if (v && v !== String(it.part_id || "") && selectedPartIds.has(String(v))) {
                                  toast({ title: "Duplicate item", description: "This item is already added to the GRN.", variant: "destructive" });
                                  return;
                                }
                                const partId = Number(v);
                                const p = partsById.get(partId);
                                const defaultCost = (p as any)?.cost_price ?? 0;
                                setForm((prev) => ({
                                  ...prev,
                                  items: prev.items.map((x, i) =>
                                    i === idx
                                      ? { ...x, part_id: partId, unit_cost: Number.isFinite(Number(defaultCost)) ? Number(Number(defaultCost).toFixed(2)) : 0.00 }
                                      : x
                                  ),
                                }));
                              }}
                              options={partOptions.filter((o) => !selectedPartIds.has(o.value) || o.value === String(it.part_id || ""))}
                              placeholder="Select item..."
                              searchPlaceholder="Search item..."
                              disabled={isPoMode || saving || loading}
                              className="h-8 text-xs font-semibold"
                            />
                            <div className="text-[10px] text-muted-foreground truncate max-w-[200px] leading-none">
                              {it.part_id ? partLabel(it.part_id) : "Pick an item"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <Input
                            type="number"
                            step="0.001"
                            inputMode="decimal"
                            value={String(it.qty_received ?? "")}
                            onChange={(e) => {
                              const v = e.target.value;
                              setForm((p) => ({
                                ...p,
                                items: p.items.map((x, i) => (i === idx ? { ...x, qty_received: Number(v) } : x)),
                              }));
                            }}
                            className="h-8 text-xs font-bold w-full"
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <Input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            value={String(it.unit_cost !== null && it.unit_cost !== undefined ? Number(it.unit_cost).toFixed(2) : "0.00")}
                            onChange={(e) => {
                              const v = e.target.value;
                              setForm((p) => ({
                                ...p,
                                items: p.items.map((x, i) => (i === idx ? { ...x, unit_cost: Number(v) } : x)),
                                tax_calc: calculateTaxes(
                                  p.items.reduce((acc, curr, j) => acc + (j === idx ? Number(v) : curr.unit_cost) * curr.qty_received, 0),
                                  supplierTaxes
                                )
                              }));
                            }}
                            className="h-8 text-xs w-full"
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          {(() => {
                            const p = partsById.get(it.part_id);
                            const showBatch = Number((p as any)?.is_fifo) === 1 || Number((p as any)?.is_expiry) === 1;
                            if (!showBatch) return <div className="text-[9px] text-muted-foreground/50 italic px-2 py-1">N/A</div>;
                            
                            const generateBatch = () => {
                              const now = new Date();
                              const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
                              const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
                              const bn = `BT-${dateStr}-${random}`;
                              setForm((p) => ({
                                ...p,
                                items: p.items.map((x, i) => (i === idx ? { ...x, batch_number: bn } : x)),
                              }));
                            };

                            return (
                              <div className="flex items-center gap-1 group">
                                <Input
                                  placeholder="Batch..."
                                  value={(it as any).batch_number ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setForm((p) => ({
                                      ...p,
                                      items: p.items.map((x, i) => (i === idx ? { ...x, batch_number: v } : x)),
                                    }));
                                  }}
                                  className="h-8 text-xs flex-1 truncate font-mono"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-primary transition-opacity"
                                  title="Generate Batch Number"
                                  onClick={generateBatch}
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          {(() => {
                            const p = partsById.get(it.part_id);
                            const showExpiry = Number((p as any)?.is_expiry) === 1;
                            if (!showExpiry) return <div className="text-[9px] text-muted-foreground/50 italic px-2 py-1">N/A</div>;
                            return (
                              <div className="space-y-1.5 py-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-muted-foreground w-6 shrink-0 text-right">MFD:</span>
                                  <Input
                                    type="date"
                                    className="h-8 text-[10px] px-2 w-[155px]"
                                    value={(it as any).mfg_date ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setForm((p) => ({
                                        ...p,
                                        items: p.items.map((x, i) => (i === idx ? { ...x, mfg_date: v } : x)),
                                      }));
                                    }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-red-500 w-6 shrink-0 text-right">EXP:</span>
                                  <Input
                                    type="date"
                                    className="h-8 text-[10px] px-2 border-red-200/50 focus-visible:ring-red-500 w-[155px]"
                                    value={(it as any).expiry_date ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setForm((p) => ({
                                        ...p,
                                        items: p.items.map((x, i) => (i === idx ? { ...x, expiry_date: v } : x)),
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLine(idx)}
                            disabled={saving || form.items.length <= 1 || isPoMode}
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="w-full lg:max-w-[420px] rounded-lg border bg-muted/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">Sub Total</div>
                    <div className="text-lg font-bold tabular-nums">{money(subTotal)}</div>
                  </div>

                  {taxCalc.lines.length > 0 ? (
                    <div className="mt-2 pt-2 border-t space-y-1">
                      {taxCalc.lines.map((t) => (
                        <div key={t.tax_id} className="flex items-center justify-between gap-4 text-sm">
                          <div className="text-muted-foreground">
                            {t.code} ({Number(t.rate_percent).toLocaleString()}%)
                          </div>
                          <div className="font-semibold tabular-nums">{money(t.amount)}</div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between gap-4 text-sm pt-1">
                        <div className="text-muted-foreground">Total Tax</div>
                        <div className="font-semibold tabular-nums">{money(taxCalc.totalTax)}</div>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-2 border-t">
                        <div className="text-sm text-muted-foreground">Final GRN Value</div>
                        <div className="text-xl font-bold tabular-nums">{money(taxCalc.grandTotal)}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-2">
                        Taxes are taken from the selected supplier (supports compound VAT on tax).
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">Final GRN Value</div>
                        <div className="text-xl font-bold tabular-nums">{money(subTotal)}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-2">
                        No taxes configured for this supplier.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.push("/inventory/grn")} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2" disabled={saving || loading}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                    Receive
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
