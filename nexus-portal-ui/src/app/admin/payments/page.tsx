"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCcw, Search, Download, Send, CheckCircle, Building, Trash2 } from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function PaymentHistoryPage() {
  const [payments,    setPayments]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/admin/billing/payments/all`, { credentials: 'include' });
      const data = await res.json();
      setPayments(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleDownload = (invoiceId: number) => {
    const a = document.createElement('a');
    a.href = `${API_BASE}/admin/billing/download?id=${invoiceId}&type=receipt`;
    a.setAttribute('download', '');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Delete this payment record? This will revert the invoice status if it was the last payment.')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/billing/payments/delete?id=${id}`, { method: 'POST', credentials: 'include' });
      if (res.ok) fetchData();
    } catch { alert('Failed to delete payment'); }
  };

  const handleResend = async (invoiceId: number) => {
    try {
      const res = await fetch(`${API_BASE}/admin/billing/resend?id=${invoiceId}&type=receipt`, { credentials: 'include' });
      if (res.ok) alert('Receipt resent successfully');
    } catch { alert('Failed to resend receipt'); }
  };

  const filtered   = payments.filter(p =>
    p.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageItems  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Payment History</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Record of enterprise transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
            <input type="text" placeholder="Search payments…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="rounded-lg border border-[#e4e4e7] bg-white py-2 pl-9 pr-3 text-[13px] text-[#09090b] placeholder:text-[#a1a1aa] w-56 focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 dark:border-[#27272a] dark:bg-[#18181b] dark:text-white transition-all" />
          </div>
          <button onClick={fetchData} className="rounded-lg border border-[#e4e4e7] bg-white p-2 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors">
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b]">
                {['Transaction', 'Tenant', 'Amount & Date', 'Method', ''].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa] ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-[13px] text-[#a1a1aa]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Loading…
                  </div>
                </td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#a1a1aa]">No payment records found</td></tr>
              ) : pageItems.map(p => (
                <tr key={p.id} className="group hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                        <CheckCircle size={15} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#09090b] dark:text-white">{p.receipt_number}</div>
                        <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] font-mono">Inv: {p.invoice_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Building size={12} className="text-[#a1a1aa]" />
                      <span className="text-[13px] text-[#09090b] dark:text-white">{p.tenant_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-semibold text-[#09090b] dark:text-white">{p.currency || 'USD'} {p.amount}</div>
                    <div className="text-[12px] text-[#71717a] dark:text-[#a1a1aa]">{new Date(p.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md border border-[#e0e7ff] bg-[#eef2ff] px-2 py-0.5 text-[11px] font-medium text-[#6366f1] dark:border-[#6366f1]/20 dark:bg-[#6366f1]/10 dark:text-[#818cf8]">
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDownload(p.invoice_id)} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-[#f4f4f5] hover:text-[#6366f1] dark:hover:bg-[#27272a] transition-colors" title="Download"><Download size={14} /></button>
                      <button onClick={() => handleResend(p.invoice_id)} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 transition-colors" title="Resend"><Send size={14} /></button>
                      <button onClick={() => handleDeletePayment(p.id)} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={itemsPerPage} />
      </div>
    </div>
  );
}
