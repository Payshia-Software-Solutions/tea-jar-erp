"use client";

import React, { useState } from "react";
import { 
  RotateCcw, 
  Banknote, 
  Loader2, 
  Check, 
  Printer, 
  Minus, 
  Plus, 
  Search, 
  Receipt, 
  AlertCircle, 
  ShieldCheck,
  History,
  Trash2,
  FileText,
  HelpCircle,
  Keyboard,
  MousePointer2,
  Zap,
  ArrowRight,
  LayoutGrid,
  Building2,
  Store,
  Calculator
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { usePOS } from "../../context/POSContext";
import { 
  fetchInvoiceForReturn, 
  fetchReturnDetails, 
  fetchPosDayLedger,
  fetchInvoices,
  addInvoicePayment, 
  api as apiHelper 
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

import { ReservationSelectionDialog } from "./ReservationSelectionDialog";

export const ManagementModals: React.FC = () => {
  const { toast } = useToast();
  const {
    returnDialogOpen, setReturnDialogOpen,
    refundDialogOpen, setRefundDialogOpen,
    ledgerDialogOpen, setLedgerDialogOpen,
    guideModalOpen, setGuideModalOpen,
    dayLedger, setDayLedger,
    loadingLedger, setLoadingLedger,
    selectedLocation,
    inventory, customers: posCustomers,
    vKeyboardEnabled, setVKeyboardActiveInput,
    pendingInvoicesDialogOpen, setPendingInvoicesDialogOpen,
    banks, bankBranches, setBankBranches
  } = usePOS();

  // --- Returns States ---
  const [searchInvoiceNo, setSearchInvoiceNo] = useState("");
  const [searchingReturn, setSearchingReturn] = useState(false);
  const [returnInvoiceData, setReturnInvoiceData] = useState<any>(null);
  const [returnCart, setReturnCart] = useState<any[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [newReturnNo, setNewReturnNo] = useState<string | null>(null);
  const [newReturnId, setNewReturnId] = useState<number | null>(null);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // --- Manual Return States ---
  const [isManualReturn, setIsManualReturn] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedManualCustomer, setSelectedManualCustomer] = useState<any>(null);
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [partResults, setPartResults] = useState<any[]>([]);
  const [isSearchingParts, setIsSearchingParts] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  // --- Refunds States ---
  const [searchReturnNo, setSearchReturnNo] = useState("");
  const [searchingRefund, setSearchingRefund] = useState(false);
  const [refundReturnData, setRefundReturnData] = useState<any>(null);
  const [refundPaymentMethod, setRefundPaymentMethod] = useState<'Cash' | 'Bank Transfer'>('Cash');
  const [newRefundId, setNewRefundId] = useState<number | null>(null);
  const [newRefundNo, setNewRefundNo] = useState<string | null>(null);
  
  // --- Pending Invoices States ---
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [searchInvoice, setSearchInvoice] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Cheque' | 'Bank Transfer'>('Cash');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  
  // Cheque Specifics
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [chequeBranchId, setChequeBranchId] = useState("");
  const refreshPendingInvoices = async () => {
    setLoadingPending(true);
    try {
      const [unpaid, partial] = await Promise.all([
        fetchInvoices({ status: 'Unpaid' }),
        fetchInvoices({ status: 'Partial' })
      ]);
      setPendingInvoices([...unpaid, ...partial].sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error("fetchInvoices error:", err);
      toast({ title: "Fetch Error", description: "Could not load pending invoices.", variant: "destructive" });
    } finally {
      setLoadingPending(false);
    }
  };

  React.useEffect(() => {
    if (pendingInvoicesDialogOpen) {
      refreshPendingInvoices();
    }
  }, [pendingInvoicesDialogOpen]);

  // Fetch branches when bank changes
  React.useEffect(() => {
    const loadBranches = async () => {
      if (chequeBank) {
        try {
          const { fetchBankBranches } = await import("@/lib/api");
          const branches = await fetchBankBranches(chequeBank);
          setBankBranches(branches);
        } catch (err) {
          console.error("Failed to load branches", err);
        }
      } else {
        setBankBranches([]);
      }
    };
    loadBranches();
  }, [chequeBank]);


  return (
    <>
      {/* 1. POS GUIDE MODAL */}
      <Dialog open={guideModalOpen} onOpenChange={setGuideModalOpen}>
        <DialogContent className="w-full sm:max-w-md h-[100dvh] sm:h-auto rounded-none sm:rounded-3xl bg-slate-900 text-white border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-xl"><HelpCircle className="w-6 h-6 text-white" /></div>
              POS Guide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
             <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 italic text-blue-200">
                <Zap className="w-5 h-5 mt-1 shrink-0" />
                <p className="text-sm">Power user tip: Use the numeric keypad and Enter key for the fastest retail checkout experience.</p>
             </div>
             <div className="grid gap-4">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-white/10 rounded-lg"><Keyboard className="w-5 h-5" /></div>
                   <div>
                      <p className="font-bold text-sm">Keyboard Shortcuts</p>
                      <p className="text-xs text-slate-400">Numeric keys for Qty/Payment, Enter to Process.</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-white/10 rounded-lg"><MousePointer2 className="w-5 h-5" /></div>
                   <div>
                      <p className="font-bold text-sm">Touch Friendly</p>
                      <p className="text-xs text-slate-400">Large buttons designed for POS terminals.</p>
                   </div>
                </div>
             </div>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold uppercase tracking-widest" onClick={() => setGuideModalOpen(false)}>Got it!</Button>
        </DialogContent>
      </Dialog>

      {/* 2. PENDING INVOICES DIALOG */}
      <Dialog open={pendingInvoicesDialogOpen} onOpenChange={(open) => {
          setPendingInvoicesDialogOpen(open);
          if(!open) {
              setSelectedInvoice(null);
              setSearchInvoice("");
              setPaymentAmount("");
              setPaymentMethod('Cash');
              setChequeNo("");
              setChequeBank("");
              setChequeBranchId("");
          }
      }}>
        <DialogContent className="w-full sm:max-w-4xl h-[100dvh] sm:h-[90vh] sm:max-h-[850px] p-0 overflow-hidden border-none shadow-2xl rounded-none sm:rounded-[2rem] flex flex-col bg-white dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-950 sm:bg-indigo-600 px-4 py-3 sm:px-8 sm:py-5 text-slate-900 dark:text-white sm:text-white relative border-b border-slate-100 dark:border-slate-800 sm:border-none shrink-0">
            <div className="flex sm:flex-row items-center gap-3 sm:gap-4">
               <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 sm:bg-white/20 rounded-xl shrink-0">
                 <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 sm:text-white" />
               </div>
               <div className="text-left">
                  <DialogTitle className="text-base sm:text-xl font-black uppercase tracking-tight">Pending Invoices</DialogTitle>
                  <p className="hidden sm:block text-indigo-100 text-[10px] font-bold uppercase tracking-widest opacity-80 mt-0.5">
                    Debt Collection Management
                  </p>
               </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-950">
             {/* Left Panel: List & Search */}
             <div className="w-full md:w-[350px] border-r border-slate-100 dark:border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Invoice # or Customer..." 
                        value={searchInvoice}
                        onChange={e => setSearchInvoice(e.target.value)}
                        className="h-10 pl-9 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm"
                      />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                   {loadingPending ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading...</p>
                      </div>
                   ) : (
                      pendingInvoices
                        .filter(inv => !searchInvoice || inv.invoice_no.toLowerCase().includes(searchInvoice.toLowerCase()) || inv.customer_name?.toLowerCase().includes(searchInvoice.toLowerCase()))
                        .map(inv => (
                           <button 
                             key={inv.id}
                             onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentAmount(String(parseFloat(inv.grand_total) - parseFloat(inv.paid_amount)));
                             }}
                             className={`w-full p-3 rounded-xl text-left transition-all border ${selectedInvoice?.id === inv.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white dark:bg-slate-950 border-transparent hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                           >
                              <div className="flex justify-between items-start mb-0.5">
                                 <span className="text-xs font-black tracking-tight">{inv.invoice_no}</span>
                                 <Badge variant="outline" className={`text-[7px] tracking-widest uppercase h-4 px-1 ${inv.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{inv.status}</Badge>
                              </div>
                              <p className="text-[9px] font-bold text-muted-foreground truncate mb-1.5">{inv.customer_name || 'Walk-in'}</p>
                              <div className="flex justify-between items-end">
                                 <div className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">Balance</div>
                                 <div className="text-xs font-black text-indigo-600">LKR {(parseFloat(inv.grand_total) - parseFloat(inv.paid_amount)).toLocaleString()}</div>
                              </div>
                           </button>
                        ))
                   )}
                   {pendingInvoices.length === 0 && !loadingPending && (
                      <div className="py-20 text-center text-muted-foreground opacity-30">
                         <Receipt className="w-12 h-12 mx-auto mb-4" />
                         <p className="text-xs font-black uppercase tracking-widest">No Pending Invoices</p>
                      </div>
                   )}
                </div>
             </div>

             {/* Right Panel: Payment Form */}
             <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar">
                {selectedInvoice ? (
                   <div className="space-y-6">
                      <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                         <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-50 dark:border-slate-900">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Receiving Payment For</p>
                               <p className="text-xl font-black">{selectedInvoice.invoice_no}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original Total</p>
                               <p className="text-lg font-black opacity-40 tabular-nums">LKR {parseFloat(selectedInvoice.grand_total).toLocaleString()}</p>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase">Already Paid</p>
                               <p className="text-lg font-black text-emerald-600">LKR {parseFloat(selectedInvoice.paid_amount).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1 text-right">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase">Remaining Balance</p>
                               <p className="text-lg font-black text-rose-600">LKR {(parseFloat(selectedInvoice.grand_total) - parseFloat(selectedInvoice.paid_amount)).toLocaleString()}</p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Payment Method</label>
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {(['Cash', 'Card', 'Cheque', 'Bank Transfer'] as const).map(m => (
                               <Button 
                                 key={m}
                                 variant={paymentMethod === m ? 'default' : 'outline'}
                                 className={`h-12 font-bold text-[10px] uppercase rounded-xl transition-all ${paymentMethod === m ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-950'}`}
                                 onClick={() => setPaymentMethod(m)}
                               >
                                  {m}
                               </Button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Payment Amount</label>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">LKR</span>
                            <Input 
                               type="number"
                               value={paymentAmount}
                               onChange={e => setPaymentAmount(e.target.value)}
                               className="h-16 pl-14 text-2xl font-black bg-white dark:bg-slate-950 border-2 border-indigo-100 dark:border-indigo-900 rounded-2xl shadow-inner focus-visible:ring-indigo-500"
                            />
                         </div>
                      </div>

                      {paymentMethod === 'Cheque' && (
                         <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-4 animate-in fade-in zoom-in-95">
                            <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                               <Receipt className="w-4 h-4" /> Cheque Documentation
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase">Cheque #</label>
                                  <Input placeholder="XXXXXX" value={chequeNo} onChange={e => setChequeNo(e.target.value)} className="h-10 font-bold bg-white dark:bg-slate-950" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase">Cheque Date</label>
                                  <Input type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} className="h-10 font-bold bg-white dark:bg-slate-950" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase">Issuing Bank</label>
                                  <SearchableSelect 
                                     options={banks.map(b => ({ value: String(b.id), label: b.name }))}
                                     value={chequeBank}
                                     onValueChange={(val) => setChequeBank(val)}
                                     placeholder="Select Bank"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase">Branch</label>
                                  <SearchableSelect 
                                     options={bankBranches.map(br => ({ value: br.branch_name, label: br.branch_name }))}
                                     value={chequeBranchId}
                                     onValueChange={(val) => setChequeBranchId(val)}
                                     placeholder="Select Branch"
                                     disabled={!chequeBank}
                                  />
                               </div>
                            </div>
                         </div>
                      )}

                      <Button 
                        className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all rounded-2xl"
                        disabled={isRecordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                        onClick={async () => {
                           setIsRecordingPayment(true);
                           try {
                              const payload = {
                                 amount: parseFloat(paymentAmount),
                                 payment_method: paymentMethod,
                                 payment_date: new Date().toISOString().split('T')[0],
                                 notes: `POS payment for ${selectedInvoice.invoice_no}`,
                                 // Cheque specifics
                                 cheque: paymentMethod === 'Cheque' ? {
                                    cheque_no: chequeNo,
                                    cheque_date: chequeDate,
                                    bank_name: banks.find(b => String(b.id) === chequeBank)?.name || "",
                                    branch_name: chequeBranchId, // We use the ID or text if available
                                    payee_name: selectedInvoice.customer_name || 'Walk-in'
                                 } : null,
                                 bank_id: paymentMethod === 'Cheque' ? chequeBank : null,
                                 reference_no: paymentMethod === 'Cheque' ? chequeNo : null
                              };

                              const res = await addInvoicePayment(selectedInvoice.id, payload);
                              if (res.status === 'success') {
                                 toast({ title: "Payment Recorded", description: `LKR ${parseFloat(paymentAmount).toLocaleString()} collected successfully.` });
                                 // Reset and Refresh
                                 setSelectedInvoice(null);
                                 setPaymentAmount("");
                                 await refreshPendingInvoices();
                                 if (res.receipt_id) {
                                    window.open(`/cms/payment-receipts/${res.receipt_id}/print?autoprint=1`, '_blank');
                                 }
                              } else {
                                 throw new Error(res.message || "Failed to record payment");
                              }
                           } catch (err: any) {
                              toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
                           } finally {
                              setIsRecordingPayment(false);
                           }
                        }}
                      >
                         {isRecordingPayment ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <ShieldCheck className="w-5 h-5 mr-3" />}
                         Confirm & Collect Payment
                      </Button>
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 text-center">
                      <Calculator className="w-16 h-16 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest max-w-[200px]">Select an invoice from the left to start collecting payment.</p>
                   </div>
                )}
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. RETURNS DIALOG */}
      <Dialog open={returnDialogOpen} onOpenChange={(open) => {
          setReturnDialogOpen(open);
           if(!open) {
               setReturnInvoiceData(null);
               setReturnCart([]);
               setNewReturnNo(null);
               setIsManualReturn(false);
               setSelectedManualCustomer(null);
               setCustomerSearchTerm("");
               setPartSearchTerm("");
               setVKeyboardActiveInput(null);
           }
      }}>
        <DialogContent className="w-full sm:max-w-xl h-[100dvh] sm:h-auto p-0 overflow-hidden border-none shadow-2xl rounded-none sm:rounded-2xl flex flex-col">
          <div className="bg-white dark:bg-slate-950 sm:bg-rose-600 p-4 sm:p-6 text-slate-900 dark:text-white sm:text-white relative border-b border-slate-100 dark:border-slate-800 sm:border-none">
            <div className="flex sm:flex-col items-center sm:justify-center gap-3">
               <div className="p-2 sm:p-3 bg-rose-100 dark:bg-rose-900/30 sm:bg-white/20 rounded-xl sm:rounded-2xl shrink-0">
                 <RotateCcw className="w-5 h-5 sm:w-8 sm:h-8 text-rose-600 sm:text-white" />
               </div>
               <div className="text-left sm:text-center">
                  <DialogTitle className="text-base sm:text-2xl font-black uppercase tracking-tight">Return Items</DialogTitle>
                  <DialogDescription className="hidden sm:block text-rose-100 text-sm font-medium opacity-90 mt-2">
                    Restock items from a previous sale and generate a completion note.
                  </DialogDescription>
               </div>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
             {!returnInvoiceData && !isManualReturn ? (
               <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-3">
                     <div className="flex justify-between items-end px-1">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Step 1: Lookup Original Invoice</label>
                        <Button 
                           variant="link" 
                           className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700"
                           onClick={() => setIsManualReturn(true)}
                        >
                           Manual Return (No Invoice)
                        </Button>
                     </div>
                     <div className="flex gap-2">
                        <Input 
                          placeholder="Enter Invoice Number (e.g. INV00001)" 
                          value={searchInvoiceNo}
                          onChange={e => setSearchInvoiceNo(e.target.value)}
                          onFocus={() => {
                             if (vKeyboardEnabled) {
                                setVKeyboardActiveInput({
                                   key: "Invoice Lookup",
                                   value: searchInvoiceNo,
                                   setter: (val: string) => setSearchInvoiceNo(val)
                                });
                             }
                          }}
                          className="h-12 font-bold bg-white dark:bg-slate-950 rounded-xl"
                          onKeyDown={async (e) => {
                             if (e.key === 'Enter' && searchInvoiceNo) {
                                setSearchingReturn(true);
                                try {
                                   const data = await fetchInvoiceForReturn(searchInvoiceNo);
                                   if (data) setReturnInvoiceData(data);
                                } catch (err: any) {
                                   toast({ title: "Not Found", description: err.message, variant: "destructive" });
                                } finally {
                                   setSearchingReturn(false);
                                }
                             }
                          }}
                        />
                        <Button 
                          className="h-12 px-6 bg-rose-600 hover:bg-rose-700 rounded-xl font-bold uppercase tracking-widest text-white shadow-lg shadow-rose-200"
                          onClick={async () => {
                             if (!searchInvoiceNo) return;
                             setSearchingReturn(true);
                             try {
                                const data = await fetchInvoiceForReturn(searchInvoiceNo);
                                if (data) setReturnInvoiceData(data);
                             } catch (err: any) {
                                toast({ title: "Search Error", description: err.message, variant: "destructive" });
                             } finally {
                                setSearchingReturn(false);
                             }
                          }}
                          disabled={searchingReturn || !searchInvoiceNo}
                        >
                          {searchingReturn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
                        </Button>
                     </div>
                  </div>

                  {newReturnNo && (
                     <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
                        <div className="p-3 bg-emerald-600 text-white rounded-full"><Check className="w-5 h-5" /></div>
                        <div className="text-center">
                           <p className="text-xs font-black uppercase tracking-widest text-emerald-800">Return Created</p>
                           <p className="text-lg font-black text-emerald-950">No: {newReturnNo}</p>
                           <p className="text-[10px] text-emerald-700 max-w-[200px] mt-1">Stock restored. Proceed to the Refunds modal to release payment.</p>
                        </div>
                        <div className="flex gap-2 w-full">
                           <Button 
                             className="flex-1 h-11 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-black uppercase tracking-widest text-[10px] rounded-xl border border-slate-200 dark:border-slate-800"
                             onClick={() => window.open(`/cms/sales-returns/${newReturnId}/receipt?autoprint=1`, '_blank')}
                           >
                             <Printer className="w-4 h-4 mr-2" /> Print Note
                           </Button>
                           <Button 
                             className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-rose-200 dark:shadow-rose-950/20"
                             onClick={async () => {
                                if (!newReturnNo) return;
                                setSearchReturnNo(newReturnNo);
                                setReturnDialogOpen(false);
                                setRefundDialogOpen(true);
                                
                                // Auto-trigger lookup to save the user a click
                                setSearchingRefund(true);
                                try {
                                   const data = await fetchReturnDetails(newReturnNo);
                                   if (data) setRefundReturnData(data);
                                } catch (err: any) {
                                   toast({ title: "Fetch Error", description: "Return created but could not auto-load for refund.", variant: "destructive" });
                                } finally {
                                   setSearchingRefund(false);
                                }
                             }}
                           >
                             <ArrowRight className="w-4 h-4 mr-2" /> Issue Refund
                           </Button>
                        </div>
                     </div>
                  )}
               </div>
             ) : isManualReturn && !selectedManualCustomer ? (
                <div className="space-y-6">
                   <div className="space-y-3">
                      <div className="flex justify-between items-end px-1">
                         <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Manual Return: Select Customer</label>
                         <Button 
                            variant="link" 
                            className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-slate-500"
                            onClick={() => setIsManualReturn(false)}
                         >
                            Back to Invoice Lookup
                         </Button>
                      </div>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                         <Input 
                           placeholder="Search customer by name or phone..." 
                           value={customerSearchTerm}
                           onChange={e => setCustomerSearchTerm(e.target.value)}
                           onFocus={() => {
                              if (vKeyboardEnabled) {
                                 setVKeyboardActiveInput({
                                    key: "Customer Search",
                                    value: customerSearchTerm,
                                    setter: (val: string) => setCustomerSearchTerm(val)
                                 });
                              }
                           }}
                           className="h-12 pl-10 font-bold bg-white dark:bg-slate-950 rounded-xl"
                         />
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         {posCustomers
                           .filter(c => !customerSearchTerm || c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.phone?.includes(customerSearchTerm))
                           .slice(0, 10)
                           .map(customer => (
                              <button 
                                key={customer.id}
                                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-left hover:border-rose-500 transition-all flex justify-between items-center group"
                                onClick={() => setSelectedManualCustomer(customer)}
                              >
                                 <div>
                                    <p className="font-black text-sm">{customer.name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">{customer.phone || "No phone"}</p>
                                 </div>
                                 <Plus className="w-4 h-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                           ))
                         }
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                               {isManualReturn ? <Building2 className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  {isManualReturn ? "Return For Customer" : "Return From Invoice"}
                               </p>
                               <p className="text-sm font-black">
                                  {isManualReturn ? selectedManualCustomer?.name : returnInvoiceData?.invoice?.invoice_no}
                               </p>
                            </div>
                         </div>
                         <Button 
                            variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tight text-rose-600"
                            onClick={() => {
                               if (isManualReturn) setSelectedManualCustomer(null);
                               else setReturnInvoiceData(null);
                               setReturnCart([]);
                            }}
                         >
                            Change
                         </Button>
                      </div>

                      {isManualReturn && (
                         <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Search & Add Items</label>
                            <div className="relative">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                               <Input 
                                 placeholder="Search items to return..." 
                                 value={partSearchTerm}
                                 onChange={e => setPartSearchTerm(e.target.value)}
                                 onFocus={() => {
                                    if (vKeyboardEnabled) {
                                       setVKeyboardActiveInput({
                                          key: "Item Search",
                                          value: partSearchTerm,
                                          setter: (val: string) => setPartSearchTerm(val)
                                       });
                                    }
                                 }}
                                 className="h-11 pl-10 text-xs font-bold bg-white dark:bg-slate-950 rounded-xl"
                               />
                            </div>
                            {partSearchTerm && (
                               <div className="space-y-1 bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-800 max-h-[200px] overflow-y-auto custom-scrollbar">
                                  {inventory
                                    .filter(p => p.part_name.toLowerCase().includes(partSearchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(partSearchTerm.toLowerCase()))
                                    .slice(0, 5)
                                    .map(part => (
                                       <button 
                                          key={part.id}
                                          className="w-full p-2 text-left hover:bg-white dark:hover:bg-slate-950 rounded-lg flex justify-between items-center transition-all group"
                                          onClick={() => {
                                             const existing = returnCart.find(ri => ri.item_id === part.id);
                                             if (existing) {
                                                setReturnCart(returnCart.map(ri => ri.item_id === part.id ? { ...ri, return_qty: ri.return_qty + 1 } : ri));
                                             } else {
                                                setReturnCart([...returnCart, {
                                                   id: `manual-${part.id}`,
                                                   item_id: part.id,
                                                   item_type: part.item_type === "Service" ? "Service" : "Part",
                                                   description: part.part_name,
                                                   unit_price: part.price || part.cost_price || 0,
                                                   return_qty: 1,
                                                   returned_qty: 0,
                                                   quantity: 99999 // Infinite for manual
                                                }]);
                                             }
                                             setPartSearchTerm("");
                                          }}
                                       >
                                          <div>
                                             <p className="text-xs font-bold">{part.part_name}</p>
                                             <p className="text-[10px] text-muted-foreground">SKU: {part.sku || 'N/A'} • Price: LKR {parseFloat(part.price || part.cost_price || 0).toLocaleString()}</p>
                                          </div>
                                          <Plus className="w-3 h-3 text-rose-500 opacity-0 group-hover:opacity-100" />
                                       </button>
                                    ))
                                  }
                               </div>
                            )}
                         </div>
                      )}

                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                         {isManualReturn ? "Items to Return" : "Step 2: Selection Items to Return"}
                      </label>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         {(isManualReturn ? returnCart : returnInvoiceData?.items)?.map((item: any) => {
                            const currentInCart = isManualReturn ? item.return_qty : (returnCart.find(ri => ri.id === item.id)?.return_qty || 0);
                            const avail = isManualReturn ? 99999 : (parseFloat(item.quantity) - parseFloat(item.returned_qty));
                            const isDisabled = !isManualReturn && avail <= 0;

                            return (
                               <div key={item.id} className={`p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl ${isDisabled ? "opacity-30 grayscale pointer-events-none" : ""}`}>
                                  <div className="flex justify-between items-start mb-2">
                                     <div>
                                        <p className="text-sm font-black">{item.description}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">
                                           {isManualReturn ? `Manual Return` : `Bought: ${parseFloat(item.quantity).toFixed(0)} • Avail: ${Math.max(0, avail)}`} 
                                           • Price: LKR {parseFloat(item.unit_price).toLocaleString()}
                                        </p>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-xs font-black text-rose-600">LKR {(currentInCart * parseFloat(item.unit_price)).toLocaleString()}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2">
                                     <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                                        <Button 
                                          variant="ghost" size="icon" className="h-8 w-8 text-rose-600"
                                          onClick={() => {
                                             const searchId = isManualReturn ? item.item_id : item.id;
                                             const cartIdx = returnCart.findIndex(ri => (isManualReturn ? ri.item_id : ri.id) === searchId);
                                             if (cartIdx >= 0) {
                                                const newCart = [...returnCart];
                                                if (newCart[cartIdx].return_qty > 0) newCart[cartIdx].return_qty -= 1;
                                                if (newCart[cartIdx].return_qty === 0) newCart.splice(cartIdx, 1);
                                                setReturnCart(newCart);
                                             }
                                          }}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="flex-1 text-center text-xs font-black">
                                           {currentInCart}
                                        </span>
                                        <Button 
                                          variant="ghost" size="icon" className="h-8 w-8 text-rose-600"
                                          onClick={() => {
                                             const searchId = isManualReturn ? item.item_id : item.id;
                                             const cartIdx = returnCart.findIndex(ri => (isManualReturn ? ri.item_id : ri.id) === searchId);
                                             if (cartIdx >= 0) {
                                                const newCart = [...returnCart];
                                                if (newCart[cartIdx].return_qty < avail) {
                                                    newCart[cartIdx].return_qty += 1;
                                                    setReturnCart(newCart);
                                                }
                                             } else {
                                                setReturnCart([...returnCart, { ...item, return_qty: 1 }]);
                                             }
                                          }}
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                        {isManualReturn && (
                                           <Button 
                                              variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 ml-auto"
                                              onClick={() => setReturnCart(returnCart.filter(ri => ri.item_id !== item.item_id))}
                                           >
                                              <Trash2 className="w-3 h-3" />
                                           </Button>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>

                  <div className="space-y-4">
                     <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Return Reason</label>
                     <div className="flex flex-wrap gap-2">
                        {["Damage", "Exchange", "Mistake", "Expired"].map(r => (
                           <Button 
                             key={r}
                             variant={returnReason === r ? 'default' : 'outline'}
                             onClick={() => setReturnReason(r)}
                             className={`h-8 text-[10px] font-bold rounded-lg transition-all ${returnReason === r ? 'bg-rose-600 text-white' : ''}`}
                           >
                              {r}
                           </Button>
                        ))}
                     </div>
                     <Input 
                       placeholder="Additional notes..." 
                       value={returnReason} 
                       onChange={e => setReturnReason(e.target.value)}
                       className="h-10 text-xs font-bold"
                     />
                  </div>

                  <Button 
                    className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest shadow-xl shadow-rose-200 active:scale-[0.98] transition-all rounded-xl mt-2"
                    disabled={returnCart.length === 0 || isProcessingReturn}
                    onClick={async () => {
                       setIsProcessingReturn(true);
                       try {
                          const payload = {
                             invoice_id: isManualReturn ? null : returnInvoiceData.invoice.id,
                             customer_id: isManualReturn ? selectedManualCustomer.id : null,
                             total_amount: returnCart.reduce((sum, i) => sum + (i.return_qty * i.unit_price), 0),
                             reason: returnReason || "General Return",
                             location_id: selectedLocation,
                             items: returnCart.map(i => ({
                                item_id: i.item_id,
                                item_type: i.item_type,
                                description: i.description,
                                quantity: i.return_qty,
                                unit_price: i.unit_price,
                                line_total: i.return_qty * i.unit_price
                             }))
                          };

                          const res = await apiHelper('/api/salesreturn/create', { method: 'POST', body: JSON.stringify(payload) });
                          const data = await res.json();
                          if (data.status === 'success') {
                             setNewReturnNo(data.data.return_no); 
                             setNewReturnId(data.data.id);
                             setReturnInvoiceData(null);
                             setReturnCart([]);
                             setReturnReason("");
                              setIsManualReturn(false);
                              setSelectedManualCustomer(null);
                             toast({ title: "Return Saved", description: "Items have been returned to stock." });
                          } else {
                             throw new Error(data.message || "Failed to process return");
                          }
                       } catch (err: any) {
                          toast({ title: "Process Failed", description: err.message, variant: "destructive" });
                       } finally {
                          setIsProcessingReturn(false);
                       }
                    }}
                  >
                     {isProcessingReturn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                     Complete Return Process
                  </Button>
                  <Button variant="ghost" className="w-full h-10 font-bold" onClick={() => { setReturnInvoiceData(null); setIsManualReturn(false); setSelectedManualCustomer(null); setReturnCart([]); }}>
                     Cancel Selection
                  </Button>
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. REFUNDS DIALOG */}
      <Dialog open={refundDialogOpen} onOpenChange={(open) => {
          setRefundDialogOpen(open);
          if(!open) {
              setRefundReturnData(null);
              setNewRefundId(null);
              setVKeyboardActiveInput(null);
          }
      }}>
        <DialogContent className="w-full sm:max-w-xl h-[100dvh] sm:h-auto p-0 overflow-hidden border-none shadow-2xl rounded-none sm:rounded-2xl flex flex-col">
          <div className="bg-white dark:bg-slate-950 sm:bg-amber-500 p-4 sm:p-6 text-slate-900 dark:text-white sm:text-white relative border-b border-slate-100 dark:border-slate-800 sm:border-none">
            <div className="flex sm:flex-col items-center sm:justify-center gap-3">
               <div className="p-2 sm:p-3 bg-amber-100 dark:bg-amber-900/30 sm:bg-white/20 rounded-xl sm:rounded-2xl shrink-0">
                 <Banknote className="w-5 h-5 sm:w-8 sm:h-8 text-amber-600 sm:text-white" />
               </div>
               <div className="text-left sm:text-center">
                  <DialogTitle className="text-base sm:text-2xl font-black uppercase tracking-tight">Financial Refund</DialogTitle>
                  <DialogDescription className="hidden sm:block text-amber-50 text-sm font-medium opacity-90 mt-2">
                    Issue cash or bank transfer for a completed return document.
                  </DialogDescription>
               </div>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
              {!refundReturnData ? (
                 <div className="space-y-4 sm:space-y-6">
                   <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Step 1: Lookup Return Number</label>
                      <div className="flex gap-2">
                         <Input 
                           placeholder="Enter SR Number (e.g. SR-00001)" 
                           value={searchReturnNo}
                           onChange={e => setSearchReturnNo(e.target.value)}
                           onFocus={() => {
                              if (vKeyboardEnabled) {
                                 setVKeyboardActiveInput({
                                    key: "Refund Lookup",
                                    value: searchReturnNo,
                                    setter: (val: string) => setSearchReturnNo(val)
                                 });
                              }
                           }}
                           className="h-12 font-bold bg-white dark:bg-slate-950 rounded-xl"
                           onKeyDown={async (e) => {
                              if (e.key === 'Enter' && searchReturnNo) {
                                 setSearchingRefund(true);
                                 try {
                                    const data = await fetchReturnDetails(searchReturnNo);
                                    if (data) setRefundReturnData(data);
                                    else toast({ title: "Not Found", description: "No return found with that number.", variant: "destructive" });
                                 } catch (err: any) {
                                    toast({ title: "Search Error", description: err.message, variant: "destructive" });
                                 } finally {
                                    setSearchingRefund(false);
                                 }
                              }
                           }}
                         />
                         <Button 
                           className="h-12 px-6 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold uppercase tracking-widest text-white"
                           onClick={async () => {
                              if (!searchReturnNo) return;
                              setSearchingRefund(true);
                              try {
                                 const data = await fetchReturnDetails(searchReturnNo);
                                 if (data) setRefundReturnData(data);
                                 else toast({ title: "Not Found", description: "No return found with that number.", variant: "destructive" });
                              } catch (err: any) {
                                 toast({ title: "Search Error", description: err.message, variant: "destructive" });
                              } finally {
                                 setSearchingRefund(false);
                              }
                           }}
                           disabled={searchingRefund || !searchReturnNo}
                         >
                           {searchingRefund ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
                         </Button>
                      </div>
                   </div>
                   <div className="p-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                      <Search className="w-12 h-12 mb-4" />
                      <p className="text-sm font-bold">Please search for a return document to proceed with financial refund.</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 rounded-xl">
                         <div className="p-3 bg-amber-600 text-white rounded-xl"><Receipt className="w-5 h-5" /></div>
                                 <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Releasing Payment For</p>
                            <p className="text-base font-black truncate">{refundReturnData.return.return_no}</p>
                            <p className="text-xs text-muted-foreground font-bold">{refundReturnData.return.customer_name} • Invoice #{refundReturnData.return.invoice_no}</p>
                         </div>
                      </div>

                      {refundReturnData.is_refunded ? (
                         <div className="p-4 bg-orange-100 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-900 animate-pulse">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-xs font-bold">This return has already been refunded. Check the Day Ledger to reprint the receipt.</p>
                         </div>
                      ) : (
                         <>
                            {!newRefundId && (
                               <>
                                  <div className="p-6 bg-amber-50/50 dark:bg-amber-950/10 border-2 border-dashed border-amber-200 dark:border-amber-900/50 rounded-2xl flex flex-col items-center">
                                     <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mb-1">Payable Refund Amount</p>
                                     <p className="text-4xl font-black text-amber-600 tabular-nums">LKR {parseFloat(refundReturnData.return.total_amount).toLocaleString()}</p>
                                  </div>

                                  <div className="space-y-2">
                                     <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Select Refund Method</label>
                                     <div className="grid grid-cols-2 gap-2">
                                        {['Cash', 'Bank Transfer'].map(m => (
                                          <Button 
                                            key={m} 
                                            variant={refundPaymentMethod === m ? 'default' : 'outline'}
                                            className={`h-12 font-black uppercase tracking-widest transition-all ${refundPaymentMethod === m ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-white dark:bg-slate-950'}`}
                                            onClick={() => setRefundPaymentMethod(m as any)}
                                          >
                                             {m === 'Cash' ? <Banknote className="w-4 h-4 mr-2" /> : <Store className="w-4 h-4 mr-2" />}
                                             {m}
                                          </Button>
                                        ))}
                                     </div>
                                  </div>
                               </>
                            )}

                            {newRefundId ? (
                               <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center gap-3 animate-in fade-in zoom-in-95">
                                  <div className="p-3 bg-emerald-600 text-white rounded-full"><Check className="w-6 h-6" /></div>
                                  <div className="text-center">
                                     <p className="text-xs font-black uppercase tracking-widest text-emerald-800">Refund Successful</p>
                                     <p className="text-sm font-black text-emerald-950 mt-1">{newRefundNo}</p>
                                     <p className="text-[10px] font-bold text-emerald-950/60 mt-1 text-center">Cash flow updated successfully.</p>
                                  </div>
                                  <Button 
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-200"
                                    onClick={() => window.open(`/cms/refunds/${newRefundId}/receipt?autoprint=1`, '_blank')}
                                  >
                                    <Printer className="w-4 h-4 mr-2" /> Print Refund Receipt
                                  </Button>
                               </div>
                            ) : (
                              <Button 
                                className="w-full h-15 font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-200 active:scale-[0.98] transition-all rounded-xl mt-4"
                                disabled={isProcessingReturn}
                                onClick={async () => {
                                   setIsProcessingReturn(true);
                                   try {
                                      const payload = {
                                         return_id: refundReturnData.return.id,
                                         invoice_id: refundReturnData.return.invoice_id,
                                         amount: refundReturnData.return.total_amount,
                                         payment_method: refundPaymentMethod,
                                         notes: `Refund for return ${refundReturnData.return.return_no}`
                                      };
                                      const res = await apiHelper('/api/refund/create', { method: 'POST', body: JSON.stringify(payload) });
                                      if (!res.ok) throw new Error("Refund processing failed");
                                      const data = await res.json();
                                      setNewRefundId(data.data.id);
                                      setNewRefundNo(data.data.refund_no);
                                      toast({ title: "Refund Success", description: `LKR ${parseFloat(refundReturnData.return.total_amount).toLocaleString()} refunded.` });
                                   } catch (err: any) {
                                      toast({ title: "Refund Failed", description: err.message, variant: "destructive" });
                                   } finally {
                                      setIsProcessingReturn(false);
                                   }
                                }}
                              >
                                 {isProcessingReturn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                 Confirm & Release Cash
                              </Button>
                            )}
                         </>
                      )}
                      <Button variant="ghost" className="w-full h-12 font-bold" onClick={() => setRefundReturnData(null)}>
                         {refundReturnData ? "Back to Search" : "Close"}
                      </Button>
                   </div>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. DAY LEDGER DIALOG */}
      <Dialog open={ledgerDialogOpen} onOpenChange={setLedgerDialogOpen}>
         <DialogContent className="w-full sm:max-w-3xl h-[100dvh] sm:h-auto p-0 overflow-hidden border-none shadow-2xl rounded-none sm:rounded-2xl bg-slate-900">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center rounded-t-2xl">
               <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                     <div className="p-1.5 bg-white/10 rounded-lg"><History className="w-5 h-5 text-blue-400" /></div>
                     Today&apos;s Day Ledger
                  </DialogTitle>
                  <DialogDescription className="text-[10px] text-slate-400 font-bold opacity-80 mt-0.5 pl-1">
                     Daily Summary • {new Date().toLocaleDateString()}
                  </DialogDescription>
               </div>
               <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-none h-8 px-3 font-black uppercase tracking-widest text-[9px] rounded-lg shadow-lg"
                    onClick={() => window.open(`/cms/pos/day-end?location_id=${selectedLocation}&autoprint=1`, '_blank')}
                  >
                     <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                  </Button>
                  <Button variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0 rounded-lg bg-white/5" onClick={() => setLedgerDialogOpen(false)}>
                     <Trash2 className="w-4 h-4" />
                  </Button>
               </div>
            </div>

            <div className="p-4 space-y-4 bg-white dark:bg-slate-950 h-full">
                {loadingLedger ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                     <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Compiling...</p>
                  </div>
                ) : dayLedger ? (
                  <>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                         <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5">Today&apos;s Sales</p>
                            <p className="text-base font-black text-slate-950 dark:text-white">LKR {dayLedger.summary.sales.toLocaleString()}</p>
                         </div>
                         <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                            <p className="text-[9px] font-black uppercase text-rose-600 mb-0.5">Stock Returns</p>
                            <p className="text-base font-black text-rose-800">LKR {dayLedger.summary.returns.toLocaleString()}</p>
                         </div>
                         <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                            <p className="text-[9px] font-black uppercase text-amber-600 mb-0.5">Total Refunds</p>
                            <p className="text-base font-black text-amber-800">LKR {dayLedger.summary.refunds.toLocaleString()}</p>
                         </div>
                         <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-right font-black">
                            <p className="text-[9px] font-black uppercase text-emerald-600 mb-0.5">Total Intake</p>
                            <p className="text-base font-black text-emerald-800">LKR {dayLedger.summary.net.toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200/50 flex items-center justify-between border-[3px] border-white dark:border-slate-800">
                         <div className="flex gap-6 items-center px-1">
                            <div className="flex flex-col">
                               <p className="text-[8px] font-black uppercase text-blue-400 mb-0.5">Cash Balance</p>
                               <p className="text-lg font-black tracking-tight leading-none">LKR {(dayLedger.summary.methods?.['Cash'] || 0).toLocaleString()}</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex gap-5">
                                <div>
                                   <p className="text-[8px] font-black uppercase text-slate-400">Card</p>
                                   <p className="text-xs font-black italic">LKR {(dayLedger.summary.methods?.['Card'] || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black uppercase text-slate-400">Transfer</p>
                                   <p className="text-xs font-black italic">LKR {(dayLedger.summary.methods?.['Bank Transfer'] || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black uppercase text-slate-400">Cheque</p>
                                   <p className="text-xs font-black italic">LKR {(dayLedger.summary.methods?.['Cheque'] || 0).toLocaleString()}</p>
                                </div>
                            </div>
                         </div>
                         <div className="text-right pr-2">
                            <p className="text-[8px] font-black uppercase text-emerald-400 flex items-center gap-1 justify-end">
                               <ShieldCheck className="w-2.5 h-2.5" /> Audited Records
                            </p>
                            <p className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">Verified from Database Ledger</p>
                         </div>
                      </div>
                        <div className="flex justify-between items-center mb-1 px-1">
                           <label className="text-xs font-black uppercase tracking-widest text-muted-foreground underline decoration-blue-500/30 underline-offset-4">Categorized Ledger</label>
                           <div className="flex gap-2">
                               <Button 
                                 variant="ghost" size="sm" className="h-6 text-[10px] font-black uppercase text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                 onClick={async () => {
                                    setLoadingLedger(true);
                                    try {
                                       const data = await fetchPosDayLedger(selectedLocation);
                                       setDayLedger(data);
                                    } finally {
                                       setLoadingLedger(false);
                                    }
                                 }}
                               >
                                  <RotateCcw className="w-3 h-3 mr-1" /> Force Refresh
                               </Button>
                            </div>
                        </div>

                        <Tabs defaultValue="all" className="w-full">
                           <TabsList className="w-full flex justify-start bg-slate-100/50 dark:bg-slate-900/50 p-1 mb-4 rounded-xl">
                              <TabsTrigger value="all" className="flex-1 text-[10px] font-black uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2">
                                 All <span className="ml-1 opacity-40">({dayLedger.events.length})</span>
                              </TabsTrigger>
                              <TabsTrigger value="Invoice" className="flex-1 text-[10px] font-black uppercase data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg py-2">
                                 Sales ({dayLedger.events.filter((e: any) => e.type === 'Invoice').length})
                              </TabsTrigger>
                              <TabsTrigger value="Return" className="flex-1 text-[10px] font-black uppercase data-[state=active]:bg-rose-600 data-[state=active]:text-white rounded-lg py-2">
                                 Returns ({dayLedger.events.filter((e: any) => e.type === 'Return').length})
                              </TabsTrigger>
                              <TabsTrigger value="Refund" className="flex-1 text-[10px] font-black uppercase data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg py-2">
                                 Refunds ({dayLedger.events.filter((e: any) => e.type === 'Refund').length})
                              </TabsTrigger>
                              <TabsTrigger value="Receipt" className="flex-1 text-[10px] font-black uppercase data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2">
                                 Receipts ({dayLedger.events.filter((e: any) => e.type === 'Receipt').length})
                              </TabsTrigger>
                           </TabsList>

                           {["all", "Invoice", "Return", "Refund", "Receipt"].map((tab) => (
                               <TabsContent key={tab} value={tab} className="mt-0">
                                  <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                  {dayLedger.events
                                    .filter((ev: any) => tab === "all" || ev.type === tab)
                                    .map((ev: any, idx: number) => (
                                     <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-100 transition-all group shadow-sm">
                                        <div className="flex items-center gap-3">
                                           <div className={`p-2 rounded-lg ${
                                              ev.type === 'Invoice' ? 'bg-blue-50 text-blue-600' :
                                              ev.type === 'Return' ? 'bg-rose-50 text-rose-600' :
                                              ev.type === 'Refund' ? 'bg-amber-50 text-amber-600' :
                                              'bg-emerald-50 text-emerald-600'
                                           }`}>
                                              {ev.type === 'Invoice' ? <FileText className="w-4 h-4" /> :
                                               ev.type === 'Return' ? <RotateCcw className="w-4 h-4" /> :
                                               ev.type === 'Refund' ? <Banknote className="w-4 h-4" /> :
                                               <Receipt className="w-4 h-4" />
                                              }
                                           </div>
                                           <div>
                                              <div className="flex items-center gap-1.5 mb-0.5">
                                                 <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                    ev.type === 'Invoice' ? 'bg-blue-600 text-white' :
                                                    ev.type === 'Return' ? 'bg-rose-600 text-white' :
                                                    ev.type === 'Refund' ? 'bg-amber-600 text-white' :
                                                    'bg-emerald-600 text-white'
                                                 }`}>{ev.type === 'Invoice' ? 'INV' : ev.type === 'Return' ? 'RTN' : ev.type === 'Refund' ? 'RFD' : 'RCP'}</span>
                                                 <span className="text-[9px] text-muted-foreground font-black opacity-60">{new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                              </div>
                                              <p className="text-sm font-black tracking-tight leading-none mb-0.5">{ev.doc_no}</p>
                                              <p className="text-[10px] text-muted-foreground font-bold">{ev.customer_name || 'Walk-in Customer'}</p>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                           <div className="text-right">
                                              <p className={`text-sm font-black ${ev.type === 'Return' || ev.type === 'Refund' ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                                 LKR {parseFloat(ev.amount).toLocaleString()}
                                              </p>
                                              <span className="text-[9px] font-black uppercase text-muted-foreground opacity-60 tracking-wider">
                                                 {ev.payment_method || (ev.type === 'Invoice' ? 'POS SALE' : 'N/A')}
                                              </span>
                                           </div>
                                           <Button 
                                             variant="outline" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-50 transition-colors"
                                             onClick={() => {
                                                 let url = '';
                                                 if (ev.type === 'Invoice') url = `/cms/invoices/${ev.id}/receipt?autoprint=1`;
                                                 if (ev.type === 'Return') url = `/cms/sales-returns/${ev.id}/receipt?autoprint=1`;
                                                 if (ev.type === 'Refund') url = `/cms/refunds/${ev.id}/receipt?autoprint=1`;
                                                 if (ev.type === 'Receipt') url = `/cms/invoices/${ev.invoice_id}/receipt?autoprint=1`; 
                                                 if (url) window.open(url, '_blank');
                                             }}
                                           >
                                              <Printer className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                           </Button>
                                        </div>
                                     </div>
                                  ))}
                                  {dayLedger.events.filter((ev: any) => tab === "all" || ev.type === tab).length === 0 && (
                                     <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                                        <History className="w-16 h-16 mb-4" />
                                        <p className="text-sm font-black uppercase tracking-widest">No {tab === 'all' ? 'activity' : tab.toLowerCase()} recorded</p>
                                     </div>
                                  )}
                               </div>
                             </TabsContent>
                           ))}
                        </Tabs>
                  </>
                ) : (
                   <div className="text-center py-20 text-muted-foreground font-bold">Failed to synchronize ledger data.</div>
                )}
            </div>
         </DialogContent>
        </Dialog>

        <ReservationSelectionDialog />
      </>
    );
};
