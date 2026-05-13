"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  ShoppingCart, 
  Eye, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle,
  Truck,
  CreditCard,
  Banknote,
  ChevronRight,
  FileText,
  Printer,
  MapPin,
  Loader2,
  Package,
  Calendar,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { fetchOnlineOrder } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function OrderViewPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [carriers, setCarriers] = useState<any[]>([]);

  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  useEffect(() => {
    if (id) {
      fetchDetails();
      fetchCarriers();
    }
  }, [id]);

  const fetchCarriers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shipping-carrier/index`);
      const data = await res.json();
      setCarriers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch carriers", err);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchOnlineOrder(id as string);
      setOrder(data);
      if (data.shipping_carrier) {
        setCarrier(data.shipping_carrier);
      }
      if (data.tracking_no) setTrackingNo(data.tracking_no);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch order details", err);
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    try {
      setDispatching(true);
      const response = await fetch(`${API_BASE_URL}/api/online-order/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          carrier,
          tracking_no: trackingNo
        })
      });

      if (!response.ok) throw new Error("Failed to dispatch");

      toast({
        title: "Order Dispatched",
        description: "Status updated to Shipped and customer notified.",
      });
      
      setDispatchOpen(false);
      fetchDetails();
    } catch (err) {
      toast({
        title: "Dispatch Failed",
        description: "Could not update order status.",
        variant: "destructive"
      });
    } finally {
      setDispatching(false);
    }
  };

  const getTrackingLink = () => {
    if (!order?.tracking_no || !order?.shipping_carrier) return null;
    const carrierObj = carriers.find(c => c.name === order.shipping_carrier);
    if (!carrierObj || !carrierObj.tracking_url) return null;
    return carrierObj.tracking_url.replace('{tracking_number}', order.tracking_no);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    return (
      <Badge 
        variant="outline" 
        className={`text-xs uppercase font-bold px-3 py-1 ${
          s === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
          s === 'processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
          s === 'shipped' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
          s === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
          ''
        }`}
      >
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Order Details">
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Retrieving Order Data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title="Order Not Found">
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">Order Not Found</p>
          <Button onClick={() => router.push('/ecommerce/orders')}>Back to Orders</Button>
        </div>
      </DashboardLayout>
    );
  }

  const customerDetails = order.customer_details_json ? JSON.parse(order.customer_details_json) : {};

  return (
    <DashboardLayout title={`Order #${order.order_no}`}>
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full border-muted-foreground/20 hover:bg-muted"
                onClick={() => router.push('/ecommerce/orders')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tighter">ORDER <span className="text-primary">#{order.order_no}</span></h1>
                {getStatusBadge(order.order_status)}
              </div>
              <p className="text-muted-foreground text-sm font-medium flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" /> Placed on {format(new Date(order.created_at), "PPPP 'at' p")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-10 font-bold px-6 border-muted-foreground/20 shadow-sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print Order
            </Button>
            
            {order.order_status?.toLowerCase() !== 'shipped' && order.order_status?.toLowerCase() !== 'completed' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 font-bold px-6 border-primary text-primary hover:bg-primary/5"
                onClick={() => {
                  if (!order.shipping_carrier) {
                    const def = carriers.find(c => Boolean(Number(c.is_default)));
                    if (def) setCarrier(def.name);
                  }
                  toast({ title: "Dispatching...", description: "Opening fulfillment dialog." });
                  setDispatchOpen(true);
                }}
              >
                <Truck className="w-4 h-4 mr-2" /> Dispatch Order
              </Button>
            )}

            <Button 
                size="sm" 
                className="h-10 font-bold px-6 shadow-lg shadow-primary/20"
                onClick={() => router.push(`/cms/invoices/create/online/${order.id}`)}
            >
              <FileText className="w-4 h-4 mr-2" /> Generate Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Items Card */}
            <Card className="border-none shadow-xl shadow-muted/20 overflow-hidden bg-background/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-muted/30 p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="border-muted/50 hover:bg-transparent">
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4">Product</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Qty</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Price</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item: any) => (
                      <TableRow key={item.id} className="border-muted/30 hover:bg-muted/5 transition-colors">
                        <TableCell className="py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-bold text-base block">{item.description}</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1 block">SKU: {item.item_id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-black text-lg">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">Rs. {Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-black text-primary">Rs. {Number(item.line_total).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="p-8 bg-muted/10 border-t flex flex-col items-end space-y-3">
                <div className="w-full max-w-[300px] space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>Items Subtotal</span>
                    <span>Rs. {(order.items?.reduce((acc: number, item: any) => acc + (Number(item.line_total) || 0), 0) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>Shipping & Handling</span>
                    <span>Rs. {Number(order.shipping_fee || 0).toFixed(2)}</span>
                  </div>
                  {Number(order.coupon_discount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-bold">
                      <span>Coupon ({order.coupon_code})</span>
                      <span>- Rs. {Number(order.coupon_discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-muted-foreground/10 my-2" />
                  <div className="flex justify-between items-center text-2xl">
                    <span className="font-black uppercase tracking-tighter">Grand Total</span>
                    <span className="font-black text-primary tracking-tighter">Rs. {Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Details */}
            <Card className="border-none shadow-xl shadow-muted/20 overflow-hidden bg-background/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/30 p-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Payment Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Method</label>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black px-3 py-1 uppercase text-xs">
                                        {order.payment_method}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Status</label>
                                <Badge className={order.payment_status.toLowerCase() === 'paid' ? 'bg-emerald-600' : 'bg-amber-500'}>
                                    {order.payment_status}
                                </Badge>
                            </div>
                        </div>
                        {order.payment_method?.toLowerCase() === 'bank' && order.payment_slip && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Payment Proof (Slip)</label>
                                <div className="relative group rounded-xl overflow-hidden border border-muted/50 cursor-pointer" onClick={() => window.open(`${API_BASE_URL}/${order.payment_slip}`, '_blank')}>
                                    <img 
                                        src={`${API_BASE_URL}/${order.payment_slip}`} 
                                        alt="Slip" 
                                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ExternalLink className="text-white w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Customer Details */}
            <Card className="border-none shadow-xl shadow-muted/20 overflow-hidden bg-background/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/30 p-6">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                        <ChevronRight className="w-4 h-4 text-primary" />
                        Customer Intel
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-xl font-black">
                            {order.customer_name?.charAt(0)}
                        </div>
                        <div>
                            <p className="font-black text-lg leading-tight">{order.customer_name}</p>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{order.location_name}</p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-muted">
                        <div className="flex items-center gap-3 text-sm font-medium">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <ExternalLink className="w-4 h-4" />
                            </div>
                            <span className="truncate">{customerDetails.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Truck className="w-4 h-4" />
                            </div>
                            <span>{customerDetails.phone}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Shipping Info */}
            <div className="grid grid-cols-1 gap-8">
                <Card className="border-none shadow-xl shadow-muted/20 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="border-b bg-gray-50/50 p-6">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4 text-primary" />
                            Shipping Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Truck className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Delivery Address</p>
                                <p className="text-base font-bold leading-relaxed text-gray-700">{order.shipping_address}</p>
                            </div>
                        </div>

                        {order.tracking_no && (
                          <div className="pt-6 border-t border-muted/50">
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Tracking Detail</p>
                                {getTrackingLink() && (
                                  <a 
                                    href={getTrackingLink()!} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Track Order
                                  </a>
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-muted-foreground">{order.shipping_carrier || 'Standard Shipping'}</p>
                                <p className="text-lg font-black tracking-tight text-primary">{order.tracking_no}</p>
                              </div>
                            </div>
                          </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-muted/20 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardHeader className="border-b bg-gray-50/50 p-6">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-gray-500">
                            <FileText className="w-4 h-4 text-primary" />
                            Billing Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Billing Address</p>
                                <p className="text-base font-bold leading-relaxed text-gray-700">{order.billing_address || order.shipping_address || 'Same as shipping'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dispatchOpen} onOpenChange={setDispatchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              DISPATCH ORDER
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Enter shipping details to mark this order as shipped. The customer will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="carrier" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Shipping Carrier</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger id="carrier" className="h-11 font-medium">
                  <SelectValue placeholder="Select a carrier" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map((c: any) => (
                    <SelectItem key={c.id} value={c.name} className="font-medium">
                      {c.name} {Boolean(Number(c.is_default)) && "(Default)"}
                    </SelectItem>
                  ))}
                  {carriers.length === 0 && (
                    <SelectItem value="manual" disabled>No carriers configured in Master</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tracking Number / Waybill</Label>
              <Input 
                id="tracking" 
                placeholder="Enter tracking number" 
                className="h-11 font-black tracking-wider"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="font-bold" onClick={() => setDispatchOpen(false)}>Cancel</Button>
            <Button 
              className="font-black px-8" 
              onClick={handleDispatch}
              disabled={dispatching || !trackingNo}
            >
              {dispatching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              CONFIRM DISPATCH
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
