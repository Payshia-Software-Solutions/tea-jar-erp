"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  fetchParts, 
  fetchPart,
  updatePart, 
  bulkUpdatePartDiscount, 
  fetchLocations, 
  uploadPartGalleryImage,
  deletePartGalleryImage,
  updatePartGallery,
  contentUrl,
  type PartRow, 
  type ServiceLocation 
} from "@/lib/api";
import { 
  Boxes, 
  Grid3X3, 
  LayoutList, 
  Loader2, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Globe, 
  Eye, 
  Star, 
  Settings2,
  TrendingUp,
  Tag,
  ChevronRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  Percent,
  Banknote,
  Sparkles,
  Layers,
  Trash2,
  Upload,
  PlusCircle
} from "lucide-react";

type ViewMode = "table" | "grid";

function ProductGridCard({ p, thumb, toggleAvailability, openDiscount, openGallery }: { 
    p: PartRow, 
    thumb: (p: any) => string | null, 
    toggleAvailability: (p: PartRow) => void,
    openDiscount: (p: PartRow) => void,
    openGallery: (p: PartRow) => void
}) {
  const [imgIndex, setImgIndex] = useState(0);
  
  const images = useMemo(() => {
    const list: string[] = [];
    const main = thumb(p);
    if (main) list.push(main);
    
    if (p.gallery && Array.isArray(p.gallery)) {
      p.gallery.forEach(g => {
        const url = contentUrl("items", g.filename);
        if (url && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    return list;
  }, [p, thumb]);

  const currentUrl = images[imgIndex] || null;

  const hasDiscount = p.discount_type && p.discount_type !== 'None';

  return (
    <Card className={`border shadow-sm overflow-hidden group hover:border-primary/30 transition-all ${p.out_of_stock ? 'opacity-75' : ''}`}>
       <div className="aspect-square relative bg-muted/20 overflow-hidden">
          {currentUrl ? (
            <img 
              key={currentUrl}
              src={currentUrl} 
              alt={p.part_name} 
              className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-300" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
               <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Dots navigation if more than one image */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10 pb-1">
               {images.map((_, idx) => (
                 <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImgIndex(idx);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${idx === imgIndex ? 'bg-primary w-3' : 'bg-white/60 hover:bg-white'}`}
                 />
               ))}
            </div>
          )}

          <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
             <Button variant="secondary" size="icon" className={`h-7 w-7 rounded-md shadow-sm transition-colors ${p.is_online ? 'bg-primary text-primary-foreground' : 'bg-white/90 text-muted-foreground'}`}>
                <Globe className="w-3.5 h-3.5" />
             </Button>
             <Button 
                variant="secondary" 
                size="icon" 
                className={`h-7 w-7 rounded-md shadow-sm transition-colors bg-white/90 text-muted-foreground hover:text-primary`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openGallery(p);
                }}
             >
                <ImageIcon className="w-3.5 h-3.5" />
             </Button>
             <Button 
                variant="secondary" 
                size="icon" 
                className={`h-7 w-7 rounded-md shadow-sm transition-colors ${hasDiscount ? 'bg-amber-500 text-white' : 'bg-white/90 text-muted-foreground hover:text-amber-600'}`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openDiscount(p);
                }}
             >
                <Tag className="w-3.5 h-3.5" />
             </Button>
          </div>
          {p.out_of_stock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <Badge variant="destructive" className="font-bold text-[10px] px-2 py-0.5 rounded-sm">OUT OF STOCK</Badge>
            </div>
          )}
          {hasDiscount && !p.out_of_stock && (
            <div className="absolute top-2 left-2 z-20">
                <Badge className="bg-amber-500 text-white border-none text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-md">
                    {p.discount_type === 'Percentage' ? `${p.discount_value}% OFF` : `SALE`}
                </Badge>
            </div>
          )}
       </div>
       <CardContent className="p-3 space-y-3">
          <div className="space-y-0.5">
             <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">{p.category_name || 'General'}</p>
             <h3 className="font-bold text-xs tracking-tight truncate leading-tight">{p.part_name}</h3>
          </div>
          
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Status</span>
                <Switch 
                    checked={!p.out_of_stock} 
                    onCheckedChange={() => toggleAvailability(p)}
                    className="data-[state=checked]:bg-emerald-500 h-4 w-7 [&>span]:h-3 [&>span]:w-3"
                />
             </div>
             <div className="text-right">
                {hasDiscount ? (
                    <>
                        <span className="text-[10px] text-muted-foreground line-through decoration-destructive/40 block leading-none">Rs. {Number(p.price).toLocaleString()}</span>
                        <span className="text-xs font-black tracking-tight block text-amber-600">
                            Rs. {(() => {
                                const base = Number(p.price) || 0;
                                const val = Number(p.discount_value) || 0;
                                if (p.discount_type === 'Percentage') return (base * (1 - val / 100)).toLocaleString();
                                return (base - val).toLocaleString();
                            })()}
                        </span>
                    </>
                ) : (
                    <span className="text-xs font-black tracking-tight block">Rs. {Number(p.price).toLocaleString()}</span>
                )}
                <span className="text-[9px] text-muted-foreground font-bold">{Number(p.stock_quantity ?? 0)} {p.unit || 'PCS'}</span>
             </div>
          </div>
       </CardContent>
    </Card>
  );
}

export default function EcommerceProductsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PartRow[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState<number>(12);
  const [page, setPage] = useState<number>(1);
  
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Discount Dialog State
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PartRow | null>(null);
  const [discountForm, setDiscountForm] = useState({
    discount_type: "None",
    discount_value: "0"
  });
  const [savingDiscount, setSavingDiscount] = useState(false);

  // Gallery Dialog State
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState<PartRow | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Bulk Discount Dialog State
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkForm, setBulkForm] = useState({
      discount_type: "Percentage",
      discount_value: "10"
  });
  const [bulkMode, setBulkMode] = useState<"visible" | "all">("visible");

  const checkLocation = () => {
    const locId = localStorage.getItem("location_id");
    if (locId) {
      setSelectedLocationId(parseInt(locId));
      return true;
    }
    return false;
  };

  const loadLocations = async () => {
    try {
      const data = await fetchLocations();
      const onlineLocations = (Array.isArray(data) ? data : []).filter(l => l.allow_online === 1);
      setLocations(onlineLocations);
      if (!checkLocation()) {
        setShowLocationDialog(true);
      }
    } catch (e) {
      console.error("Failed to load locations", e);
    } finally {
      setIsLocating(false);
    }
  };

  const loadItems = async (locId: number) => {
    setLoading(true);
    try {
      const data = await fetchParts("");
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasLoc = checkLocation();
    void loadLocations();
    if (hasLoc) {
      void loadItems(parseInt(localStorage.getItem("location_id")!));
    }
  }, []);

  const handleSelectLocation = (id: number) => {
    localStorage.setItem("location_id", String(id));
    const loc = locations.find(l => l.id === id);
    if (loc) localStorage.setItem("location_name", loc.name);
    setSelectedLocationId(id);
    setShowLocationDialog(false);
    void loadItems(id);
    window.dispatchEvent(new Event("storage"));
  };

  const toggleAvailability = async (item: PartRow) => {
    try {
      const nextValue = item.out_of_stock ? 0 : 1;
      await updatePart(item.id, { out_of_stock: nextValue });
      setItems(prev => prev.map(p => p.id === item.id ? { ...p, out_of_stock: nextValue } : p));
      toast({ 
        title: nextValue ? "Marked as Out of Stock" : "Marked as Available",
        description: `${item.part_name} status updated.`
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const openDiscount = (p: PartRow) => {
    setEditingProduct(p);
    setDiscountForm({
        discount_type: p.discount_type || "None",
        discount_value: String(p.discount_value || "0")
    });
    setShowDiscountDialog(true);
  };

  const handleUpdateDiscount = async () => {
    if (!editingProduct) return;
    setSavingDiscount(true);
    try {
        const payload = {
            discount_type: discountForm.discount_type as any,
            discount_value: parseFloat(discountForm.discount_value) || 0
        };
        await updatePart(editingProduct.id, payload);
        setItems(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
        setShowDiscountDialog(false);
        toast({ title: "Success", description: "Discount settings updated." });
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setSavingDiscount(false);
    }
  };

  const openGallery = (p: PartRow) => {
    setGalleryProduct(p);
    setShowGalleryDialog(true);
  };

  const handleUploadGallery = async (files: File[]) => {
    if (!galleryProduct) return;
    setUploadingGallery(true);
    try {
        for (const f of files) {
            await uploadPartGalleryImage(galleryProduct.id, f);
        }
        // Reload product to get new gallery
        const updated = await fetchPart(galleryProduct.id);
        setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
        setGalleryProduct(updated);
        toast({ title: "Success", description: `${files.length} images uploaded.` });
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setUploadingGallery(false);
    }
  };

  const handleDeleteGalleryImage = async (imgId: number) => {
    if (!galleryProduct || !confirm("Delete this image?")) return;
    setUploadingGallery(true);
    try {
        await deletePartGalleryImage(imgId);
        const updated = await fetchPart(galleryProduct.id);
        setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
        setGalleryProduct(updated);
        toast({ title: "Deleted", description: "Image removed from gallery." });
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setUploadingGallery(false);
    }
  };

  const handleUpdateGalleryItems = async () => {
    if (!galleryProduct || !galleryProduct.gallery) return;
    setUploadingGallery(true);
    try {
        await updatePartGallery(galleryProduct.id, galleryProduct.gallery);
        // Refresh items
        const updated = await fetchPart(galleryProduct.id);
        setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast({ title: "Success", description: "Gallery order and labels updated." });
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setUploadingGallery(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter(p => {
      if (!selectedLocationId) return false;
      if (!p.allowed_locations || p.allowed_locations.trim() === "") return true;
      const allowedIds = p.allowed_locations.split(',').map(s => s.trim());
      return allowedIds.includes(String(selectedLocationId));
    });
    if (q) {
      rows = rows.filter((p) => (p.part_name ?? "").toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => String(a.part_name ?? "").localeCompare(String(b.part_name ?? "")));
  }, [items, query, selectedLocationId]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleBulkDiscount = async () => {
    const targetIds = bulkMode === "visible" ? filtered.map(p => p.id) : items.map(p => p.id);
    if (targetIds.length === 0) return;
    
    setSavingDiscount(true);
    try {
        const payload = {
            ids: targetIds,
            discount_type: bulkForm.discount_type,
            discount_value: parseFloat(bulkForm.discount_value) || 0
        };
        await bulkUpdatePartDiscount(payload);
        setItems(prev => prev.map(p => targetIds.includes(p.id) ? { ...p, discount_type: payload.discount_type as any, discount_value: payload.discount_value } : p));
        setShowBulkDialog(false);
        toast({ 
            title: "Bulk Update Success", 
            description: `Applied ${payload.discount_type === 'Percentage' ? payload.discount_value + '%' : 'Fixed'} discount to ${targetIds.length} products.` 
        });
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setSavingDiscount(false);
    }
  };

  const thumb = (p: any) => {
    const fn = p?.image_filename ? String(p.image_filename) : "";
    if (!fn) return null;
    return contentUrl("items", fn);
  };

  const activeLocationName = useMemo(() => {
    if (typeof window === 'undefined') return "";
    return localStorage.getItem("location_name") || "";
  }, [selectedLocationId]);

  return (
    <DashboardLayout title="Storefront Products">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
        
        {/* Gallery Dialog */}
        <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <ImageIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle>Product Gallery</DialogTitle>
                                <DialogDescription>{galleryProduct?.part_name}</DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {galleryProduct?.gallery && galleryProduct.gallery.length > 0 && (
                                <Button size="sm" variant="secondary" onClick={handleUpdateGalleryItems} disabled={uploadingGallery}>
                                    Save Changes
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                disabled={uploadingGallery}
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.multiple = true;
                                    input.accept = 'image/*';
                                    input.onchange = (e: any) => {
                                        const files = Array.from(e.target.files) as File[];
                                        if (files.length > 0) handleUploadGallery(files);
                                    };
                                    input.click();
                                }}
                            >
                                {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                                Add Images
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-6">
                    {(!galleryProduct?.gallery || galleryProduct.gallery.length === 0) ? (
                        <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-bold text-muted-foreground">No gallery images yet.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                {galleryProduct.gallery.map((img, idx) => (
                                    <div key={img.id} className="group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                                        <div className="relative aspect-video">
                                            <img 
                                                src={contentUrl("items", img.filename)} 
                                                alt="" 
                                                className="w-full h-full object-cover" 
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={() => handleDeleteGalleryImage(img.id)}
                                                    disabled={uploadingGallery}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-3 bg-muted/20">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Label</Label>
                                                <Select 
                                                    value={img.label || ""} 
                                                    onValueChange={(val) => {
                                                        if (!galleryProduct) return;
                                                        const newGal = [...(galleryProduct.gallery || [])];
                                                        newGal[idx].label = val;
                                                        setGalleryProduct({ ...galleryProduct, gallery: newGal });
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
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Order</Label>
                                                <Input 
                                                    type="number"
                                                    className="h-8 text-xs bg-background"
                                                    value={img.sort_order || 0}
                                                    onChange={(e) => {
                                                        if (!galleryProduct) return;
                                                        const newGal = [...(galleryProduct.gallery || [])];
                                                        newGal[idx].sort_order = parseInt(e.target.value) || 0;
                                                        setGalleryProduct({ ...galleryProduct, gallery: newGal });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowGalleryDialog(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Location Selection Dialog */}
        <Dialog open={showLocationDialog} onOpenChange={(open) => {
            if (!selectedLocationId && !open) return;
            setShowLocationDialog(open);
        }}>
            <DialogContent className="sm:max-w-md border-none shadow-2xl overflow-hidden p-0">
                <div className="bg-primary/5 p-6 pb-4 border-b border-primary/10">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <DialogTitle className="text-xl font-bold">Select Storefront Location</DialogTitle>
                        </div>
                        <DialogDescription className="text-muted-foreground">
                            Please select a location to manage its e-commerce inventory and stock status.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                        {locations.length === 0 && !isLocating ? (
                            <div className="text-center py-8 space-y-2">
                                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto opacity-20" />
                                <p className="text-sm font-bold text-muted-foreground">No web-enabled locations found.</p>
                            </div>
                        ) : (
                            locations.map(loc => (
                                <button
                                    key={loc.id}
                                    onClick={() => handleSelectLocation(loc.id)}
                                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary hover:bg-primary/5 transition-all group text-left"
                                >
                                    <div className="space-y-0.5">
                                        <p className="font-bold group-hover:text-primary transition-colors">{loc.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{loc.location_type}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Quick Discount Dialog */}
        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Tag className="w-5 h-5 text-amber-600" />
                        </div>
                        <DialogTitle>Update Product Discount</DialogTitle>
                    </div>
                    <DialogDescription>
                        Set a promotional discount for <span className="font-bold text-foreground">{editingProduct?.part_name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <Select 
                            value={discountForm.discount_type} 
                            onValueChange={(v) => setDiscountForm(prev => ({ ...prev, discount_type: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None">No Discount</SelectItem>
                                <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                <SelectItem value="Fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {discountForm.discount_type !== "None" && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <Label>{discountForm.discount_type === "Percentage" ? "Discount Percentage (%)" : "Discount Amount"}</Label>
                            <div className="relative">
                                {discountForm.discount_type === "Percentage" ? (
                                    <Percent className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <Banknote className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                )}
                                <Input 
                                    type="number"
                                    className="pl-10"
                                    value={discountForm.discount_value}
                                    onChange={(e) => setDiscountForm(prev => ({ ...prev, discount_value: e.target.value }))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-2 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pricing Summary</span>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground">Original Price</p>
                                <p className="text-sm font-bold line-through opacity-40">Rs. {Number(editingProduct?.price || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Storefront Price</p>
                                <p className="text-2xl font-black text-amber-600">
                                    Rs. {(() => {
                                        const base = Number(editingProduct?.price) || 0;
                                        const val = parseFloat(discountForm.discount_value) || 0;
                                        if (discountForm.discount_type === "Percentage") return (base * (1 - val / 100)).toLocaleString();
                                        if (discountForm.discount_type === "Fixed") return (base - val).toLocaleString();
                                        return base.toLocaleString();
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDiscountDialog(false)} disabled={savingDiscount}>Cancel</Button>
                    <Button 
                        onClick={handleUpdateDiscount} 
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        disabled={savingDiscount}
                    >
                        {savingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Price"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Bulk Discount Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <DialogTitle>Bulk Apply Discounts</DialogTitle>
                    </div>
                    <DialogDescription>
                        Apply a promotion to multiple products at once. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Target Selection</Label>
                        <Select value={bulkMode} onValueChange={(v: any) => setBulkMode(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="visible">Currently Filtered Items ({filtered.length})</SelectItem>
                                <SelectItem value="all">All Storefront Items ({items.length})</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground px-1 italic">
                            * Tip: Use the search bar first to filter specific categories or brands, then select "Currently Filtered".
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Discount Type</Label>
                            <Select 
                                value={bulkForm.discount_type} 
                                onValueChange={(v) => setBulkForm(prev => ({ ...prev, discount_type: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">Clear Discount</SelectItem>
                                    <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="Fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {bulkForm.discount_type !== "None" && (
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input 
                                    type="number"
                                    value={bulkForm.discount_value}
                                    onChange={(e) => setBulkForm(prev => ({ ...prev, discount_value: e.target.value }))}
                                    placeholder="0"
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                         <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                            <AlertCircle className="w-4 h-4" /> Attention
                         </div>
                         <p className="text-[11px] text-muted-foreground leading-relaxed">
                            You are about to apply a <strong>{bulkForm.discount_type === 'None' ? 'No Discount' : (bulkForm.discount_type === 'Percentage' ? bulkForm.discount_value + '%' : 'Fixed')}</strong> policy to <strong>{bulkMode === 'visible' ? filtered.length : items.length}</strong> products. This will update the storefront prices immediately.
                         </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBulkDialog(false)} disabled={savingDiscount}>Cancel</Button>
                    <Button 
                        onClick={handleBulkDiscount} 
                        className="font-bold px-6"
                        disabled={savingDiscount || (bulkMode === 'visible' && filtered.length === 0)}
                    >
                        {savingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Bulk Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
           <span>E-commerce</span>
           <ChevronRight className="w-3 h-3" />
           <span className="text-foreground">Storefront Products</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Storefront Products</h1>
              {selectedLocationId && (
                  <Badge 
                    variant="outline" 
                    className="hidden sm:flex items-center gap-1.5 py-1 px-3 bg-primary/5 text-primary border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors shadow-sm"
                    onClick={() => setShowLocationDialog(true)}
                  >
                    <MapPin className="w-3 h-3" />
                    {activeLocationName}
                    <span className="text-[9px] font-bold opacity-40 ml-1">CHANGE</span>
                  </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">Control how your inventory items appear on the public e-commerce store.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9 h-10"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center border rounded-md p-1 bg-background">
              <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" onClick={() => setView("table")} className="h-8 w-8 rounded-sm">
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setView("grid")} className="h-8 w-8 rounded-sm">
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" className="h-10 px-4 font-bold gap-2 text-primary border-primary/20 hover:bg-primary/5" onClick={() => setShowBulkDialog(true)}>
               <Layers className="w-4 h-4" />
               Bulk Apply
            </Button>
            <Button asChild className="h-10 px-4 font-bold gap-2">
              <Link href="/inventory/items/new">
                <Plus className="w-4 h-4" />
                New Product
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card className="border shadow-sm overflow-hidden bg-primary/5">
              <CardContent className="p-5 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Web Visible</p>
                    <p className="text-2xl font-black">{items.filter(i => i.is_online).length}</p>
                 </div>
                 <Globe className="w-8 h-8 text-primary opacity-20" />
              </CardContent>
           </Card>
           <Card className="border shadow-sm overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Available Now</p>
                    <p className="text-2xl font-black">{items.filter(i => !i.out_of_stock).length}</p>
                 </div>
                 <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-20" />
              </CardContent>
           </Card>
           <Card className="border shadow-sm overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Out of Stock</p>
                    <p className="text-2xl font-black text-destructive">{items.filter(i => i.out_of_stock).length}</p>
                 </div>
                 <AlertCircle className="w-8 h-8 text-destructive opacity-20" />
              </CardContent>
           </Card>
        </div>

        {!selectedLocationId && isLocating ? (
             <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-bold text-muted-foreground animate-pulse">Initializing module...</p>
            </div>
        ) : !selectedLocationId ? (
            <div className="py-40 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <Building2 className="w-12 h-12 mx-auto opacity-10 mb-4" />
                <p className="text-lg font-bold text-muted-foreground">Please select a location to view products.</p>
                <Button onClick={() => setShowLocationDialog(true)} className="mt-4 font-bold uppercase tracking-widest text-xs h-10 px-8">Select Location</Button>
            </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="font-bold text-sm text-muted-foreground">Syncing items...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
            <ImageIcon className="w-12 h-12 mx-auto opacity-10 mb-4" />
            <p className="text-lg font-bold text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {view === "table" ? (
              <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Product</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-wider">Visibility</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-wider">Availability</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-wider">Discount</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Stock</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Price</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((p) => {
                      const url = thumb(p);
                      const hasDiscount = p.discount_type && p.discount_type !== 'None';
                      return (
                        <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md border bg-muted flex items-center justify-center shrink-0">
                                {url ? (
                                  <img src={url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-sm truncate">{p.part_name}</div>
                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{p.sku || `#${p.id}`}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-tighter ${p.is_online ? 'bg-primary/5 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-muted-foreground/20'}`}>
                                {p.is_online ? 'ONLINE' : 'HIDDEN'}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                             <div className="flex flex-col items-center gap-1.5">
                                <Switch 
                                    checked={!p.out_of_stock} 
                                    onCheckedChange={() => toggleAvailability(p)}
                                    className="data-[state=checked]:bg-emerald-500 scale-75"
                                />
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${p.out_of_stock ? 'text-destructive' : 'text-emerald-600'}`}>
                                    {p.out_of_stock ? 'Out of Stock' : 'Available'}
                                </span>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 rounded-full"
                                onClick={() => openGallery(p)}
                             >
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                             </Button>
                          </TableCell>
                          <TableCell className="text-center">
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`h-8 gap-2 font-bold text-[10px] uppercase tracking-tighter ${hasDiscount ? 'text-amber-600 bg-amber-500/5 hover:bg-amber-500/10' : 'text-muted-foreground hover:text-amber-600'}`}
                                onClick={() => openDiscount(p)}
                             >
                                <Tag className="w-3.5 h-3.5" />
                                {hasDiscount ? (p.discount_type === 'Percentage' ? `${p.discount_value}%` : 'FIXED') : 'SET'}
                             </Button>
                          </TableCell>
                          <TableCell>
                             <div className="text-sm font-bold">{Number(p.stock_quantity ?? 0).toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">{p.unit}</span></div>
                          </TableCell>
                          <TableCell className="text-right">
                             {hasDiscount ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-muted-foreground line-through opacity-50 leading-none">Rs. {Number(p.price).toLocaleString()}</span>
                                    <span className="text-sm font-black text-amber-600">
                                        Rs. {(() => {
                                            const base = Number(p.price) || 0;
                                            const val = Number(p.discount_value) || 0;
                                            if (p.discount_type === 'Percentage') return (base * (1 - val / 100)).toLocaleString();
                                            return (base - val).toLocaleString();
                                        })()}
                                    </span>
                                </div>
                             ) : (
                                <span className="text-sm font-black">Rs. {Number(p.price).toLocaleString()}</span>
                             )}
                          </TableCell>
                          <TableCell>
                             <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                <Link href={`/inventory/items/${p.id}`}>
                                    <Settings2 className="w-4 h-4" />
                                </Link>
                             </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paged.map((p) => (
                  <ProductGridCard 
                    key={p.id} 
                    p={p} 
                    thumb={thumb} 
                    toggleAvailability={toggleAvailability} 
                    openDiscount={openDiscount}
                    openGallery={openGallery}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
               <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Showing <span className="text-foreground">{paged.length}</span> {" / "} {filtered.length}
               </div>
               <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 px-4 font-bold" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <Button variant="outline" size="sm" className="h-8 px-4 font-bold" onClick={() => setPage(p => p + 1)} disabled={paged.length < pageSize}>Next</Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
