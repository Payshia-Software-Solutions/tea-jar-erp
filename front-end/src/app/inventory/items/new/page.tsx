"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createPart, fetchBrands, fetchInventoryCollections, fetchLocations, fetchParts, fetchSuppliers, fetchUnits, uploadPartImage, fetchItemSections, fetchItemDepartments, fetchItemCategories, type BrandRow, type ServiceLocation, type SupplierRow, type UnitRow, type ItemSection, type ItemDepartment, type ItemCategory } from "@/lib/api";
import { ArrowLeft, ChevronDown, LayoutGrid, Loader2, Plus, Sparkles, Upload } from "lucide-react";

function asNumOrNull(v: any) {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function generateSku() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  let rand = "";
  try {
    const bytes = new Uint8Array(3);
    globalThis.crypto.getRandomValues(bytes);
    rand = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  } catch {
    rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  }
  return `SKU-${ymd}-${rand}`;
}

export default function NewItemPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [units, setUnits] = useState<UnitRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [sections, setSections] = useState<ItemSection[]>([]);
  const [departments, setDepartments] = useState<ItemDepartment[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sku: "",
    slug: "",
    part_number: "",
    barcode_number: "",
    part_name: "",
    unit: "",
    brand_id: "",
    cost_price: "",
    price: "",
    wholesale_price: "",
    min_selling_price: "",
    price_2: "",
    reorder_level: "",
    is_active: true,
    is_fifo: false,
    is_expiry: false,
    item_type: "Part" as "Part" | "Service",
    recipe_type: "Standard" as "Standard" | "A La Carte" | "Recipe",
    default_location_id: "",
    net_weight_kg: "",
    gross_weight_kg: "",
    units_per_carton: "1",
    packing_type: "Carton",
    carton_length_cm: "",
    carton_width_cm: "",
    carton_height_cm: "",
    volume_cbm: "",
    carton_tare_weight_kg: "",
    hs_code: "",
    item_section_id: "",
    item_department_id: "",
    item_category_id: "",
  });

  const [supplierIds, setSupplierIds] = useState<number[]>([]);
  const [collectionIds, setCollectionIds] = useState<number[]>([]);
  const [allowedLocationIds, setAllowedLocationIds] = useState<number[]>([]);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [collectionQuery, setCollectionQuery] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [skuTaken, setSkuTaken] = useState(false);
  const lastSkuCheck = useRef<string>("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [u, b, s, c, locationsRes, sRes, dRes, cRes] = await Promise.all([
          fetchUnits(""), 
          fetchBrands(""), 
          fetchSuppliers(""),
          fetchInventoryCollections(),
          fetchLocations(),
          fetchItemSections(),
          fetchItemDepartments(),
          fetchItemCategories()
        ]);
        setUnits(Array.isArray(u) ? u : []);
        setBrands(Array.isArray(b) ? b : []);
        setSuppliers(Array.isArray(s) ? s : []);
        setCollections(Array.isArray(c) ? c : []);
        setLocations(Array.isArray(locationsRes) ? locationsRes : []);
        setSections(Array.isArray(sRes) ? sRes : []);
        setDepartments(Array.isArray(dRes) ? dRes : []);
        setCategories(Array.isArray(cRes) ? cRes : []);
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load master data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const sku = form.sku.trim();
    if (!sku) {
      setSkuTaken(false);
      return;
    }
    if (sku === lastSkuCheck.current) return;
    lastSkuCheck.current = sku;
    void (async () => {
      try {
        const parts = await fetchParts(sku);
        const taken = Array.isArray(parts) ? parts.some((p: any) => String(p.sku || "").toLowerCase() === sku.toLowerCase()) : false;
        setSkuTaken(taken);
      } catch {
        setSkuTaken(false);
      }
    })();
  }, [form.sku]);

  const canSave = useMemo(() => {
    const nameOk = form.part_name.trim().length > 0;
    const priceOk = asNumOrNull(form.price) !== null;
    return nameOk && priceOk && !skuTaken;
  }, [form, skuTaken]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      let image_filename: string | null = null;
      if (imageFile) {
        const up = await uploadPartImage(imageFile);
        if (up.status !== "success") throw new Error(up.message || "Image upload failed");
        image_filename = up.data.filename;
      }

      await createPart({
        sku: (form.sku || "").trim() ? form.sku.trim() : null,
        slug: (form.slug || "").trim() ? form.slug.trim() : null,
        part_number: (form.part_number || "").trim() ? form.part_number.trim() : null,
        barcode_number: (form.barcode_number || "").trim() ? form.barcode_number.trim() : null,
        part_name: (form.part_name || "").trim(),
        unit: (form.unit || "").trim() ? form.unit.trim() : null,
        brand_id: (form.brand_id || "").trim() ? Number(form.brand_id) : null,
        supplier_ids: supplierIds,
        collection_ids: collectionIds,
        stock_quantity: 0,
        cost_price: asNumOrNull(form.cost_price),
        price: asNumOrNull(form.price) ?? 0,
        wholesale_price: asNumOrNull(form.wholesale_price),
        min_selling_price: asNumOrNull(form.min_selling_price),
        price_2: asNumOrNull(form.price_2),
        reorder_level: asNumOrNull(form.reorder_level),
        is_active: form.is_active ? 1 : 0,
        is_fifo: form.is_fifo ? 1 : 0,
        is_expiry: form.is_expiry ? 1 : 0,
        image_filename,
        item_type: form.item_type,
        recipe_type: form.recipe_type,
        default_location_id: (form.default_location_id && form.default_location_id !== "none") ? Number(form.default_location_id) : null,
        allowed_locations: JSON.stringify(allowedLocationIds),
        net_weight_kg: asNumOrNull(form.net_weight_kg),
        gross_weight_kg: asNumOrNull(form.gross_weight_kg),
        units_per_carton: asNumOrNull(form.units_per_carton) || 1,
        packing_type: form.packing_type,
        carton_length_cm: asNumOrNull(form.carton_length_cm),
        carton_width_cm: asNumOrNull(form.carton_width_cm),
        carton_height_cm: asNumOrNull(form.carton_height_cm),
        volume_cbm: asNumOrNull(form.volume_cbm),
        carton_tare_weight_kg: asNumOrNull(form.carton_tare_weight_kg),
        hs_code: (form.hs_code || "").trim() || null,
        item_section_id: form.item_section_id ? parseInt(form.item_section_id) : null,
        item_department_id: form.item_department_id ? parseInt(form.item_department_id) : null,
        item_category_id: form.item_category_id ? parseInt(form.item_category_id) : null,
      });

      toast({ title: "Created", description: "Product created" });
      router.push("/inventory/items");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Create failed", variant: "destructive" });
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">New Product</h1>
              <p className="text-muted-foreground mt-1">Create an item with unit, pricing and image</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/inventory/items">All Products</Link>
          </Button>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Required: Name and Selling price</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Item Type</Label>
                    <Select value={form.item_type} onValueChange={(v: any) => setForm((p) => ({ ...p, item_type: v }))}>
                      <SelectTrigger className="font-bold border-amber-200 bg-amber-50/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Part" className="font-bold">Part (Physical Goods)</SelectItem>
                        <SelectItem value="Service" className="font-bold">Service (Labor/Fee)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipe Type</Label>
                    <Select value={form.recipe_type} onValueChange={(v: any) => setForm((p) => ({ ...p, recipe_type: v }))}>
                      <SelectTrigger className="font-bold border-blue-200 bg-blue-50/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard" className="font-bold">Standard (GRN & Sell)</SelectItem>
                        <SelectItem value="A La Carte" className="font-bold">A La Carte (Needs BOM)</SelectItem>
                        <SelectItem value="Recipe" className="font-bold">Recipe (Needs BOM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Stock Location</Label>
                    <Select value={form.default_location_id} onValueChange={(v) => setForm((p) => ({ ...p, default_location_id: v }))}>
                      <SelectTrigger className="font-bold border-green-200 bg-green-50/30">
                        <SelectValue placeholder="Select location..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="italic">Inherit from Invoice/POS</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={String(loc.id)}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-[10px] text-muted-foreground -mt-1 line-clamp-2 italic">A La Carte items will ALWAYS deduct ingredients from this location.</div>
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <div className="flex gap-2">
                      <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 shrink-0"
                        onClick={() => setForm((p) => ({ ...p, sku: generateSku() }))}
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </Button>
                    </div>
                    {skuTaken ? <div className="text-xs text-destructive">SKU already exists</div> : null}
                    <div className="text-[11px] text-muted-foreground">Optional</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Part Number</Label>
                    <Input value={form.part_number} onChange={(e) => setForm((p) => ({ ...p, part_number: e.target.value }))} />
                    <div className="text-[11px] text-muted-foreground">Optional</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Barcode</Label>
                    <Input value={form.barcode_number} onChange={(e) => setForm((p) => ({ ...p, barcode_number: e.target.value }))} />
                    <div className="text-[11px] text-muted-foreground">Optional</div>
                  </div>
	                  <div className="space-y-2">
	                    <Label>Name</Label>
	                    <Input value={form.part_name} onChange={(e) => setForm((p) => ({ ...p, part_name: e.target.value }))} required />
	                  </div>
	                  <div className="space-y-2">
	                    <Label>URL Slug</Label>
                      <div className="flex gap-2">
	                      <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="e.g. classic-earl-grey" />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="icon"
                          className="shrink-0"
                          onClick={() => setForm(p => ({ 
                            ...p, 
                            slug: p.part_name.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') 
                          }))}
                          title="Regenerate from Name"
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-[11px] text-muted-foreground">Optional. Auto-generated if left blank.</div>
	                  </div>
	                  <div className="space-y-2">
	                    <Label>Brand</Label>
	                    <Select value={form.brand_id} onValueChange={(v) => setForm((p) => ({ ...p, brand_id: v }))}>
	                      <SelectTrigger>
	                        <SelectValue placeholder="Select brand..." />
	                      </SelectTrigger>
	                      <SelectContent className="max-h-[280px]">
	                        {brands.map((b) => (
	                          <SelectItem key={b.id} value={String(b.id)}>
	                            {b.name}
	                          </SelectItem>
	                        ))}
	                      </SelectContent>
	                    </Select>
	                    <div className="text-[11px] text-muted-foreground">
	                      Manage brands in <Link className="underline" href="/master-data/brands">Master Data → Brands</Link>
	                    </div>
	                  </div>
	                  <div className="space-y-2">
	                    <Label>Unit</Label>
	                    <Select value={form.unit} onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}>
	                      <SelectTrigger>
                        <SelectValue placeholder="Select unit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.name}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-[11px] text-muted-foreground">
                      Manage units in <Link className="underline" href="/master-data/units">Master Data → Units</Link>
                    </div>
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label>Suppliers</Label>
                    <div className="rounded-md border p-4 bg-muted/5 space-y-3">
                      <Input 
                        placeholder="Search suppliers..." 
                        value={supplierQuery} 
                        onChange={(e) => setSupplierQuery(e.target.value)} 
                        className="h-8 text-sm"
                      />
                      <ScrollArea className="h-[120px] pr-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {suppliers
                            .filter((s) => (s.name ?? "").toLowerCase().includes(supplierQuery.trim().toLowerCase()))
                            .map((s) => {
                              const sid = Number(s.id);
                              const checked = supplierIds.includes(sid);
                              return (
                                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer select-none hover:bg-muted/50 p-1.5 rounded-sm transition-colors border border-transparent hover:border-muted-foreground/20">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) => {
                                      setSupplierIds((prev) => {
                                        const next = new Set(prev);
                                        if (v) next.add(sid);
                                        else next.delete(sid);
                                        return Array.from(next).sort((a, b) => a - b);
                                      });
                                    }}
                                  />
                                  <span className="truncate flex-1">{s.name}</span>
                                </label>
                              );
                            })}
                          {suppliers.length === 0 ? (
                            <div className="text-xs text-muted-foreground py-4 text-center col-span-full">No suppliers found</div>
                          ) : null}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Select multiple suppliers for this product.</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Collections</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between">
                          <span className="truncate">
                            {collectionIds.length === 0 ? "Select collections..." : `${collectionIds.length} selected`}
                          </span>
                          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-3" align="start">
                        <div className="space-y-2">
                          <Input placeholder="Search collections..." value={collectionQuery} onChange={(e) => setCollectionQuery(e.target.value)} />
                          <ScrollArea className="h-[240px] pr-2">
                            <div className="space-y-2">
                              {collections
                                .filter((c) => (c.name ?? "").toLowerCase().includes(collectionQuery.trim().toLowerCase()))
                                .map((c) => {
                                  const cid = Number(c.id);
                                  const checked = collectionIds.includes(cid);
                                  return (
                                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={(v) => {
                                          setCollectionIds((prev) => {
                                            const next = new Set(prev);
                                            if (v) next.add(cid);
                                            else next.delete(cid);
                                            return Array.from(next).sort((a, b) => a - b);
                                          });
                                        }}
                                      />
                                      <span className="truncate">{c.name}</span>
                                    </label>
                                  );
                                })}
                              {collections.length === 0 ? (
                                <div className="text-xs text-muted-foreground py-4 text-center">No collections</div>
                              ) : null}
                            </div>
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="text-[11px] text-muted-foreground">Group this product for POS filtering.</div>
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label>Allowed Stock Locations</Label>
                    <div className="rounded-md border p-4 bg-muted/5 space-y-2">
                      <ScrollArea className="h-[120px] pr-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {locations.map((loc) => {
                            const checked = allowedLocationIds.includes(loc.id);
                            return (
                              <label key={loc.id} className="flex items-center gap-2 text-sm cursor-pointer select-none hover:bg-muted/50 p-1.5 rounded-md transition-colors border border-transparent hover:border-muted-foreground/10">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    setAllowedLocationIds((prev) => {
                                      const next = new Set(prev);
                                      if (v) next.add(loc.id);
                                      else next.delete(loc.id);
                                      return Array.from(next).sort((a, b) => a - b);
                                    });
                                  }}
                                />
                                <span className="truncate flex-1 font-medium">{loc.name}</span>
                              </label>
                            );
                          })}
                          {locations.length === 0 ? (
                            <div className="text-xs text-muted-foreground py-4 text-center col-span-full italic">No locations configured</div>
                          ) : null}
                        </div>
                      </ScrollArea>
                      <div className="text-[11px] text-muted-foreground border-t pt-2">Limit which locations can sell this item. Leave empty for "All Locations".</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Active</Label>
                    <div className="h-11 flex items-center">
                      <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow FIFO</Label>
                    <div className="h-11 flex items-center">
                      <Switch checked={form.is_fifo} onCheckedChange={(v) => setForm((p) => ({ ...p, is_fifo: v }))} />
                    </div>
                    <div className="text-[10px] text-muted-foreground -mt-1 line-clamp-1">Track stock by oldest batch first</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Track Expiry</Label>
                    <div className="h-11 flex items-center">
                      <Switch checked={form.is_expiry} onCheckedChange={(v) => setForm((p) => ({ ...p, is_expiry: v }))} />
                    </div>
                    <div className="text-[10px] text-muted-foreground -mt-1 line-clamp-1">Capture Mfg/Expiry dates during GRN</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      inputMode="decimal" 
                      value={Number.isFinite(Number(form.cost_price)) ? Number(form.cost_price).toFixed(2) : "0.00"} 
                      onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      inputMode="decimal" 
                      value={form.price} 
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Wholesale Price</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      inputMode="decimal" 
                      value={form.wholesale_price} 
                      onChange={(e) => setForm((p) => ({ ...p, wholesale_price: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min. Selling Price</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      inputMode="decimal" 
                      value={form.min_selling_price} 
                      onChange={(e) => setForm((p) => ({ ...p, min_selling_price: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price 2 Option</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      inputMode="decimal" 
                      value={form.price_2} 
                      onChange={(e) => setForm((p) => ({ ...p, price_2: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reorder Level</Label>
                    <Input inputMode="numeric" value={form.reorder_level} onChange={(e) => setForm((p) => ({ ...p, reorder_level: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                    <div className="text-[11px] text-muted-foreground">Optional</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t pt-5 mt-2">
                   <div className="space-y-2">
                      <Label>Item Section</Label>
                      <Select value={form.item_section_id} onValueChange={(v) => setForm(p => ({ ...p, item_section_id: v, item_department_id: "" }))}>
                        <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                        <SelectContent>
                          {sections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>Item Department</Label>
                      <Select value={form.item_department_id} onValueChange={(v) => setForm(p => ({ ...p, item_department_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>
                          {departments.filter(d => !form.item_section_id || d.section_id === parseInt(form.item_section_id)).map(d => (
                            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>Item Category</Label>
                      <Select value={form.item_category_id} onValueChange={(v) => setForm(p => ({ ...p, item_category_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                </div>
                
                {form.item_type === "Part" && (
                  <>
                    <h3 className="font-semibold text-lg border-t pt-4 mt-2">Shipping & Packing Defaults</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Net Weight (kg)</Label>
                        <Input type="number" step="0.001" value={form.net_weight_kg} onChange={(e) => setForm(p => ({ ...p, net_weight_kg: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Gross Weight (kg)</Label>
                        <Input type="number" step="0.001" value={form.gross_weight_kg} onChange={(e) => setForm(p => ({ ...p, gross_weight_kg: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Units / Carton</Label>
                        <Input type="number" step="1" value={form.units_per_carton} onChange={(e) => setForm(p => ({ ...p, units_per_carton: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Packing Type</Label>
                        <Select value={form.packing_type} onValueChange={(v) => setForm(p => ({ ...p, packing_type: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Carton">Carton (Box)</SelectItem>
                            <SelectItem value="Pouch">Pouch / Packet</SelectItem>
                            <SelectItem value="Canister">Canister</SelectItem>
                            <SelectItem value="Drum">Drum / Barrel</SelectItem>
                            <SelectItem value="Bag">Bag / Sack</SelectItem>
                            <SelectItem value="Crate">Crate</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>HS Code (Tariff)</Label>
                        <Input value={form.hs_code} onChange={(e) => setForm(p => ({ ...p, hs_code: e.target.value }))} placeholder="e.g. 6109.10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Carton Tare Wt (kg)</Label>
                        <Input type="number" step="0.001" value={form.carton_tare_weight_kg} onChange={(e) => setForm(p => ({ ...p, carton_tare_weight_kg: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Length (cm)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={form.carton_length_cm} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(p => {
                              const next = { ...p, carton_length_cm: val };
                              const l = parseFloat(val) || 0;
                              const w = parseFloat(next.carton_width_cm) || 0;
                              const h = parseFloat(next.carton_height_cm) || 0;
                              const vol = (l * w * h) / 1000000;
                              if (vol > 0) next.volume_cbm = vol.toFixed(6);
                              return next;
                            });
                          }} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Width (cm)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={form.carton_width_cm} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(p => {
                              const next = { ...p, carton_width_cm: val };
                              const l = parseFloat(next.carton_length_cm) || 0;
                              const w = parseFloat(val) || 0;
                              const h = parseFloat(next.carton_height_cm) || 0;
                              const vol = (l * w * h) / 1000000;
                              if (vol > 0) next.volume_cbm = vol.toFixed(6);
                              return next;
                            });
                          }} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height (cm)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={form.carton_height_cm} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(p => {
                              const next = { ...p, carton_height_cm: val };
                              const l = parseFloat(next.carton_length_cm) || 0;
                              const w = parseFloat(next.carton_width_cm) || 0;
                              const h = parseFloat(val) || 0;
                              const vol = (l * w * h) / 1000000;
                              if (vol > 0) next.volume_cbm = vol.toFixed(6);
                              return next;
                            });
                          }} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Volume (CBM)</Label>
                        <Input type="number" step="0.000001" value={form.volume_cbm} onChange={(e) => setForm(p => ({ ...p, volume_cbm: e.target.value }))} />
                        <p className="text-[10px] text-muted-foreground">Manual override or calculated</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => router.push("/inventory/items")} disabled={saving}>
                    Cancel
                  </Button>
                  <Button className="gap-2" onClick={() => void save()} disabled={!canSave || saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
