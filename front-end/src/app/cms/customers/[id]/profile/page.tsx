"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { fetchCustomerSummary, fetchCustomerCheques, fetchCustomerStocks, updateCustomerStock, CONTENT_BASE_URL } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  History, 
  TrendingUp, 
  Calendar,
  Wrench,
  FileText,
  BadgeCent,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Plus,
  Receipt,
  Hotel,
  Layers,
  ArrowUpRight,
  Printer,
  Package,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function CustomerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [cheques, setCheques] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);

  const [stockUpdateModal, setStockUpdateModal] = useState<{ isOpen: boolean; stockId: number | null; currentSoldQty: number; maxQty: number }>({ isOpen: false, stockId: null, currentSoldQty: 0, maxQty: 0 });
  const [stockUpdateQty, setStockUpdateQty] = useState("");

  const handleUpdateStockConfirm = async () => {
    const { stockId, maxQty } = stockUpdateModal;
    if (stockId === null) return;
    
    const numQty = parseFloat(stockUpdateQty);
    if (isNaN(numQty) || numQty < 0 || numQty > maxQty) {
      return toast({ title: "Error", description: "Invalid quantity", variant: "destructive" });
    }
    
    try {
      await updateCustomerStock(stockId, { sold_qty: numQty });
      setStocks(stocks.map(s => s.id === stockId ? { ...s, sold_qty: numQty } : s));
      toast({ title: "Success", description: "Sold quantity updated successfully." });
      setStockUpdateModal({ ...stockUpdateModal, isOpen: false });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [summary, chequesData, stocksData] = await Promise.all([
          fetchCustomerSummary(id as string),
          fetchCustomerCheques(id as string).catch(() => []),
          fetchCustomerStocks(id as string).catch(() => [])
        ]);
        setData(summary);
        setCheques(chequesData);
        setStocks(stocksData);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { customer, invoices, payments, reservations, stats, purchased_items } = data;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 w-full mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight">{customer.name}</h1>
                <Badge variant={customer.is_active ? "default" : "secondary"}>
                  {customer.is_active ? "Active Guest" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                <span className="uppercase tracking-widest text-[10px] font-black opacity-50">Customer ID:</span>
                <span className="font-mono text-xs">CUST-{String(customer.id).padStart(4, '0')}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="font-bold gap-2">
              <Calendar className="w-4 h-4" /> Book Room
            </Button>
            <Button className="font-bold gap-2">
              <Plus className="w-4 h-4" /> New Service
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden relative">
            <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-10" />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Lifetime Spending</p>
              <h3 className="text-3xl font-black mt-1">LKR {Number(stats.total_spent).toLocaleString()}</h3>
              <p className="text-xs mt-2 opacity-80 font-medium">Across {stats.total_invoices} invoices</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg overflow-hidden relative">
            <BadgeCent className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-5 text-rose-500" />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Outstanding</p>
              <h3 className="text-3xl font-black mt-1 text-rose-500">LKR {Number(customer.total_outstanding).toLocaleString()}</h3>
              <p className="text-xs mt-2 text-muted-foreground font-medium">Pending settlement</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg overflow-hidden relative">
            <Hotel className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-5 text-blue-500" />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Stays</p>
              <h3 className="text-3xl font-black mt-1 text-blue-500">{stats.total_stays} Visits</h3>
              <p className="text-xs mt-2 text-muted-foreground font-medium">Front office history</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg overflow-hidden relative">
            <CreditCard className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-5 text-emerald-500" />
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reward Points</p>
              <h3 className="text-3xl font-black mt-1 text-emerald-500">{Math.floor(stats.total_paid / 1000)} pts</h3>
              <p className="text-xs mt-2 text-muted-foreground font-medium">Available for redemption</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Contact Info */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <User className="w-4 h-4" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.photo_url && (
                  <div className="flex justify-center mb-6">
                    <img 
                      src={`${CONTENT_BASE_URL}${customer.photo_url}`} 
                      alt={customer.name} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-muted"
                    />
                  </div>
                )}
                {customer.qr_code_hash && (
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl mb-6">
                    <QRCodeSVG 
                      id="customer-qr-code" 
                      value={customer.qr_code_hash} 
                      size={120} 
                      level="H" 
                      includeMargin={false}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 w-full text-xs font-bold"
                      onClick={() => {
                        const svg = document.getElementById("customer-qr-code");
                        if (!svg) return;
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        const img = new Image();
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          const pngFile = canvas.toDataURL("image/png");
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head><title>Print QR Code</title></head>
                                <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0;">
                                  <h2 style="font-family:sans-serif; margin-bottom: 20px;">${customer.name}</h2>
                                  <img src="${pngFile}" style="width:250px; height:250px;"/>
                                  <script>
                                    window.onload = function() { window.print(); window.close(); }
                                  </script>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        };
                        img.src = "data:image/svg+xml;base64," + btoa(svgData);
                      }}
                    >
                      <Printer className="w-3 h-3 mr-2" /> Print ID Card
                    </Button>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Phone</p>
                    <p className="font-bold">{customer.phone || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Email</p>
                    <p className="font-bold">{customer.email || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Address</p>
                    <p className="font-bold">{customer.address || "Not provided"}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                  {customer.nic && <Badge variant="outline" className="font-mono text-[10px]">NIC: {customer.nic}</Badge>}
                  {customer.tax_number && <Badge variant="outline" className="font-mono text-[10px]">Tax: {customer.tax_number}</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Registered Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 space-y-2 opacity-50">
                  <p className="text-xs font-bold italic">Module integration pending...</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: History Tabs */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-xl min-h-[600px]">
              <CardContent className="p-6">
                <Tabs defaultValue="reservations" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6 h-12 rounded-xl bg-muted/50 p-1">
                    <TabsTrigger value="reservations" className="rounded-lg font-bold gap-2">
                      <Hotel className="w-4 h-4" /> Stays
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="rounded-lg font-bold gap-2">
                      <FileText className="w-4 h-4" /> Invoices
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-lg font-bold gap-2">
                      <Receipt className="w-4 h-4" /> Payments
                    </TabsTrigger>
                    <TabsTrigger value="cheques" className="rounded-lg font-bold gap-2">
                      <CreditCard className="w-4 h-4" /> Cheques
                    </TabsTrigger>
                    <TabsTrigger value="items" className="rounded-lg font-bold gap-2">
                      <Layers className="w-4 h-4" /> Items
                    </TabsTrigger>
                    <TabsTrigger value="stocks" className="rounded-lg font-bold gap-2">
                      <Package className="w-4 h-4" /> Stocks
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="reservations" className="space-y-4">
                    {reservations.length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground">No stay history found.</div>
                    ) : (
                      <div className="space-y-3">
                        {reservations.map((res: any) => (
                          <div key={res.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:bg-muted/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold">Room {res.room_no || "TBD"}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  {res.check_in} — {res.check_out}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={res.status === 'CheckedOut' ? 'default' : 'secondary'}>{res.status}</Badge>
                              <Link href={`/front-office/reservations/${res.id}`}>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="invoices" className="space-y-4">
                    {invoices.length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground">No invoices found.</div>
                    ) : (
                      <div className="space-y-3">
                        {invoices.map((inv: any) => (
                          <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:bg-muted/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-mono font-bold">INV-{inv.invoice_no}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{inv.issue_date}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="font-black">LKR {Number(inv.grand_total).toLocaleString()}</p>
                                <Badge variant={inv.status === 'Paid' ? 'default' : 'destructive'} className="text-[10px] py-0">{inv.status}</Badge>
                              </div>
                              <Link href={`/cms/invoices/${inv.id}/view`}>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="payments" className="space-y-4">
                    {payments.length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground">No payments recorded.</div>
                    ) : (
                      <div className="space-y-3">
                        {payments.map((pay: any) => (
                          <div key={pay.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:bg-muted/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <BadgeCent className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-mono font-bold">{pay.receipt_no}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{pay.payment_date} via {pay.payment_method}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-emerald-500">+ LKR {Number(pay.amount).toLocaleString()}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">REF: {pay.invoice_no}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="cheques" className="space-y-4">
                    {cheques.length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground">No cheque history found.</div>
                    ) : (
                      <div className="space-y-3">
                        {cheques.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:bg-muted/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                c.status === 'Cleared' ? 'bg-emerald-100 text-emerald-600' : 
                                c.status === 'Bounced' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-mono font-bold tracking-widest text-lg">#{c.cheque_no_last6}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  {c.bank_name} — Date: {c.cheque_date}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black">LKR {Number(c.amount).toLocaleString()}</p>
                              <Badge className={`${
                                c.status === 'Cleared' ? 'bg-emerald-500' : 
                                c.status === 'Bounced' ? 'bg-rose-500' : 'bg-amber-500'
                              } text-white border-none`}>
                                {c.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="items" className="space-y-4">
                    {purchased_items.length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground">No purchase history found.</div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-border/50">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3">Item Name</th>
                              <th className="px-4 py-3 text-center">Qty</th>
                              <th className="px-4 py-3 text-right">Avg Price</th>
                              <th className="px-4 py-3 text-right">Total Spent</th>
                              <th className="px-4 py-3 text-right">Last Bought</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {purchased_items.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-4 font-bold text-primary">{item.item_name}</td>
                                <td className="px-4 py-4 text-center font-mono">{Number(item.total_qty).toLocaleString()}</td>
                                <td className="px-4 py-4 text-right font-mono">LKR {Number(item.avg_price).toLocaleString()}</td>
                                <td className="px-4 py-4 text-right font-black text-primary">LKR {Number(item.total_spent).toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-xs text-muted-foreground">
                                  {new Date(item.last_purchased).toLocaleDateString('en-GB')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="stocks" className="space-y-4">
                    {stocks.length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground">No customer stocks found.</div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-border/50">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3">Item Name</th>
                              <th className="px-4 py-3">Batch</th>
                              <th className="px-4 py-3">Invoice No</th>
                              <th className="px-4 py-3 text-center">Original Qty</th>
                              <th className="px-4 py-3 text-center">Sold Qty</th>
                              <th className="px-4 py-3 text-center">Remaining</th>
                              <th className="px-4 py-3 text-right">Expiry Date</th>
                              <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {stocks.map((item: any) => {
                              const originalQty = Number(item.quantity) || 0;
                              const soldQty = Number(item.sold_qty) || 0;
                              const remaining = originalQty - soldQty;
                              return (
                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-4 font-bold text-primary">{item.item_description}</td>
                                  <td className="px-4 py-4 font-mono text-xs">{item.batch_number || '-'}</td>
                                  <td className="px-4 py-4 font-mono text-xs">{item.invoice_no || '-'}</td>
                                  <td className="px-4 py-4 text-center font-mono">
                                    <Badge variant="outline">{originalQty.toLocaleString()}</Badge>
                                  </td>
                                  <td className="px-4 py-4 text-center font-mono">
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600">{soldQty.toLocaleString()}</Badge>
                                  </td>
                                  <td className="px-4 py-4 text-center font-mono">
                                    <Badge variant={remaining > 0 ? "default" : "destructive"}>{remaining.toLocaleString()}</Badge>
                                  </td>
                                  <td className="px-4 py-4 text-right font-mono text-xs text-rose-500 font-bold">
                                    {item.expire_date || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setStockUpdateModal({ isOpen: true, stockId: item.id, currentSoldQty: soldQty, maxQty: originalQty });
                                      setStockUpdateQty(soldQty.toString());
                                    }}>
                                      <Edit2 className="w-4 h-4 text-blue-500" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={stockUpdateModal.isOpen} onOpenChange={(open) => setStockUpdateModal({ ...stockUpdateModal, isOpen: open })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Sold Quantity</DialogTitle>
            <DialogDescription>
              Enter the total quantity sold for this batch. The maximum allowed is {stockUpdateModal.maxQty}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sold_qty" className="text-right">
                Sold Qty
              </Label>
              <Input
                id="sold_qty"
                type="number"
                min="0"
                max={stockUpdateModal.maxQty}
                step="0.01"
                value={stockUpdateQty}
                onChange={(e) => setStockUpdateQty(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockUpdateModal({ ...stockUpdateModal, isOpen: false })}>Cancel</Button>
            <Button onClick={handleUpdateStockConfirm}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
