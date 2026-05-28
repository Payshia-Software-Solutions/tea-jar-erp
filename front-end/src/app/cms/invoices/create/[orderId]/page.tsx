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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fetchOrder, createInvoice, fetchOrderParts, fetchParts, fetchTaxes, fetchLocations, fetchCustomers, createCustomer, fetchCompany, fetchBanks, fetchPartBatches, api as apiHelper } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CreateInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPromotionPromptOpen, setIsPromotionPromptOpen] = useState(false);
  const [promotionsPromptDismissed, setPromotionsPromptDismissed] = useState(false);
  const [checkoutIntentActive, setCheckoutIntentActive] = useState(false);

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

  // Bank & Promotions States
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("any");
  const [selectedCardCategory, setSelectedCardCategory] = useState<string>("Any");
  const [eligiblePromotions, setEligiblePromotions] = useState<any[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<any | null>(null);

  const [locations, setLocations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [differentShipping, setDifferentShipping] = useState(false);
  
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  const isStandalone = orderId === 'standalone';

  useEffect(() => {
    loadOrderContext();
  }, [orderId]);

  useEffect(() => {
    if (selectedCustomer && customers.length > 0) {
      const cust = customers.find(c => String(c.id) === selectedCustomer);
      if (cust && cust.address) {
        setBillingAddress(cust.address);
        if (!differentShipping) setShippingAddress(cust.address);
      }
    }
  }, [selectedCustomer, customers, differentShipping]);

  const loadOrderContext = async () => {
    setLoading(true);
    try {
      const fetches: Promise<any>[] = [
        fetchParts().catch(() => []),
        fetchTaxes('', { all: true }).catch(() => []),
        fetchLocations().catch(() => []),
        fetchCustomers().catch(() => []),
        fetchCompany().catch(() => null),
        fetchBanks().catch(() => [])
      ];

      // Only fetch order-specific data if not standalone
      if (!isStandalone) {
        fetches.push(fetchOrder(orderId));
        fetches.push(fetchOrderParts(orderId).catch(() => []));
      }

      const results = await Promise.all(fetches);
      
      let inventoryParts, allTaxesData, locs, custs, company, banksData, orderData, partsData;
      
      if (!isStandalone) {
        [inventoryParts, allTaxesData, locs, custs, company, banksData, orderData, partsData] = results;
      } else {
        [inventoryParts, allTaxesData, locs, custs, company, banksData] = results;
        orderData = null;
        partsData = [];
      }

      setOrder(orderData);
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
      setBanks(banksData || []);

      const defaultLoc = locs?.length > 0 ? String(locs[0].id) : "";
      if (!selectedLocation) setSelectedLocation(defaultLoc);
      const locToUse = selectedLocation || defaultLoc;

      // Standalone mode: default to empty items
      if (isStandalone) {
        setItems([]);
      } else if (partsData && partsData.length > 0) {
        // Map order parts to invoice items
        const initialItems = await Promise.all(partsData.map(async (p: any) => {
          const inventoryPart = inventoryParts.find((ip: any) => ip.id === p.part_id);
          const isFifo = inventoryPart?.is_fifo === 1 || inventoryPart?.is_expiry === 1;
          let batches = [];
          if (isFifo && locToUse) {
            try {
              batches = await fetchPartBatches(p.part_id, locToUse);
            } catch (err) {
              console.error("Failed to load batches for", p.part_name);
            }
          }
          return {
            description: p.part_name || p.description,
            item_id: p.part_id,
            item_type: "Part",
            quantity: p.quantity,
            unit_price: p.unit_price,
            discount: 0,
            line_total: p.line_total,
            is_fifo: isFifo,
            available_batches: batches,
            selected_batch: 'auto'
          };
        }));
        setItems(initialItems);
      } else {
        setItems([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order context.",
        variant: "destructive"
      });
      router.push("/cms/invoices/new");
    } finally {
      setLoading(false);
    }
  };

  const refreshAllBatches = async () => {
    if (!selectedLocation || items.length === 0) return;
    const updatedItems = await Promise.all(items.map(async (item) => {
      if (item.item_id) {
        const p = allParts.find(x => String(x.id) === String(item.item_id));
        const isFifo = p?.is_fifo === 1 || p?.is_expiry === 1;
        if (isFifo) {
          try {
            const batches = await fetchPartBatches(item.item_id, selectedLocation);
            return { ...item, is_fifo: true, available_batches: batches };
          } catch (err) {
            return { ...item, is_fifo: true, available_batches: [] };
          }
        }
      }
      return item;
    }));
    setItems(updatedItems);
  };

  useEffect(() => {
    if (selectedLocation && items.length > 0) {
      // Only refresh if some items are missing batches or if we want to be safe
      const needsRefresh = items.some(i => i.item_id && !i.available_batches);
      if (needsRefresh) {
        refreshAllBatches();
      }
    }
  }, [selectedLocation, allParts]);

  // discount is per-unit: line_total = (unit_price - discount) * qty
  const calculateLineTotal = (qty: number, price: number, discountPerUnit: number) => {
    return Math.max(0, (price - discountPerUnit) * qty);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (['quantity', 'unit_price', 'discount'].includes(field)) {
      const qty = Number(newItems[index].quantity) || 0;
      const price = Number(newItems[index].unit_price) || 0;
      const disc = Number(newItems[index].discount) || 0;
      newItems[index].line_total = calculateLineTotal(qty, price, disc);
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

  const validatePromotions = async () => {
    const regularItems = items.filter(i => !i.is_reward);
    if (regularItems.length === 0) {
      setEligiblePromotions([]);
      if (appliedPromotion) setAppliedPromotion(null);
      return [];
    }

    const sub = regularItems.reduce((acc, i) => acc + (Number(i.quantity) * Number(i.unit_price) - Number(i.quantity) * Number(i.discount)), 0);
    
    try {
      const res = await apiHelper('/api/promotion/validate', {
        method: 'POST',
        body: JSON.stringify({
          items: regularItems.map(item => ({ id: item.item_id, quantity: item.quantity, unit_price: item.unit_price, discount: item.discount })),
          subtotal: sub,
          bank_id: selectedBankId === 'any' ? null : selectedBankId,
          card_category: selectedCardCategory === 'Any' ? null : selectedCardCategory,
          location_id: selectedLocation
        })
      });

      const resData = await res.json();
      const matches = Array.isArray(resData.data) ? resData.data : [];
      setEligiblePromotions(matches);

      // Auto-remove applied promotion if it's no longer eligible
      if (appliedPromotion) {
        if (!matches.some(m => m.promotion_id === appliedPromotion.promotion_id)) {
          updateAppliedPromotion(null);
          toast({ title: "Promotion Removed", description: "The previously applied promotion is no longer eligible.", variant: "destructive" });
        }
      }

      // Proactive Prompting for BOGO: If we find a new BOGO and haven't dismissed prompts, show it.
      if (!appliedPromotion && !isPromotionPromptOpen && !promotionsPromptDismissed && matches.some(p => p.missing_rewards)) {
        setIsPromotionPromptOpen(true);
      }

      return matches;
    } catch (error) {
      setEligiblePromotions([]);
      return [];
    }
  };

  const updateAppliedPromotion = (promo: any | null) => {
    // Remove existing rewards
    setItems(prev => prev.filter(i => !i.is_reward));
    setAppliedPromotion(promo);
    if (promo) {
      claimPromotionRewards(promo);
    }
  };

  const claimPromotionRewards = async (promo: any) => {
    if (!promo || !promo.missing_rewards) return;
    const reward = promo.missing_rewards;
    const product = allParts.find(p => String(p.id) === String(reward.item_id));
    if (product) {
      let batches = [];
      const isFifo = product.is_fifo === 1 || product.is_expiry === 1;
      if (isFifo && selectedLocation) {
        try {
          batches = await fetchPartBatches(product.id, selectedLocation);
        } catch (err) {
          console.error("Failed to load batches for reward");
        }
      }

      const newLine = {
        item_id: product.id,
        description: (product.part_name || product.description) + " (Reward)",
        item_type: product.item_type === "Service" ? "Service" : "Part",
        quantity: reward.qty,
        unit_price: 0,
        discount: 0,
        line_total: 0,
        is_reward: true,
        is_fifo: isFifo,
        available_batches: batches,
        selected_batch: 'auto'
      };
      setItems(prev => [...prev.filter(i => !i.is_reward), newLine]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      validatePromotions();
    }, 600);
    return () => clearTimeout(timer);
  }, [items.map(i => `${i.item_id}-${i.quantity}`).join('|'), selectedLocation, selectedBankId, selectedCardCategory]);

  // subtotal = gross (no discount), line_discount = total saved across all items (discount/unit * qty)
  const totals = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const discPerUnit = Number(item.discount) || 0;
    const gross = qty * price;
    const lineDiscount = discPerUnit * qty;
    const lineTotal = Math.max(0, gross - lineDiscount);
    return {
      subtotal: acc.subtotal + gross,
      line_discount: acc.line_discount + lineDiscount,
      line_totals_sum: acc.line_totals_sum + lineTotal
    };
  }, { subtotal: 0, line_discount: 0, line_totals_sum: 0 });

  const globalDiscountValue = Number(billDiscount) || 0;
  const globalDiscount = discountType === 'percent' 
    ? totals.line_totals_sum * (globalDiscountValue / 100)
    : globalDiscountValue;

  const promoDiscountAmt = appliedPromotion ? Number(appliedPromotion.discount_value) : 0;
  const taxableAmount = Math.max(0, totals.line_totals_sum - globalDiscount - promoDiscountAmt);
  
    let currentBase = taxableAmount;
    let taxSum = 0;
    const appliedTaxes: { name: string, code: string, amount: number }[] = [];
    
    const sortedTaxes = [...systemTaxes].sort((a, b) => a.sort_order - b.sort_order);
    sortedTaxes.forEach(tax => {
      const applyTo = tax.apply_on === 'base_plus_previous' ? currentBase : taxableAmount;
      const taxAmt = applyTo * (Number(tax.rate_percent) / 100);
      taxSum += taxAmt;
      appliedTaxes.push({ name: tax.name, code: tax.code, amount: taxAmt });
      currentBase += taxAmt;
    });

  const grandTotal = taxableAmount + taxSum;
  const totalDiscount = totals.line_discount + globalDiscount + promoDiscountAmt;

  const handleSave = async () => {
    if (!selectedLocation) {
      toast({ title: "Validation Error", description: "Please select a location.", variant: "destructive" });
      return;
    }

    if (!selectedCustomer) {
      toast({ title: "Validation Error", description: "Please select or add a customer for this invoice.", variant: "destructive" });
      return;
    }

    // Item Validations
    if (items.length === 0) {
      toast({ title: "Validation Error", description: "Invoice must have at least one item.", variant: "destructive" });
      return;
    }

    if (items.some(i => !i.description.trim())) {
      toast({ title: "Validation Error", description: "All items must have a description.", variant: "destructive" });
      return;
    }

    if (grandTotal <= 0) {
      toast({ title: "Validation Error", description: "Invoice total must be greater than zero.", variant: "destructive" });
      return;
    }

    // POS-style Promotion Catch: If offers exist but none applied, prompt the user
    if (!appliedPromotion && eligiblePromotions.length > 0 && !promotionsPromptDismissed) {
      setCheckoutIntentActive(true);
      setIsPromotionPromptOpen(true);
      return;
    }

    await doSave();
  };

  const doSave = async () => {
    setSubmitting(true);
    try {
      const payload = {
        order_id: Number(orderId) || null,
        location_id: selectedLocation ? Number(selectedLocation) : null,
        customer_id: selectedCustomer ? Number(selectedCustomer) : (order?.customer_id ?? 1),
        billing_address: billingAddress.trim(),
        shipping_address: differentShipping ? shippingAddress.trim() : billingAddress.trim(),
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: totals.subtotal,
        tax_total: taxSum,
        discount_total: totalDiscount,
        grand_total: grandTotal,
        notes: notes,
        applied_promotion_id: appliedPromotion ? appliedPromotion.promotion_id : null,
        applied_promotion_name: appliedPromotion ? appliedPromotion.name : null,
        bank_id: selectedBankId === 'any' ? null : Number(selectedBankId),
        card_category: selectedCardCategory === 'Any' ? null : selectedCardCategory,
        items: items.map(item => ({
          ...item,
          is_reward: item.is_reward ? 1 : 0,
          selected_batches: item.selected_batch && item.selected_batch !== 'auto' ? [{ batch_id: Number(item.selected_batch), qty: Number(item.quantity) }] : null
        })),
        applied_taxes: appliedTaxes.map(tax => ({
          ...tax,
          rate_percent: systemTaxes.find(st => st.code === tax.code)?.rate_percent || 0
        }))
      };

      const res = await createInvoice(payload);
      toast({ title: "Success", description: "Invoice generated successfully." });
      // Redirect directly to the print template
      router.push(`/cms/invoices/${res.data.id}/print?autoprint=1`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setCheckoutIntentActive(false);
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

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>CMS</span>
          <ChevronRight className="w-3 h-3" />
          <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.push('/cms/invoices')}>Invoices</span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium text-foreground">Draft Invoice</span>
        </div>

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 border border-slate-200 dark:border-0 px-8 py-7 shadow-sm dark:shadow-xl">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full bg-blue-400/10 dark:bg-cyan-400/10 blur-xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span className="text-amber-600 dark:text-amber-400 text-sm font-semibold tracking-widest uppercase">
                  {isStandalone ? "Direct Invoice" : "Invoice Builder"}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                {isStandalone ? "Create Direct Invoice" : "Draft Invoice"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {isStandalone ? (
                  "Create a standalone invoice without a repair order reference."
                ) : (
                  <>
                    Composing invoice for <span className="text-amber-600 dark:text-amber-300 font-semibold">Order #{orderId}</span>
                    {order?.customer_name && <span className="text-slate-500 dark:text-slate-400"> · {order.customer_name}</span>}
                  </>
                )}
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


        {/* ── Location + Customer Bar ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm">
          {/* Location */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest block">📍 Location</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-11 border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/40 focus:ring-amber-400/50 focus:border-amber-400">
                <SelectValue placeholder="Select originating location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc: any) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest block">👤 Customer</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <SearchableSelect
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                  options={customers.map(c => ({
                    value: String(c.id),
                    label: `${c.name} (${c.phone || 'No Phone'})`,
                    keywords: `${c.name} ${c.phone || ''} ${c.email || ''}`
                  }))}
                  placeholder="Search & link customer..."
                />
              </div>
              <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-10 w-10 p-0 shrink-0 border-slate-200 dark:border-border hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-500 transition-all">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Quick Add Customer</DialogTitle></DialogHeader>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
                      toast({ title: "Validation Error", description: "Name and Phone are required", variant: "destructive" });
                      return;
                    }
                    setAddingCustomer(true);
                    try {
                      const res = await createCustomer({ name: newCustomerName, phone: newCustomerPhone, status: 'Active' });
                      toast({ title: "Success", description: "Customer added successfully" });
                      const newCustId = res.data.id;
                      const custs = await fetchCustomers();
                      setCustomers(custs);
                      setSelectedCustomer(String(newCustId));
                      setAddCustomerOpen(false);
                      setNewCustomerName("");
                      setNewCustomerPhone("");
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message || "Failed to add customer", variant: "destructive" });
                    } finally {
                      setAddingCustomer(false);
                    }
                  }} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Customer Name *</label>
                      <Input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} required placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number *</label>
                      <Input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} required placeholder="e.g. 0771234567" />
                    </div>
                    <Button type="submit" disabled={addingCustomer} className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold border-0">
                      {addingCustomer ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Customer"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Line Items Card ── */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-border bg-slate-50 dark:bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-amber-400" />
                <span className="font-bold text-slate-800 dark:text-foreground text-base">Line Items</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-muted-foreground font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="p-5 space-y-3">
              {items.map((item, index) => (
                <div key={index} className={`flex flex-wrap lg:flex-nowrap items-start gap-3 p-4 rounded-xl border transition-all ${index % 2 === 0 ? 'bg-slate-50 dark:bg-muted/30 border-slate-100 dark:border-border' : 'bg-white dark:bg-card border-slate-100 dark:border-border'} hover:border-amber-300 dark:hover:border-amber-400/50 hover:shadow-sm`}>
                  <div className="w-full lg:w-2/5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Description</label>
                    <Input
                      placeholder="e.g. Oil Filter / Labor"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      disabled={!!item.item_id}
                      className={`border-slate-200 dark:border-border focus:border-amber-400 focus:ring-amber-400/30 ${!!item.item_id ? 'bg-slate-100 dark:bg-muted text-slate-400 dark:text-muted-foreground cursor-not-allowed' : ''}`}
                    />
                    {item.is_fifo && item.available_batches && item.available_batches.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase">Batch:</span>
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
                  <div className="w-1/2 lg:w-1/6">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Type</label>
                    <Select 
                      value={item.item_type} 
                      onValueChange={(val) => handleItemChange(index, 'item_type', val)} 
                      disabled={!!item.item_id}
                    >
                      <SelectTrigger className={`border-slate-200 dark:border-border focus:border-amber-400 ${!!item.item_id ? 'bg-slate-100 dark:bg-muted text-slate-400 dark:text-muted-foreground cursor-not-allowed opacity-100' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Part">Part</SelectItem>
                        <SelectItem value="Labor">Labor</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-1/2 lg:w-20">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Qty</label>
                    <Input
                      type="number" min="0.01" step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="border-slate-200 dark:border-border focus:border-amber-400 focus:ring-amber-400/30"
                    />
                  </div>
                  <div className="w-1/2 lg:w-28">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Unit Price</label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="border-slate-200 dark:border-border focus:border-amber-400 focus:ring-amber-400/30"
                    />
                  </div>
                  <div className="w-1/2 lg:w-24">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Disc/Unit</label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      className="border-slate-200 dark:border-border focus:border-amber-400 focus:ring-amber-400/30"
                    />
                  </div>
                  <div className="w-1/2 lg:w-28">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Total</label>
                    <Input
                      type="number"
                      readOnly
                      value={Number(item.line_total || 0).toFixed(2)}
                      className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-400/50 font-bold text-amber-600 dark:text-amber-400 cursor-default"
                    />
                  </div>
                  <div className="w-full lg:w-auto pt-5 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1} className="text-slate-400 dark:text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-destructive/10 dark:hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add Controls */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 dark:border-border mt-2">
                <div className="w-full">
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
                      label: `${p.part_name}${p.sku ? ` (${p.sku})` : ''}`,
                      keywords: `${p.part_name} ${p.sku || ''}`
                    }))}
                    placeholder="🔍 Select from inventory to add item..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-5">

            {/* Details Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-border bg-slate-50 dark:bg-muted/40">
                <div className="w-1 h-4 rounded-full bg-cyan-400" />
                <span className="font-bold text-slate-800 dark:text-foreground text-sm">Invoice Details</span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Issue Date</label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="border-slate-200 dark:border-border focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Due Date</label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border-slate-200 dark:border-border focus:border-amber-400" />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[7, 21, 30, 45, 60].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          const d = new Date(issueDate || new Date().toISOString().split('T')[0]);
                          d.setDate(d.getDate() + days);
                          setDueDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-500/20 dark:hover:text-amber-400 border border-slate-200 dark:border-border transition-colors font-bold uppercase tracking-tighter"
                      >
                        {days}D
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Notes</label>
                  <Input placeholder="Thank you for your business!" value={notes} onChange={(e) => setNotes(e.target.value)} className="border-slate-200 dark:border-border focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Billing Address</label>
                  <textarea
                    className="flex min-h-[72px] w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-background text-slate-800 dark:text-foreground px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                    placeholder="Enter billing address..."
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="diffShip" checked={differentShipping} onChange={(e) => setDifferentShipping(e.target.checked)} className="rounded border-slate-300 dark:border-border accent-amber-500 w-4 h-4 cursor-pointer" />
                  <label htmlFor="diffShip" className="text-sm font-medium text-slate-600 dark:text-muted-foreground cursor-pointer select-none">Different Shipping Address</label>
                </div>
                {differentShipping && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Shipping Address</label>
                    <textarea
                      className="flex min-h-[72px] w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-background text-slate-800 dark:text-foreground px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                      placeholder="Enter shipping address..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Metadata Card (For Bank Promotions) */}
            <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-border bg-slate-50 dark:bg-muted/40">
                <div className="w-1 h-4 rounded-full bg-violet-400" />
                <span className="font-bold text-slate-800 dark:text-foreground text-sm">Payment Metadata (Promotions)</span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Payment Bank</label>
                  <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                    <SelectTrigger className="border-slate-200 dark:border-border focus:border-amber-400 focus:ring-amber-400/30">
                      <SelectValue placeholder="Any Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Bank</SelectItem>
                      {banks.map(b => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 block">Card Category</label>
                  <Select value={selectedCardCategory} onValueChange={setSelectedCardCategory}>
                    <SelectTrigger className="border-slate-200 dark:border-border focus:border-amber-400 focus:ring-amber-400/30">
                      <SelectValue placeholder="Any Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any Category</SelectItem>
                      <SelectItem value="Credit">Credit Card</SelectItem>
                      <SelectItem value="Debit">Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Totals Card */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-0">
              {/* Header */}
              <div className="bg-slate-100 dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-700 px-5 py-4 flex items-center gap-2 border-b border-slate-200 dark:border-0">
                <Calculator className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="font-bold text-slate-800 dark:text-white text-sm tracking-wide">Invoice Summary</span>
              </div>

              {/* Bill Discount Input */}
              <div className="bg-slate-50 dark:bg-slate-700 px-5 py-3 flex items-center gap-3 border-b border-slate-200 dark:border-white/10">
                <span className="text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap font-medium">Bill Discount</span>
                <Input
                  type="number" min="0" step="0.01"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(e.target.value)}
                  className="bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 h-8 flex-1 text-sm"
                />
                <Button
                  variant="ghost"
                  onClick={() => setDiscountType(prev => prev === 'value' ? 'percent' : 'value')}
                  className="h-8 min-w-[44px] px-2 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/40 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-bold text-xs shrink-0 border border-amber-300 dark:border-amber-400/30"
                >
                  {discountType === 'percent' ? '%' : 'LKR'}
                </Button>
              </div>

              {/* Promotions Engine */}
              {eligiblePromotions.length > 0 && (
                <div className="bg-amber-50/50 dark:bg-amber-900/10 px-5 py-4 border-b border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">Available Promotions</span>
                  </div>
                  <div className="space-y-2">
                    {eligiblePromotions.map((promo: any) => {
                      const isApplied = appliedPromotion?.promotion_id === promo.promotion_id;
                      return (
                        <div key={promo.promotion_id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${isApplied ? 'bg-amber-100 border-amber-300 dark:bg-amber-500/20 dark:border-amber-500/40' : 'bg-white border-amber-100 hover:border-amber-300 dark:bg-slate-800 dark:border-slate-700'}`}>
                          <div>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{promo.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{promo.missing_rewards || promo.type?.toUpperCase() === 'BOGO' ? 'Buy One Get One' : 'Discount Offer'}</div>
                          </div>
                          {isApplied ? (
                            <Button size="sm" variant="outline" onClick={() => updateAppliedPromotion(null)} className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-200 dark:border-amber-500/50 dark:text-amber-400 shrink-0">
                              Remove
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => updateAppliedPromotion(promo)} className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                              Apply Offer
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Breakdown */}
              <div className="bg-white dark:bg-slate-800 px-5 py-4 space-y-2.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">LKR {totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.line_discount > 0 && (
                  <div className="flex justify-between text-red-500 dark:text-rose-400 text-sm">
                    <span>Item Discounts</span>
                    <span>−LKR {totals.line_discount.toFixed(2)}</span>
                  </div>
                )}
                {globalDiscount > 0 && (
                  <div className="flex justify-between text-red-500 dark:text-rose-400 text-sm">
                    <span>Bill Discount {discountType === 'percent' ? `(${billDiscount}%)` : ''}</span>
                    <span>−LKR {globalDiscount.toFixed(2)}</span>
                  </div>
                )}
                {promoDiscountAmt > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 text-sm font-semibold">
                    <span>Promo Discount</span>
                    <span>−LKR {promoDiscountAmt.toFixed(2)}</span>
                  </div>
                )}
                {(totals.line_discount > 0 || globalDiscount > 0 || promoDiscountAmt > 0) && (
                  <div className="flex justify-between text-slate-400 dark:text-slate-500 text-xs border-t border-slate-100 dark:border-slate-700 pt-2">
                    <span>After Discount</span>
                    <span>LKR {taxableAmount.toFixed(2)}</span>
                  </div>
                )}
                {appliedTaxes.map((tax, idx) => (
                  <div key={idx} className="flex justify-between text-blue-600 dark:text-cyan-400 text-sm">
                    <span title={tax.name} className="cursor-help">{tax.code}</span>
                    <span>+LKR {tax.amount.toFixed(2)}</span>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="border-t border-slate-100 dark:border-slate-600 mt-1 pt-3 flex justify-between items-baseline">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Grand Total</span>
                  <span className="text-amber-500 dark:text-amber-400 font-extrabold text-2xl">LKR {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {(totals.line_discount + globalDiscount + promoDiscountAmt) > 0 && (
                <div className="bg-emerald-500/10 px-5 py-2.5 flex items-center justify-between border-t border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">Total Savings</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">LKR {(totals.line_discount + globalDiscount + promoDiscountAmt).toFixed(2)}</span>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleSave}
                disabled={submitting || grandTotal <= 0}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 text-sm tracking-wide transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Promotion Prompt Dialog (POS Style) */}
      <Dialog open={isPromotionPromptOpen} onOpenChange={(open) => {
        setIsPromotionPromptOpen(open);
        if (!open) {
          setPromotionsPromptDismissed(true);
          if (checkoutIntentActive) doSave();
        }
      }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl bg-white dark:bg-slate-950">
          <div className="p-6 pb-2">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Available Offers
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Great news!
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
                We've found {eligiblePromotions.length} special {eligiblePromotions.length === 1 ? 'offer' : 'offers'} for this invoice.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="max-h-[400px] overflow-y-auto pr-1 space-y-3">
              {eligiblePromotions.map((promo) => {
                const isPotential = !!promo.missing_rewards;
                return (
                  <div 
                    key={promo.promotion_id}
                    className={`group relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer ${
                      isPotential 
                      ? 'bg-amber-50/30 dark:bg-amber-500/5 border-amber-100 dark:border-amber-900/30 hover:shadow-md hover:border-amber-200' 
                      : 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/30 hover:shadow-md hover:border-emerald-200'
                    }`}
                    onClick={() => {
                      updateAppliedPromotion(promo);
                      setIsPromotionPromptOpen(false);
                      setPromotionsPromptDismissed(true);
                      if (checkoutIntentActive) setTimeout(doSave, 300);
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isPotential ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {promo.type?.toUpperCase()}
                        </span>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          {promo.name}
                          {isPotential && <Gift className="w-3.5 h-3.5 text-amber-500" />}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-1 ${
                          isPotential 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50' 
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50'
                        }`}>
                          {isPotential ? 'BOGO' : 'Instant Save'}
                        </span>
                        <div className={`text-lg font-bold tabular-nums ${isPotential ? 'text-amber-700' : 'text-emerald-700'}`}>
                          LKR {isPotential ? promo.missing_rewards.potential_discount : promo.discount_value}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex items-center justify-between gap-4 p-3 rounded-xl ${
                      isPotential 
                      ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200' 
                      : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                    }`}>
                      <div className="text-xs font-medium leading-tight">
                        {isPotential ? (
                          <span>Add {promo.missing_rewards.qty}x <span className="font-bold">{promo.missing_rewards.item_name}</span> to claim!</span>
                        ) : (
                          <span>Click to apply this discount.</span>
                        )}
                      </div>
                      <Button 
                        size="sm"
                        className={`h-8 px-4 font-bold rounded-lg text-[11px] uppercase transition-all ${
                          isPotential 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isPotential ? 'Claim' : 'Apply'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col items-center gap-4">
              <button 
                onClick={() => {
                  setIsPromotionPromptOpen(false);
                  setPromotionsPromptDismissed(true);
                  if (checkoutIntentActive) doSave();
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors uppercase tracking-widest"
              >
                Skip for now
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}