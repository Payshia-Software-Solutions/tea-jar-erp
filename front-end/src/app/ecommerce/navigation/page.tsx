"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  fetchStorefrontMenus, 
  fetchStorefrontMenusList, 
  createStorefrontMenu, 
  updateStorefrontMenu, 
  deleteStorefrontMenu, 
  sortStorefrontMenus,
  fetchItemCategories,
  fetchInventoryCollections,
  fetchLocations,
  fetchCompany,
  type ServiceLocation,
  type StorefrontMenuItem
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  GripVertical, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Link as LinkIcon,
  Globe,
  LayoutGrid,
  Box,
  ExternalLink,
  ArrowRight,
  Loader2,
  FolderTree,
  Type,
  Columns
} from "lucide-react";

export default function EcommerceNavigationPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<StorefrontMenuItem[]>([]);
  const [flatList, setFlatList] = useState<StorefrontMenuItem[]>([]);
  
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingItem, setEditingItem] = useState<StorefrontMenuItem | null>(null);
  const [formData, setFormData] = useState<Partial<StorefrontMenuItem>>({
    label: "",
    parent_id: null,
    location_id: null,
    link_type: "Internal",
    link_value: "",
    sort_order: 0,
    is_active: 1,
    is_mega_menu: 0
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [companyName, setCompanyName] = useState("Your Store");
  const [filterLocation, setFilterLocation] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, f, cats, cols, locs, comp] = await Promise.all([
        fetchStorefrontMenus(false, filterLocation),
        fetchStorefrontMenusList(false, filterLocation),
        fetchItemCategories(),
        fetchInventoryCollections(),
        fetchLocations(),
        fetchCompany()
      ]);
      setTree(t);
      setFlatList(f);
      setCategories(Array.isArray(cats) ? cats : []);
      setCollections(Array.isArray(cols) ? cols : []);
      setLocations(Array.isArray(locs) ? locs : []);
      setCompanyName(comp?.name || "Your Store");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterLocation]);

  const handleOpenAdd = (parentId: number | null = null) => {
    setEditingItem(null);
    setFormData({
      label: "",
      parent_id: parentId,
      location_id: null,
      link_type: "Internal",
      link_value: "",
      sort_order: flatList.length,
      is_active: 1,
      is_mega_menu: 0
    });
    setShowDialog(true);
  };

  const handleOpenEdit = (item: StorefrontMenuItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.label) {
      toast({ title: "Required", description: "Label is required", variant: "destructive" });
      return;
    }

    try {
      if (editingItem) {
        await updateStorefrontMenu(editingItem.id, formData);
        toast({ title: "Success", description: "Menu item updated" });
      } else {
        await createStorefrontMenu(formData);
        toast({ title: "Success", description: "Menu item created" });
      }
      setShowDialog(false);
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this menu item and all its children?")) return;
    try {
      await deleteStorefrontMenu(id);
      toast({ title: "Deleted", description: "Menu item removed" });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const renderMenuItem = (item: StorefrontMenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id} className="space-y-1">
        <div className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/40 transition-all group ${!item.is_active ? 'opacity-50 grayscale' : ''}`}>
           <div className="flex items-center gap-2 shrink-0">
              <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                 {item.link_type === 'External' ? <ExternalLink className="w-3.5 h-3.5" /> : 
                  item.link_type === 'Category' ? <LayoutGrid className="w-3.5 h-3.5" /> :
                  item.link_type === 'Collection' ? <Box className="w-3.5 h-3.5" /> :
                  item.link_type === 'Heading' ? <Type className="w-3.5 h-3.5" /> :
                  <LinkIcon className="w-3.5 h-3.5" />}
              </div>
           </div>

           <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                 <span className="font-bold text-sm truncate">{item.label}</span>
                 {item.is_mega_menu === 1 && <Badge variant="default" className="text-[8px] h-4 uppercase bg-primary text-primary-foreground gap-1"><Columns className="w-2.5 h-2.5"/> Mega Menu</Badge>}
                 {!item.is_active && <Badge variant="secondary" className="text-[8px] h-4 uppercase">Hidden</Badge>}
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                 <span className="font-black uppercase tracking-tighter text-primary/60">{item.link_type}</span>
                 {item.link_type !== 'Heading' && (
                   <>
                     <span className="opacity-30">•</span>
                     <span className="truncate max-w-[200px]">{item.link_value || '/'}</span>
                   </>
                 )}
                 {item.location_id && (
                   <>
                     <span className="opacity-30">•</span>
                     <span className="flex items-center gap-1 text-primary/80"><Globe className="w-3 h-3" /> {locations.find(l => l.id === item.location_id)?.name || 'Unknown Location'}</span>
                   </>
                 )}
              </div>
           </div>

           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenAdd(item.id)}>
                 <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(item)}>
                 <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                 <Trash2 className="w-4 h-4" />
              </Button>
           </div>
        </div>

        {hasChildren && (
          <div className="pl-12 border-l-2 border-muted/50 ml-6 space-y-1 py-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="Storefront Navigation">
      <div className="flex flex-col gap-6 w-full pb-20 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <span>E-commerce</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground">Navigation Menu</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Storefront Navigation</h1>
              <p className="text-muted-foreground text-sm">Design the header navigation for your public website with support for dropdowns.</p>
           </div>
           <div className="flex items-center gap-2">
               <Button onClick={() => setShowPreview(true)} variant="outline" className="h-11 px-6 font-bold gap-2">
                  <Globe className="w-5 h-5" />
                  Live Preview
               </Button>
               <Button onClick={() => handleOpenAdd()} className="h-11 px-6 font-bold gap-2 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5" />
                  Add Main Link
               </Button>
           </div>
        </div>

        <Card className="border shadow-sm overflow-hidden">
           <CardHeader className="bg-muted/30 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <CardTitle className="text-lg flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-primary" />
                    Menu Structure
                 </CardTitle>
                 <CardDescription>Drag and drop items to reorder. Nest items to create dropdowns.</CardDescription>
              </div>
              <div className="w-full md:w-64">
                 <Select value={filterLocation?.toString() || "all"} onValueChange={(v) => setFilterLocation(v === "all" ? null : parseInt(v))}>
                    <SelectTrigger className="bg-background shadow-sm border-muted-foreground/20 font-semibold">
                       <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">All Locations (Global)</SelectItem>
                       {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
           </CardHeader>
           <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                   <p className="text-sm font-bold text-muted-foreground">Loading menu structure...</p>
                </div>
              ) : tree.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
                   <LinkIcon className="w-12 h-12 mx-auto opacity-10 mb-4" />
                   <p className="text-lg font-bold text-muted-foreground">No menu items yet.</p>
                   <p className="text-sm text-muted-foreground mb-6">Start by adding your first main navigation link.</p>
                   <Button onClick={() => handleOpenAdd()} variant="outline">Create Menu</Button>
                </div>
              ) : (
                <div className="space-y-2">
                   {tree.map(item => renderMenuItem(item))}
                </div>
              )}
           </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
           <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                 <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                 <DialogDescription>
                    Configure how this link appears and where it points to.
                 </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Link Label</Label>
                        <Input 
                            placeholder="e.g. Products, About Us, Mega Sale" 
                            value={formData.label} 
                            onChange={e => setFormData({...formData, label: e.target.value})}
                        />
                     </div>
                     <div className="grid gap-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</Label>
                        <Select 
                            value={formData.location_id?.toString() || "null"} 
                            onValueChange={v => setFormData({...formData, location_id: v === "null" ? null : parseInt(v)})}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder="All Locations" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="null">All Locations</SelectItem>
                              {locations.map(loc => (
                                 <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Link Type</Label>
                        <Select 
                            value={formData.link_type} 
                            onValueChange={v => setFormData({...formData, link_type: v as any, link_value: ""})}
                        >
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Internal">Internal Page</SelectItem>
                              <SelectItem value="Category">Product Category</SelectItem>
                              <SelectItem value="Collection">Collection</SelectItem>
                              <SelectItem value="External">External URL</SelectItem>
                              <SelectItem value="Heading">Column Heading (No Link)</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Parent Menu</Label>
                        <Select 
                            value={formData.parent_id?.toString() || "null"} 
                            onValueChange={v => setFormData({...formData, parent_id: v === "null" ? null : parseInt(v)})}
                        >
                           <SelectTrigger>
                              <SelectValue placeholder="No Parent" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="null">No Parent (Main Link)</SelectItem>
                              {flatList.filter(i => i.id !== editingItem?.id).map(item => (
                                 <SelectItem key={item.id} value={item.id.toString()}>{item.label}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                    </div>
                 </div>

                 <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Destination</Label>
                    {formData.link_type === 'Heading' ? (
                       <div className="p-3 bg-muted/50 rounded-lg border text-xs text-muted-foreground flex items-center gap-2">
                          <Type className="w-4 h-4" /> This item acts as a structural heading. No destination link is required.
                       </div>
                    ) : formData.link_type === 'Internal' ? (
                       <Input placeholder="e.g. /shop, /contact" value={formData.link_value || ""} onChange={e => setFormData({...formData, link_value: e.target.value})} />
                    ) : formData.link_type === 'External' ? (
                       <Input placeholder="https://..." value={formData.link_value || ""} onChange={e => setFormData({...formData, link_value: e.target.value})} />
                    ) : formData.link_type === 'Category' ? (
                       <Select value={formData.link_value || ""} onValueChange={v => setFormData({...formData, link_value: v})}>
                          <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                          <SelectContent>
                             {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    ) : (
                       <Select value={formData.link_value || ""} onValueChange={v => setFormData({...formData, link_value: v})}>
                          <SelectTrigger><SelectValue placeholder="Select Collection" /></SelectTrigger>
                          <SelectContent>
                             {collections.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                        <div className="space-y-0.5">
                           <Label className="text-sm font-bold">Visible on Website</Label>
                           <p className="text-[10px] text-muted-foreground">Enable or disable this link.</p>
                        </div>
                        <Switch 
                           checked={formData.is_active === 1} 
                           onCheckedChange={checked => setFormData({...formData, is_active: checked ? 1 : 0})}
                        />
                     </div>
                     {(!formData.parent_id || formData.parent_id === null) && (
                         <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 border-primary/20">
                            <div className="space-y-0.5">
                               <Label className="text-sm font-bold text-primary">Mega Menu</Label>
                               <p className="text-[10px] text-muted-foreground">Display children as columns.</p>
                            </div>
                            <Switch 
                               checked={formData.is_mega_menu === 1} 
                               onCheckedChange={checked => setFormData({...formData, is_mega_menu: checked ? 1 : 0})}
                            />
                         </div>
                     )}
                 </div>
              </div>
              <DialogFooter className="border-t pt-6">
                 <Button variant="ghost" onClick={() => setShowDialog(false)} className="font-bold">Cancel</Button>
                 <Button onClick={handleSave} className="font-bold px-8">Save Changes</Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

        {/* Live Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
           <DialogContent className="max-w-[1200px] w-[95vw] h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
              <DialogHeader className="p-4 border-b bg-muted/30 shrink-0">
                 <DialogTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Storefront Mega Menu Preview
                 </DialogTitle>
                 <DialogDescription>Hover over the links to see how the mega menu and dropdowns will appear on your public website.</DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-auto bg-muted/10 relative">
                 {/* Simulated Website Header */}
                 <header className="sticky top-0 w-full h-20 border-b flex items-center px-10 gap-10 bg-background text-foreground z-50 shadow-sm">
                    <div className="text-2xl font-black tracking-tight flex-shrink-0">{companyName}</div>
                    
                    <nav className="flex-1 flex items-center gap-8 h-full">
                       {tree.filter(i => i.is_active === 1).map(mainItem => (
                          <div key={mainItem.id} className="h-full flex items-center group relative cursor-pointer">
                             <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors tracking-wide">{mainItem.label}</span>
                             
                             {/* Dropdown / Mega Menu Container */}
                             {mainItem.children && mainItem.children.filter(c => c.is_active === 1).length > 0 && (
                                 <div className="absolute top-full left-0 pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 w-max z-50">
                                    <div className={`bg-card border shadow-xl rounded-b-xl overflow-hidden p-8 ${mainItem.is_mega_menu === 1 ? 'grid grid-cols-4 gap-12 w-screen max-w-[1000px] -ml-[200px]' : 'flex flex-col w-64'}`}>
                                       
                                       {mainItem.is_mega_menu === 1 ? (
                                          // Mega Menu Layout (Columns)
                                          mainItem.children?.filter(c => c.is_active === 1).map(col => (
                                             <div key={col.id} className="flex flex-col gap-4">
                                                <h3 className="text-foreground font-bold text-xs uppercase tracking-widest border-b pb-2">{col.label}</h3>
                                                <div className="flex flex-col gap-3">
                                                   {col.children?.filter(sub => sub.is_active === 1).map(subItem => (
                                                      <span key={subItem.id} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                                         {subItem.label}
                                                      </span>
                                                   ))}
                                                </div>
                                             </div>
                                          ))
                                       ) : (
                                          // Standard Dropdown Layout
                                          <div className="flex flex-col gap-3">
                                             {mainItem.children?.filter(c => c.is_active === 1).map(child => (
                                                <div key={child.id} className="flex flex-col gap-2">
                                                   <span className={`text-sm ${child.link_type === 'Heading' ? 'text-foreground font-bold text-xs uppercase tracking-widest mt-2' : 'text-muted-foreground hover:text-primary transition-colors'}`}>
                                                      {child.label}
                                                   </span>
                                                   {/* 3rd level for standard dropdown */}
                                                   {child.children && child.children.filter(sc => sc.is_active === 1).length > 0 && (
                                                      <div className="pl-4 flex flex-col gap-2 border-l ml-2 mt-1">
                                                         {child.children.filter(sc => sc.is_active === 1).map(subItem => (
                                                            <span key={subItem.id} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                                               {subItem.label}
                                                            </span>
                                                         ))}
                                                      </div>
                                                   )}
                                                </div>
                                             ))}
                                          </div>
                                       )}

                                    </div>
                                 </div>
                             )}
                          </div>
                       ))}
                    </nav>

                    <div className="flex items-center gap-4 text-muted-foreground">
                       <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">🔍</span>
                       <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">🛒</span>
                    </div>
                 </header>
                 
                 {/* Fake Body content */}
                 <div className="p-20 text-center opacity-50 flex flex-col gap-4 items-center">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center text-muted-foreground font-bold">Hero Image</div>
                    <h1 className="text-4xl font-black tracking-tight">Welcome to {companyName}</h1>
                    <p className="max-w-xl mx-auto text-muted-foreground">This is a simulated preview to visualize how your newly configured navigation structure will look and behave on a live storefront using hover states.</p>
                 </div>
              </div>
           </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
