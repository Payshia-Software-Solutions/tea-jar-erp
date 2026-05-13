"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  MoreVertical, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Truck,
  CreditCard,
  Banknote,
  ChevronRight,
  FileText,
  Printer,
  TrendingUp,
  MapPin,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fetchOnlineOrders, fetchOnlineOrder } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function OnlineOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState<any>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [carriers, setCarriers] = useState<any[]>([]);

  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  useEffect(() => {
    fetchOrders();
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shipping-carrier/index`);
      const data = await res.json();
      setCarriers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch carriers", err);
    }
  };

  const getTrackingLink = (order: any) => {
    if (!order?.tracking_no || !order?.shipping_carrier) return null;
    const carrierObj = carriers.find(c => c.name === order.shipping_carrier);
    if (!carrierObj || !carrierObj.tracking_url) return null;
    return carrierObj.tracking_url.replace('{tracking_number}', order.tracking_no);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetchOnlineOrders();
      const data = res.status === 'success' ? res.data : [];
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string | number) => {
    try {
      setLoadingDetails(true);
      setShowOrderModal(true);
      const data = await fetchOnlineOrder(id);
      setSelectedOrder(data);
      setLoadingDetails(false);
    } catch (err) {
      console.error("Failed to fetch order details", err);
      setLoadingDetails(false);
      setShowOrderModal(false);
    }
  };

  const handleDispatch = async () => {
    if (!dispatchOrder) return;
    try {
      setDispatching(true);
      const response = await fetch(`${API_BASE_URL}/api/online-order/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dispatchOrder.id,
          carrier,
          tracking_no: trackingNo
        })
      });

      if (!response.ok) throw new Error("Failed to dispatch");

      setDispatchOpen(false);
      setCarrier("");
      setTrackingNo("");
      fetchOrders();
    } catch (err) {
      console.error("Dispatch Failed", err);
    } finally {
      setDispatching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    return (
      <Badge 
        variant="outline" 
        className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
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
  
  const getPaymentMethodIcon = (method: string, slip?: string) => {
    const m = method?.toLowerCase();
    if (m === 'ipg' || m === 'payhere') {
      return <img src="/payhere.png" alt="PayHere" className="h-4 w-auto" />;
    }
    if (m === 'mintpay') {
      return (
        <Badge variant="outline" className="bg-emerald-500 text-white border-none font-black text-[9px] h-5 px-1.5 flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          MINTPAY
        </Badge>
      );
    }
    if (m === 'cod' || m.includes('cash')) {
      return (
        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground font-black text-[9px] h-5 px-1.5 flex items-center gap-1">
          <Banknote className="w-3 h-3" />
          COD
        </Badge>
      );
    }
    if (m === 'bank' || m.includes('transfer')) {
      return (
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="border-amber-500/30 text-amber-600 font-black text-[9px] h-5 px-1.5 flex items-center gap-1">
            <Banknote className="w-3 h-3" />
            BANK
          </Badge>
          {slip && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-1.5 text-[9px] font-bold text-primary hover:bg-primary/10 flex items-center gap-1 uppercase tracking-tighter"
              onClick={() => {
                setSelectedSlip(slip);
                setShowSlipModal(true);
              }}
            >
              <Eye className="w-2.5 h-2.5" /> Slip
            </Button>
          )}
        </div>
      );
    }
    return <span className="text-[10px] font-bold uppercase">{method}</span>;
  };

  const getPaymentBadge = (order: any) => {
    const isPaid = order.payment_status.toLowerCase() === "paid";
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={isPaid ? "default" : "outline"} 
          className={`text-[10px] uppercase font-bold ${isPaid ? "bg-emerald-600 hover:bg-emerald-600" : "text-muted-foreground border-dashed"}`}
        >
          {order.payment_status}
        </Badge>
        {getPaymentMethodIcon(order.payment_method, order.payment_slip)}
      </div>
    );
  };

  const filteredOrders = orders.filter(order => 
    order.order_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout title="E-commerce Online Orders">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Online Orders</h1>
            <p className="text-muted-foreground text-sm">Fulfill orders from your storefront.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 font-bold">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button size="sm" className="h-9 font-bold">
              <Printer className="w-4 h-4 mr-2" /> Batch Print
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-9 h-10 bg-background"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-10 font-bold gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider h-12">Order</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider h-12">Customer</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider h-12 hidden md:table-cell">Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider h-12">Payment</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider h-12 text-center">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider h-12 text-right">Total</TableHead>
                  <TableHead className="w-[80px] h-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-xs text-muted-foreground font-bold">Syncing...</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/5 transition-colors group">
                      <TableCell className="py-3">
                         <div className="flex flex-col gap-1">
                            <span className="font-bold text-primary text-sm">#{order.order_no}</span>
                            {order.invoice_no && (
                              <button 
                                onClick={() => router.push(`/cms/invoices/${order.invoice_id}/view`)}
                                className="flex items-center gap-1 w-fit bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors group/inv"
                              >
                                <FileText className="w-2.5 h-2.5 text-muted-foreground group-hover/inv:text-primary" />
                                <span className="text-[9px] font-black text-muted-foreground group-hover/inv:text-primary uppercase tracking-tight">
                                  {order.invoice_no}
                                </span>
                              </button>
                            )}
                         </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{order.customer_name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">{order.location_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{format(new Date(order.created_at), "MMM dd")}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(order.created_at), "hh:mm a")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {getPaymentBadge(order)}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {getStatusBadge(order.order_status)}
                          {order.tracking_no && (
                            <div className="flex flex-col items-center">
                              {getTrackingLink(order) ? (
                                <a 
                                  href={getTrackingLink(order)!} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-tighter"
                                >
                                  <Truck className="w-2.5 h-2.5" /> {order.tracking_no}
                                </a>
                              ) : (
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                  {order.tracking_no}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold text-sm">
                        Rs. {Number(order.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleViewDetails(order.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => router.push(`/cms/invoices/create/online/${order.id}`)}
                                className="font-bold text-sm cursor-pointer"
                              >
                                <FileText className="w-4 h-4 mr-2" /> Generate Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setDispatchOrder(order);
                                  // Pre-fill existing or set default
                                  if (order.shipping_carrier) {
                                    setCarrier(order.shipping_carrier);
                                  } else {
                                    const def = carriers.find(c => Boolean(Number(c.is_default)));
                                    setCarrier(def ? def.name : "");
                                  }
                                  setTrackingNo(order.tracking_no || "");
                                  setTimeout(() => {
                                    setDispatchOpen(true);
                                  }, 100);
                                }}
                                className="font-bold text-sm cursor-pointer"
                              >
                                <Truck className="w-4 h-4 mr-2 text-indigo-500" /> Dispatch Order
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="font-bold text-sm cursor-pointer text-destructive">
                                <AlertCircle className="w-4 h-4 mr-2" /> Reject Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="p-4 border-t bg-muted/20 flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Page {currentPage} of {totalPages || 1}
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-4 font-bold text-xs" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-4 font-bold text-xs" 
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showSlipModal} onOpenChange={setShowSlipModal}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-gray-200 shadow-2xl">
          <DialogHeader className="p-4 border-b border-gray-100 bg-gray-50">
            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-gray-500">Payment Proof (Slip)</DialogTitle>
          </DialogHeader>
          <div className="p-2 bg-gray-100 flex items-center justify-center min-h-[400px]">
             {selectedSlip ? (
                <img 
                  src={`${API_BASE_URL}/${selectedSlip}`} 
                  alt="Payment Slip" 
                  className="max-w-full max-h-[80vh] object-contain shadow-xl rounded-md"
                />
             ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-xs font-bold uppercase tracking-widest">No slip file found</p>
                </div>
             )}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button 
              variant="outline" 
              className="font-bold text-xs uppercase tracking-widest border-gray-300 hover:bg-white text-gray-700"
              onClick={() => setShowSlipModal(false)}
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl bg-white">
          <DialogHeader className="p-6 border-b bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Order #{selectedOrder?.order_no || '...'}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {selectedOrder && getStatusBadge(selectedOrder.order_status)}
                  <span className="text-xs text-gray-500 font-medium">
                    Placed on {selectedOrder?.created_at ? format(new Date(selectedOrder.created_at), "PPP p") : '...'}
                  </span>
                </div>
              </div>
              {selectedOrder && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 mr-8"
                  onClick={() => router.push(`/ecommerce/orders/view/${selectedOrder.id}`)}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-2" /> Open in separate page
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="p-6 space-y-8">
            {loadingDetails ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Order Intel...</p>
              </div>
            ) : (
              <>
                {/* Section 1: Customer Info */}
                <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                        {selectedOrder?.customer_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-base text-gray-900 leading-tight">{selectedOrder?.customer_name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{selectedOrder?.location_name}</p>
                      </div>
                    </div>
                    {selectedOrder?.customer_details_json && (
                       <div className="text-right">
                          <p className="text-xs font-bold text-gray-600 truncate">{JSON.parse(selectedOrder.customer_details_json).email}</p>
                          <p className="text-[10px] font-black text-primary mt-1">{JSON.parse(selectedOrder.customer_details_json).phone}</p>
                       </div>
                    )}
                  </div>
                </Card>

                {/* Section 2: Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="pb-3 border-b bg-gray-50/30">
                      <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 text-primary" />
                        Shipping Destination
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed font-semibold text-gray-700">{selectedOrder?.shipping_address || 'No shipping address provided'}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="pb-3 border-b bg-gray-50/30">
                      <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Billing Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed font-semibold text-gray-700">{selectedOrder?.billing_address || selectedOrder?.shipping_address || 'Same as shipping'}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Section 2: Order Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Order Items ({selectedOrder?.items?.length || 0})</h3>
                    <div className="h-px flex-1 mx-4 bg-gray-100" />
                  </div>
                  
                  <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-bold text-[10px] uppercase h-10 text-gray-600">Product</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase h-10 text-center text-gray-600">Qty</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase h-10 text-right text-gray-600">Price</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase h-10 text-right text-gray-600">Discount</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase h-10 text-right text-gray-600">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder?.items?.map((item: any) => (
                          <TableRow key={item.id} className="border-gray-100">
                            <TableCell className="py-4">
                              <span className="font-bold text-sm block text-gray-900">{item.description}</span>
                              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">SKU: {item.item_id}</span>
                            </TableCell>
                            <TableCell className="text-center font-black text-gray-700">{Number(item.quantity).toFixed(4)}</TableCell>
                            <TableCell className="text-right font-semibold text-gray-600">Rs. {Number(item.unit_price).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">- Rs. {Number(item.discount || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-gray-900">Rs. {Number(item.line_total).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Section 3: Summary */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <div className="w-full max-w-[300px] space-y-3">
                    <div className="flex justify-between text-sm text-gray-500 font-semibold">
                      <span>Subtotal</span>
                      <span className="text-gray-900">Rs. {Number(selectedOrder?.subtotal_amount || 0).toFixed(2)}</span>
                    </div>

                    {(() => {
                      const lineDiscountsTotal = selectedOrder?.items?.reduce((acc: number, item: any) => acc + (Number(item.discount || 0) * Number(item.quantity || 0)), 0) || 0;
                      if (lineDiscountsTotal > 0) {
                        return (
                          <div className="flex justify-between text-sm text-emerald-600 font-bold">
                            <span>Line Discounts</span>
                            <span>- Rs. {lineDiscountsTotal.toFixed(2)}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {(() => {
                      const taxDetails = selectedOrder?.tax_details_json ? JSON.parse(selectedOrder.tax_details_json) : [];
                      if (!Array.isArray(taxDetails) || taxDetails.length === 0) {
                        return Number(selectedOrder?.tax_total || 0) > 0 ? (
                          <div className="flex justify-between text-sm text-gray-500 font-semibold">
                            <span>Taxes</span>
                            <span className="text-gray-900">Rs. {Number(selectedOrder?.tax_total).toFixed(2)}</span>
                          </div>
                        ) : null;
                      }

                      const base = Number(selectedOrder?.subtotal_amount || 0);
                      let currentSubtotal = base;
                      const breakdown: any[] = [];

                      // Sort taxes by sort_order or id to ensure consistent compounding
                      const sortedTaxes = [...taxDetails].sort((a, b) => (Number(a.sort_order || 0) - Number(b.sort_order || 0)) || (a.id - b.id));

                      sortedTaxes.forEach(tax => {
                        let amount = 0;
                        
                        if (tax.amount !== undefined) {
                          // Use the amount stored in the database record
                          amount = Number(tax.amount);
                        } else {
                          // Recalculate for legacy orders that don't have the amount stored
                          const rate = Number(tax.rate_percent) / 100;
                          if (tax.apply_on === 'base_plus_previous') {
                            amount = currentSubtotal * rate;
                            currentSubtotal += amount;
                          } else {
                            amount = base * rate;
                          }
                        }
                        
                        if (amount > 0) {
                          breakdown.push({ name: tax.name, amount });
                        }
                      });

                      return breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider pl-4">
                          <span>{b.name}</span>
                          <span>Rs. {b.amount.toFixed(2)}</span>
                        </div>
                      ));
                    })()}

                    <div className="flex justify-between text-sm text-gray-500 font-semibold">
                      <span>Shipping</span>
                      <span className="text-gray-900">Rs. {Number(selectedOrder?.shipping_fee || 0).toFixed(2)}</span>
                    </div>
                    {Number(selectedOrder?.coupon_discount || 0) > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600 font-bold">
                        <span>Coupon ({selectedOrder?.coupon_code})</span>
                        <span>- Rs. {Number(selectedOrder?.coupon_discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-lg">
                      <span className="font-black uppercase tracking-tighter text-gray-900">Total</span>
                      <span className="font-black text-primary">Rs. {Number(selectedOrder?.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="p-6 bg-gray-50 border-t flex items-center justify-between sticky bottom-0 backdrop-blur-md">
            <Button 
              variant="outline" 
              className="font-bold uppercase tracking-widest text-xs border-gray-300 h-11 text-gray-700 hover:bg-white"
              onClick={() => setShowOrderModal(false)}
            >
              Close Details
            </Button>
            <div className="flex items-center gap-3">
              {selectedOrder?.payment_method?.toLowerCase() === 'bank' && selectedOrder?.payment_slip && (
                 <Button 
                  variant="outline" 
                  className="h-11 font-bold uppercase tracking-widest text-xs border-amber-500/50 text-amber-600 hover:bg-amber-500/5"
                  onClick={() => {
                    setSelectedSlip(selectedOrder.payment_slip);
                    setShowSlipModal(true);
                  }}
                 >
                   View Payment Slip
                 </Button>
              )}
              <Button 
                className="h-11 font-black uppercase tracking-widest text-xs px-8 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
                onClick={() => {
                  setShowOrderModal(false);
                  router.push(`/cms/invoices/create/online/${selectedOrder.id}`);
                }}
              >
                Proceed to Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={dispatchOpen} onOpenChange={setDispatchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              DISPATCH ORDER
            </DialogTitle>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
              Order #{dispatchOrder?.order_no}
            </div>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label htmlFor="list-carrier" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Shipping Carrier</label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger id="list-carrier" className="h-11 font-medium">
                  <SelectValue placeholder="Select a carrier" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map((c) => (
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
              <label htmlFor="list-tracking" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tracking Number / Waybill</label>
              <Input 
                id="list-tracking" 
                placeholder="Enter tracking number" 
                className="h-11 font-black tracking-wider"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" className="font-bold" onClick={() => setDispatchOpen(false)}>Cancel</Button>
            <Button 
              className="font-black px-8" 
              onClick={handleDispatch}
              disabled={dispatching || !trackingNo}
            >
              {dispatching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
              CONFIRM DISPATCH
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
