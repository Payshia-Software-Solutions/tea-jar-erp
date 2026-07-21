"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  fetchCustomers, 
  fetchInvoices, 
  addBulkInvoicePayments,
  fetchBanks
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  Banknote, 
  ChevronRight,
  User,
  FileText,
  CheckCircle2,
  Check
} from "lucide-react";
import Link from "next/link";

export default function NewPaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  
  // Selection State
  const [step, setStep] = useState(1); // 1: Customer, 2: Invoice, 3: Payment
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  
  // Form State
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "Cash",
    payment_date: new Date().toISOString().split('T')[0],
    reference_no: "",
    notes: "",
    bank_id: ""
  });

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [custs, bks] = await Promise.all([
          fetchCustomers(),
          fetchBanks()
        ]);
        setCustomers(custs || []);
        setBanks(bks || []);
      } catch (err) {}
    };
    loadInit();
  }, []);

  const handleCustomerSelect = async (cust: any) => {
    setSelectedCustomer(cust);
    setSelectedInvoices([]);
    setLoading(true);
    try {
      // Fetch only unpaid or partial invoices
      const invs = await fetchInvoices({ customer_id: String(cust.id) });
      const pending = invs.filter((i: any) => i.status === 'Unpaid' || i.status === 'Partial');
      setInvoices(pending);
      setStep(2);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load invoices", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleInvoiceSelect = (inv: any) => {
    setSelectedInvoices(prev => {
      if (prev.some(i => i.id === inv.id)) {
        return prev.filter(i => i.id !== inv.id);
      } else {
        return [...prev, inv];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices([...invoices]);
    }
  };

  const handleProceedToPayment = () => {
    const initialAllocations: Record<number, string> = {};
    let totalVal = 0;
    selectedInvoices.forEach(inv => {
      const bal = Number(inv.grand_total) - Number(inv.paid_amount);
      initialAllocations[inv.id] = String(bal.toFixed(2));
      totalVal += bal;
    });
    setAllocations(initialAllocations);
    setFormData(prev => ({ ...prev, amount: String(totalVal.toFixed(2)) }));
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoices.length === 0) return;
    
    setLoading(true);
    try {
      const paymentsPayload = selectedInvoices.map(inv => ({
        invoice_id: inv.id,
        amount: Number(allocations[inv.id] || 0)
      })).filter(p => p.amount > 0);

      if (paymentsPayload.length === 0) {
        toast({ title: "Validation Error", description: "At least one invoice must have an allocated payment amount.", variant: "destructive" });
        setLoading(false);
        return;
      }

      await addBulkInvoicePayments({
        ...formData,
        amount: Number(formData.amount),
        payments: paymentsPayload,
        userId: 1 // TODO: Dynamic auth
      });
      
      toast({ 
        title: "Success", 
        description: `Bulk payment of LKR ${Number(formData.amount).toLocaleString()} recorded successfully.`
      });
      router.push("/cms/payment-receipts");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/cms/payment-receipts" className="hover:text-primary transition-colors">Receipts</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Record New Payment</span>
        </div>

        {/* Stepper Header */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {step === 1 && (
          <Card className="border-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Select Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9 h-12 rounded-xl" placeholder="Search by name or phone..." />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleCustomerSelect(c)}
                    className="flex flex-col items-start p-4 rounded-2xl border border-border/50 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                  >
                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.phone || "No phone"}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" /> Change Customer
            </Button>
            
            <Card className="border-none shadow-xl">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-primary">
                    <FileText className="w-5 h-5" />
                    Select Pending Invoices
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-medium">Showing unpaid balances for <span className="text-foreground font-bold">{selectedCustomer?.name}</span></p>
                </div>
                {invoices.length > 0 && (
                  <Button variant="outline" size="sm" onClick={toggleSelectAll} className="text-xs font-bold uppercase">
                    {selectedInvoices.length === invoices.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : invoices.length === 0 ? (
                  <div className="text-center p-8 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-20" />
                    <p className="text-sm font-medium text-muted-foreground">No pending invoices found for this customer.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {invoices.map(inv => {
                        const isSelected = selectedInvoices.some(i => i.id === inv.id);
                        return (
                          <button
                            key={inv.id}
                            onClick={() => toggleInvoiceSelect(inv)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                                : 'border-border/50 hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-sm">INV-{inv.invoice_no}</span>
                                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{inv.issue_date}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-lg">LKR {(Number(inv.grand_total) - Number(inv.paid_amount)).toLocaleString()}</div>
                              <div className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">Balance Due</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-4 flex justify-end items-center border-t">
                      <Button 
                        disabled={selectedInvoices.length === 0} 
                        onClick={handleProceedToPayment}
                        className="h-12 px-6 rounded-xl font-black uppercase tracking-tight text-sm shadow-md"
                      >
                        Proceed to Pay ({selectedInvoices.length} Selected)
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setStep(2)} className="gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" /> Change Invoices
            </Button>

            <form onSubmit={handleSubmit}>
              <Card className="border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-primary" />
                      Bulk Payment Settlement
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Selected Invoices</div>
                      <div className="font-mono font-bold text-primary">{selectedInvoices.length} Invoices</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Allocation Fields */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Allocation per Invoice</label>
                    <div className="border border-border/60 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/30 space-y-3 max-h-[300px] overflow-y-auto">
                      {selectedInvoices.map(inv => {
                        const maxBalance = Number(inv.grand_total) - Number(inv.paid_amount);
                        return (
                          <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                            <div>
                              <div className="font-mono font-bold text-sm">INV-{inv.invoice_no}</div>
                              <div className="text-[10px] text-muted-foreground">
                                Balance: <span className="font-bold text-slate-800 dark:text-slate-200">LKR {maxBalance.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="relative w-full sm:w-48">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">LKR</span>
                              <Input 
                                type="number"
                                step="0.01"
                                required
                                max={maxBalance}
                                placeholder="0.00"
                                className="h-10 pl-10 pr-3 font-bold text-right rounded-xl"
                                value={allocations[inv.id] || ""}
                                onChange={e => {
                                  const val = e.target.value;
                                  const newAllocations = { ...allocations, [inv.id]: val };
                                  setAllocations(newAllocations);
                                  
                                  let newTotal = 0;
                                  Object.values(newAllocations).forEach(v => {
                                    newTotal += Number(v) || 0;
                                  });
                                  setFormData(prev => ({ ...prev, amount: String(newTotal.toFixed(2)) }));
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Payment Amount (LKR)</label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        readOnly 
                        className="h-12 text-lg font-black rounded-xl border-2 bg-muted cursor-not-allowed text-primary"
                        value={formData.amount}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Method</label>
                      <select
                        className="w-full h-12 rounded-xl border-2 border-input bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.payment_method}
                        onChange={e => setFormData({...formData, payment_method: e.target.value})}
                      >
                        <option>Cash</option>
                        <option>Card</option>
                        <option>Bank Transfer</option>
                        <option>Cheque</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Date</label>
                      <Input 
                        type="date" 
                        required 
                        className="h-12 rounded-xl font-bold"
                        value={formData.payment_date}
                        onChange={e => setFormData({...formData, payment_date: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference / Trx ID</label>
                      <Input 
                        placeholder="Cheque No, Txn ID, etc." 
                        className="h-12 rounded-xl font-bold"
                        value={formData.reference_no}
                        onChange={e => setFormData({...formData, reference_no: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes (Optional)</label>
                    <Input 
                      placeholder="e.g. Settlement of multiple pending invoices" 
                      className="h-12 rounded-xl font-medium"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !formData.amount || Number(formData.amount) <= 0} 
                    className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-tight shadow-lg shadow-primary/20"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Settlement"}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

