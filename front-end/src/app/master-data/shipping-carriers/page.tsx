"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Truck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  MoreVertical,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default function ShippingCarriersPage() {
  const { toast } = useToast();
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    tracking_url: "",
    is_default: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/shipping-carrier/index`);
      const data = await res.json();
      setCarriers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch carriers", err);
      toast({ title: "Error", description: "Failed to load carriers.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (carrier: any = null) => {
    if (carrier) {
      setEditingCarrier(carrier);
      setFormData({
        name: carrier.name,
        tracking_url: carrier.tracking_url || "",
        is_default: Boolean(Number(carrier.is_default))
      });
    } else {
      setEditingCarrier(null);
      setFormData({
        name: "",
        tracking_url: "",
        is_default: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = editingCarrier 
        ? `${API_BASE_URL}/api/shipping-carrier/update/${editingCarrier.id}`
        : `${API_BASE_URL}/api/shipping-carrier/store`;
      
      const method = editingCarrier ? 'POST' : 'POST'; // Backend simple router uses POST for both usually, or I can check App.php

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({ 
        title: editingCarrier ? "Carrier Updated" : "Carrier Created", 
        description: `Successfully saved ${formData.name}.` 
      });
      setIsModalOpen(false);
      fetchCarriers();
    } catch (err) {
      toast({ title: "Error", description: "Failed to save carrier.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this carrier?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/shipping-carrier/delete/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Carrier Deleted", description: "The carrier has been removed." });
      fetchCarriers();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete carrier.", variant: "destructive" });
    }
  };

  const filteredCarriers = carriers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Shipping Carriers">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">SHIPPING <span className="text-primary">CARRIERS</span></h1>
            <p className="text-muted-foreground text-sm font-medium">Manage logistics partners and tracking integrations.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="font-black px-6 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> ADD NEW CARRIER
          </Button>
        </div>

        <Card className="border-none shadow-xl shadow-muted/20 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search carriers..." 
                className="pl-9 h-10 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20 h-14">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-widest pl-6">Carrier Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest">Tracking URL Template</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-center">Default</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading Master Data...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCarriers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium italic">
                      No shipping carriers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCarriers.map((carrier) => (
                    <TableRow key={carrier.id} className="hover:bg-primary/[0.02] transition-colors border-b last:border-0 group">
                      <TableCell className="py-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                             <Truck className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-black text-base">{carrier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col gap-1 max-w-md">
                          <code className="text-[11px] font-mono bg-muted p-1.5 rounded border text-muted-foreground break-all">
                            {carrier.tracking_url || 'No URL configured'}
                          </code>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                            Use <span className="text-primary font-black">{"{tracking_number}"}</span> as placeholder
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        {Boolean(Number(carrier.is_default)) ? (
                          <Badge className="bg-emerald-600 font-black px-3 py-1 uppercase text-[10px] tracking-widest">
                            <Star className="w-3 h-3 mr-1 fill-white" /> DEFAULT
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/30 font-bold uppercase text-[10px] tracking-widest">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-5 pr-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => handleOpenModal(carrier)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(carrier.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
                <Truck className="w-6 h-6 text-primary" />
                {editingCarrier ? 'EDIT CARRIER' : 'ADD NEW CARRIER'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Carrier Name</Label>
                <Input 
                  id="name" 
                  required
                  placeholder="e.g. CityPak, DHL, Prompt Xpress" 
                  className="h-11 font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tracking URL Template</Label>
                <Input 
                  id="url" 
                  placeholder="https://track.citypak.lk/track?tracking_number={tracking_number}" 
                  className="h-11 font-medium"
                  value={formData.tracking_url}
                  onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                  Tip: Insert <span className="font-bold text-primary">{"{tracking_number}"}</span> where the actual number should go.
                </p>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-muted/50 border border-muted-foreground/10">
                <input 
                  type="checkbox" 
                  id="is_default" 
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
                <div className="grid gap-0.5">
                  <Label htmlFor="is_default" className="text-sm font-black cursor-pointer leading-none">SET AS DEFAULT</Label>
                  <p className="text-[10px] text-muted-foreground font-medium">This carrier will be pre-selected for new orders.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="font-bold" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
              <Button type="submit" className="font-black px-8" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {editingCarrier ? 'UPDATE CARRIER' : 'SAVE CARRIER'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
