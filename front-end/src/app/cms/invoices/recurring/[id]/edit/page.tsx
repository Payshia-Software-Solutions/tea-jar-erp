"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  Save,
  Loader2,
  Calendar,
  RotateCw,
  Tag,
  ArrowLeft,
  Clock,
  Mail,
  Zap
} from "lucide-react";
import { DateTime } from "@/lib/utils/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  fetchParts, 
  fetchTaxes, 
  fetchLocations, 
  fetchCustomers, 
  updateRecurringInvoice,
  fetchRecurringInvoiceDetails,
  fetchCompany,
  formatPartLabel
} from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";

export default function EditRecurringTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isForceGenerating, setIsForceGenerating] = useState(false);
  const [showConfirmGen, setShowConfirmGen] = useState(false);

  // Template Info
  const [templateName, setTemplateName] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [status, setStatus] = useState("Active");
  const [allTaxes, setAllTaxes] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [allParts, setAllParts] = useState<any[]>([]);
  const [systemTaxes, setSystemTaxes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const filteredTaxes = allTaxes.filter(tax => {
      const loc = locations.find(l => l.id === Number(selectedLocation));
      if (!loc || !loc.allowed_taxes_json) return true;
      try {
        const allowedIds = JSON.parse(loc.allowed_taxes_json);
        return allowedIds.includes(tax.id) || allowedIds.includes(String(tax.id));
      } catch (e) {
        return true;
      }
    });

    setTaxes(filteredTaxes);
  }, [selectedLocation, allTaxes, locations]);

  const handleFrequencyChange = (freq: string) => {
    setFrequency(freq);
    
    const periodStr = freq === 'Monthly' ? " - {month} {year}" : 
                     freq === 'Yearly' ? " - {year}" : 
                     freq === 'Weekly' ? " - Week {week}, {year}" : "";
                     
    if (periodStr) {
      setItems(prev => prev.map(item => {
        if (item.description && !item.description.includes('{')) {
          return { ...item, description: item.description + periodStr };
        }
        return item;
      }));
    }
  };

  const handleForceGenerate = async () => {
    setIsForceGenerating(true);
    try {
      const res = await api(`/recurring-invoice/force-generate/${id}`, { 
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast({ 
          title: "Invoice Generated!", 
          description: `Successfully created ${data.invoice_no}. Redirecting...`,
          variant: "default"
        });
        setTimeout(() => {
          router.push(`/cms/invoices/${data.id}/view`);
        }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate invoice", variant: "destructive" });
    } finally {
      setIsForceGenerating(false);
      setShowConfirmGen(false);
    }
  };

  const calculateCycleEnd = () => {
    if (!startDate) return "";
    try {
      const dt = new DateTime(startDate);
      switch (frequency) {
        case 'Daily': return dt.format('yyyy-MM-dd');
        case 'Weekly': dt.modify('+6 days'); return dt.format('yyyy-MM-dd');
        case 'Monthly': dt.modify('+1 month -1 day'); return dt.format('yyyy-MM-dd');
        case 'Yearly': dt.modify('+1 year -1 day'); return dt.format('yyyy-MM-dd');
        default: return "";
      }
    } catch (e) { return ""; }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [template, partsData, taxesData, locs, custs, company] = await Promise.all([
        fetchRecurringInvoiceDetails(id),
        fetchParts(),
        fetchTaxes('', { all: true }),
        fetchLocations(),
        fetchCustomers(),
        fetchCompany()
      ]);

      if (!template) {
        toast({ title: "Error", description: "Template not found.", variant: "destructive" });
        router.push("/cms/invoices/recurring");
        return;
      }

      // Populate template data
      setTemplateName(template.template_name);
      setFrequency(template.frequency);
      setStartDate(template.start_date);
      setEndDate(template.end_date || "");
      setStatus(template.status);
      setItems(template.items || []);
      setNotes(template.notes || "");
      setSelectedLocation(String(template.location_id));
      setSelectedCustomer(String(template.customer_id));
      setBillingAddress(template.billing_address || "");
      setShippingAddress(template.shipping_address || "");

      setAllParts(partsData);
      
      let enabledIds = new Set<number>();
      if (company?.tax_ids_json) {
        try { enabledIds = new Set(JSON.parse(company.tax_ids_json)); } catch {}
      }
      setSystemTaxes(taxesData.filter((t: any) => t.is_active && enabledIds.has(t.id)));
      
      setLocations(locs);
      setCustomers(custs);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load template data.", variant: "destructive" });
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
      newItems[index].line_total = Math.max(0, (price - disc) * qty);
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totals = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const disc = Number(item.discount) || 0;
    const lineTotal = Math.max(0, (price - disc) * qty);
    return {
      subtotal: acc.subtotal + (qty * price),
      discount: acc.discount + (qty * disc),
      taxable: acc.taxable + lineTotal
    };
  }, { subtotal: 0, discount: 0, taxable: 0 });

  let taxTotal = 0;
  systemTaxes.forEach(tax => {
    taxTotal += totals.taxable * (Number(tax.rate_percent) / 100);
  });

  const grandTotal = totals.taxable + taxTotal;

  const handleSave = async () => {
    if (!templateName || !selectedCustomer || !selectedLocation) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        template_name: templateName,
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        status,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        subtotal: totals.subtotal,
        tax_total: taxTotal,
        discount_total: totals.discount,
        grand_total: grandTotal,
        notes,
        items: items.map(item => ({
          item_id: item.item_id || null,
          description: item.description,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          line_total: item.line_total
        }))
      };

      await updateRecurringInvoice(id, payload);
      toast({ title: "Success", description: "Recurring template updated." });
      router.push("/cms/invoices/recurring");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update.", variant: "destructive" });
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
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => router.push('/cms/invoices/recurring')} className="p-0 h-auto hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium text-foreground">Edit Template</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RotateCw className="w-5 h-5 text-amber-500" />
              <span className="text-amber-600 text-sm font-semibold tracking-widest uppercase">Edit Template</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Recurring Invoice</h2>
            <p className="text-muted-foreground mt-1">Modify schedule and template details.</p>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog open={showConfirmGen} onOpenChange={setShowConfirmGen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-amber-600 border-amber-200 bg-amber-50/50 hover:bg-amber-100 font-bold transition-all"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Force Generate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Generate Invoice Now?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately create an invoice from this template, bypassing the normal schedule.
                    The customer will receive an email notification with the invoice PDF.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isForceGenerating}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={(e) => {
                      e.preventDefault();
                      handleForceGenerate();
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                    disabled={isForceGenerating}
                  >
                    {isForceGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Confirm & Generate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 shadow-sm">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Update Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <Tag className="w-4 h-4" /> Template Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Template Name *</Label>
                    <Input value={templateName} onChange={e => setTemplateName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Input value={customers.find(c => String(c.id) === selectedCustomer)?.name || ""} disabled className="bg-muted/50" />
                    {selectedCustomer && (
                      <div className="flex items-center gap-2 mt-2 px-1 text-xs">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Sending to:</span>
                        <span className="font-medium">
                          {customers.find(c => String(c.id) === selectedCustomer)?.email || 'No Email Set'}
                        </span>
                        {customers.find(c => String(c.id) === selectedCustomer)?.email ? (
                          <Badge variant="outline" className="text-[9px] h-4 bg-green-50 text-green-700 border-green-200">AUTO-SEND ENABLED</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] h-4 bg-red-50 text-red-700 border-red-200 uppercase">Email Missing</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Paused">Paused</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <FileText className="w-4 h-4" /> Invoice Items
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setItems([...items, { description: "", item_type: "Part", quantity: 1, unit_price: 0, discount: 0, line_total: 0 }])}>
                  <Plus className="w-3 h-3 mr-1" /> Add Manual Item
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 border-b">
                        <th className="p-4 text-left font-bold text-muted-foreground uppercase text-[10px]">Description</th>
                        <th className="p-4 text-right font-bold text-muted-foreground uppercase text-[10px] w-20">Qty</th>
                        <th className="p-4 text-right font-bold text-muted-foreground uppercase text-[10px] w-32">Price</th>
                        <th className="p-4 text-right font-bold text-muted-foreground uppercase text-[10px] w-32">Total</th>
                        <th className="p-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <SearchableSelect
                              value={item.item_id ? String(item.item_id) : ""}
                              onValueChange={(val) => {
                                const p = allParts.find(x => String(x.id) === String(val));
                                if (p) {
                                  handleItemChange(index, 'item_id', p.id);
                                  handleItemChange(index, 'description', p.part_name || p.description);
                                  handleItemChange(index, 'unit_price', p.price || p.cost_price || 0);
                                  handleItemChange(index, 'item_type', p.item_type === "Service" ? "Service" : "Part");
                                }
                              }}
                              options={allParts.map(p => ({
                                value: String(p.id),
                                label: formatPartLabel(p)
                              }))}
                              className="text-right border-none shadow-none focus-visible:ring-1"
                            />
                          </td>
                          <td className="p-4">
                            <Input 
                              type="number" 
                              value={item.unit_price} 
                              onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                              className="text-right border-none shadow-none focus-visible:ring-1"
                            />
                          </td>
                          <td className="p-4 text-right font-bold tabular-nums">
                            {Number(item.line_total).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden bg-amber-50/30 dark:bg-amber-900/10 border-l-4 border-l-amber-500">
              <CardHeader className="bg-amber-500/10 border-b border-amber-500/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  <Calendar className="w-4 h-4" /> Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={handleFrequencyChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>

                <div className="pt-2 border-t border-amber-500/10">
                  <div className="flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-400 font-medium italic">
                    <Clock className="w-3 h-3" />
                    Billing Cycle: {startDate} to {calculateCycleEnd()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden bg-slate-900 text-white">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-sm opacity-70">
                  <span>Subtotal</span>
                  <span className="tabular-nums">LKR {totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm text-rose-400">
                    <span>Discount</span>
                    <span className="tabular-nums">-LKR {totals.discount.toFixed(2)}</span>
                  </div>
                )}
                {taxTotal > 0 && (
                  <>
                    <div className="flex justify-between text-sm opacity-70">
                      <span>Tax Total</span>
                      <span className="tabular-nums">+LKR {taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {systemTaxes.map(tax => {
                        const amount = totals.taxable * (Number(tax.rate_percent) / 100);
                        if (amount <= 0) return null;
                        return (
                          <div key={tax.id} className="flex justify-between text-[10px] opacity-50 pl-4 italic border-l border-white/10 ml-2">
                            <span>{tax.name} ({Number(tax.rate_percent)}%)</span>
                            <span className="tabular-nums">LKR {amount.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                  <span className="font-bold uppercase text-xs tracking-widest">Grand Total</span>
                  <span className="text-2xl font-black text-amber-400 tabular-nums">
                    LKR {grandTotal.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
