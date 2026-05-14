"use client";
// Force rebuild 2026-05-07


import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  api,
  contentUrl,
  deletePart,
  fetchBrands,
  fetchInventoryCollections,
  fetchLocations,
  fetchPart,
  fetchSuppliers,
  fetchUnits,
  fetchPackagingTypes,
  uploadPartImage,
  uploadPartGalleryImage,
  deletePartGalleryImage,
  updatePartGallery,
  fetchAttributeGroups,
  assignAttributeGroupToPart,
  unassignAttributeGroupFromPart,
  fetchItemSections,
  fetchItemDepartments,
  fetchItemCategories,
  type BrandRow,
  type ServiceLocation,
  type SupplierRow,
  type UnitRow,
  type PackagingType,
  type ItemSection,
  type ItemDepartment,
  type ItemCategory
} from "@/lib/api";
import { 
  ArrowLeft, ChevronDown, LayoutGrid, Image as ImageIcon, Loader2, Save, Sparkles, Trash2, Upload, 
  Globe, Info, Settings, Package, Truck, ListTree, PlusCircle, XCircle, Plus, LogOut,
  Coffee, Droplets, Thermometer, Clock, Users, ShoppingBag
} from "lucide-react";

function asNumOrNull(v: any) {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function generateSku() {
  return "ITM-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

export default function ItemDetailPage() {
  console.log("ItemDetailPage render");
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [part, setPart] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);

  const [units, setUnits] = useState<UnitRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [sections, setSections] = useState<ItemSection[]>([]);
  const [departments, setDepartments] = useState<ItemDepartment[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);

  const [form, setForm] = useState({
    part_name: "",
    slug: "",
    sku: "",
    part_number: "",
    barcode_number: "",
    unit: "",
    brand_id: "",
    cost_price: "",
    price: "",
    reorder_level: "0",
    is_active: true,
    is_fifo: false,
    is_expiry: false,
    item_type: "Part",
    recipe_type: "Standard",
    default_location_id: "none",
    wholesale_price: "",
    min_selling_price: "",
    price_2: "",
    net_weight_kg: "",
    gross_weight_kg: "",
    units_per_carton: "1",
    carton_length_cm: "",
    carton_width_cm: "",
    carton_height_cm: "",
    carton_tare_weight_kg: "",
    hs_code: "",
    packing_type: "Carton",
    is_online: true,
    out_of_stock: false,
    public_description: "",
    item_section_id: "",
    item_department_id: "",
    item_category_id: "",
    discount_type: "None",
    discount_value: "0",
  });

  const [attrGroups, setAttrGroups] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [attrValues, setAttrValues] = useState<Record<number, string>>({});
  const [gallery, setGallery] = useState<any[]>([]);

  const [supplierIds, setSupplierIds] = useState<number[]>([]);
  const [collectionIds, setCollectionIds] = useState<number[]>([]);
  const [allowedLocationIds, setAllowedLocationIds] = useState<number[]>([]);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [collectionQuery, setCollectionQuery] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const loadData = async () => {
        // Use individual catch blocks to ensure one failing call doesn't block everything
        const [p, u, b, s, c, locationsRes, batchesRes, attrRes, pkgsRes, sectionsRes, deptsRes, catsRes] = await Promise.all([
          fetchPart(String(id)),
          fetchUnits("").catch(() => []),
          fetchBrands("").catch(() => []),
          fetchSuppliers("").catch(() => []),
          fetchInventoryCollections().catch(() => []),
          fetchLocations().catch(() => []),
          api(`/api/part/batches/${id}`).then(res => res.ok ? res.json() : []).catch(() => []),
          fetchAttributeGroups().catch(() => []),
          fetchPackagingTypes().catch(() => []),
          fetchItemSections().catch(() => []),
          fetchItemDepartments().catch(() => []),
          fetchItemCategories().catch(() => [])
        ]);

        if (p?.status === 'error') {
           setError(p.message || "Failed to load product");
           setLoading(false);
           return;
        }

        setPart(p);
        setGallery(p?.gallery || []);
        setAllGroups(attrRes || []);
        
        // Use grouped attributes from part data (includes values)
        const grouped = p?.attributes_grouped || [];
        setAttrGroups(grouped);
        
        // Initialize attribute values from part data
        const initialAttrs: Record<number, string> = {};
        if (p?.attributes_grouped) {
          p.attributes_grouped.forEach((g: any) => {
            g.attributes.forEach((a: any) => {
              if (a.value !== null) initialAttrs[a.id] = String(a.value);
            });
          });
        }
        setAttrValues(initialAttrs);
        setBatches(batchesRes?.status === 'success' ? batchesRes.data : (Array.isArray(batchesRes) ? batchesRes : []));
        setUnits(Array.isArray(u) ? u : []);
        setBrands(Array.isArray(b) ? b : []);
        setSuppliers(Array.isArray(s) ? s : []);
        setCollections(Array.isArray(c) ? c : []);
        setLocations(Array.isArray(locationsRes) ? locationsRes : []);
        setPackagingTypes(pkgsRes?.status === 'success' ? pkgsRes.data : (Array.isArray(pkgsRes) ? pkgsRes : []));
        setSections(Array.isArray(sectionsRes) ? sectionsRes : []);
        setDepartments(Array.isArray(deptsRes) ? deptsRes : []);
        setCategories(Array.isArray(catsRes) ? catsRes : []);

        if (p) {
          setForm({
            part_name: p.part_name || "",
            slug: p.slug || "",
            sku: p.sku || "",
            part_number: p.part_number || "",
            barcode_number: p.barcode_number || "",
            unit: p.unit || "",
            brand_id: p.brand_id ? String(p.brand_id) : "",
            cost_price: p.cost_price !== null && p.cost_price !== undefined ? String(p.cost_price) : "",
            price: p.price !== null && p.price !== undefined ? String(p.price) : "",
            reorder_level: p.reorder_level !== null && p.reorder_level !== undefined ? String(p.reorder_level) : "0",
            is_active: Boolean(p.is_active),
            is_fifo: Boolean(p.is_fifo),
            is_expiry: Boolean(p.is_expiry),
            item_type: p.item_type || "Part",
            recipe_type: p.recipe_type || "Standard",
            default_location_id: p.default_location_id ? String(p.default_location_id) : "none",
            wholesale_price: p.wholesale_price !== null && p.wholesale_price !== undefined ? String(p.wholesale_price) : "",
            min_selling_price: p.min_selling_price !== null && p.min_selling_price !== undefined ? String(p.min_selling_price) : "",
            price_2: p.price_2 !== null && p.price_2 !== undefined ? String(p.price_2) : "",
            net_weight_kg: p.net_weight_kg !== null && p.net_weight_kg !== undefined ? String(p.net_weight_kg) : "",
            gross_weight_kg: p.gross_weight_kg !== null && p.gross_weight_kg !== undefined ? String(p.gross_weight_kg) : "",
            units_per_carton: p.units_per_carton !== null && p.units_per_carton !== undefined ? String(p.units_per_carton) : "1",
            carton_length_cm: p.carton_length_cm !== null && p.carton_length_cm !== undefined ? String(p.carton_length_cm) : "",
            carton_width_cm: p.carton_width_cm !== null && p.carton_width_cm !== undefined ? String(p.carton_width_cm) : "",
            carton_height_cm: p.carton_height_cm !== null && p.carton_height_cm !== undefined ? String(p.carton_height_cm) : "",
            carton_tare_weight_kg: p.carton_tare_weight_kg !== null && p.carton_tare_weight_kg !== undefined ? String(p.carton_tare_weight_kg) : "",
            hs_code: p.hs_code ?? "",
            packing_type: p.packing_type ?? "Carton",
            is_online: p.is_online !== undefined ? Boolean(p.is_online) : true,
            out_of_stock: p.out_of_stock !== undefined ? Boolean(p.out_of_stock) : false,
            public_description: p.public_description ?? "",
            item_section_id: p.item_section_id ? String(p.item_section_id) : "",
            item_department_id: p.item_department_id ? String(p.item_department_id) : "",
            item_category_id: p.item_category_id ? String(p.item_category_id) : "",
            discount_type: p.discount_type || "None",
            discount_value: p.discount_value !== null && p.discount_value !== undefined ? String(p.discount_value) : "0",
          });
          const sIds = Array.isArray(p.supplier_ids) ? p.supplier_ids.map(Number) : [];
          setSupplierIds(sIds);
          const cIds = Array.isArray(p.collection_ids) ? p.collection_ids.map(Number) : [];
          setCollectionIds(cIds);
          const aLocs = p.allowed_locations ? String(p.allowed_locations).split(",").map(Number).filter(n => !isNaN(n)) : [];
          setAllowedLocationIds(aLocs);
        }
      };
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while loading product data.");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const load = async () => {
    setLoading(true);
    try {
      const p = await fetchPart(String(id));
      setPart(p);
      setGallery(p?.gallery || []);
      // re-initialize attributes etc.
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAssignGroup = async (groupId: number) => {
    if (!id || !groupId) return;
    try {
      await assignAttributeGroupToPart(Number(id), groupId);
      // Reload part to get updated attributes
      const p = await fetchPart(String(id));
      setPart(p);
      setAttrGroups(p?.attributes_grouped || []);
      toast.success("Group assigned successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to assign group");
    }
  };

  const handleUnassignGroup = async (groupId: number) => {
    if (!id || !groupId) return;
    if (!confirm("Are you sure you want to remove this group and all its values from this product?")) return;
    try {
      await unassignAttributeGroupFromPart(Number(id), groupId);
      // Reload part
      const p = await fetchPart(String(id));
      setPart(p);
      setAttrGroups(p?.attributes_grouped || []);
      toast.success("Group removed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove group");
    }
  };

  const handleUpdateGallery = async () => {
    setSaving(true);
    try {
      await updatePartGallery(String(id), gallery);
      toast({ title: "Success", description: "Gallery updated" });
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        slug: form.slug.trim() || null,
        brand_id: form.brand_id === "" ? null : parseInt(form.brand_id),
        cost_price: asNumOrNull(form.cost_price),
        price: asNumOrNull(form.price),
        wholesale_price: asNumOrNull(form.wholesale_price),
        min_selling_price: asNumOrNull(form.min_selling_price),
        price_2: asNumOrNull(form.price_2),
        reorder_level: parseInt(form.reorder_level),
        default_location_id: form.default_location_id === "none" ? null : parseInt(form.default_location_id),
        supplier_ids: supplierIds,
        collection_ids: collectionIds,
        allowed_locations: allowedLocationIds.length > 0 ? allowedLocationIds.join(",") : null,
        net_weight_kg: asNumOrNull(form.net_weight_kg),
        gross_weight_kg: asNumOrNull(form.gross_weight_kg),
        units_per_carton: parseInt(form.units_per_carton) || 1,
        carton_length_cm: asNumOrNull(form.carton_length_cm),
        carton_width_cm: asNumOrNull(form.carton_width_cm),
        carton_height_cm: asNumOrNull(form.carton_height_cm),
        volume_cbm: (parseFloat(form.carton_length_cm) * parseFloat(form.carton_width_cm) * parseFloat(form.carton_height_cm) / 1000000) || null,
        carton_tare_weight_kg: asNumOrNull(form.carton_tare_weight_kg),
        hs_code: (form.hs_code || "").trim() || null,
        is_online: form.is_online ? 1 : 0,
        out_of_stock: form.out_of_stock ? 1 : 0,
        public_description: form.public_description.trim() || null,
        item_section_id: form.item_section_id ? parseInt(form.item_section_id) : null,
        item_department_id: form.item_department_id ? parseInt(form.item_department_id) : null,
        item_category_id: form.item_category_id ? parseInt(form.item_category_id) : null,
        attributes: attrValues
      };

      const res = await api(`/api/part/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Saved", description: "Product updated" });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this product?")) return;
    setSaving(true);
    try {
      await deletePart(String(id));
      toast({ title: "Deleted", description: "Product removed" });
      router.push("/inventory/items");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Delete failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File) => {
    setSaving(true);
    try {
      const up = await api('/api/upload/part_image', {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          fd.append('image', file);
          return fd;
        })()
      }).then(r => r.json());

      if (up.status !== "success") throw new Error(up.message || "Upload failed");
      
      await api(`/api/part/set_image/${id}`, {
        method: 'POST',
        body: JSON.stringify({ image_filename: up.data.filename })
      });

      toast({ title: "Uploaded", description: "Image updated" });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Upload failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const imageUrl = part?.image_filename ? contentUrl("items", part.image_filename) : null;

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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Product #{id}</h1>
              <p className="text-muted-foreground mt-1">{part?.part_name ? part.part_name : "Product"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={saving}>
              Reload
            </Button>
            <Button className="gap-2" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
            <Button variant="destructive" className="gap-2" onClick={() => void remove()} disabled={saving}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span className="text-lg font-medium">Loading product details...</span>
          </div>
        ) : error || !part ? (
          <div className="text-lg text-muted-foreground py-20 text-center bg-muted/10 rounded-xl border border-dashed flex flex-col items-center gap-4">
            <XCircle className="w-10 h-10 text-destructive/50" />
            <div className="space-y-1">
               <p className="font-semibold text-foreground">{error || "Product not found"}</p>
               <p className="text-sm">Please verify the ID or your access permissions.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full flex justify-start h-auto p-1 bg-muted/30 border overflow-x-auto no-scrollbar">
              <TabsTrigger value="general" className="gap-2 py-2.5 px-4"><Info className="w-4 h-4" /> General</TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2 py-2.5 px-4"><Package className="w-4 h-4" /> Inventory</TabsTrigger>
              <TabsTrigger value="shipping" className="gap-2 py-2.5 px-4"><Truck className="w-4 h-4" /> Shipping</TabsTrigger>
              <TabsTrigger value="ecommerce" className="gap-2 py-2.5 px-4 text-primary font-bold"><Globe className="w-4 h-4" /> E-Commerce</TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2 py-2.5 px-4"><ImageIcon className="w-4 h-4" /> Gallery</TabsTrigger>
              <TabsTrigger value="attributes" className="gap-2 py-2.5 px-4"><ListTree className="w-4 h-4" /> Attributes</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-4 shadow-sm border-none bg-muted/5">
                  <CardHeader>
                    <CardTitle className="text-base">Thumbnail</CardTitle>
                    <CardDescription>Main product image for listings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-[240px] rounded-xl border-2 border-dashed bg-background overflow-hidden flex items-center justify-center group relative">
                      {imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt="" className="h-full w-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Change</Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-3">
                          <ImageIcon className="w-10 h-10 opacity-20" />
                          <div className="text-sm font-medium">No Primary Image</div>
                          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Upload</Button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (!f) return;
                        void uploadImage(f);
                        e.currentTarget.value = "";
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

                <Card className="lg:col-span-8 shadow-sm border-none bg-muted/5">
                  <CardHeader>
                    <CardTitle className="text-base">Core Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 col-span-full">
                      <Label>Product Name</Label>
                      <Input className="text-lg font-bold" value={form.part_name} onChange={(e) => setForm((p) => ({ ...p, part_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <div className="flex gap-2">
                        <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
                        <Button variant="outline" size="icon" onClick={() => setForm((p) => ({ ...p, sku: generateSku() }))} disabled={saving}>
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Select value={form.brand_id} onValueChange={(v) => setForm((p) => ({ ...p, brand_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select brand..." /></SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Collections (for POS)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between">
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
                          <SelectItem value="Part">Part (Physical)</SelectItem>
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
                      <Label className="flex items-center gap-2">
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
                        <Input type="number" value={form.cost_price} onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-primary font-bold">Selling Price</Label>
                        <Input className="border-primary/30 bg-primary/5 font-bold" type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Wholesale Price</Label>
                        <Input type="number" value={form.wholesale_price} onChange={(e) => setForm((p) => ({ ...p, wholesale_price: e.target.value }))} />
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

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

                    {batches.length > 0 && (
                      <div className="mt-6 border-t pt-6">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" /> Current Batches
                        </h4>
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="text-[10px] uppercase">Batch</TableHead>
                                <TableHead className="text-[10px] uppercase text-right">Qty</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batches.map((b: any) => (
                                <TableRow key={b.id}>
                                  <TableCell className="py-2 text-xs font-medium">{b.batch_number || "N/A"}</TableCell>
                                  <TableCell className="py-2 text-xs text-right font-bold">{Number(b.quantity_on_hand).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
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

            <TabsContent value="shipping" className="mt-6">
              <Card className="shadow-sm border-none bg-muted/5">
                <CardHeader>
                  <CardTitle className="text-base">Logistics & Packaging</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="space-y-2">
                      <Label>Net Weight (kg)</Label>
                      <Input type="number" step="0.001" value={form.net_weight_kg} onChange={(e) => setForm(p => ({ ...p, net_weight_kg: e.target.value }))} />
                   </div>
                   <div className="space-y-2">
                      <Label>Gross Weight (kg)</Label>
                      <Input type="number" step="0.001" value={form.gross_weight_kg} onChange={(e) => setForm(p => ({ ...p, gross_weight_kg: e.target.value }))} />
                   </div>
                   <div className="space-y-2">
                      <Label>Packing Type</Label>
                      <Select value={form.packing_type} onValueChange={(v) => setForm(p => ({ ...p, packing_type: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select Packing" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Carton">Carton (Legacy)</SelectItem>
                          <SelectItem value="Pouch">Pouch (Legacy)</SelectItem>
                          <SelectItem value="Canister">Canister (Legacy)</SelectItem>
                          {packagingTypes.map(pkg => (
                            <SelectItem key={pkg.id} value={pkg.name}>{pkg.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label>HS Code</Label>
                      <Input value={form.hs_code} onChange={(e) => setForm(p => ({ ...p, hs_code: e.target.value }))} />
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
                        <Label>Collections</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-12">
                              <span className="truncate">{collectionIds.length === 0 ? "Not in any collection" : `${collectionIds.length} Collections`}</span>
                              <LayoutGrid className="w-4 h-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                             <ScrollArea className="h-[300px] p-4">
                               <div className="space-y-3">
                                  {collections.map(c => (
                                    <label key={c.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                              <Checkbox 
                                        checked={collectionIds.includes(c.id)} 
                                        onCheckedChange={(v) => setCollectionIds(prev => v ? [...prev, c.id] : prev.filter(id => id !== c.id))} 
                                      />
                                      {c.name}
                                    </label>
                                  ))}
                               </div>
                             </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2 pt-4">
                        <Label>URL Slug</Label>
                        <p className="text-xs text-muted-foreground mb-2">SEO-friendly identifier for the storefront link (leave blank to auto-generate from name)</p>
                        <div className="flex gap-2">
                          <Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="e.g. classic-earl-grey" />
                          <Button 
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

                  <Card className="shadow-sm border-none bg-amber-500/5 border-l-4 border-l-amber-500 mt-6">
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
                  <Card className="shadow-sm border-none bg-muted/5">
                    <CardHeader>
                      <CardTitle className="text-base">Public Description</CardTitle>
                      <CardDescription>Rich HTML or plain text description for the website</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea 
                        placeholder="Enter detailed product description..." 
                        className="min-h-[300px] font-mono text-sm leading-relaxed" 
                        value={form.public_description} 
                        onChange={(e) => setForm(p => ({ ...p, public_description: e.target.value }))}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-6">
              <Card className="shadow-sm border-none bg-muted/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Media Gallery</CardTitle>
                    <CardDescription>Upload multiple views and technical diagrams</CardDescription>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'image/*';
                    input.onchange = async (e: any) => {
                      const files = Array.from(e.target.files) as File[];
                      if (files.length === 0) return;
                      setSaving(true);
                      try {
                        for (const f of files) {
                          await uploadPartGalleryImage(String(id), f);
                        }
                        toast({ title: "Uploaded", description: "Gallery updated" });
                        await load();
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      } finally {
                        setSaving(false);
                      }
                    };
                    input.click();
                  }} disabled={saving}>
                    <PlusCircle className="w-4 h-4" /> Add Images
                  </Button>
                </CardHeader>
                 <CardContent>
                    {gallery.length > 0 && (
                      <div className="flex justify-end mb-4">
                        <Button size="sm" variant="secondary" onClick={handleUpdateGallery} disabled={saving}>
                          Save Gallery Changes
                        </Button>
                      </div>
                    )}
                    {gallery.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed rounded-xl bg-background/50">
                         <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                         <p className="text-muted-foreground font-medium">Gallery is empty</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                         {gallery.map((img, idx) => (
                           <div key={img.id} className="group relative rounded-xl border bg-background overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                              <div className="relative aspect-video">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                 <img src={contentUrl("items", img.filename)} alt="" className="h-full w-full object-cover" />
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button 
                                      variant="destructive" 
                                      size="icon" 
                                      className="h-8 w-8 rounded-full"
                                      onClick={async () => {
                                        if (!confirm("Delete this gallery image?")) return;
                                        setSaving(true);
                                        try {
                                          await deletePartGalleryImage(img.id);
                                          await load();
                                        } catch (err: any) {
                                          toast({ title: "Error", description: err.message, variant: "destructive" });
                                        } finally {
                                          setSaving(false);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </div>
                              <div className="p-3 space-y-2 bg-muted/30">
                                 <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Label</Label>
                                    <Select 
                                      value={img.label || ""} 
                                      onValueChange={(val) => {
                                        const newGal = [...gallery];
                                        newGal[idx].label = val;
                                        setGallery(newGal);
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs bg-background">
                                        <SelectValue placeholder="Select View" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[
                                          "Front View", "Back View", "Side View", "Top View", 
                                          "Bottom View", "Inner View", "Technical Diagram", 
                                          "Packaging", "Other"
                                        ].map(opt => (
                                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                        {img.label && ![
                                          "Front View", "Back View", "Side View", "Top View", 
                                          "Bottom View", "Inner View", "Technical Diagram", 
                                          "Packaging", "Other"
                                        ].includes(img.label) && (
                                          <SelectItem value={img.label}>{img.label}</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Sort Order</Label>
                                    <Input 
                                      type="number"
                                      className="h-8 text-xs bg-background" 
                                      value={img.sort_order || 0} 
                                      onChange={(e) => {
                                        const newGal = [...gallery];
                                        newGal[idx].sort_order = parseInt(e.target.value) || 0;
                                        setGallery(newGal);
                                      }}
                                    />
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attributes" className="mt-6">
              <Card className="shadow-sm border-none bg-muted/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-base">Technical Specifications</CardTitle>
                    <CardDescription>Select and manage groups for this product</CardDescription>
                  </div>
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" /> Add Specification Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Specification Group</DialogTitle>
                        <DialogDescription>
                          Select a group to add it to this product's technical specifications.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                         <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                               {allGroups
                                 .filter(g => !attrGroups.some(ag => ag.id === g.id))
                                 .map(g => (
                                   <div 
                                     key={g.id} 
                                     className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                                     onClick={() => {
                                       handleAssignGroup(g.id);
                                       setIsAssignDialogOpen(false);
                                     }}
                                   >
                                      <div className="font-medium">{g.name}</div>
                                      <PlusCircle className="w-4 h-4 text-primary" />
                                   </div>
                                 ))
                               }
                               {allGroups.filter(g => !attrGroups.some(ag => ag.id === g.id)).length === 0 && (
                                 <div className="py-8 text-center text-muted-foreground italic">
                                   No more groups available to add.
                                 </div>
                               )}
                            </div>
                         </ScrollArea>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAssignDialogOpen(false)}>Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-8">
                   {attrGroups.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground italic border rounded-lg">
                        No attribute groups defined.
                      </div>
                   ) : (
                     attrGroups.map(group => (
                       <div key={group.id} className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="h-px bg-muted flex-1" />
                             <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{group.name}</h3>
                             <div className="h-px bg-muted flex-1" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                             {(group.attributes || []).map((attr: any) => (
                               <div key={attr.id} className="space-y-1.5">
                                  <Label className="text-xs">{attr.name} {attr.type === 'list' || attr.type === 'badge' ? '(Comma separated)' : ''}</Label>
                                  {attr.type === 'textarea' || attr.type === 'para' ? (
                                    <Textarea 
                                      placeholder={`Enter ${attr.name}...`} 
                                      value={attrValues[attr.id] || ""} 
                                      onChange={(e) => setAttrValues(prev => ({ ...prev, [attr.id]: e.target.value }))}
                                      className="min-h-[100px]"
                                    />
                                  ) : attr.type === 'icon-text' ? (
                                    <div className="flex gap-2">
                                       <Select 
                                          value={(attrValues[attr.id] || "").split('|')[0] || "Coffee"} 
                                          onValueChange={(v) => {
                                             const oldText = (attrValues[attr.id] || "").split('|')[1] || "";
                                             setAttrValues(prev => ({ ...prev, [attr.id]: `${v}|${oldText}` }));
                                          }}
                                       >
                                          <SelectTrigger className="w-12 px-2">
                                             <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                             <SelectItem value="Coffee"><Coffee className="w-4 h-4" /></SelectItem>
                                             <SelectItem value="Droplets"><Droplets className="w-4 h-4" /></SelectItem>
                                             <SelectItem value="Thermometer"><Thermometer className="w-4 h-4" /></SelectItem>
                                             <SelectItem value="Clock"><Clock className="w-4 h-4" /></SelectItem>
                                             <SelectItem value="Users"><Users className="w-4 h-4" /></SelectItem>
                                             <SelectItem value="ShoppingBag"><ShoppingBag className="w-4 h-4" /></SelectItem>
                                             <SelectItem value="Package"><Package className="w-4 h-4" /></SelectItem>
                                             <SelectItem value="Info"><Info className="w-4 h-4" /></SelectItem>
                                          </SelectContent>
                                       </Select>
                                       <Input 
                                          placeholder={`Enter ${attr.name}...`} 
                                          value={(attrValues[attr.id] || "").split('|')[1] || ""} 
                                          onChange={(e) => {
                                             const oldIcon = (attrValues[attr.id] || "").split('|')[0] || "Coffee";
                                             setAttrValues(prev => ({ ...prev, [attr.id]: `${oldIcon}|${e.target.value}` }));
                                          }}
                                       />
                                    </div>
                                  ) : attr.type === 'boolean' ? (
                                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-background">
                                       <Switch 
                                          checked={attrValues[attr.id] === '1' || attrValues[attr.id] === 'true' || attrValues[attr.id] === 'Yes'} 
                                          onCheckedChange={(v) => setAttrValues(prev => ({ ...prev, [attr.id]: v ? '1' : '0' }))} 
                                       />
                                       <span className="text-xs text-muted-foreground">{attrValues[attr.id] === '1' ? 'Yes' : 'No'}</span>
                                    </div>
                                  ) : (
                                    <Input 
                                      placeholder={
                                        attr.type === 'list' || attr.type === 'badge' 
                                          ? "Item 1, Item 2, Item 3" 
                                          : `Enter ${attr.name}...`
                                      } 
                                      value={attrValues[attr.id] || ""} 
                                      onChange={(e) => setAttrValues(prev => ({ ...prev, [attr.id]: e.target.value }))}
                                    />
                                  )}
                                  {(attr.type === 'list' || attr.type === 'badge') && (
                                     <p className="text-[10px] text-muted-foreground italic">
                                        Format: Item 1, Item 2, Item 3
                                     </p>
                                  )}
                               </div>
                             ))}
                          </div>
                       </div>
                     ))
                   )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
