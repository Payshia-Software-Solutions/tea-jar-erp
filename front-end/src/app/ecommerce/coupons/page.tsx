"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Ticket, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Calendar, 
  TrendingUp, 
  History, 
  AlertCircle,
  Loader2,
  Tag,
  Users,
  Layers,
  ArrowRight
} from "lucide-react";
import { couponApi } from "@/lib/api/coupons";
import { format } from "date-fns";

export default function CouponsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [showUsage, setShowUsage] = useState(false);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "Percentage",
    discount_value: "0",
    min_order_amount: "0",
    max_discount_amount: "0",
    start_date: "",
    end_date: "",
    max_uses: "0",
    user_limit: "1",
    is_active: 1
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await couponApi.getAll();
      setCoupons(res || []);
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to load coupons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm({
      code: "",
      description: "",
      discount_type: "Percentage",
      discount_value: "0",
      min_order_amount: "0",
      max_discount_amount: "0",
      start_date: "",
      end_date: "",
      max_uses: "0",
      user_limit: "1",
      is_active: 1
    });
    setShowForm(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: String(c.min_order_amount),
      max_discount_amount: String(c.max_discount_amount),
      start_date: c.start_date ? format(new Date(c.start_date), "yyyy-MM-dd'T'HH:mm") : "",
      end_date: c.end_date ? format(new Date(c.end_date), "yyyy-MM-dd'T'HH:mm") : "",
      max_uses: String(c.max_uses),
      user_limit: String(c.user_limit),
      is_active: parseInt(c.is_active)
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.code) return toast({ title: "Code required" });
    try {
      if (editingCoupon) {
        await couponApi.update(editingCoupon.id, form);
        toast({ title: "Updated", description: "Coupon updated successfully" });
      } else {
        await couponApi.create(form);
        toast({ title: "Created", description: "New coupon added" });
      }
      setShowForm(false);
      loadCoupons();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Action failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await couponApi.delete(id);
      toast({ title: "Deleted", description: "Coupon removed" });
      loadCoupons();
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleViewUsage = async (c: any) => {
    setEditingCoupon(c);
    setShowUsage(true);
    setUsageLoading(true);
    try {
      const res = await couponApi.getUsage(c.id);
      setUsageLogs(res || []);
    } catch (e) {
      toast({ title: "Error", description: "Failed to load usage history", variant: "destructive" });
    } finally {
      setUsageLoading(false);
    }
  };

  const filtered = coupons.filter(c => 
    c.code.toLowerCase().includes(query.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <DashboardLayout title="Coupons & Discounts">
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-primary/5">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Coupons</p>
                        <p className="text-2xl font-black">{coupons.filter(c => c.is_active == 1).length}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-emerald-500/5">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Redemptions</p>
                        <p className="text-2xl font-black">{coupons.reduce((acc, c) => acc + parseInt(c.used_count), 0)}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-amber-500/5">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg. Discount</p>
                        <p className="text-2xl font-black">15%</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-muted/50">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-xl text-muted-foreground">
                        <Plus className="w-5 h-5" />
                    </div>
                    <Button variant="ghost" className="p-0 h-auto font-black text-left" onClick={handleOpenCreate}>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Action</p>
                            <p className="text-sm flex items-center gap-1">Create Coupon <ArrowRight className="w-3 h-3" /></p>
                        </div>
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                    placeholder="Search codes..." 
                    className="pl-10" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <Button onClick={handleOpenCreate} className="gap-2 font-bold w-full md:w-auto">
                <Plus className="w-4 h-4" /> New Coupon
            </Button>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="font-bold">Code</TableHead>
                        <TableHead className="font-bold">Discount</TableHead>
                        <TableHead className="font-bold">Usage</TableHead>
                        <TableHead className="font-bold">Validity</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-40 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground opacity-20" />
                            </TableCell>
                        </TableRow>
                    ) : filtered.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-40 text-center">
                                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground opacity-10 mb-2" />
                                <p className="text-sm text-muted-foreground">No coupons found.</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        filtered.map(c => (
                            <TableRow key={c.id} className="group">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-black text-primary tracking-tighter">{c.code}</span>
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{c.description || "No description"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="font-bold">
                                        {c.discount_type === 'Percentage' ? `${c.discount_value}%` : `Rs. ${Number(c.discount_value).toLocaleString()}`}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">{c.used_count} <span className="text-[10px] text-muted-foreground font-normal">/ {c.max_uses == 0 ? '∞' : c.max_uses}</span></span>
                                            <div className="w-20 h-1 bg-muted rounded-full overflow-hidden mt-1">
                                                <div 
                                                    className="h-full bg-primary" 
                                                    style={{ width: `${c.max_uses == 0 ? 0 : (parseInt(c.used_count) / parseInt(c.max_uses) * 100)}%` }} 
                                                />
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleViewUsage(c)}>
                                            <History className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-[11px]">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" /> {c.start_date ? format(new Date(c.start_date), "MMM d") : "Anytime"}</span>
                                        <span className="flex items-center gap-1 text-muted-foreground">to {c.end_date ? format(new Date(c.end_date), "MMM d") : "Indefinite"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={c.is_active == 1 ? "bg-emerald-500" : "bg-muted text-muted-foreground"}>
                                        {c.is_active == 1 ? "Active" : "Disabled"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenEdit(c)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Tag className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                            <DialogDescription>Configure discount rules and usage limits.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-4">
                    <div className="col-span-2 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Coupon Code</Label>
                        <Input 
                            placeholder="e.g. SUMMER2024" 
                            className="font-black text-primary uppercase placeholder:lowercase" 
                            value={form.code}
                            onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                        <Input 
                            placeholder="Internal note or customer visible text" 
                            value={form.description}
                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discount Type</Label>
                        <Select 
                            value={form.discount_type} 
                            onValueChange={(v) => setForm(prev => ({ ...prev, discount_type: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                <SelectItem value="FixedAmount">Fixed Amount (LKR)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discount Value</Label>
                        <Input 
                            type="number" 
                            value={form.discount_value}
                            onChange={(e) => setForm(prev => ({ ...prev, discount_value: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Min. Order Amount</Label>
                        <Input 
                            type="number" 
                            value={form.min_order_amount}
                            onChange={(e) => setForm(prev => ({ ...prev, min_order_amount: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Max. Discount (0=∞)</Label>
                        <Input 
                            type="number" 
                            value={form.max_discount_amount}
                            onChange={(e) => setForm(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Start Date</Label>
                        <Input 
                            type="datetime-local" 
                            value={form.start_date}
                            onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">End Date</Label>
                        <Input 
                            type="datetime-local" 
                            value={form.end_date}
                            onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Global Limit (0=∞)</Label>
                        <Input 
                            type="number" 
                            value={form.max_uses}
                            onChange={(e) => setForm(prev => ({ ...prev, max_uses: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Per User Limit</Label>
                        <Input 
                            type="number" 
                            value={form.user_limit}
                            onChange={(e) => setForm(prev => ({ ...prev, user_limit: e.target.value }))}
                        />
                    </div>

                    <div className="col-span-2 flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                        <div className="space-y-0.5">
                            <Label className="font-bold">Active Status</Label>
                            <p className="text-[10px] text-muted-foreground">Enable or disable this coupon immediately.</p>
                        </div>
                        <Switch 
                            checked={form.is_active === 1} 
                            onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v ? 1 : 0 }))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} className="font-bold">
                        {editingCoupon ? "Save Changes" : "Create Coupon"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Usage History Dialog */}
        <Dialog open={showUsage} onOpenChange={setShowUsage}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <History className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <DialogTitle>Redemption History</DialogTitle>
                            <DialogDescription>Usage logs for coupon <span className="font-bold text-foreground">{editingCoupon?.code}</span></DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Used At</TableHead>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Saved</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usageLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></TableCell>
                                    </TableRow>
                                ) : usageLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">No usage recorded yet.</TableCell>
                                    </TableRow>
                                ) : (
                                    usageLogs.map((log: any) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs">{format(new Date(log.used_at), "MMM d, yyyy HH:mm")}</TableCell>
                                            <TableCell className="font-bold">{log.order_no}</TableCell>
                                            <TableCell className="text-xs">{log.customer_name || "Guest"}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">Rs. {Number(log.discount_amount).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
