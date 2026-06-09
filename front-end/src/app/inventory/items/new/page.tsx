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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { 
  createPart, 
  fetchBrands, 
  fetchInventoryCollections, 
  fetchLocations, 
  fetchParts, 
  fetchSuppliers, 
  fetchUnits, 
  uploadPartImage, 
  fetchItemSections, 
  fetchItemDepartments, 
  fetchItemCategories, 
  type BrandRow, 
  type ServiceLocation, 
  type SupplierRow, 
  type UnitRow, 
  type ItemSection, 
  type ItemDepartment, 
  type ItemCategory 
} from "@/lib/api";
import { 
  ArrowLeft, ChevronDown, LayoutGrid, Image as ImageIcon, Loader2, Plus, Sparkles, Upload, 
  Globe, Info, Settings, Package, Truck, ListTree, XCircle, Users
} from "lucide-react";

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
    reorder_level: "0",
    is_active: true,
    is_fifo: false,
    is_expiry: false,
    item_type: "Part" as "Part" | "Service",
    recipe_type: "Standard" as "Standard" | "A La Carte" | "Recipe" | "Buffet",
    default_location_id: "none",
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
    is_online: true,
    out_of_stock: false,
    public_description: "",
    discount_type: "None",
    discount_value: "0",
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
          fetchUnits("").catch(() => []), 
          fetchBrands("").catch(() => []), 
          fetchSuppliers("").catch(() => []),
          fetchInventoryCollections().catch(() => []),
          fetchLocations().catch(() => []),
          fetchItemSections().catch(() => []),
          fetchItemDepartments().catch(() => []),
          fetchItemCategories().catch(() => [])
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

      const res = await createPart({
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
        reorder_level: asNumOrNull(form.reorder_level) ?? 0,
        is_active: form.is_active ? 1 : 0,
        is_fifo: form.is_fifo ? 1 : 0,
        is_expiry: form.is_expiry ? 1 : 0,
        image_filename,
        item_type: form.item_type,
        recipe_type: form.recipe_type,
        default_location_id: (form.default_location_id && form.default_location_id !== "none") ? Number(form.default_location_id) : null,
        allowed_locations: allowedLocationIds.length > 0 ? allowedLocationIds.join(",") : null,
        net_weight_kg: asNumOrNull(form.net_weight_kg),
        gross_weight_kg: asNumOrNull(form.gross_weight_kg),
        units_per_carton: asNumOrNull(form.units_per_carton) || 1,
        packing_type: form.packing_type,
        carton_length_cm: asNumOrNull(form.carton_length_cm),
        carton_width_cm: asNumOrNull(form.carton_width_cm),
        carton_height_cm: asNumOrNull(form.carton_height_cm),
        volume_cbm: asNumOrNull(form.volume_cbm) || (parseFloat(form.carton_length_cm) * parseFloat(form.carton_width_cm) * parseFloat(form.carton_height_cm) / 1000000) || null,
        carton_tare_weight_kg: asNumOrNull(form.carton_tare_weight_kg),
        hs_code: (form.hs_code || "").trim() || null,
        item_section_id: form.item_section_id ? parseInt(form.item_section_id) : null,
        item_department_id: form.item_department_id ? parseInt(form.item_department_id) : null,
        item_category_id: form.item_category_id ? parseInt(form.item_category_id) : null,
        is_online: form.is_online ? 1 : 0,
        out_of_stock: form.out_of_stock ? 1 : 0,
        public_description: form.public_description.trim() || null,
        discount_type: form.discount_type,
        discount_value: asNumOrNull(form.discount_value) ?? 0,
      });

      toast({ title: "Created", description: "Product created successfully." });
      
      // Redirect to the newly created product detail page so they can manage gallery & attributes!
      if (res?.status === "success" && res?.data?.id) {
        router.push(`/inventory/items/${res.data.id}`);
      } else {
        router.push("/inventory/items");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Create failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const imagePreviewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">New Product</h1>
              <p className="text-muted-foreground mt-1">Create a physical product or catalog service</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/inventory/items")} disabled={saving}>
              Cancel
            </Button>
            <Button className="gap-2" onClick={() => void save()} disabled={!canSave || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Product
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span className="text-lg font-medium">Loading form assets...</span>
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full flex justify-start h-auto p-1 bg-muted/30 border overflow-x-auto no-scrollbar">
              <TabsTrigger value="general" className="gap-2 py-2.5 px-4"><Info className="w-4 h-4" /> General</TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2 py-2.5 px-4"><Package className="w-4 h-4" /> Inventory</TabsTrigger>
              <TabsTrigger value="shipping" className="gap-2 py-2.5 px-4"><Truck className="w-4 h-4" /> Shipping</TabsTrigger>
              <TabsTrigger value="ecommerce" className="gap-2 py-2.5 px-4 text-primary font-bold"><Globe className="w-4 h-4" /> E-Commerce</TabsTrigger>
              <TabsTrigger value="gallery" disabled className="gap-2 py-2.5 px-4 opacity-50 cursor-not-allowed"><ImageIcon className="w-4 h-4" /> Gallery <span className="text-[9px] font-normal italic opacity-60 ml-0.5">(After creation)</span></TabsTrigger>
              <TabsTrigger value="attributes" disabled className="gap-2 py-2.5 px-4 opacity-50 cursor-not-allowed"><ListTree className="w-4 h-4" /> Attributes <span className="text-[9px] font-normal italic opacity-60 ml-0.5">(After creation)</span></TabsTrigger>
            </TabsList>

            {/* GENERAL TAB */}
            <TabsContent value="general" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Card: Image & Status */}
                <Card className="lg:col-span-4 shadow-sm border-none bg-muted/5">
                  <CardHeader>
                    <CardTitle className="text-base">Thumbnail</CardTitle>
                    <CardDescription>Main product image for listings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-[240px] rounded-xl border-2 border-dashed bg-background overflow-hidden flex items-center justify-center group relative">
                      {imagePreviewUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagePreviewUrl} alt="" className="h-full w-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button variant="secondary" size="sm" onClick={() => document.getElementById("part-image-file")?.click()}>Change</Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-3">
                          <ImageIcon className="w-10 h-10 opacity-20" />
                          <div className="text-sm font-medium">No Image Selected</div>
                          <Button variant="outline" size="sm" onClick={() => document.getElementById("part-image-file")?.click()}>Upload File</Button>
                        </div>
                      )}
                    </div>
                    <input
                      id="part-image-file"
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setImageFile(f);
                      }}
                    />
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                        <span className="text-sm font-medium">{form.is_active ? 'Active' : 'Inactive'}</span>
                        <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right Card: Core Information */}
                <Card className="lg:col-span-8 shadow-sm border-none bg-muted/5">
                  <CardHeader>
                    <CardTitle className="text-base">Core Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 col-span-full">
                      <Label>Product Name</Label>
                      <Input className="text-lg font-bold" value={form.part_name} onChange={(e) => setForm((p) => ({ ...p, part_name: e.target.value }))} required placeholder="e.g. Brake Pads" />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <div className="flex gap-2">
                        <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder="Optional SKU code..." />
                        <Button variant="outline" size="icon" onClick={() => setForm((p) => ({ ...p, sku: generateSku() }))} disabled={saving}>
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </div>
                      {skuTaken ? <div className="text-xs text-destructive mt-0.5">SKU already exists</div> : null}
                    </div>
                    <div className="space-y-2">
                      <Label>Part Number</Label>
                      <Input value={form.part_number} onChange={(e) => setForm((p) => ({ ...p, part_number: e.target.value }))} placeholder="Optional part number..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <SearchableSelect
                        value={form.brand_id}
                        onValueChange={(v) => setForm((p) => ({ ...p, brand_id: v }))}
                        options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
                        placeholder="Select brand..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Barcode</Label>
                      <Input value={form.barcode_number} onChange={(e) => setForm((p) => ({ ...p, barcode_number: e.target.value }))} placeholder="Optional barcode number..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Collections (for POS)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-10">
                            <span className="truncate">
                              {collectionIds.length === 0 ? "Select collections..." : `${collectionIds.length} selected`}
                            </span>
                            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-3" align="start">
                          <div className="space-y-2">
                            <Input 
                              placeholder="Search collections..." 
                              value={collectionQuery} 
                              onChange={(e) => setCollectionQuery(e.target.value)} 
                              className="h-8 text-sm"
                            />
                            <ScrollArea className="h-[200px] pr-2">
                              <div className="space-y-2">
                                {collections
                                  .filter((c) => (c.name ?? "").toLowerCase().includes(collectionQuery.trim().toLowerCase()))
                                  .map((c) => {
                                    const cid = Number(c.id);
                                    const checked = collectionIds.includes(cid);
                                    return (
                                      <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer select-none hover:bg-muted/50 p-1 rounded transition-colors">
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
                                        <span className="truncate flex-1">{c.name}</span>
                                      </label>
                                    );
                                  })}
                                {collections.length === 0 ? (
                                  <div className="text-xs text-muted-foreground py-4 text-center">No collections found</div>
                                ) : null}
                              </div>
                            </ScrollArea>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Item Type</Label>
                      <Select value={form.item_type} onValueChange={(v: any) => setForm((p) => ({ ...p, item_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Part">Product (Physical)</SelectItem>
                          <SelectItem value="Service">Service (Labor)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Unit of Measure</Label>
                      <Select value={form.unit} onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select unit..." /></SelectTrigger>
                        <SelectContent>
                          {units.map((u) => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-full border-t pt-4">
                      <Label className="flex items-center gap-2 font-medium">
                        <Users className="w-4 h-4 text-muted-foreground" /> Associated Suppliers
                      </Label>
                      <div className="rounded-xl border bg-background p-4 space-y-3">
                        <Input 
                          placeholder="Search suppliers..." 
                          value={supplierQuery} 
                          onChange={(e) => setSupplierQuery(e.target.value)} 
                          className="h-8 text-sm"
                        />
                        <ScrollArea className="h-[140px] pr-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {suppliers
                              .filter((s) => (s.name ?? "").toLowerCase().includes(supplierQuery.trim().toLowerCase()))
                              .map((s) => {
                                const sid = Number(s.id);
                                const checked = supplierIds.includes(sid);
                                return (
                                  <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer select-none hover:bg-muted/50 p-2 rounded-md transition-colors border border-muted-foreground/5 bg-muted/5">
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
                                    <span className="truncate flex-1 font-medium">{s.name}</span>
                                  </label>
                                );
                              })}
                            {suppliers.length === 0 ? (
                               <div className="text-xs text-muted-foreground py-4 text-center col-span-full">No suppliers found</div>
                            ) : null}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-5 border-t pt-5 mt-2">
                      <div className="space-y-2">
                        <Label>Cost Price</Label>
                        <Input type="number" placeholder="0.00" value={form.cost_price} onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-primary font-bold">Selling Price</Label>
                        <Input className="border-primary/30 bg-primary/5 font-bold" type="number" placeholder="0.00" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Wholesale Price</Label>
                        <Input type="number" placeholder="0.00" value={form.wholesale_price} onChange={(e) => setForm((p) => ({ ...p, wholesale_price: e.target.value }))} />
                      </div>
                    </div>

                    <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-5 border-t pt-5 mt-2">
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
                              {departments.filter(d => !form.item_section_id || String(d.section_id) === String(form.item_section_id)).map(d => (
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
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <Card className="shadow-sm border-none bg-muted/5">
                  <CardHeader>
                    <CardTitle className="text-base">Stock Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label>Reorder Level</Label>
                          <Input type="number" value={form.reorder_level} onChange={(e) => setForm((p) => ({ ...p, reorder_level: e.target.value }))} />
                       </div>
                       <div className="space-y-2">
                          <Label>Recipe Type</Label>
                          <Select value={form.recipe_type} onValueChange={(v: any) => setForm((p) => ({ ...p, recipe_type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard">Standard</SelectItem>
                              <SelectItem value="A La Carte">A La Carte</SelectItem>
                              <SelectItem value="Recipe">Recipe</SelectItem>
                              <SelectItem value="Buffet">Buffet</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                      <div className="space-y-0.5">
                        <Label>FIFO Tracking</Label>
                        <p className="text-xs text-muted-foreground">Force oldest batch usage first</p>
                      </div>
                      <Switch checked={form.is_fifo} onCheckedChange={(v) => setForm((p) => ({ ...p, is_fifo: v }))} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                      <div className="space-y-0.5">
                        <Label>Track Expiry</Label>
                        <p className="text-xs text-muted-foreground">Capture dates during receiving</p>
                      </div>
                      <Switch checked={form.is_expiry} onCheckedChange={(v) => setForm((p) => ({ ...p, is_expiry: v }))} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-muted/5">
                  <CardHeader>
                    <CardTitle className="text-base">Location Mapping</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default Location</Label>
                      <Select value={form.default_location_id} onValueChange={(v) => setForm((p) => ({ ...p, default_location_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select location..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Inherit from Context</SelectItem>
                          {locations.map((loc) => <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label>Restricted Locations</Label>
                      <div className="rounded-xl border bg-background p-4 grid grid-cols-2 gap-3 max-h-[180px] overflow-y-auto">
                        {locations.map((loc) => (
                          <label key={loc.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 p-1 rounded transition-colors">
                            <Checkbox 
                              checked={allowedLocationIds.includes(loc.id)} 
                              onCheckedChange={(v) => setAllowedLocationIds(prev => v ? [...prev, loc.id] : prev.filter(id => id !== loc.id))} 
                            />
                            {loc.name}
                          </label>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Leave all unchecked to allow across all branches.</p>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* SHIPPING TAB */}
            <TabsContent value="shipping" className="mt-6 space-y-6">
              <Card className="shadow-sm border-none bg-muted/5">
                <CardHeader>
                  <CardTitle className="text-base">Shipping & Packing Defaults</CardTitle>
                  <CardDescription>Logistics and warehouse dimensions (Physical products only)</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* E-COMMERCE TAB */}
            <TabsContent value="ecommerce" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-4 space-y-6">
                  <Card className="shadow-sm border-none bg-primary/5 border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                         <Globe className="w-4 h-4 text-primary" /> Visibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-background shadow-sm border border-primary/10">
                        <div className="space-y-1">
                          <Label className="text-base">Online Store</Label>
                          <p className="text-xs text-muted-foreground">Show in external storefronts</p>
                        </div>
                        <Switch checked={form.is_online} onCheckedChange={(v) => setForm(p => ({ ...p, is_online: v }))} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-background shadow-sm border border-destructive/10">
                        <div className="space-y-1">
                          <Label className="text-base">Out of Stock</Label>
                          <p className="text-xs text-muted-foreground">Force out of stock status</p>
                        </div>
                        <Switch checked={form.out_of_stock} onCheckedChange={(v) => setForm(p => ({ ...p, out_of_stock: v }))} />
                      </div>
                      
                      <div className="space-y-2 pt-4">
                        <Label>URL Slug</Label>
                        <p className="text-xs text-muted-foreground mb-2">SEO identifier (leave blank to auto-generate)</p>
                        <div className="flex gap-2">
                          <Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="e.g. classic-earl-grey" />
                          <Button 
                            type="button"
                            variant="outline" 
                            size="icon"
                            onClick={() => setForm(p => ({ 
                              ...p, 
                              slug: p.part_name.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') 
                            }))}
                            title="Regenerate from Name"
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-none bg-amber-500/5 border-l-4 border-l-amber-500">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                         <Sparkles className="w-4 h-4" /> Pricing & Discount
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="space-y-2">
                          <Label>Discount Type</Label>
                          <Select value={form.discount_type} onValueChange={(v: any) => setForm(p => ({ ...p, discount_type: v }))}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="None">No Discount</SelectItem>
                                <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                <SelectItem value="Fixed">Fixed Amount</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       
                       {form.discount_type !== "None" && (
                         <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <Label>{form.discount_type === "Percentage" ? "Discount Percentage (%)" : "Discount Amount"}</Label>
                            <Input 
                              type="number" 
                              value={form.discount_value} 
                              onChange={(e) => setForm(p => ({ ...p, discount_value: e.target.value }))}
                              placeholder={form.discount_type === "Percentage" ? "e.g. 10" : "e.g. 500"}
                            />
                         </div>
                       )}

                       <div className="p-3 rounded-lg bg-background border border-amber-200/50 mt-4">
                          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Final Storefront Price</div>
                          <div className="text-xl font-bold text-amber-600">
                             LKR {(() => {
                               const base = parseFloat(form.price) || 0;
                               const val = parseFloat(form.discount_value) || 0;
                               if (form.discount_type === "Percentage") return (base * (1 - val / 100)).toLocaleString();
                               if (form.discount_type === "Fixed") return (base - val).toLocaleString();
                               return base.toLocaleString();
                             })()}
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-8">
                  <Card className="shadow-sm border-none bg-muted/5 h-full">
                    <CardHeader>
                      <CardTitle className="text-base">Storefront Descriptions</CardTitle>
                      <CardDescription>Rich public descriptions for e-commerce listings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Public Description</Label>
                        <Textarea 
                          className="min-h-[300px] font-mono text-sm leading-relaxed" 
                          placeholder="Write storefront listing details here..." 
                          value={form.public_description}
                          onChange={(e) => setForm(p => ({ ...p, public_description: e.target.value }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </TabsContent>

          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
