"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchAttributeGroups, createAttributeGroup, updateAttributeGroup, deleteAttributeGroup,
  fetchAttributes, createAttribute, updateAttribute, deleteAttribute 
} from "@/lib/api";
import { Plus, Search, Trash2, Pencil, Loader2, ListTree, Tags, Layers, ChevronRight, Settings2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AttributesPage() {
  const { toast } = useToast();
  
  // State for Groups
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  
  // State for Attributes
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  
  // Dialogs
  const [groupDialog, setGroupDialog] = useState({ open: false, id: null as number | null, name: "", sort: "0" });
  const [attrDialog, setAttrDialog] = useState({ open: false, id: null as number | null, name: "", type: "text", sort: "0" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const data = await fetchAttributeGroups();
      const list = Array.isArray(data) ? data : [];
      setGroups(list);
      if (list.length > 0 && !selectedGroupId) {
        setSelectedGroupId(list[0].id);
      }
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to load groups", variant: "destructive" });
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadAttributes = async (gid: number) => {
    setLoadingAttributes(true);
    try {
      const data = await fetchAttributes(gid);
      setAttributes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to load attributes", variant: "destructive" });
    } finally {
      setLoadingAttributes(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadAttributes(selectedGroupId);
    } else {
      setAttributes([]);
    }
  }, [selectedGroupId]);

  // --- Group Handlers ---
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupDialog.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = { name: groupDialog.name.trim(), sort_order: parseInt(groupDialog.sort) || 0 };
      if (groupDialog.id) {
        await updateAttributeGroup(groupDialog.id, payload);
        toast({ title: "Updated", description: "Group updated" });
      } else {
        await createAttributeGroup(payload);
        toast({ title: "Created", description: "Group added" });
      }
      setGroupDialog(p => ({ ...p, open: false }));
      await loadGroups();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("Delete this group and all its attributes?")) return;
    try {
      await deleteAttributeGroup(id);
      toast({ title: "Deleted", description: "Group removed" });
      if (selectedGroupId === id) setSelectedGroupId(null);
      await loadGroups();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // --- Attribute Handlers ---
  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrDialog.name.trim() || !selectedGroupId) return;
    setIsSubmitting(true);
    try {
      const payload = { 
        name: attrDialog.name.trim(), 
        group_id: selectedGroupId,
        type: attrDialog.type,
        sort_order: parseInt(attrDialog.sort) || 0 
      };
      if (attrDialog.id) {
        await updateAttribute(attrDialog.id, payload);
        toast({ title: "Updated", description: "Attribute updated" });
      } else {
        await createAttribute(payload);
        toast({ title: "Created", description: "Attribute added" });
      }
      setAttrDialog(p => ({ ...p, open: false }));
      await loadAttributes(selectedGroupId);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttribute = async (id: number) => {
    if (!confirm("Delete this attribute?")) return;
    try {
      await deleteAttribute(id);
      toast({ title: "Deleted", description: "Attribute removed" });
      if (selectedGroupId) await loadAttributes(selectedGroupId);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Technical Specifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">Define custom attribute groups and fields for your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setGroupDialog({ open: true, id: null, name: "", sort: "0" })} className="gap-2">
                <Plus className="w-4 h-4" /> Add Group
            </Button>
            {selectedGroupId && (
                <Button onClick={() => setAttrDialog({ open: true, id: null, name: "", type: "text", sort: "0" })} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Attribute
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Pane: Groups */}
        <div className="lg:col-span-4 space-y-4">
           <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="w-3 h-3" /> Attribute Groups
              </h2>
           </div>
           
           <div className="space-y-2">
              {loadingGroups ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
              ) : groups.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground text-sm italic">
                  No groups yet
                </div>
              ) : (
                groups.map(g => (
                  <div 
                    key={g.id} 
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${selectedGroupId === g.id ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-sm' : 'bg-background hover:bg-muted/30 border-border/50'}`}
                    onClick={() => setSelectedGroupId(g.id)}
                  >
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedGroupId === g.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                           <Settings2 className="w-4 h-4" />
                        </div>
                        <div>
                           <p className={`font-bold text-sm ${selectedGroupId === g.id ? 'text-primary' : 'text-foreground'}`}>{g.name}</p>
                           <p className="text-[10px] text-muted-foreground font-mono">ORDER: {g.sort_order}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => {
                            e.stopPropagation();
                            setGroupDialog({ open: true, id: g.id, name: g.name, sort: String(g.sort_order) });
                        }}>
                            <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(g.id);
                        }}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                        <ChevronRight className={`w-4 h-4 ml-1 ${selectedGroupId === g.id ? 'text-primary' : 'text-muted-foreground/30'}`} />
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Right Pane: Attributes */}
        <div className="lg:col-span-8">
           <Card className="border-none shadow-xl bg-muted/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                 <div>
                    <CardTitle className="text-lg">Attributes</CardTitle>
                    <CardDescription>Fields assigned to {groups.find(g => g.id === selectedGroupId)?.name || "selected group"}</CardDescription>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 {loadingAttributes ? (
                    <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary/30" /></div>
                 ) : !selectedGroupId ? (
                    <div className="py-20 text-center text-muted-foreground italic">Select a group to manage its attributes</div>
                 ) : attributes.length === 0 ? (
                    <div className="py-20 text-center border-t">
                        <ListTree className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-muted-foreground font-medium">This group has no attributes yet</p>
                        <Button variant="link" className="mt-2 text-primary" onClick={() => setAttrDialog({ open: true, id: null, name: "", type: "text", sort: "0" })}>
                            Create the first attribute
                        </Button>
                    </div>
                 ) : (
                    <Table>
                        <TableHeader className="bg-muted/50 border-t">
                            <TableRow>
                                <TableHead className="w-[300px]">Field Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Sort Order</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attributes.map(a => (
                                <TableRow key={a.id} className="hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-bold">{a.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize text-[10px] font-bold tracking-wider">{a.type}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{a.sort_order}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                                                setAttrDialog({ open: true, id: a.id, name: a.name, type: a.type, sort: String(a.sort_order) });
                                            }}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteAttribute(a.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      {/* Group Dialog */}
      <Dialog open={groupDialog.open} onOpenChange={(v) => setGroupDialog(p => ({ ...p, open: v }))}>
         <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveGroup}>
               <DialogHeader>
                  <DialogTitle>{groupDialog.id ? "Edit Group" : "Add Attribute Group"}</DialogTitle>
                  <DialogDescription>Groups help organize specifications (e.g., Physical, Engine, Electrical)</DialogDescription>
               </DialogHeader>
               <div className="grid gap-5 py-6">
                  <div className="space-y-2">
                     <Label>Group Name</Label>
                     <Input 
                        value={groupDialog.name} 
                        onChange={e => setGroupDialog(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Mechanical Specs"
                        required
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Sort Order</Label>
                     <Input 
                        type="number"
                        value={groupDialog.sort} 
                        onChange={e => setGroupDialog(p => ({ ...p, sort: e.target.value }))}
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setGroupDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                     {groupDialog.id ? "Update Group" : "Create Group"}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Attribute Dialog */}
      <Dialog open={attrDialog.open} onOpenChange={(v) => setAttrDialog(p => ({ ...p, open: v }))}>
         <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveAttribute}>
               <DialogHeader>
                  <DialogTitle>{attrDialog.id ? "Edit Attribute" : "Add Attribute Field"}</DialogTitle>
                  <DialogDescription>Define a specific specification field for the {groups.find(g => g.id === selectedGroupId)?.name} group</DialogDescription>
               </DialogHeader>
               <div className="grid gap-5 py-6">
                  <div className="space-y-2">
                     <Label>Field Name</Label>
                     <Input 
                        value={attrDialog.name} 
                        onChange={e => setAttrDialog(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Horsepower, Material, Voltage"
                        required
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Input Type</Label>
                     <Select value={attrDialog.type} onValueChange={v => setAttrDialog(p => ({ ...p, type: v }))}>
                        <SelectTrigger>
                           <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="text">Text</SelectItem>
                           <SelectItem value="number">Number</SelectItem>
                           <SelectItem value="textarea">Para (Textarea)</SelectItem>
                           <SelectItem value="list">List (Comma separated)</SelectItem>
                           <SelectItem value="icon-text">Icon Text</SelectItem>
                           <SelectItem value="badge">Badge (Comma separated)</SelectItem>
                           <SelectItem value="boolean">Yes/No (Boolean)</SelectItem>
                           <SelectItem value="selection">Selection List</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label>Sort Order</Label>
                     <Input 
                        type="number"
                        value={attrDialog.sort} 
                        onChange={e => setAttrDialog(p => ({ ...p, sort: e.target.value }))}
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setAttrDialog(p => ({ ...p, open: false }))}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                     {attrDialog.id ? "Update Attribute" : "Create Attribute"}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
