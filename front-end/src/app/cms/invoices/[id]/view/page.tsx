"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { api, fetchInvoiceDetails, createPaymentReceipt, fetchCompany, contentUrl, type CompanyRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Printer,
  ChevronLeft,
  DollarSign,
  Loader2,
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Truck,
  History,
  RotateCw
} from "lucide-react";
import { convertInvoiceToRecurring } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function InvoiceContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const shouldPrint = searchParams.get('print') === 'true';
  const taxInclusive = searchParams.get('tax_inclusive') === '1';

  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState("");
  // Cheque fields
  const [chequeNo, setChequeNo] = useState("");
  const [chequeBankName, setChequeBankName] = useState("");
  const [chequeBranchName, setChequeBranchName] = useState("");
  const [chequeDate, setChequeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [chequePayee, setChequePayee] = useState("");
  const [lastReceiptId, setLastReceiptId] = useState<string | null>(null);

  // Recurring Template State
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [recurringSubmitting, setRecurringSubmitting] = useState(false);
  const [frequency, setFrequency] = useState("Monthly");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [templateName, setTemplateName] = useState("");

  const loadInvoice = async () => {
    setError(null);
    try {
      const data = await fetchInvoiceDetails(id);
      if (!data) throw new Error("Invoice not found");
      setInvoice(data);
      
      const balance = Number(data.grand_total) - Number(data.paid_amount);
      setPaymentAmount(balance > 0 ? balance.toString() : "");

      try {
        const comp = await fetchCompany();
        if (comp) setCompany(comp);
      } catch (e) {
        console.warn("Company details unavailable", e);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to load invoice details.";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoice && !templateName) {
      setTemplateName(`Template for ${invoice.invoice_no}`);
    }
  }, [invoice]);

  const handleConvertToRecurring = async () => {
    setRecurringSubmitting(true);
    try {
      await convertInvoiceToRecurring(id, {
        template_name: templateName,
        frequency,
        start_date: startDate
      });
      toast({ title: "Success", description: "Recurring template created successfully." });
      setRecurringDialogOpen(false);
      router.push("/cms/invoices/recurring");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to convert.", variant: "destructive" });
    } finally {
      setRecurringSubmitting(false);
    }
  };

  useEffect(() => {
    if (id) loadInvoice();
  }, [id]);

  useEffect(() => {
    if (shouldPrint && !loading && invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, loading, invoice]);

  const handleRecordPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast({ title: "Validation Error", description: "Invalid payment amount.", variant: "destructive" });
      return;
    }
    if (paymentMethod === 'Cheque' && chequeNo.length < 6) {
      toast({ title: "Validation Error", description: "Enter at least 6 cheque digits.", variant: "destructive" });
      return;
    }

    setPaymentSubmitting(true);
    try {
      const payload: any = {
        invoice_id: Number(id),
        invoice_no: invoice?.invoice_no ?? '',
        customer_id: Number(invoice?.customer_id ?? 0),
        customer_name: invoice?.customer_name ?? '',
        location_id: Number(invoice?.location_id ?? 1),
        amount: Number(paymentAmount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_no: paymentRef || null,
      };
      if (paymentMethod === 'Cheque') {
        payload.cheque = {
          cheque_no: chequeNo,
          bank_name: chequeBankName,
          branch_name: chequeBranchName,
          cheque_date: chequeDate,
          payee_name: chequePayee,
        };
      }
      const result = await createPaymentReceipt(payload);
      const receiptNo = result.receipt_no;
      toast({ title: "Payment Recorded", description: `Receipt ${receiptNo} generated.` });
      setPaymentDialogOpen(false);
      setLastReceiptId(null);
      // Offer to print receipt
      if (receiptNo) window.open(`/cms/invoices/${id}/receipt?autoprint=1`, '_blank');
      loadInvoice();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add payment.", variant: "destructive" });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const handleResendEmail = async () => {
    setEmailSubmitting(true);
    try {
      const res = await api(`/api/invoice/send-email/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        toast({ title: "Success", description: data.message });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to resend email.", variant: "destructive" });
    } finally {
      setEmailSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-x-2 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-lg font-medium tracking-tight">Loading Securely...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-20 border-rose-100 bg-rose-50/30">
        <CardContent className="pt-8 pb-10 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-rose-600 rotate-45" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-rose-900">Unable to load Invoice</h3>
            <p className="text-sm text-rose-600 font-medium">{error}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/cms/invoices")} className="border-rose-200 text-rose-700 hover:bg-rose-100">
            Return to Invoice List
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) return null;

  const balance = Number(invoice.grand_total) - Number(invoice.paid_amount);
  const isPaid = balance <= 0;

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(Number(amount));
  };

  const getShortTaxName = (name: string) => {
    const upper = (name || "").toUpperCase();
    if (upper.includes("SOCIAL SECURITY CONTRIBUTION LEVY")) return "SSCL";
    if (upper.includes("VALUE ADDED TAX")) return "VAT";
    return name;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.push("/cms/invoices")} className="hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>

        <div className="flex items-center gap-3">
          {!isPaid && (
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-all">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Remaining balance: <span className="font-bold text-foreground">{formatCurrency(balance)}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (LKR)</Label>
                      <Input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Date</Label>
                      <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={paymentMethod}
                        onChange={e => { setPaymentMethod(e.target.value); }}
                      >
                        <option>Cash</option>
                        <option>Card</option>
                        <option>Bank Transfer</option>
                        <option>Cheque</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference No.</Label>
                      <Input placeholder="Optional" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
                    </div>
                  </div>

                  {/* Cheque fields */}
                  {paymentMethod === 'Cheque' && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Cheque Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Cheque Number (last 6 digits)</Label>
                          <Input maxLength={6} placeholder="XXXXXX" value={chequeNo} onChange={e => setChequeNo(e.target.value.replace(/\D/g,''))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Cheque Date</Label>
                          <Input type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Bank Name</Label>
                          <Input placeholder="e.g. Sampath Bank" value={chequeBankName} onChange={e => setChequeBankName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Branch Name</Label>
                          <Input placeholder="e.g. Colombo 3" value={chequeBranchName} onChange={e => setChequeBranchName(e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Payee Name</Label>
                          <Input placeholder="Name on cheque" value={chequePayee} onChange={e => setChequePayee(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleRecordPayment} disabled={paymentSubmitting} className="w-full font-bold">
                    {paymentSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Confirm & Generate Receipt
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-all">
                <History className="w-4 h-4 mr-2" />
                Make Recurring
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Recurring Template</DialogTitle>
                <DialogDescription>
                  Convert this invoice into a template for automated generation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Monthly Maintenance" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={frequency}
                      onChange={e => setFrequency(e.target.value)}
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Next Run Date</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleConvertToRecurring} disabled={recurringSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                  {recurringSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCw className="w-4 h-4 mr-2" />}
                  Save Recurring Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleResendEmail} disabled={emailSubmitting} className="text-slate-600 border-slate-200 hover:bg-slate-50 transition-all">
            {emailSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Resend Email
          </Button>

          <Button onClick={() => window.open(`/cms/invoices/${id}/print?autoprint=1${taxInclusive ? '&tax_inclusive=1' : ''}`, '_blank')} className="bg-primary hover:bg-primary/90 shadow-sm">
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Document Card */}
      <Card className="border-none shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-10 md:p-16 space-y-12 bg-card">
            
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row justify-between gap-8 border-b pb-12 border-border/60">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {company?.logo_filename ? (
                    <img src={contentUrl('company', company.logo_filename)} alt="Logo" className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Printer className="w-8 h-8 text-primary opacity-20" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-black tracking-tighter text-foreground border-l-4 border-primary pl-4 uppercase">
                      Invoice
                    </h1>
                    <p className="pl-4 text-muted-foreground font-mono text-sm uppercase tracking-tighter">NO: {invoice.invoice_no}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <p className="text-xl font-black text-foreground uppercase tracking-tight">
                  {company?.name || "ServiceBay Solutions"}
                </p>
                {invoice.location_name && (
                  <p className="text-sm font-bold text-muted-foreground/80 leading-snug">
                    {invoice.location_name}
                  </p>
                )}
                <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {invoice.location_address || company?.address || "Main Distribution Hub, Colombo"}
                  {(invoice.location_tax_no || company?.tax_no) && (
                    <div className="font-bold text-foreground uppercase text-[10px] mt-2 bg-muted/50 px-3 py-1 rounded-full inline-block border border-border/50">
                      {invoice.location_tax_label || company?.tax_label || "TAX ID"}: {invoice.location_tax_no || company?.tax_no}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-3 mt-3">
                    <span className="flex items-center gap-1.5 font-medium text-foreground/80"><Phone className="w-3.5 h-3.5 text-primary"/> {invoice.location_phone || company?.phone || "+94 77 123 4567"}</span>
                    <span className="flex items-center gap-1.5 font-medium text-foreground/80"><Mail className="w-3.5 h-3.5 text-primary"/> {company?.email || "billing@servicebay.com"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Billing Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Billed To</h4>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-foreground">{invoice.customer_name}</p>
                  <p className="text-sm text-muted-foreground font-medium">{invoice.customer_phone}</p>
                  {invoice.customer_tax_no && (
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-widest bg-muted px-2.5 py-1 rounded-full inline-block border border-border/50">
                      TAX ID: {invoice.customer_tax_no}
                    </p>
                  )}
                  {invoice.billing_address && (
                    <p className="text-sm text-muted-foreground/80 mt-3 whitespace-pre-line border-t pt-3 border-border/40 leading-relaxed">{invoice.billing_address}</p>
                  )}
                  {invoice.is_international === 1 && (
                    <div className="mt-4 pt-4 border-t border-border/40 bg-blue-50/30 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-600/60 dark:text-blue-400/60">International Delivery</h5>
                        <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[9px] h-4">
                          <Globe className="w-3 h-3 mr-1" /> {invoice.shipping_country || 'Global'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" /> {invoice.provider_name || 'Shipping Provider'}
                      </p>
                      <p className="text-sm text-muted-foreground/80 whitespace-pre-line leading-relaxed">{invoice.shipping_address}</p>
                    </div>
                  )}
                  {invoice.shipping_address && invoice.shipping_address !== invoice.billing_address && invoice.is_international !== 1 && (
                    <div className="mt-4 pt-4 border-t border-border/40 bg-muted/20 p-3 rounded-lg">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Shipping Address</h5>
                      <p className="text-sm text-muted-foreground/80 whitespace-pre-line leading-relaxed">{invoice.shipping_address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Payment Status</h4>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm
                    ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''}
                    ${invoice.status === 'Partial' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : ''}
                    ${invoice.status === 'Unpaid' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : ''}
                  `}>
                    {invoice.status}
                  </Badge>
                  {isPaid && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-emerald-500/20 shadow-lg shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>}
                </div>
              </div>

              <div className="space-y-4 text-right md:text-left">
                {invoice.location_name && (
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-muted-foreground/70 font-medium">Fleet Management</span>
                    <div className="text-right">
                      <span className="font-bold text-foreground/90 block">{invoice.location_name}</span>
                      {invoice.location_phone && <span className="text-[10px] text-muted-foreground tabular-nums">{invoice.location_phone}</span>}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-border/40">
                  <span className="text-muted-foreground/70 font-medium">Issue Date</span>
                  <span className="font-bold text-foreground/90 tabular-nums">{invoice.issue_date}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground/70 font-medium">Due Date</span>
                  <span className="font-bold text-foreground/90 tabular-nums border-b border-border pb-0.5">{invoice.due_date}</span>
                </div>
                {invoice.order_id && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground/70 font-medium">Repair Reference</span>
                    <span className="font-black text-primary dark:text-primary-foreground/90 hover:underline cursor-pointer">#{invoice.order_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Items Table Section */}
            <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="py-4 px-6 font-black uppercase tracking-widest text-muted-foreground/60 text-[10px]">Description & Type</th>
                    <th className="py-4 px-6 font-black uppercase tracking-widest text-muted-foreground/60 text-[10px] text-right">Qty</th>
                    <th className="py-4 px-6 font-black uppercase tracking-widest text-muted-foreground/60 text-[10px] text-right">Unit Price</th>
                    <th className="py-4 px-6 font-black uppercase tracking-widest text-muted-foreground/60 text-[10px] text-right">Discount</th>
                    <th className="py-4 px-6 font-black uppercase tracking-widest text-muted-foreground/60 text-[10px] text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {invoice.items?.map((item: any) => {
                    const totalTaxPercent = (invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.rate_percent || 0), 0);
                    let displayUnitPrice = Number(item.unit_price);
                    let displayDiscount = Number(item.discount || 0);
                    let displayLineTotal = Number(item.line_total);
                    
                    if (taxInclusive && totalTaxPercent > 0) {
                      displayUnitPrice = displayUnitPrice * (1 + totalTaxPercent / 100);
                      displayDiscount = displayDiscount * (1 + totalTaxPercent / 100);
                      displayLineTotal = displayLineTotal * (1 + totalTaxPercent / 100);
                    }

                    return (
                      <tr key={item.id} className="group hover:bg-muted/20 transition-colors">
                        <td className="py-5 px-6">
                          <div className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{item.description}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2.5 py-0.5 rounded-md border
                              ${item.item_type === 'Service' ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' : 'text-muted-foreground bg-muted border-border'}
                            `}>
                              {item.item_type}
                            </span>
                          </div>
                          {/* Sold Batch Details */}
                          {invoice.batch_movements?.filter((bm: any) => Number(bm.part_id) === Number(item.item_id))?.length > 0 && (
                            <div className="mt-3 space-y-1.5 border-l-2 border-primary/20 pl-3">
                              {invoice.batch_movements
                                .filter((bm: any) => Number(bm.part_id) === Number(item.item_id))
                                .map((bm: any, bIdx: number) => (
                                  <div key={bIdx} className="text-[11px] flex items-center gap-2">
                                    <span className="font-black text-primary/70 uppercase tracking-widest text-[9px]">Batch</span>
                                    <span className="font-bold text-foreground/80">{bm.batch_number || 'UNBATCHED'}</span>
                                    {bm.expiry_date && (
                                      <>
                                        <span className="text-muted-foreground/40 text-[8px]">/</span>
                                        <span className="text-muted-foreground uppercase text-[9px]">Exp: {bm.expiry_date}</span>
                                      </>
                                    )}
                                    <span className="ml-auto tabular-nums font-bold text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                                      Qty: {Math.abs(Number(bm.qty_change))}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </td>
                        <td className="py-5 px-6 text-right font-medium text-muted-foreground tabular-nums">{item.quantity}</td>
                        <td className="py-5 px-6 text-right font-medium text-muted-foreground tabular-nums">{formatCurrency(displayUnitPrice)}</td>
                        <td className="py-5 px-6 text-right font-bold text-rose-500 tabular-nums uppercase tracking-tighter">
                          {displayDiscount > 0 ? `-${formatCurrency(displayDiscount)}` : "-"}
                        </td>
                        <td className="py-5 px-6 text-right font-black text-foreground tabular-nums tracking-tighter shadow-sm">
                          {formatCurrency(displayLineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Totals Section */}
            <div className="flex flex-col md:flex-row justify-between gap-12 pt-10 border-t border-border">
              <div className="flex-1 space-y-8">
                {invoice.notes && (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Important Notes</h5>
                    <div className="bg-muted/40 p-5 rounded-2xl text-sm text-muted-foreground italic leading-relaxed border-l-4 border-primary/30">
                      {invoice.notes}
                    </div>
                  </div>
                )}
                
                {/* Payment History */}
                {invoice.payments && invoice.payments.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Payment Reconciliation</h5>
                    <div className="divide-y border-y border-border/40">
                      {invoice.payments.map((p: any) => (
                        <div key={p.id} className="py-3 group space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">
                              {p.payment_date} — <span className="uppercase opacity-70 italic font-bold">{p.payment_method}</span>
                            </span>
                            <span className="text-emerald-500 dark:text-emerald-400 font-black tabular-nums">+{formatCurrency(p.amount)}</span>
                          </div>
                          {p.payment_method === 'Card' && (
                            <div className="flex flex-wrap gap-2 items-center text-[9px] font-bold uppercase tracking-tight">
                              {p.card_type && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">{p.card_type}</span>}
                              {p.card_bank_name && <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded text-indigo-600 dark:text-indigo-400">{p.card_bank_name}</span>}
                              {p.card_category && <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">{p.card_category}</span>}
                              {p.card_last4 && <span className="font-mono text-slate-400">**** {p.card_last4}</span>}
                              {p.card_auth_code && <span className="text-slate-400 opacity-60 italic">Auth: {p.card_auth_code}</span>}
                            </div>
                          )}
                          {p.payment_method === 'Cheque' && p.cheque_no_last6 && (
                            <div className="flex flex-wrap gap-2 items-center text-[9px] font-bold uppercase tracking-tight text-amber-600">
                              <span>Cheque #{p.cheque_no_last6}</span>
                              {p.cheque_date && <span>• Date: {p.cheque_date}</span>}
                              {p.cheque_bank_name && <span>• {p.cheque_bank_name}</span>}
                              {p.cheque_branch_name && <span>• {p.cheque_branch_name}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-80 space-y-4 bg-muted/20 p-6 rounded-3xl border border-border/50">
                <div className="space-y-3 pb-5 border-b border-border">
                  {taxInclusive ? (
                    <div className="space-y-3">
                      {(() => {
                        const taxSum = (invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
                        const inferredDiscount = Number(invoice.subtotal) + taxSum - Number(invoice.grand_total);
                        const actualDiscount = Number(invoice.discount_total) > 0 ? Number(invoice.discount_total) : (inferredDiscount > 0.01 ? inferredDiscount : 0);
                        
                        if (actualDiscount > 0 || invoice.applied_promotion_name) {
                          return (
                            <div className="flex justify-between items-center text-sm text-rose-500 font-bold">
                              <span>Savings / Discount {invoice.applied_promotion_name ? `(${invoice.applied_promotion_name})` : ''}</span>
                              <span className="tabular-nums">-LKR {actualDiscount.toFixed(2)}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex justify-between items-center text-sm font-bold text-primary">
                        <span>Total (Tax Inclusive)</span>
                        <span className="tabular-nums">LKR {Number(invoice.grand_total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground italic">
                        <span>Includes Taxes</span>
                        <span className="tabular-nums">LKR {(invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground/70 font-medium">Subtotal</span>
                        <span className="font-bold text-foreground/90 tabular-nums">LKR {Number(invoice.subtotal).toFixed(2)}</span>
                      </div>
                      {(() => {
                        const taxSum = (invoice.applied_taxes || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
                        const inferredDiscount = Number(invoice.subtotal) + taxSum - Number(invoice.grand_total);
                        const actualDiscount = Number(invoice.discount_total) > 0 ? Number(invoice.discount_total) : (inferredDiscount > 0.01 ? inferredDiscount : 0);
                        
                        if (actualDiscount > 0 || invoice.applied_promotion_name) {
                          return (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground/70 font-medium">
                                Discount {invoice.applied_promotion_name ? `(${invoice.applied_promotion_name})` : ''}
                              </span>
                              <span className="font-bold text-rose-500 tabular-nums">-LKR {actualDiscount.toFixed(2)}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {invoice.applied_taxes && invoice.applied_taxes.length > 0 ? (
                        invoice.applied_taxes.map((tax: any) => (
                          <div key={tax.id} className="flex justify-between items-center text-sm text-blue-600 dark:text-cyan-400">
                            <span className="font-medium">{getShortTaxName(tax.tax_code || tax.tax_name)} {Number(tax.rate_percent) > 0 ? `(${Number(tax.rate_percent)}%)` : ''}</span>
                            <span className="font-bold tabular-nums">+LKR {Number(tax.amount).toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        Number(invoice.tax_total) > 0 && (
                          <div className="flex justify-between items-center text-sm text-blue-600 dark:text-cyan-400">
                            <span className="font-medium">Tax</span>
                            <span className="font-bold tabular-nums">+LKR {Number(invoice.tax_total).toFixed(2)}</span>
                          </div>
                        )
                      )}
                      {Number(invoice.shipping_fee) > 0 && (
                        <div className="flex justify-between items-center text-sm text-indigo-600 dark:text-indigo-400">
                          <span className="font-medium">Shipping ({invoice.shipping_provider_name || 'Standard'})</span>
                          <span className="font-bold tabular-nums">+LKR {Number(invoice.shipping_fee).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="pt-4 border-t border-border flex justify-between items-baseline">
                    <span className="text-sm font-black uppercase tracking-widest text-foreground/60">Grand Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-amber-500 tabular-nums tracking-tighter">
                        <span className="text-sm mr-1 uppercase">LKR</span>
                        {Number(invoice.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl space-y-3 mt-4 transition-all shadow-inner border border-border/30
                  ${isPaid ? 'bg-emerald-500/5' : 'bg-rose-500/5'}
                `}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    <span>Paid to Date</span>
                    <span className="text-emerald-500">{formatCurrency(invoice.paid_amount)}</span>
                  </div>
                  <div className={`flex justify-between text-lg font-black tracking-tighter
                    ${isPaid ? 'text-emerald-500' : 'text-rose-500 underline decoration-rose-500/30 underline-offset-8'}
                  `}>
                    <span className="uppercase font-bold tracking-widest text-xs opacity-80 pt-1.5">Balance Due</span>
                    <span className="tabular-nums">{formatCurrency(balance)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Footer */}
            <div className="flex flex-col items-center justify-center pt-16 text-center space-y-4">
              <div className="flex items-center gap-2 opacity-50">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {company?.name || "ServiceBay"} • Automotive Excellence
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/40 font-medium px-20 leading-loose max-w-2xl mx-auto italic">
                Thank you for choosing us for your vehicle maintenance. Please ensure payment is made by the due date to avoid service interruptions. 
                This document is electronically generated and verified for authenticity.
              </p>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvoiceViewPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex h-96 items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-lg font-medium tracking-tight">Initializing Document...</span>
        </div>
      }>
        <InvoiceContent />
      </Suspense>
    </DashboardLayout>
  );
}
