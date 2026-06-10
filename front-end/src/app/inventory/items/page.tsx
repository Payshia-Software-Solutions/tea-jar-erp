"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { contentUrl, fetchParts, type PartRow, fetchItemSections, fetchItemDepartments, fetchItemCategories, type ItemSection, type ItemDepartment, type ItemCategory } from "@/lib/api";
import { Boxes, Grid3X3, LayoutList, Loader2, Plus, Search, Image as ImageIcon, Filter, X, UploadCloud } from "lucide-react";
import { ImportItemsDialog } from "@/components/inventory/ImportItemsDialog";

type ViewMode = "table" | "grid";

const LS_VIEW_KEY = "inventory_items_view";
const LS_SIZE_KEY = "inventory_items_page_size";

export default function InventoryItemsListPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PartRow[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const [pageSize, setPageSize] = useState<number>(12);
  const [page, setPage] = useState<number>(1);
  const [showImport, setShowImport] = useState(false);
  
  // Filter options
  const [sections, setSections] = useState<ItemSection[]>([]);
  const [departments, setDepartments] = useState<ItemDepartment[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);

  // Filter selections
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedCatId, setSelectedCatId] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const [data, s, d, c] = await Promise.all([
        fetchParts(""),
        fetchItemSections(),
        fetchItemDepartments(),
        fetchItemCategories()
      ]);
      setItems(Array.isArray(data) ? data : []);
      setSections(Array.isArray(s) ? s : []);
      setDepartments(Array.isArray(d) ? d : []);
      setCategories(Array.isArray(c) ? c : []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(LS_VIEW_KEY);
      if (v === "grid" || v === "table") setView(v);
      const s = Number(window.localStorage.getItem(LS_SIZE_KEY));
      if (Number.isFinite(s) && s > 0) setPageSize(s);
    } catch {
      // ignore
    }
    void load();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_VIEW_KEY, view);
    } catch {}
  }, [view]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_SIZE_KEY, String(pageSize));
    } catch {}
  }, [pageSize]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items;
    
    if (q) {
      rows = rows.filter((p) => (p.part_name ?? "").toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q));
    }

    if (selectedSectionId !== "all") {
      rows = rows.filter(p => p.item_section_id === parseInt(selectedSectionId));
    }

    if (selectedDeptId !== "all") {
      rows = rows.filter(p => p.item_department_id === parseInt(selectedDeptId));
    }

    if (selectedCatId !== "all") {
      rows = rows.filter(p => p.item_category_id === parseInt(selectedCatId));
    }

    return [...rows].sort((a, b) => String(a.part_name ?? "").localeCompare(String(b.part_name ?? "")));
  }, [items, query, selectedSectionId, selectedDeptId, selectedCatId]);

  const filteredDepts = useMemo(() => {
    if (selectedSectionId === "all") return departments;
    return departments.filter(d => d.section_id === parseInt(selectedSectionId));
  }, [departments, selectedSectionId]);

  useEffect(() => {
     // Clear department if not in filtered list
     if (selectedDeptId !== "all") {
        if (!filteredDepts.some(d => String(d.id) === selectedDeptId)) {
          setSelectedDeptId("all");
        }
     }
  }, [filteredDepts, selectedDeptId]);

  const pageCount = useMemo(() => {
    const c = Math.ceil(filtered.length / pageSize);
    return c <= 0 ? 1 : c;
  }, [filtered.length, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
    if (page < 1) setPage(1);
  }, [page, pageCount]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const Pagination = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{" "}
        <span className="font-semibold text-foreground">{Math.min(page * pageSize, filtered.length)}</span> of{" "}
        <span className="font-semibold text-foreground">{filtered.length}</span>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            const n = Number(v);
            setPageSize(Number.isFinite(n) && n > 0 ? n : 12);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[12, 24, 48].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </Button>
        <Badge variant="outline" className="px-3 py-2">
          Page {page} / {pageCount}
        </Badge>
        <Button variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
          Next
        </Button>
      </div>
    </div>
  );

  const thumb = (p: any) => {
    const fn = p?.image_filename ? String(p.image_filename) : "";
    if (!fn) return null;
    return contentUrl("items", fn);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1">Item master (list view). Click an item to edit.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[340px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                className="pl-9 h-11"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")} className="gap-2">
                <LayoutList className="w-4 h-4" />
                Table
              </Button>
              <Button variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")} className="gap-2">
                <Grid3X3 className="w-4 h-4" />
                Grid
              </Button>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setShowImport(true)}>
              <UploadCloud className="w-4 h-4" />
              Import
            </Button>
            <Button asChild className="gap-2">
              <Link href="/inventory/items/new">
                <Plus className="w-4 h-4" />
                New
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
              {filtered.length} of {items.length} Items
            </Badge>
            {(selectedSectionId !== 'all' || selectedDeptId !== 'all' || selectedCatId !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-2"
                onClick={() => {
                  setSelectedSectionId('all');
                  setSelectedDeptId('all');
                  setSelectedCatId('all');
                }}
              >
                <X className="w-3 h-3" /> Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border border-dashed">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Section</div>
            <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Department</div>
            <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {filteredDepts.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Category</div>
            <Select value={selectedCatId} onValueChange={setSelectedCatId}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full h-9 gap-2" onClick={() => void load()}>
               <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
               Refresh
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground py-16 text-center">No items found</div>
            ) : (
              <div className="space-y-4">
                {Pagination}
                {view === "table" ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="w-[110px]">Type</TableHead>
                          <TableHead className="w-[100px]">Stock</TableHead>
                          <TableHead className="hidden md:table-cell w-[120px]">Cost</TableHead>
                          <TableHead className="hidden md:table-cell w-[120px]">Selling</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paged.map((p) => {
                          const url = thumb(p);
                          return (
                            <TableRow key={p.id} className="hover:bg-muted/10">
                              <TableCell>
                                <Link href={`/inventory/items/${p.id}`} className="flex items-center gap-3 min-w-0">
                                  <div className="h-12 w-12 rounded-lg border bg-muted/10 overflow-hidden flex items-center justify-center shrink-0">
                                    {url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold truncate">{p.part_name}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate">
                                      {p.sku ? `SKU: ${p.sku}` : `ITEM ID: #${p.id}`}
                                    </div>
                                    {(p.brand_name || p.brand) && (
                                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {p.brand_name || p.brand}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              </TableCell>
                              <TableCell className="space-y-1">
                                <Badge variant="outline" className={p.item_type === 'Service' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'}>
                                  {p.item_type === 'Part' ? 'Product' : (p.item_type || 'Product')}
                                </Badge>
                                {p.recipe_type && p.recipe_type !== 'Standard' && (
                                  <div className="block">
                                    <Badge variant="outline" className={p.recipe_type === 'Recipe' ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px]' : 'bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]'}>
                                      {p.recipe_type}
                                    </Badge>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-bold">
                                  {p.item_type === 'Service' ? '—' : Number(p.stock_quantity ?? 0).toLocaleString()}{" "}
                                  {p.item_type !== 'Service' && p.unit ? <span className="text-xs text-muted-foreground font-normal">{p.unit}</span> : null}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {p.cost_price !== null && p.cost_price !== undefined ? Number(p.cost_price).toFixed(2) : "-"}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm">
                                {p.price !== null && p.price !== undefined ? Number(p.price).toFixed(2) : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paged.map((p) => {
                      const url = thumb(p);
                      return (
                        <Link key={p.id} href={`/inventory/items/${p.id}`} className="block">
                          <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-14 w-14 rounded-xl border bg-muted/10 overflow-hidden flex items-center justify-center shrink-0">
                                    {url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold truncate">{p.part_name}</div>
                                    {(p.brand_name || p.brand) && (
                                      <div className="text-[11px] text-muted-foreground truncate mb-1">
                                        {p.brand_name || p.brand}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs text-muted-foreground truncate">{p.sku ? p.sku : `#${p.id}`}</div>
                                      <Badge variant="outline" className={`text-[9px] py-0 h-4 ${p.item_type === 'Service' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                        {p.item_type === 'Part' ? 'Product' : (p.item_type || 'Product')}
                                      </Badge>
                                      {p.recipe_type && p.recipe_type !== 'Standard' && (
                                        <Badge variant="outline" className={`text-[9px] py-0 h-4 ${p.recipe_type === 'Recipe' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                          {p.recipe_type}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-muted/40 font-bold whitespace-nowrap">
                                  {p.item_type === 'Service' ? 'Service' : `${Number(p.stock_quantity ?? 0).toLocaleString()} ${p.unit ?? ""}`}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="text-muted-foreground">Selling</div>
                                <div className="font-semibold">{p.price !== null && p.price !== undefined ? Number(p.price).toFixed(2) : "-"}</div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {Pagination}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ImportItemsDialog 
        open={showImport} 
        onOpenChange={setShowImport} 
        onSuccess={() => void load()} 
      />
    </DashboardLayout>
  );
}

