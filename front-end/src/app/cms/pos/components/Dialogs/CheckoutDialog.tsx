"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Calculator, 
  Banknote, 
  CreditCard, 
  Receipt, 
  Store, 
  Trash2, 
  Plus, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  Printer, 
  User 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { usePOS } from "../../context/POSContext";
import { fetchBankBranches } from "@/lib/api";

export const CheckoutDialog: React.FC = () => {
  const {
    checkoutOpen,
    setCheckoutOpen,
    cart,
    totals,
    submitting,
    handleCheckoutProcess,
    selectedCustomer,
    customers,
    banks,
    bankBranches,
    setBankBranches,
    vKeyboardEnabled,
    setVKeyboardActiveInput,
    selectedBankId,
    setSelectedBankId,
    selectedCardCategory,
    setSelectedCardCategory
  } = usePOS();

  // --- Single Payment States ---
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Cheque' | 'Bank Transfer' | 'Credit'>('Cash');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  
  // Details for Single Payment
  const [cardType, setCardType] = useState('Visa');
  const [cardLast4, setCardLast4] = useState('');
  const [cardAuthCode, setCardAuthCode] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeBankName, setChequeBankName] = useState('');
  const [chequeBranchName, setChequeBranchName] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequePayee, setChequePayee] = useState('');

  // --- Split Payment States ---
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<any[]>([
    { id: '1', method: 'Cash', amount: 0, cardType: 'Visa', cardLast4: '', cardAuthCode: '', chequeNo: '', chequeBankName: '', chequeBranchName: '', chequeDate: new Date().toISOString().split('T')[0], chequePayee: '' }
  ]);
  const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null);

  // Sub-dialogs visibility
  const [cardDetailsOpen, setCardDetailsOpen] = useState(false);
  const [chequeDetailsOpen, setChequeDetailsOpen] = useState(false);

  // Initialize amount when opening
  useEffect(() => {
    if (checkoutOpen) {
       setAmountReceived(totals.grandTotal);
       setIsSplitPayment(false);
       setPaymentMethod('Cash');
       setSplitPayments([{ id: '1', method: 'Cash', amount: totals.grandTotal, cardType: 'Visa', cardLast4: '', cardAuthCode: '', chequeNo: '', chequeBankName: '', chequeBranchName: '', chequeDate: new Date().toISOString().split('T')[0], chequePayee: '' }]);
    }
  }, [checkoutOpen, totals.grandTotal]);

  const onConfirmCheckout = async () => {
    const paymentData = {
      isSplit: isSplitPayment,
      splitPayments: splitPayments,
      method: paymentMethod,
      amount: Math.min(amountReceived, totals.grandTotal),
      cardType, cardLast4, cardAuthCode,
      chequeNo, chequeBankName, chequeBranchName, chequeDate, chequePayee
    };
    await handleCheckoutProcess(paymentData);
    setCheckoutOpen(false);
  };

  // Global Key Listener for Amount received (only when single cash payment)
  useEffect(() => {
    if (!checkoutOpen || isSplitPayment || (paymentMethod !== 'Cash' && paymentMethod !== 'Bank Transfer')) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (/^[0-9]$/.test(e.key) || e.key === '.') {
        e.preventDefault();
        const current = String(amountReceived || '');
        if (e.key === '.' && current.includes('.')) return;
        const next = current + e.key;
        setAmountReceived(Number(next));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const str = String(amountReceived || '');
        setAmountReceived(Number(str.slice(0, -1)) || 0);
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setAmountReceived(0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!submitting) onConfirmCheckout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkoutOpen, isSplitPayment, paymentMethod, amountReceived, submitting, onConfirmCheckout]);

  const totalPaid = isSplitPayment ? splitPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0) : amountReceived;

  return (
    <>
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className={`transition-all duration-300 w-full ${isSplitPayment ? 'sm:max-w-[600px]' : (['Cheque', 'Card', 'Cash', 'Bank Transfer', 'Credit'].includes(paymentMethod)) ? 'sm:max-w-[780px]' : 'sm:max-w-md'} h-[100dvh] sm:h-auto rounded-none sm:rounded-3xl p-0 overflow-hidden border-none shadow-2xl`}>
          <div className="flex flex-col md:flex-row h-full">
            {/* Main Payment Section */}
            <div className="flex-1 p-6 flex flex-col space-y-5 bg-background overflow-hidden">
              <DialogHeader className="mb-2 relative pr-8">
                <div className="flex justify-between items-center w-full">
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-primary"/> POS Checkout
                  </DialogTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsSplitPayment(!isSplitPayment)}
                    className={`font-bold transition-all h-8 text-[10px] ${isSplitPayment ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : ''}`}
                  >
                    {isSplitPayment ? '⚡ Split: ON' : '⚡ Split?'}
                  </Button>
                </div>
              </DialogHeader>
              
              {/* Total and Balance */}
              <div className="space-y-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex justify-between items-center shadow-inner">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Total Due</span>
                  <span className="font-black text-2xl tabular-nums text-foreground">LKR {totals.grandTotal.toLocaleString()}</span>
                </div>
                
                {isSplitPayment && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center border border-blue-100 dark:border-blue-900/30 min-w-0">
                      <span className="text-[10px] font-bold text-blue-700 uppercase whitespace-nowrap mr-2">Paid</span>
                      <span className="font-black text-lg tabular-nums text-blue-800 dark:text-blue-400 truncate">LKR {totalPaid.toLocaleString()}</span>
                    </div>
                    <div className={`flex-1 p-3 rounded-lg flex justify-between items-center border min-w-0 ${totalPaid >= totals.grandTotal ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30 text-emerald-700' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30 text-rose-700'}`}>
                      <span className="text-[10px] font-bold uppercase whitespace-nowrap mr-2">Balance</span>
                      <span className="font-black text-lg tabular-nums truncate">LKR {Math.max(0, totals.grandTotal - totalPaid).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4 custom-scrollbar">
                {isSplitPayment ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {splitPayments.map((payment, idx) => (
                      <div key={payment.id} className="p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-4 relative group">
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex-1">
                            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                              {(['Cash', 'Card', 'Cheque', 'Bank Transfer'] as const).map(m => {
                                const active = payment.method === m;
                                return (
                                  <button 
                                    key={m} 
                                    onClick={() => {
                                      const next = [...splitPayments];
                                      next[idx].method = m;
                                      setSplitPayments(next);
                                    }}
                                    className={`px-3 h-8 rounded-full border text-[10px] font-black uppercase transition-all flex items-center gap-1.5 whitespace-nowrap ${active ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-primary/50'}`}
                                  >
                                    {m === 'Cash' && <Banknote className="w-3 h-3"/>}
                                    {m === 'Card' && <CreditCard className="w-3 h-3"/>}
                                    {m === 'Cheque' && <Receipt className="w-3 h-3"/>}
                                    {m === 'Bank Transfer' && <Store className="w-3 h-3"/>}
                                    {m}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {idx > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                              onClick={() => setSplitPayments(splitPayments.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                             <Input 
                              type="number" 
                              placeholder="Amount" 
                              value={payment.amount || ''}
                              onChange={(e) => {
                                const next = [...splitPayments];
                                next[idx].amount = Number(e.target.value);
                                setSplitPayments(next);
                              }}
                              onFocus={() => {
                                if (vKeyboardEnabled) {
                                  setVKeyboardActiveInput({
                                    key: `Split Amount #${idx + 1}`,
                                    value: String(payment.amount || ''),
                                    type: 'numeric',
                                    setter: (val: string) => {
                                      const next = [...splitPayments];
                                      next[idx].amount = Number(val);
                                      setSplitPayments(next);
                                    }
                                  });
                                }
                              }}
                              className="h-11 font-black text-xl bg-white dark:bg-slate-900 focus:ring-primary shadow-sm"
                            />
                          </div>
                          {(payment.method === 'Card' || payment.method === 'Cheque') && (
                            <Button 
                              variant="outline" 
                              className={`h-11 font-bold gap-2 ${((payment.method === 'Card' && payment.cardLast4) || (payment.method === 'Cheque' && payment.chequeNo)) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-indigo-200 text-indigo-700'}`}
                              onClick={() => setEditingPaymentIndex(idx)}
                            >
                              {payment.method === 'Card' ? <CreditCard className="w-4 h-4"/> : <Receipt className="w-4 h-4"/>}
                              {((payment.method === 'Card' && payment.cardLast4) || (payment.method === 'Cheque' && payment.chequeNo)) ? 'Saved' : 'Details'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full h-12 border-dashed border-2 font-bold text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5"
                      onClick={() => setSplitPayments([...splitPayments, {
                        id: Math.random().toString(),
                        method: 'Cash',
                        amount: 0,
                        cardType: 'Visa', cardLast4: '', cardAuthCode: '',
                        chequeNo: '', chequeBankName: '', chequeBranchName: '', chequeDate: new Date().toISOString().split('T')[0], chequePayee: ''
                      }])}
                    >
                       <Plus className="w-4 h-4 mr-2" /> Add Payment Method
                    </Button>
                  </div>
                ) : (
                  /* Standard Single Payment View */
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['Cash', 'Card', 'Cheque', 'Bank Transfer'] as const).map(m => {
                          const icons: Record<string, React.ReactNode> = {
                            Cash: <Banknote className="w-4 h-4 mr-2" />,
                            Card: <CreditCard className="w-4 h-4 mr-2" />,
                            Cheque: <Receipt className="w-4 h-4 mr-2" />,
                            'Bank Transfer': <Store className="w-4 h-4 mr-2" />,
                          };
                          const active = paymentMethod === m;
                          return (
                            <Button key={m} type="button" variant={active ? 'default' : 'outline'}
                              className={`h-12 border-2 text-xs font-bold transition-all ${active ? 'border-primary ring-2 ring-primary/20 bg-primary text-white scale-[1.02]' : 'hover:border-primary/50'}`}
                              onClick={() => { setPaymentMethod(m); if (amountReceived === 0) setAmountReceived(totals.grandTotal); }}
                            >
                              {icons[m]} {m}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        type="button"
                        variant={paymentMethod === 'Credit' ? 'destructive' : 'outline'}
                        className={`w-full h-11 border-2 font-bold text-xs transition-all ${paymentMethod === 'Credit' ? 'ring-2 ring-rose-500/20 scale-[1.02]' : 'border-dashed border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10'}`}
                        onClick={() => { setPaymentMethod('Credit'); setAmountReceived(0); }}
                      >
                        📋 Credit Close — Invoice later
                      </Button>
                    </div>

                    {(paymentMethod === 'Cheque' || paymentMethod === 'Card') && (
                      <div className="md:hidden">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className={`w-full h-12 border-2 font-bold gap-2 ${paymentMethod === 'Cheque' ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                          onClick={() => paymentMethod === 'Cheque' ? setChequeDetailsOpen(true) : setCardDetailsOpen(true)}
                        >
                          {paymentMethod === 'Cheque' ? (
                              <>
                                  <Receipt className="w-4 h-4" />
                                  {chequeNo ? `Cheque: ${chequeNo}` : 'Enter Cheque Details'}
                              </>
                          ) : (
                              <>
                                  <CreditCard className="w-4 h-4" />
                                  {cardLast4 ? `Card ending in ${cardLast4}` : 'Enter Card Details'}
                              </>
                          )}
                        </Button>
                      </div>
                    )}

                    {paymentMethod !== 'Credit' && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Amount Tendered</label>
                        <Input 
                          type="number"
                          value={amountReceived || ''} 
                          onChange={(e) => setAmountReceived(Number(e.target.value))}
                          onFocus={() => {
                            if (vKeyboardEnabled) {
                              setVKeyboardActiveInput({
                                key: "Cash Amount Received",
                                value: String(amountReceived || ''),
                                type: 'numeric',
                                setter: (val: string) => setAmountReceived(Number(val))
                              });
                            }
                          }}
                          className="text-center font-black text-3xl h-16 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 focus-visible:ring-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-inner rounded-xl"
                        />
                        <div className="flex justify-center gap-2">
                          {[0, 500, 1000, 5000].map(bump => (
                            <Button key={bump} variant="outline" size="sm" onClick={() => setAmountReceived(bump === 0 ? totals.grandTotal : amountReceived + bump)} className="font-bold tabular-nums h-9 px-4 rounded-lg">
                              {bump === 0 ? 'Exact' : `+${bump}`}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {paymentMethod !== 'Credit' && amountReceived - totals.grandTotal > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 animate-in fade-in slide-in-from-top-2">
                        <span className="font-bold text-xs uppercase tracking-wider">Change Due</span>
                        <span className="font-black text-xl tabular-nums">LKR {(amountReceived - totals.grandTotal).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-2 border-t pt-5 gap-3 shrink-0">
                <Button variant="ghost" onClick={() => setCheckoutOpen(false)} className="font-bold">Cancel</Button>
                <Button 
                    onClick={onConfirmCheckout} 
                    disabled={submitting || 
                        (isSplitPayment && totalPaid < totals.grandTotal) || 
                        (!isSplitPayment && ((paymentMethod === 'Cheque' && !chequeNo) || (paymentMethod === 'Card' && !cardLast4)))
                    } 
                    className="font-bold flex-1 h-12 shadow-lg shadow-primary/20 rounded-xl"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-5 h-5 mr-2 opacity-50" />}
                  Process & Print Invoice
                </Button>
              </DialogFooter>
            </div>

            {/* Right Side Detail Panels (Desktop) */}
            {!isSplitPayment && (
              <div className="hidden md:flex w-[400px] bg-slate-50 dark:bg-slate-950 p-7 border-l border-border flex-col space-y-7 overflow-y-auto custom-scrollbar">
                
                {/* 1. Balanced Customer Header (Persistent) */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="w-3 h-3" /> Billing Customer
                  </p>
                  {(() => {
                    const cust = customers.find(c => String(c.id) === String(selectedCustomer));
                    return (
                      <div className="flex items-center gap-3 p-4 bg-white dark:bg-card border border-border rounded-xl shadow-sm">
                        <div className="p-2.5 bg-primary/10 rounded-full">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black truncate text-foreground">{cust?.name || 'Walk-In Customer'}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">{cust?.phone || 'No Phone Attached'}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="h-px bg-border/50 shrink-0" />

                {/* 2. Context-Aware Action Panel */}
                {paymentMethod === 'Credit' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="pb-2">
                      <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Credit Audit
                      </p>
                    </div>
                    {(() => {
                       const cust = customers.find(c => String(c.id) === String(selectedCustomer));
                       if (!cust) return <div className="text-xs text-muted-foreground italic">Select a customer to view credit stats.</div>;
                       const limit = Number(cust.credit_limit) || 0;
                       const outstanding = Number(cust.total_outstanding) || 0;
                       const available = limit - outstanding;
                       const remainingAfterSale = available - totals.grandTotal;
                       const isOverLimit = remainingAfterSale < 0;
                       return (
                         <div className="space-y-4">
                            <div className={`p-5 border-2 rounded-2xl shadow-md transition-all ${isOverLimit ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Remaining Trust Balance</p>
                              <p className={`text-3xl font-black tabular-nums ${isOverLimit ? 'text-rose-700' : 'text-emerald-700'}`}>LKR {available.toLocaleString()}</p>
                            </div>
                            {isOverLimit && (
                              <div className="p-4 bg-rose-600 text-white rounded-xl flex items-start gap-3 shadow-lg shadow-rose-200 dark:shadow-none animate-pulse">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div className="space-y-1">
                                  <p className="text-[11px] font-black uppercase">Credit Warning</p>
                                  <p className="text-[10px] leading-tight font-medium opacity-90">This transaction exceeds the customer&apos;s allowed credit limit.</p>
                                </div>
                              </div>
                            )}
                         </div>
                       );
                    })()}
                  </div>
                )}

                {paymentMethod === 'Cheque' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                    <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2"><Receipt className="w-4 h-4" /> Cheque Documentation</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight ml-1">Cheque Serial Number</label>
                        <Input maxLength={10} placeholder="XXXXXX" value={chequeNo} onChange={e => setChequeNo(e.target.value.replace(/\D/g,''))} className="font-mono text-center font-bold h-11 border-2" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight ml-1">Payment Date</label>
                        <Input type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} className="h-11 border-2 font-bold" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight ml-1">Issuing Bank</label>
                        <SearchableSelect
                          options={banks.map(b => ({ value: String(b.id), label: b.name }))}
                          value={chequeBankName ? String(banks.find(b => b.name === chequeBankName)?.id || "") : ""}
                          onValueChange={async (val) => {
                            const b = banks.find(x => String(x.id) === val);
                            if (b) { setChequeBankName(b.name); setChequeBranchName(""); setBankBranches(await fetchBankBranches(val)); }
                          }}
                          placeholder="Select Bank"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight ml-1">Branch Name</label>
                        <SearchableSelect
                          options={bankBranches.map(br => ({ value: String(br.id), label: br.branch_name }))}
                          value={chequeBranchName ? String(bankBranches.find(br => br.branch_name === chequeBranchName)?.id || "") : ""}
                          onValueChange={(val) => setChequeBranchName(bankBranches.find(br => String(br.id) === val)?.branch_name || "")}
                          placeholder="Select Branch"
                          disabled={!bankBranches.length}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'Cash' || paymentMethod === 'Bank Transfer') && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2"><Calculator className="w-4 h-4" /> Quick Numpad</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '.'].map(val => (
                        <Button 
                          key={String(val)} 
                          variant="outline" 
                          className={`h-14 text-2xl font-black rounded-xl border-2 hover:bg-white hover:border-primary hover:text-primary transition-all shadow-sm ${val === 'C' ? 'text-rose-500' : ''}`}
                          onClick={() => {
                            if (val === 'C') setAmountReceived(0);
                            else {
                               const current = String(amountReceived || '');
                               if (val === '.' && current.includes('.')) return;
                               const next = current + String(val);
                               if (next.length <= 12) setAmountReceived(Number(next) || 0);
                            }
                          }}
                        >
                          {val}
                        </Button>
                      ))}
                    </div>
                    <Button variant="default" className="w-full h-14 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none rounded-xl text-lg" onClick={() => setAmountReceived(totals.grandTotal)}>EXACT AMOUNT</Button>
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-4 h-4" /> Gateway Info</p>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        {['Visa', 'Mastercard', 'AMEX', 'Other'].map(type => (
                          <Button key={type} size="sm" variant={cardType === type ? 'default' : 'outline'} onClick={() => setCardType(type)} className={`text-[10px] h-10 font-black border-2 transition-all ${cardType === type ? 'scale-[1.05] ring-2 ring-primary/20' : ''}`}>{type}</Button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight ml-1">Card Provider / Bank</label>
                        <SearchableSelect 
                            options={banks.map(b => ({ value: String(b.id), label: b.name }))}
                            value={selectedBankId}
                            onValueChange={(val) => setSelectedBankId(val)}
                            placeholder="Select Bank..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight ml-1">Card Category</label>
                        <div className="grid grid-cols-2 gap-2">
                             {['Credit', 'Debit'].map(cat => (
                                 <Button 
                                    key={cat}
                                    type="button"
                                    variant={selectedCardCategory === cat ? 'default' : 'outline'}
                                    onClick={() => setSelectedCardCategory(cat)}
                                    className={`h-11 rounded-xl font-black text-xs transition-all ${selectedCardCategory === cat ? 'scale-[1.05] ring-2 ring-primary/20 shadow-lg' : ''}`}
                                 >
                                    {cat} Card
                                 </Button>
                             ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight ml-1">Card Number (Last 4)</label>
                        <Input 
                          maxLength={4} placeholder="0000" 
                          value={cardLast4} 
                          onChange={e => setCardLast4(e.target.value.replace(/\D/g,''))} 
                          onFocus={() => {
                            if (vKeyboardEnabled) {
                              setVKeyboardActiveInput({
                                key: "Card Last 4",
                                value: cardLast4,
                                type: 'numeric',
                                setter: (val: string) => setCardLast4(val.replace(/\D/g,''))
                              });
                            }
                          }}
                          className="font-mono text-center text-2xl h-14 tracking-[0.4em] font-black border-2" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight ml-1">Terminal Auth Code</label>
                        <Input 
                          placeholder="Verification Code" 
                          value={cardAuthCode} 
                          onChange={e => setCardAuthCode(e.target.value)} 
                          onFocus={() => {
                            if (vKeyboardEnabled) {
                              setVKeyboardActiveInput({
                                key: "Auth Code",
                                value: cardAuthCode,
                                setter: (val: string) => setCardAuthCode(val)
                              });
                            }
                          }}
                          className="h-12 border-2 font-bold" 
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Payment Detail Sub-Modals (Card/Cheque) */}
      <Dialog open={editingPaymentIndex !== null} onOpenChange={(o) => !o && setEditingPaymentIndex(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md bg-white dark:bg-slate-950 rounded-[2rem] p-6 border-none shadow-2xl animate-in zoom-in-95 duration-200">
           <DialogHeader className="mb-4">
             <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
               {editingPaymentIndex !== null && splitPayments[editingPaymentIndex]?.method === 'Card' ? (
                 <><CreditCard className="w-5 h-5 text-indigo-500"/> Card Setup</>
               ) : (
                 <><Receipt className="w-5 h-5 text-amber-500"/> Cheque Setup</>
               )}
             </DialogTitle>
           </DialogHeader>
           {editingPaymentIndex !== null && (
             <div className="space-y-6">
                {splitPayments[editingPaymentIndex].method === 'Card' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-2">
                      {['Visa', 'Mastercard', 'AMEX', 'Other'].map(type => (
                        <Button 
                          key={type} 
                          size="sm" 
                          variant={splitPayments[editingPaymentIndex].cardType === type ? 'default' : 'outline'} 
                          onClick={() => {
                            const n = [...splitPayments]; n[editingPaymentIndex].cardType = type; setSplitPayments(n);
                          }} 
                          className={`font-black text-[10px] uppercase h-10 transition-all rounded-xl ${splitPayments[editingPaymentIndex].cardType === type ? 'ring-2 ring-primary/20' : ''}`}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Card Provider / Bank</label>
                        <select 
                          className="w-full h-11 px-4 text-sm font-bold bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-primary/20 cursor-pointer"
                          value={splitPayments[editingPaymentIndex].bankId || ""}
                          onChange={e => {
                            const n = [...splitPayments]; n[editingPaymentIndex].bankId = e.target.value; setSplitPayments(n);
                          }}
                        >
                          <option value="">Select Bank</option>
                          {banks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Card Category</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl">
                          {['Credit', 'Debit'].map(cat => (
                            <Button
                              key={cat}
                              size="sm"
                              variant={splitPayments[editingPaymentIndex].cardCategory === cat ? 'default' : 'ghost'}
                              onClick={() => {
                                const n = [...splitPayments]; n[editingPaymentIndex].cardCategory = cat; setSplitPayments(n);
                              }}
                              className={`h-9 font-black text-[10px] uppercase rounded-xl transition-all ${splitPayments[editingPaymentIndex].cardCategory === cat ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-muted-foreground'}`}
                            >
                              {cat} Card
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Card Number (Last 4)</label>
                          <Input 
                            maxLength={4} 
                            placeholder="0000" 
                            value={splitPayments[editingPaymentIndex].cardLast4 || ""} 
                            onChange={e => {
                              const n = [...splitPayments]; n[editingPaymentIndex].cardLast4 = e.target.value.replace(/\D/g,''); setSplitPayments(n);
                            }} 
                            className="font-mono text-center text-2xl h-12 font-black tracking-[0.2em] bg-slate-50 dark:bg-slate-900 border-none rounded-xl" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Auth Code</label>
                          <Input 
                            placeholder="Verification" 
                            value={splitPayments[editingPaymentIndex].cardAuthCode || ""} 
                            onChange={e => {
                              const n = [...splitPayments]; n[editingPaymentIndex].cardAuthCode = e.target.value; setSplitPayments(n);
                            }} 
                            className="text-center font-bold h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl placeholder:font-medium" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cheque #</label>
                         <Input 
                          placeholder="XXXXXX" 
                          value={splitPayments[editingPaymentIndex].chequeNo} 
                          onChange={e => {
                            const n = [...splitPayments]; n[editingPaymentIndex].chequeNo = e.target.value; setSplitPayments(n);
                          }} 
                          className="font-bold h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Date</label>
                         <Input 
                          type="date" 
                          value={splitPayments[editingPaymentIndex].chequeDate} 
                          onChange={e => {
                            const n = [...splitPayments]; n[editingPaymentIndex].chequeDate = e.target.value; setSplitPayments(n);
                          }} 
                          className="font-bold h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl"
                         />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Issuing Bank</label>
                      <SearchableSelect
                          options={banks.map(b => ({ value: String(b.id), label: b.name }))}
                          value={splitPayments[editingPaymentIndex].chequeBankName ? String(banks.find(b => b.name === splitPayments[editingPaymentIndex].chequeBankName)?.id || "") : ""}
                          onValueChange={async (val) => {
                            const b = banks.find(x => String(x.id) === val);
                            if (b) {
                               const n = [...splitPayments]; n[editingPaymentIndex].chequeBankName = b.name; n[editingPaymentIndex].chequeBranchName = ""; setSplitPayments(n);
                               setBankBranches(await fetchBankBranches(val));
                            }
                          }}
                          placeholder="Select Bank"
                        />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Branch</label>
                      <SearchableSelect
                          options={bankBranches.map(br => ({ value: String(br.id), label: br.branch_name }))}
                          value={splitPayments[editingPaymentIndex].chequeBranchName ? String(bankBranches.find(br => br.branch_name === splitPayments[editingPaymentIndex].chequeBranchName)?.id || "") : ""}
                          onValueChange={(val) => {
                            const br = bankBranches.find(x => String(x.id) === val);
                            if (br) { const n = [...splitPayments]; n[editingPaymentIndex].chequeBranchName = br.branch_name; setSplitPayments(n); }
                          }}
                          placeholder="Select Branch"
                          disabled={!bankBranches.length}
                        />
                    </div>
                  </div>
                )}
                <Button onClick={() => setEditingPaymentIndex(null)} className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">
                  Save Changes
                </Button>
             </div>
           )}
        </DialogContent>
      </Dialog>

      {/* Single Payment Detail Sub-Modals (Card) */}
      <Dialog open={cardDetailsOpen} onOpenChange={setCardDetailsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md h-auto rounded-[2rem] p-6 bg-white dark:bg-slate-950 border-none shadow-2xl animate-in zoom-in-95 duration-200">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500"/> Card Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {['Visa', 'Mastercard', 'AMEX', 'Other'].map(type => (
                <Button 
                  key={type} 
                  size="sm" 
                  variant={cardType === type ? 'default' : 'outline'} 
                  onClick={() => setCardType(type)} 
                  className={`font-black text-[10px] uppercase h-10 transition-all rounded-xl ${cardType === type ? 'ring-2 ring-primary/20' : ''}`}
                >
                  {type}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Card Provider / Bank</label>
                  <SearchableSelect 
                      options={banks.map(b => ({ value: String(b.id), label: b.name }))}
                      value={selectedBankId}
                      onValueChange={(val) => setSelectedBankId(val)}
                      placeholder="Select Bank..."
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Card Category</label>
                  <div className="grid grid-cols-2 gap-2">
                       {['Credit', 'Debit'].map(cat => (
                           <Button 
                              key={cat}
                              type="button"
                              variant={selectedCardCategory === cat ? 'default' : 'outline'}
                              onClick={() => setSelectedCardCategory(cat)}
                              className={`h-11 rounded-xl font-black text-[10px] uppercase transition-all ${selectedCardCategory === cat ? 'ring-2 ring-primary/20 shadow-lg' : ''}`}
                           >
                              {cat} Card
                           </Button>
                       ))}
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Card Number (Last 4)</label>
              <Input 
                maxLength={4} 
                placeholder="0000" 
                value={cardLast4} 
                onChange={e => setCardLast4(e.target.value.replace(/\D/g,''))} 
                className="font-mono text-center text-3xl h-16 font-black tracking-[0.4em] bg-slate-50 dark:bg-slate-900 border-none rounded-2xl shadow-inner" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Auth Code</label>
              <Input 
                placeholder="Verification Code" 
                value={cardAuthCode} 
                onChange={e => setCardAuthCode(e.target.value)} 
                className="h-12 border-none bg-slate-50 dark:bg-slate-900 rounded-xl font-bold px-4" 
              />
            </div>
            <Button onClick={() => setCardDetailsOpen(false)} className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20">
              Save & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Payment Detail Sub-Modals (Cheque) */}
      <Dialog open={chequeDetailsOpen} onOpenChange={setChequeDetailsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md h-auto rounded-[2rem] p-6 bg-white dark:bg-slate-950 border-none shadow-2xl animate-in zoom-in-95 duration-200">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500"/> Cheque Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cheque #</label>
                <Input 
                  placeholder="XXXXXX" 
                  value={chequeNo} 
                  onChange={e => setChequeNo(e.target.value)} 
                  className="font-bold h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Date</label>
                <Input 
                  type="date" 
                  value={chequeDate} 
                  onChange={e => setChequeDate(e.target.value)} 
                  className="font-bold h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Issuing Bank</label>
              <SearchableSelect
                options={banks.map(b => ({ value: String(b.id), label: b.name }))}
                value={chequeBankName ? String(banks.find(b => b.name === chequeBankName)?.id || "") : ""}
                onValueChange={async (val) => {
                  const b = banks.find(x => String(x.id) === val);
                  if (b) { setChequeBankName(b.name); setChequeBranchName(""); setBankBranches(await fetchBankBranches(val)); }
                }}
                placeholder="Select Bank"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Branch</label>
              <SearchableSelect
                options={bankBranches.map(br => ({ value: String(br.id), label: br.branch_name }))}
                value={chequeBranchName ? String(bankBranches.find(br => br.branch_name === chequeBranchName)?.id || "") : ""}
                onValueChange={(val) => setChequeBranchName(bankBranches.find(br => String(br.id) === val)?.branch_name || "")}
                placeholder="Select Branch"
                disabled={!bankBranches.length}
              />
            </div>
            <Button onClick={() => setChequeDetailsOpen(false)} className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-500/20 mt-4">
              Save & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
