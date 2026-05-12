"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard,
  RefreshCcw,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Building,
  Edit2,
  Download,
  Mail,
  Send,
  X,
  DollarSign,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function GlobalInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showResendModal, setShowResendModal] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionId, setTransactionId] = useState('');
  
  // Billing Cycle Progress State
  const [billingModal, setBillingModal] = useState({
    isOpen: false,
    step: 'idle', // idle, fetching, processing, completed
    total: 0,
    processed: 0,
    currentTenant: '',
    selectedMonth: new Date().toLocaleString('default', { month: 'long' }),
    selectedYear: new Date().getFullYear().toString(),
    results: { created: 0, skipped: 0, details: [] as any[] }
  });

  

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/billing/list`, { credentials: 'include' });
      const data = await res.json();
      setInvoices(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateInvoice = async (id: number, data: any) => {
    try {
      const res = await fetch(`${API_BASE}/admin/billing/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, ...data })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to update invoice');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    if (!confirm(`Mark invoice #${id} as ${status}?`)) return;
    updateInvoice(id, { status });
  };

  const handleEditAmount = async (id: number, currentAmount: string) => {
    const newAmount = prompt('Enter new amount:', currentAmount);
    if (newAmount !== null && !isNaN(parseFloat(newAmount))) {
      updateInvoice(id, { amount: parseFloat(newAmount) });
    }
  };

  const handleDownload = (id: number, type: string = 'invoice') => {
    const link = document.createElement('a');
    link.href = `${API_BASE}/admin/billing/download?id=${id}&type=${type}`;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResend = async (type: string = 'invoice') => {
    if (!showResendModal) return;
    setIsResending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/billing/resend?id=${showResendModal.id}&type=${type}`, {
        credentials: 'include'
      });
      if (res.ok) {
        fetchData();
        setShowResendModal(null);
      }
    } catch (err) {
      alert('Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  const handlePayment = async () => {
    if (!showPaymentModal) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) {
      alert('Please enter a valid amount');
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch(`${API_BASE}/admin/billing/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          invoice_id: showPaymentModal.id, 
          amount: amount,
          payment_method: paymentMethod,
          transaction_id: transactionId
        })
      });
      if (res.ok) {
        fetchData();
        setShowPaymentModal(null);
        setPaymentAmount('');
        setTransactionId('');
      }
    } catch (err) {
      alert('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  const fetchPaymentHistory = async (invoiceId: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/admin/billing/payments?id=${invoiceId}`, { credentials: 'include' });
      const data = await res.json();
      setPaymentHistory(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowHistory = (inv: any) => {
    setShowHistoryModal(inv);
    fetchPaymentHistory(inv.id);
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/billing/payments/delete?id=${id}`, { 
        method: 'POST',
        credentials: 'include' 
      });
      if (res.ok) {
        if (showHistoryModal) fetchPaymentHistory(showHistoryModal.id);
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete payment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/billing/delete?id=${id}`, { 
        method: 'POST',
        credentials: 'include' 
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete invoice');
    }
  };

  const handleRunBilling = async () => {
    const period = `${billingModal.selectedMonth} ${billingModal.selectedYear}`;
    setBillingModal(prev => ({ ...prev, step: 'fetching', processed: 0, total: 0 }));
    
    try {
      // 1. Fetch all active tenants
      const tenantsRes = await fetch(`${API_BASE}/admin/tenants`, { credentials: 'include' });
      const tenantsData = await tenantsRes.json();
      const activeTenants = tenantsData.data || [];
      
      setBillingModal(prev => ({ ...prev, step: 'processing', total: activeTenants.length }));
      
      let created = 0;
      let skipped = 0;
      const details: any[] = [];
      
      // 2. Process one by one
      for (let i = 0; i < activeTenants.length; i++) {
        const tenant = activeTenants[i];
        setBillingModal(prev => ({ ...prev, currentTenant: tenant.name, processed: i + 1 }));
        
        try {
          const res = await fetch(`${API_BASE}/admin/billing/run-cycle?tenant_id=${tenant.id}&period=${encodeURIComponent(period)}`, { 
            method: 'POST',
            credentials: 'include' 
          });
          const data = await res.json();
          if (data.processed > 0) {
            created++;
            details.push({ name: tenant.name, status: 'Generated', amount: tenant.monthly_price });
          } else {
            skipped++;
            details.push({ name: tenant.name, status: 'Skipped', reason: 'Already exists' });
          }
        } catch (e) {
          skipped++;
          details.push({ name: tenant.name, status: 'Error', reason: 'Connection failed' });
        }
      }
      
      setBillingModal(prev => ({ 
        ...prev, 
        step: 'completed', 
        results: { created, skipped, details } 
      }));
      fetchData();
    } catch (err) {
      alert('Failed to start billing cycle');
      setBillingModal(prev => ({ ...prev, isOpen: false, step: 'idle' }));
    }
  };

  const filtered = invoices.filter(i => 
    i.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Payments & Invoices</h1>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Enterprise billing & financial status</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setBillingModal(prev => ({ ...prev, isOpen: true, step: 'idle' }))}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 transition-all shadow-md disabled:opacity-50"
          >
            <CreditCard size={14} />
            Run Billing
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs w-64 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-bold"
            />
          </div>
          <button onClick={fetchData} className="p-1.5 glass glass-hover text-slate-400 rounded-lg transition-all">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Enterprise Tenant</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Invoice</th>
              <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Amount</th>
              <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Email</th>
              <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {currentItems.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Building size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{inv.tenant_name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">ID: {inv.tenant_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <div className="font-mono text-[11px] text-indigo-500 dark:text-indigo-400 font-black truncate max-w-[120px]">{inv.invoice_number}</div>
                  <div className="text-[10px] text-slate-500 font-bold">{inv.billing_month}</div>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1 group/amt">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{inv.currency || 'USD'} {inv.amount}</span>
                    <button 
                      onClick={() => handleEditAmount(inv.id, inv.amount)}
                      className="p-1 text-slate-400 hover:text-indigo-500 opacity-0 group-hover/amt:opacity-100 transition-all"
                      title="Edit"
                    >
                      <Edit2 size={10} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-1 ${
                    inv.status === 'Paid' 
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                    : inv.status === 'Overdue'
                    ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                    : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-1 ${
                      inv.email_status === 'Sent' 
                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                      : inv.email_status === 'Failed'
                      ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                      : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {inv.email_status || 'Pending'}
                    </span>
                    {inv.last_sent_at && (
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        {new Date(inv.last_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => setShowResendModal(inv)}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-500 rounded-lg transition-all"
                      title="Resend"
                    >
                      <Mail size={14} />
                    </button>
                    <button 
                      onClick={() => handleDownload(inv.id, 'invoice')}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-500 rounded-lg transition-all"
                      title="Download"
                    >
                      <FileText size={14} />
                    </button>
                    {inv.status !== 'Paid' ? (
                      <button 
                        onClick={() => {
                          setShowPaymentModal(inv);
                          setPaymentAmount(inv.amount);
                        }}
                        className="px-2 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all shadow-md"
                      >
                        Pay
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleShowHistory(inv)}
                        className="px-2 py-1 bg-indigo-600/10 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded hover:bg-indigo-600/20 transition-all"
                      >
                        Details
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(inv.id)}
                      className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500 rounded-lg transition-all">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="text-[11px] text-slate-600 font-black uppercase tracking-widest">No matching billing records found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Resend Confirmation Modal */}
      {showResendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Mail size={24} />
                </div>
                <button 
                  onClick={() => setShowResendModal(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Resend Invoice?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                You are about to re-dispatch <span className="font-bold text-indigo-500">{showResendModal.invoice_number}</span> to the enterprise client.
              </p>

              <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-6 mb-8 border border-slate-100 dark:border-white/5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400">
                      <Building size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{showResendModal.tenant_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-xs font-medium">{showResendModal.admin_email}</span>
                  </div>
                  {showResendModal.billing_cc_email && (() => {
                    let ccs: string[] = [];
                    try {
                      const decoded = JSON.parse(showResendModal.billing_cc_email);
                      if (Array.isArray(decoded)) ccs = decoded;
                    } catch(e) {
                      ccs = showResendModal.billing_cc_email.split(',').map((e: string) => e.trim()).filter(Boolean);
                    }
                    return ccs.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">CC Recipients:</div>
                        {ccs.map((cc: string, i: number) => (
                          <div key={i} className="text-[10px] text-slate-500 font-medium ml-7">{cc}</div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowResendModal(null)}
                  className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleResend(showResendModal.status === 'Paid' ? 'receipt' : 'invoice')}
                  disabled={isResending}
                  className="flex-1 py-4 bg-indigo-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <RefreshCcw size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isResending ? 'Sending...' : (showResendModal.status === 'Paid' ? 'Resend Receipt' : 'Send Invoice')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Payment Receipts</h3>
                    <p className="text-xs text-slate-500 font-medium">History for {showHistoryModal.invoice_number}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                {loadingHistory ? (
                  <div className="py-12 flex flex-col items-center gap-4">
                    <RefreshCcw size={32} className="animate-spin text-indigo-500" />
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Records...</span>
                  </div>
                ) : paymentHistory.length > 0 ? (
                  <div className="grid gap-3">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between group/pay">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center text-emerald-500">
                            <CheckCircle size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">{payment.receipt_number}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              {payment.payment_method} • {new Date(payment.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-900 dark:text-white">${payment.amount}</div>
                            <div className="text-[9px] text-slate-400 font-medium font-mono">{payment.transaction_id || 'No TXID'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button 
                              onClick={() => handleDownload(showHistoryModal.id, 'receipt')}
                              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400 hover:text-indigo-500 transition-all"
                              title="Download Receipt"
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setShowResendModal(showHistoryModal);
                                setShowHistoryModal(null);
                              }}
                              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                              title="Resend Receipt"
                            >
                              <Send size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                              title="Delete Payment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50 dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5">
                    <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-bold">No formal payment records found.</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Status may have been set manually.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end">
                <button 
                  onClick={() => setShowHistoryModal(null)}
                  className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                >
                  Close Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <DollarSign size={24} />
                </div>
                <button 
                  onClick={() => setShowPaymentModal(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Confirm Payment</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                Enter the amount received from <span className="font-bold text-emerald-500">{showPaymentModal.tenant_name}</span>.
              </p>

              <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-6 mb-8 border border-slate-100 dark:border-white/5 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Invoice Balance</div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{showPaymentModal.currency || 'USD'} {showPaymentModal.amount}</div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Payment Amount ({showPaymentModal.currency || 'USD'})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`e.g. ${showPaymentModal.currency || 'USD'} ${showPaymentModal.amount}`}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-lg font-bold focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Method</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Transaction ID</label>
                    <input 
                      type="text" 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowPaymentModal(null)}
                  className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="flex-1 py-4 bg-emerald-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPaying ? (
                    <RefreshCcw size={16} className="animate-spin" />
                  ) : (
                    <DollarSign size={16} />
                  )}
                  {isPaying ? 'Processing...' : 'Confirm Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add extra fields to Payment Confirmation Modal */}
      <style jsx global>{`
        .payment-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }
      `}</style>
      {/* Billing Cycle Progress Modal */}
      {billingModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                  <CreditCard size={28} />
                </div>
                {billingModal.step === 'completed' && (
                  <button 
                    onClick={() => setBillingModal(prev => ({ ...prev, isOpen: false }))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-all"
                  >
                    <X size={24} />
                  </button>
                )}
              </div>

              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                {billingModal.step === 'idle' && 'Billing Period'}
                {billingModal.step === 'fetching' && 'Initializing Cycle...'}
                {billingModal.step === 'processing' && 'Processing Billing'}
                {billingModal.step === 'completed' && 'Cycle Completed'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                {billingModal.step === 'idle' && 'Select the target month and year for this billing cycle.'}
                {billingModal.step === 'fetching' && 'Accessing BizzFlow Master API to scope enterprise tenants.'}
                {billingModal.step === 'processing' && `Generating and dispatching invoices for ${billingModal.total} active accounts.`}
                {billingModal.step === 'completed' && 'The monthly billing cycle has been executed successfully.'}
              </p>

              {billingModal.step === 'idle' && (
                <div className="space-y-6 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing Month</label>
                            <select 
                                value={billingModal.selectedMonth}
                                onChange={(e) => setBillingModal(prev => ({ ...prev, selectedMonth: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                            >
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing Year</label>
                            <select 
                                value={billingModal.selectedYear}
                                onChange={(e) => setBillingModal(prev => ({ ...prev, selectedYear: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                            >
                                {[2024, 2025, 2026, 2027, 2028].map(y => (
                                    <option key={y} value={y.toString()}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={handleRunBilling}
                        className="w-full py-5 bg-indigo-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30"
                    >
                        Start Billing Cycle
                    </button>
                </div>
              )}

              {(billingModal.step === 'processing' || billingModal.step === 'completed') && (
                <div className="space-y-6 mb-8">
                  <div className="flex items-center justify-between text-[11px] font-black tracking-widest text-slate-400 uppercase">
                    <span>Progress Status</span>
                    <span>{Math.round((billingModal.processed / billingModal.total) * 100)}%</span>
                  </div>
                  <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                      style={{ width: `${(billingModal.processed / billingModal.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5">
                    {billingModal.step === 'processing' ? (
                        <RefreshCcw size={16} className="animate-spin text-indigo-500" />
                    ) : (
                        <CheckCircle size={16} className="text-emerald-500" />
                    )}
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {billingModal.step === 'processing' 
                        ? `Processing: ${billingModal.currentTenant}` 
                        : 'All tenants processed'}
                    </span>
                  </div>
                </div>
              )}

              {billingModal.step === 'completed' && (
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Generated</div>
                            <div className="text-2xl font-black text-emerald-600">{billingModal.results.created}</div>
                        </div>
                        <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-2xl">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Skipped</div>
                            <div className="text-2xl font-black text-slate-500">{billingModal.results.skipped}</div>
                        </div>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Detailed Report</div>
                        {billingModal.results.details.map((d, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl">
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</div>
                                    <div className="text-[9px] text-slate-500 font-medium">{d.reason || `Amount: $${d.amount}`}</div>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                    d.status === 'Generated' ? 'bg-emerald-500/10 text-emerald-600' : 
                                    d.status === 'Skipped' ? 'bg-amber-500/10 text-amber-600' : 
                                    'bg-rose-500/10 text-rose-600'
                                }`}>
                                    {d.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {billingModal.step === 'completed' && (
                <button 
                  onClick={() => setBillingModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full py-5 bg-indigo-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30"
                >
                  Dismiss Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
