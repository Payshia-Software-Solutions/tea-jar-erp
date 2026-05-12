"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  RefreshCcw, 
  Search, 
  Download, 
  Send, 
  CheckCircle, 
  Building,
  Calendar,
  ChevronRight,
  Trash2
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/billing/payments/all`, { credentials: 'include' });
      const data = await res.json();
      setPayments(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = (invoiceId: number) => {
    const link = document.createElement('a');
    link.href = `${API_BASE}/admin/billing/download?id=${invoiceId}&type=receipt`;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment record? This will revert the invoice status if it was the last payment.')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/billing/payments/delete?id=${id}`, { 
        method: 'POST',
        credentials: 'include' 
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to delete payment');
    }
  };

  const handleResend = async (invoiceId: number) => {
    try {
      const res = await fetch(`${API_BASE}/admin/billing/resend?id=${invoiceId}&type=receipt`, {
        credentials: 'include'
      });
      if (res.ok) {
        alert('Receipt resent successfully');
      }
    } catch (err) {
      alert('Failed to resend receipt');
    }
  };

  const filtered = payments.filter(p => 
    p.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Payment History</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Record of enterprise transactions</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid gap-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="animate-spin text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Revenue Data...</span>
          </div>
        ) : filtered.length > 0 ? (
          <div className="glass overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Transaction</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Tenant</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Amount & Date</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Method</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {currentItems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                          <CheckCircle size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">{p.receipt_number}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inv: {p.invoice_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <Building size={12} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.tenant_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-black text-slate-900 dark:text-white">{p.currency || 'USD'} {p.amount}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(p.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded border border-indigo-500/20">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleDownload(p.invoice_id)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-500 rounded-lg transition-all"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          onClick={() => handleResend(p.invoice_id)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                          title="Resend"
                        >
                          <Send size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        ) : (
          <div className="py-20 text-center glass">
            <DollarSign size={32} className="mx-auto text-slate-200 dark:text-white/5 mb-3" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">No Transactions</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Process payments to see revenue history here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
