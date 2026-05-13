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
  Printer
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
import { format } from "date-fns";
import { fetchOnlineOrders } from "@/lib/api";

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetchOnlineOrders();
      // res is now {status: 'success', data: [...]}
      const data = res.status === 'success' ? res.data : [];
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50"><Truck className="w-3 h-3 mr-1" /> Processing</Badge>;
      case "shipped":
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-900/50"><Truck className="w-3 h-3 mr-1" /> Shipped</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string, method: string) => {
    const isPaid = status.toLowerCase() === "paid";
    return (
      <div className="flex flex-col gap-1">
        <Badge variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-green-600 hover:bg-green-600" : "text-muted-foreground border-dashed"}>
          {isPaid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
          {status}
        </Badge>
        <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
          {method === 'IPG' ? <CreditCard className="w-2.5 h-2.5" /> : <Banknote className="w-2.5 h-2.5" />}
          {method}
        </span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-foreground">Online Orders</h1>
              <p className="text-muted-foreground text-sm font-medium">Manage and fulfill orders placed via your public e-commerce store.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 px-6 rounded-xl font-bold border-muted-foreground/20 hover:bg-muted/50 transition-all">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
              <Printer className="w-4 h-4 mr-2" /> Batch Printing
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Orders", value: orders.length.toString(), icon: ShoppingCart, color: "bg-blue-500" },
            { label: "Pending Fulfillment", value: orders.filter(o => o.order_status === 'Pending').length.toString(), icon: Clock, color: "bg-amber-500" },
            { label: "Revenue (MTD)", value: `Rs. ${orders.filter(o => o.payment_status === 'Paid').reduce((sum, o) => sum + Number(o.total_amount), 0).toLocaleString()}`, icon: CreditCard, color: "bg-green-500" },
            { label: "Avg. Order Value", value: `Rs. ${orders.length > 0 ? (orders.reduce((sum, o) => sum + Number(o.total_amount), 0) / orders.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}`, icon: TrendingUp, color: "bg-indigo-500" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg shadow-${stat.color.split('-')[1]}/20 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black mt-1">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50">
          <CardHeader className="bg-muted/30 border-b p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Search by Order ID, Customer..." 
                  className="pl-12 h-14 rounded-2xl border-2 focus-visible:ring-primary/20 bg-background shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="h-14 rounded-2xl px-6 border-2 font-bold gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Status
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl px-6 border-2 font-bold gap-2">
                  <MapPin className="w-5 h-5" />
                  All Locations
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                  <TableHead className="w-[180px] font-black uppercase text-[11px] tracking-widest p-4">Order ID</TableHead>
                  <TableHead className="font-black uppercase text-[11px] tracking-widest p-4">Customer</TableHead>
                  <TableHead className="font-black uppercase text-[11px] tracking-widest p-4">Date & Time</TableHead>
                  <TableHead className="font-black uppercase text-[11px] tracking-widest p-4">Payment</TableHead>
                  <TableHead className="font-black uppercase text-[11px] tracking-widest p-4 text-center">Order Status</TableHead>
                  <TableHead className="font-black uppercase text-[11px] tracking-widest p-4 text-center">Shipping</TableHead>
                  <TableHead className="text-right font-black uppercase text-[11px] tracking-widest p-4">Total Amount</TableHead>
                  <TableHead className="w-[80px] p-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-bold">Loading your online sales...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <ShoppingCart className="w-16 h-16 opacity-20" />
                        <p className="font-bold">No online orders found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-primary/[0.02] group transition-colors border-b">
                      <TableCell className="font-black p-4 text-base">
                        <span 
                          onClick={() => router.push(`/ecommerce/orders/view/${order.id}`)}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          {order.order_no}
                        </span>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-base">{order.customer_name}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-widest">
                            <MapPin className="w-2.5 h-2.5" />
                            {order.location_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{format(new Date(order.created_at), "MMM dd, yyyy")}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(order.created_at), "hh:mm a")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        {getPaymentBadge(order.payment_status, order.payment_method)}
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        {getStatusBadge(order.order_status)}
                      </TableCell>
                      <TableCell className="p-4 text-center font-bold text-sm text-muted-foreground">
                        Rs. {Number(order.shipping_fee || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <div className="text-lg font-black tracking-tight">Rs. {Number(order.total_amount).toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button 
                            onClick={() => router.push(`/ecommerce/orders/view/${order.id}`)}
                            variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="w-5 h-5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                                <MoreVertical className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-2xl border-muted-foreground/10">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 px-2">Order Management</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => router.push(`/ecommerce/orders/view/${order.id}`)}
                                className="rounded-lg h-10 font-medium px-3 cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2 text-muted-foreground" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => router.push(`/cms/invoices/create/online/${order.id}`)}
                                className="rounded-lg h-10 font-bold px-3 cursor-pointer text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                              >
                                <FileText className="w-4 h-4 mr-2" /> Convert to Invoice
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2" />
                              <DropdownMenuItem className="rounded-lg h-10 font-medium px-3 cursor-pointer">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg h-10 font-medium px-3 cursor-pointer text-destructive hover:bg-destructive/10">
                                <AlertCircle className="w-4 h-4 mr-2" /> Cancel Order
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
          <CardFooter className="bg-muted/30 border-t p-6 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Showing {orders.length} orders
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl h-10 px-6 border-2 font-bold" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="rounded-xl h-10 px-6 border-2 font-bold" disabled>Next</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Inline missing components for speed and safety
const TrendingUp = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const MapPin = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
