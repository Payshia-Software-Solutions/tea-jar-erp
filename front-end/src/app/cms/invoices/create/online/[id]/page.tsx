"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  Calculator,
  Save,
  Loader2,
  CreditCard,
  Gift,
  Sparkles,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchOnlineOrder, 
  createInvoice, 
  fetchParts, 
  fetchTaxes, 
  fetchLocations, 
  fetchCustomers, 
  createCustomer, 
  fetchCompany, 
  fetchBanks, 
  fetchPartBatches, 
  api as apiHelper,
  formatPartLabel
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CreateOnlineInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState("");

  const [allParts, setAllParts] = useState<any[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [systemTaxes, setSystemTaxes] = useState<any[]>([]);
  const [billDiscount, setBillDiscount] = useState<string>("0");
  const [discountType, setDiscountType] = useState<"value" | "percent">("value");

  const [locations, setLocations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [differentShipping, setDifferentShipping] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(0);
  
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  useEffect(() => {
    loadOrderContext();
  }, [orderId]);

  // Removed automatic address sync from customer profile to avoid overwriting 
  // the specific addresses provided in the online order.

  const loadOrderContext = async () => {
    setLoading(true);
    try {
      const [
        inventoryParts,
        allTaxesData,
        locs,
        custs,
        company,
        onlineOrderData
      ] = await Promise.all([
        fetchParts().catch(() => []),
        fetchTaxes('', { all: true }).catch(() => []),
        fetchLocations().catch(() => []),
        fetchCustomers().catch(() => []),
        fetchCompany().catch(() => null),
        fetchOnlineOrder(orderId)
      ]);

      setOrder(onlineOrderData);
      setAllParts(inventoryParts);
      
      // Parse JSON from company data
      let enabledIds = new Set<number>();
      if (company?.tax_ids_json) {
        try {
          const ids = JSON.parse(company.tax_ids_json);
          if (Array.isArray(ids)) enabledIds = new Set(ids);
        } catch {
          // ignore
        }
      }
      
      const filteredTaxes = (allTaxesData || []).filter((t: any) => t.is_active && enabledIds.has(t.id));
      setSystemTaxes(filteredTaxes);
      setLocations(locs || []);
      setCustomers(custs || []);

      const defaultLoc = String(onlineOrderData.location_id) || (locs?.length > 0 ? String(locs[0].id) : "");
      setSelectedLocation(defaultLoc);

      // Pre-select customer if exists
      if (onlineOrderData.customer_id) {
        setSelectedCustomer(String(onlineOrderData.customer_id));
      }

      // Pre-fill addresses
      const sAddr = onlineOrderData.shipping_address || "";
      const bAddr = onlineOrderData.billing_address || sAddr;
      setBillingAddress(bAddr);
      setShippingAddress(sAddr);
      if (sAddr && bAddr && sAddr !== bAddr) {
        setDifferentShipping(true);
      }
      setShippingFee(Number(onlineOrderData.shipping_fee) || 0);

      if (Number(onlineOrderData.coupon_discount) > 0) {
        setBillDiscount(String(onlineOrderData.coupon_discount));
        setDiscountType("value");
      }

      // Map online order items to invoice items
      if (onlineOrderData.items && onlineOrderData.items.length > 0) {
        const initialItems = await Promise.all(onlineOrderData.items.map(async (p: any) => {
          const inventoryPart = inventoryParts.find((ip: any) => ip.id === p.item_id);
          const isFifo = inventoryPart?.is_fifo === 1 || inventoryPart?.is_expiry === 1;
          let batches = [];
          if (isFifo && defaultLoc) {
            try {
              batches = await fetchPartBatches(p.item_id, defaultLoc);
            } catch (err) {
              console.error("Failed to load batches for", p.description);
            }
          }
          const roundedPrice = Number(Number(p.unit_price).toFixed(2));
          const roundedDiscount = Number(Number(p.discount || 0).toFixed(2));
          const roundedQty = Number(p.quantity);
          return {
            description: p.description,
            item_id: p.item_id,
            item_type: "Part",
            quantity: roundedQty,
            unit_price: roundedPrice,
            discount: roundedDiscount,
            line_total: Number(Math.max(0, (roundedPrice - roundedDiscount) * roundedQty).toFixed(2)),
            is_fifo: isFifo,
            available_batches: batches,
            selected_batch: 'auto'
          };
        }));
        setItems(initialItems);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load online order context.",
        variant: "destructive"
      });
      router.push("/sales/online-orders");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (['quantity', 'unit_price', 'discount'].includes(field)) {
      const qty = Number(newItems[index].quantity) || 0;
      const price = Number(newItems[index].unit_price) || 0;
      const disc = Number(newItems[index].discount) || 0;
      const rawTotal = (price - disc) * qty;
      newItems[index].line_total = Number(Math.max(0, rawTotal).toFixed(2));
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", item_type: "Part", quantity: 1, unit_price: 0, discount: 0, line_total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const totals = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const discPerUnit = Number(item.discount) || 0;
    
    const lineDiscount = Number((discPerUnit * qty).toFixed(2));
    const lineTotal = Number(Math.max(0, (price - discPerUnit) * qty).toFixed(2));
    const gross = Number((lineTotal + lineDiscount).toFixed(2));
    
    return {
      subtotal: Number((acc.subtotal + gross).toFixed(2)),
      line_discount: Number((acc.line_discount + lineDiscount).toFixed(2)),
      line_totals_sum: Number((acc.line_totals_sum + lineTotal).toFixed(2))
    };
  }, { subtotal: 0, line_discount: 0, line_totals_sum: 0 });

  const globalDiscountValue = Number(billDiscount) || 0;
  const globalDiscount = discountType === 'percent' 
    ? totals.line_totals_sum * (globalDiscountValue / 100)
    : globalDiscountValue;

  const taxableAmount = Math.max(0, totals.line_totals_sum - globalDiscount);
  
  let taxSum = 0;
  const appliedTaxes: any[] = [];
  
  // Try to use stored tax breakdown from order if items haven't been modified
  const orderTaxDetails = order?.tax_details_json ? JSON.parse(order.tax_details_json) : null;
  const itemsModified = items.length !== (order?.items?.length || 0);

  if (orderTaxDetails && !itemsModified) {
    // Use stored breakdown
    orderTaxDetails.forEach((tax: any) => {
      const amt = Number(tax.amount || 0);
      taxSum += amt;
      appliedTaxes.push({ name: tax.name, code: tax.code || tax.name, amount: amt, rate_percent: tax.rate_percent });
    });
  } else {
    // Recalculate based on current items
    let currentBase = taxableAmount;
    const sortedTaxes = [...systemTaxes].sort((a, b) => a.sort_order - b.sort_order);
    sortedTaxes.forEach(tax => {
      const applyTo = tax.apply_on === 'base_plus_previous' ? currentBase : taxableAmount;
      const taxAmt = applyTo * (Number(tax.rate_percent) / 100);
      taxSum += taxAmt;
      appliedTaxes.push({ name: tax.name, code: tax.code, amount: taxAmt, rate_percent: tax.rate_percent });
      currentBase += taxAmt;
    });
  }

  const grandTotal = taxableAmount + taxSum + shippingFee;
  const totalDiscount = globalDiscount; // Line discounts are now part of subtotal

  const handleSave = async () => {
    if (!selectedLocation) {
      toast({ title: "Validation Error", description: "Please select a location.", variant: "destructive" });
      return;
    }

    if (!selectedCustomer) {
      toast({ title: "Validation Error", description: "Please select or add a customer for this invoice.", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Validation Error", description: "Invoice must have at least one item.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        online_order_id: Number(orderId),
        location_id: Number(selectedLocation),
        customer_id: Number(selectedCustomer),
        billing_address: billingAddress.trim(),
        shipping_address: differentShipping ? shippingAddress.trim() : billingAddress.trim(),
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: totals.line_totals_sum,
        tax_total: taxSum,
        discount_total: totalDiscount,
        shipping_fee: shippingFee,
        grand_total: grandTotal,
        notes: notes,
        applied_promotion_id: order?.coupon_code ? 1 : null, // Marker for coupon
        applied_promotion_name: order?.coupon_code || null,
        items: items.map(item => ({
          ...item,
          selected_batches: item.selected_batch && item.selected_batch !== 'auto' ? [{ batch_id: Number(item.selected_batch), qty: Number(item.quantity) }] : null
        })),
        applied_taxes: appliedTaxes,
        payments: (order?.payment_status === 'Paid' && order?.payment_method !== 'COD') ? [
          {
            method: order.payment_method === 'PayHere' ? 'Online' : (order.payment_method || 'Bank Transfer'),
            amount: grandTotal,
            reference_no: order.payhere_id || order.order_no,
            notes: `Auto-generated from Online Order ${order.order_no}`
          }
        ] : []
      };

      const res = await createInvoice(payload);
      toast({ title: "Success", description: "Invoice generated successfully." });
      
      // Redirect to the invoice view page
      if (res?.data?.id) {
        router.push(`/cms/invoices/${res.data.id}/view`);
      } else {
        router.push(`/cms/invoices`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.push('/sales/online-orders')}>Online Orders</span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium text-foreground">Convert to Invoice</span>
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 border border-slate-200 dark:border-0 px-8 py-7 shadow-sm dark:shadow-xl">
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span className="text-amber-600 dark:text-amber-400 text-sm font-semibold tracking-widest uppercase">Online Order Conversion</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                Invoice for Order {order?.order_no}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                Transforming online order into a system-wide invoice for accounting and inventory.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={submitting || items.length === 0 || !selectedLocation || !selectedCustomer}
              className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold shadow-lg shadow-amber-500/30 border-0 transition-all hover:scale-105"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Generate Invoice
            </Button>
          </div>
        </div>

        {/* Location + Customer Bar */}
        {/* Location + Customer + Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest block">📍 Fulfillment Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-11 border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/40">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc: any) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest block">👤 Customer Account</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                    options={customers.map(c => ({
                      value: String(c.id),
                      label: (
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{c.name} ({c.phone || 'No Phone'})</span>
                          {Number(c.is_ecommerce_user) === 1 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] font-black uppercase h-5 px-1.5 shrink-0">Web</Badge>
                          )}
                        </div>
                      ),
                      keywords: `${c.name} ${c.phone || ''} ${Number(c.is_ecommerce_user) === 1 ? 'web' : ''}`
                    }))}
                    placeholder="Link customer account..."
                  />
                </div>
                {selectedCustomer && customers.find(c => String(c.id) === String(selectedCustomer))?.is_ecommerce_user == 1 && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-black text-[10px] h-10 px-3 uppercase tracking-tighter shrink-0 animate-in zoom-in-50 duration-300">
                    Web Customer
                  </Badge>
                )}
                <Button variant="outline" className="h-10 w-10 p-0 shrink-0" onClick={() => setAddCustomerOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/20 shadow-sm flex flex-col justify-center">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Order Payment</h3>
               <Badge variant={order?.payment_status === 'Paid' ? 'default' : 'outline'} className={order?.payment_status === 'Paid' ? 'bg-green-500 hover:bg-green-600 border-none' : ''}>
                 {order?.payment_status || 'Pending'}
               </Badge>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-muted flex items-center justify-center border border-slate-100">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Method</p>
                      <p className="text-sm font-black">{order?.payment_method || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/50">
                  {order?.payment_status === 'Paid' && order?.payment_method !== 'COD' ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">Auto-Receipt Enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">Payment via {order?.payment_method === 'COD' ? 'COD (Manual)' : 'Verification'}</span>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Items and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card className="rounded-2xl border-slate-200 dark:border-border shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-muted/40 border-b">
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-wrap lg:flex-nowrap items-start gap-3 p-4 rounded-xl border border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/20">
                    <div className="w-full lg:w-2/5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Description</label>
                      <Input value={item.description} readOnly className="bg-muted/50 cursor-not-allowed" />
                      {item.is_fifo && item.available_batches && item.available_batches.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-600 uppercase">Batch:</span>
                          <Select value={item.selected_batch || 'auto'} onValueChange={(val) => handleItemChange(index, 'selected_batch', val)}>
                            <SelectTrigger className="h-7 text-xs border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto (FIFO)</SelectItem>
                              {item.available_batches.map((b: any) => (
                                <SelectItem key={b.id} value={String(b.id)}>{b.batch_number} (Avail: {b.available_qty})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="w-1/2 lg:w-20">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Qty</label>
                      <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                    </div>
                    <div className="w-1/2 lg:w-28">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Unit Price</label>
                      <Input type="number" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} />
                    </div>
                    <div className="w-1/2 lg:w-28">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Disc/Unit</label>
                      <Input type="number" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', e.target.value)} />
                    </div>
                    <div className="w-1/2 lg:w-28">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Total</label>
                      <Input readOnly value={Number(item.line_total || 0).toFixed(2)} className="bg-amber-50 dark:bg-amber-500/10 font-bold" />
                    </div>
                    <div className="w-full lg:w-auto pt-5 flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-3">
                   <SearchableSelect
                    value={selectedPartId}
                    onValueChange={async (val) => {
                      const p = allParts.find(x => String(x.id) === String(val));
                      if (p) {
                        let availableBatches = [];
                        let isFifo = p.is_fifo === 1 || p.is_expiry === 1;
                        if (isFifo && selectedLocation) {
                          try {
                            availableBatches = await fetchPartBatches(p.id, selectedLocation);
                          } catch (err) {
                            console.error("Failed to load batches");
                          }
                        }

                        setItems([...items, {
                          item_id: p.id,
                          description: p.part_name,
                          item_type: p.item_type === "Service" ? "Service" : "Part",
                          quantity: 1,
                          unit_price: p.price || p.cost_price || 0,
                          discount: 0,
                          line_total: p.price || p.cost_price || 0,
                          is_fifo: isFifo,
                          available_batches: availableBatches,
                          selected_batch: 'auto'
                        }]);
                        setSelectedPartId("");
                      }
                    }}
                    options={allParts.map(p => ({
                      value: String(p.id),
                      label: formatPartLabel(p),
                      keywords: `${p.part_name} ${p.sku || ''}`
                    }))}
                    placeholder="🔍 Add more items from inventory..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-2xl border-slate-200 dark:border-border shadow-sm">
                <CardHeader className="bg-slate-50 dark:bg-muted/40 py-3 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest">Notes & Terms</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <textarea 
                    className="w-full min-h-[100px] bg-transparent border-none focus:ring-0 text-sm resize-none"
                    placeholder="Add special instructions or terms..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200 dark:border-border shadow-sm">
                <CardHeader className="bg-slate-50 dark:bg-muted/40 py-3 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest">Address Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Billing Address</label>
                    <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} className="w-full text-xs bg-muted/20 border-slate-200 rounded-lg p-2" rows={2} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Shipping Address</label>
                    <textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className="w-full text-xs bg-muted/20 border-slate-200 rounded-lg p-2" rows={2} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="rounded-3xl border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-bold tracking-tight">Invoice Summary</span>
                  <Calculator className="w-5 h-5 opacity-50" />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Subtotal</span>
                    <span className="font-bold">Rs. {totals.line_totals_sum.toLocaleString()}</span>
                  </div>
                  {totals.line_discount > 0 && (
                    <div className="flex justify-between text-[10px] text-muted-foreground italic">
                      <span>(Incl. Rs. {totals.line_discount.toLocaleString()} line discounts)</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Bill Discount</span>
                    <span className="text-emerald-400 font-bold">- Rs. {globalDiscount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Shipping</span>
                    <span className="font-bold">Rs. {shippingFee.toLocaleString()}</span>
                  </div>
                  {appliedTaxes.map(tax => (
                    <div key={tax.code} className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">{tax.name} ({tax.rate_percent}%)</span>
                      <span className="font-bold">Rs. {tax.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Grand Total</p>
                      <p className="text-3xl font-black text-amber-400">Rs. {grandTotal.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Savings</p>
                       <p className="text-sm font-bold text-emerald-400">Rs. {totalDiscount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-border shadow-sm overflow-hidden">
               <CardHeader className="bg-slate-50 dark:bg-muted/40 py-3 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Issue Date</label>
                    <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Due Date</label>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setAddingCustomer(true);
            try {
              const res = await createCustomer({ name: newCustomerName, phone: newCustomerPhone, status: 'Active' });
              const custs = await fetchCustomers();
              setCustomers(custs);
              setSelectedCustomer(String(res.data.id));
              setAddCustomerOpen(false);
            } catch (err: any) {
              toast({ title: "Error", description: err.message, variant: "destructive" });
            } finally {
              setAddingCustomer(false);
            }
          }} className="space-y-4 pt-4">
            <Input placeholder="Customer Name" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} required />
            <Input placeholder="Phone Number" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} required />
            <Button type="submit" disabled={addingCustomer} className="w-full bg-amber-500 text-slate-900 font-bold">
              {addingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Customer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
