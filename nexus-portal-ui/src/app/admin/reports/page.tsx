"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, RefreshCcw, DollarSign, Users, AlertCircle, FileText, Download, 
  Calendar, Clock, ShieldAlert, ArrowRight, Building, CheckCircle, Send, Loader2
} from 'lucide-react';

export default function ReportsPage() {
  const [tenants,    setTenants]    = useState<any[]>([]);
  const [packages,   setPackages]   = useState<any[]>([]);
  const [payments,   setPayments]   = useState<any[]>([]);
  const [invoices,   setInvoices]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<'financial' | 'unpaid' | 'operational'>('financial');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  
  // Track reminder email status for each invoice id
  const [remindingStatus, setRemindingStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  
  // Billing month filter for unpaid report (default to current month/year format)
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [tenantsRes, packagesRes, paymentsRes, invoicesRes] = await Promise.all([
        fetch(`${API_BASE}/admin/tenants`, { credentials: 'include', headers }),
        fetch(`${API_BASE}/admin/packages`, { credentials: 'include', headers }),
        fetch(`${API_BASE}/admin/billing/payments/all`, { credentials: 'include', headers }),
        fetch(`${API_BASE}/admin/billing/list`, { credentials: 'include', headers })
      ]);

      const tenantsData  = await tenantsRes.json();
      const packagesData = await packagesRes.json();
      const paymentsData = await paymentsRes.json();
      const invoicesData = await invoicesRes.json();

      setTenants(tenantsData.data || []);
      setPackages(packagesData.data || []);
      setPayments(paymentsData.data || []);
      setInvoices(invoicesData.data || []);
      
      // Auto-select latest billing month from invoices list if available
      const months = Array.from(new Set((invoicesData.data || []).map((inv: any) => inv.billing_month).filter(Boolean)));
      if (months.length > 0) {
        setFilterMonth(months[0] as string);
      }
    } catch (err) {
      console.error('Failed to fetch report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendReminder = async (invoiceId: string) => {
    setRemindingStatus(prev => ({ ...prev, [invoiceId]: 'loading' }));
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`${API_BASE}/admin/billing/resend?id=${invoiceId}&type=invoice`, { 
        credentials: 'include',
        headers
      });
      
      if (res.ok) {
        setRemindingStatus(prev => ({ ...prev, [invoiceId]: 'success' }));
        setTimeout(() => {
          setRemindingStatus(prev => ({ ...prev, [invoiceId]: 'idle' }));
        }, 3000);
      } else {
        setRemindingStatus(prev => ({ ...prev, [invoiceId]: 'error' }));
      }
    } catch {
      setRemindingStatus(prev => ({ ...prev, [invoiceId]: 'error' }));
    }
  };

  // Simple currency conversion helper
  const getAmountInSelected = (amount: number, fromCurrency: string) => {
    const from = (fromCurrency || 'USD').toUpperCase();
    const to = selectedCurrency.toUpperCase();
    if (from === to) return amount;
    if (from === 'USD' && to === 'LKR') return amount * 300;
    if (from === 'LKR' && to === 'USD') return amount / 300;
    if (from === 'EUR' && to === 'USD') return amount * 1.1;
    if (from === 'USD' && to === 'EUR') return amount / 1.1;
    return amount;
  };

  // Helper to calculate credit days aging
  const getCreditDaysAnalysis = (dueDateStr: string) => {
    if (!dueDateStr) return { text: 'No due date', type: 'unknown', days: 0 };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return { text: `${diffDays} days left`, type: 'current', days: diffDays };
    } else if (diffDays === 0) {
      return { text: 'Due today', type: 'today', days: 0 };
    } else {
      return { text: `${Math.abs(diffDays)} days overdue`, type: 'overdue', days: diffDays };
    }
  };

  // Unique billing months found in invoices
  const billingMonthsList = Array.from(new Set(invoices.map(inv => inv.billing_month).filter(Boolean)));

  // ── 1. Financial Metrics ──────────────────────────────────────────
  const totalRevenue = payments.reduce((acc, p) => {
    return acc + getAmountInSelected(parseFloat(p.amount || 0), p.currency);
  }, 0);

  const outstandingRevenue = invoices.reduce((acc, inv) => {
    if (inv.status !== 'Paid') {
      return acc + getAmountInSelected(parseFloat(inv.amount || 0), inv.currency);
    }
    return acc;
  }, 0);

  const projectedMRR = tenants.reduce((acc, tenant) => {
    if (tenant.status === 'Active' || tenant.status === 'Trial') {
      const pkg = packages.find(p => p.id == tenant.package_id);
      const price = pkg ? parseFloat(pkg.monthly_price || 0) : 0;
      return acc + getAmountInSelected(price, tenant.currency || 'USD');
    }
    return acc;
  }, 0);

  const getRevenueByMonth = () => {
    const monthlyData: Record<string, number> = {};
    payments.forEach(p => {
      const date = new Date(p.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      const amt = getAmountInSelected(parseFloat(p.amount || 0), p.currency);
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + amt;
    });
    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6);
  };

  const revenueByMonth = getRevenueByMonth();
  const maxMonthRev = Math.max(...revenueByMonth.map(d => d.amount), 1);

  // ── 2. Unpaid & Credit Days Analysis ─────────────────────────────
  // Filter invoices that are unpaid for the selected billing month
  const unpaidInvoices = invoices.filter(inv => {
    const isUnpaid = inv.status !== 'Paid';
    const matchesMonth = filterMonth === 'all' || inv.billing_month === filterMonth;
    return isUnpaid && matchesMonth;
  });

  // Credit days grouping / aging buckets for all unpaid invoices globally
  const agingGroups = {
    current: { count: 0, amount: 0 },   // Due date in future
    overdue30: { count: 0, amount: 0 }, // 1-30 days overdue
    overdue60: { count: 0, amount: 0 }, // 31-60 days overdue
    overdue90: { count: 0, amount: 0 }, // 60+ days overdue
  };

  invoices.forEach(inv => {
    if (inv.status === 'Paid') return;
    const amount = getAmountInSelected(parseFloat(inv.amount || 0), inv.currency);
    const analysis = getCreditDaysAnalysis(inv.due_date);
    
    if (analysis.type === 'current' || analysis.type === 'today') {
      agingGroups.current.count++;
      agingGroups.current.amount += amount;
    } else {
      const daysOverdue = Math.abs(analysis.days);
      if (daysOverdue <= 30) {
        agingGroups.overdue30.count++;
        agingGroups.overdue30.amount += amount;
      } else if (daysOverdue <= 60) {
        agingGroups.overdue60.count++;
        agingGroups.overdue60.amount += amount;
      } else {
        agingGroups.overdue90.count++;
        agingGroups.overdue90.amount += amount;
      }
    }
  });

  // ── 3. Operational Metrics ────────────────────────────────────────
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'Active').length;
  const trialTenants = tenants.filter(t => t.status === 'Trial').length;
  const suspendedTenants = tenants.filter(t => t.status === 'Suspended' || t.status === 'Expired').length;

  const tierDistribution = packages.map(pkg => {
    const count = tenants.filter(t => t.package_id == pkg.id).length;
    return { name: pkg.name, count, price: pkg.monthly_price };
  }).filter(t => t.count > 0);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#a1a1aa]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Processing global directory…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full print:p-0">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white flex items-center gap-2">
            <BarChart size={18} className="text-[#6366f1]" /> Global Platform Reports & Collections
          </h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">System-wide outstanding balances and credit days aging analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Currency Switcher */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#e4e4e7] bg-white px-2.5 py-1.5 dark:border-[#27272a] dark:bg-[#18181b]">
            <span className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Reporting CCY:</span>
            <select 
              value={selectedCurrency} 
              onChange={e => setSelectedCurrency(e.target.value)}
              className="bg-transparent text-[12px] font-semibold text-[#09090b] dark:text-white outline-none cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="LKR">LKR (Rs)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <button onClick={fetchData} className="rounded-lg border border-[#e4e4e7] bg-white p-2 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors">
            <RefreshCcw size={15} />
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#4f46e5] transition-colors shadow-sm">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e4e4e7] dark:border-[#27272a] print:hidden">
        <button 
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all ${
            activeTab === 'financial' 
              ? 'border-[#6366f1] text-[#6366f1] dark:border-[#818cf8] dark:text-[#818cf8]' 
              : 'border-transparent text-[#71717a] hover:text-[#09090b] dark:text-[#a1a1aa] dark:hover:text-white'
          }`}
        >
          Financial Overview
        </button>
        <button 
          onClick={() => setActiveTab('unpaid')}
          className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all ${
            activeTab === 'unpaid' 
              ? 'border-[#6366f1] text-[#6366f1] dark:border-[#818cf8] dark:text-[#818cf8]' 
              : 'border-transparent text-[#71717a] hover:text-[#09090b] dark:text-[#a1a1aa] dark:hover:text-white'
          }`}
        >
          Unpaid Month & Credit Days
        </button>
        <button 
          onClick={() => setActiveTab('operational')}
          className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all ${
            activeTab === 'operational' 
              ? 'border-[#6366f1] text-[#6366f1] dark:border-[#818cf8] dark:text-[#818cf8]' 
              : 'border-transparent text-[#71717a] hover:text-[#09090b] dark:text-[#a1a1aa] dark:hover:text-white'
          }`}
        >
          Operational & Tiers
        </button>
      </div>

      {/* ── 1. Financial Overview Tab ── */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#18181b]">
              <span className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">Projected MRR</span>
              <p className="mt-2 text-2xl font-bold text-[#09090b] dark:text-white">
                {selectedCurrency} {projectedMRR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-green-600 font-medium">Active tenant subscription projection</span>
            </div>

            <div className="rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#18181b]">
              <span className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">Total Received</span>
              <p className="mt-2 text-2xl font-bold text-[#09090b] dark:text-white">
                {selectedCurrency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">Accumulated solved payments</span>
            </div>

            <div className="rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#18181b]">
              <span className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">Outstanding Receivables</span>
              <p className="mt-2 text-2xl font-bold text-[#09090b] dark:text-white">
                {selectedCurrency} {outstandingRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">Pending & Overdue invoices</span>
            </div>
          </div>

          <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#09090b] dark:text-white">Monthly Collections Timeline</h3>
              <p className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">Rolling payment aggregates</p>
            </div>
            {revenueByMonth.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#a1a1aa]">No payments logged yet.</div>
            ) : (
              <div className="space-y-3">
                {revenueByMonth.map((d, i) => {
                  const percent = (d.amount / maxMonthRev) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-12 text-[12px] font-medium text-[#71717a] dark:text-[#a1a1aa]">{d.month}</span>
                      <div className="flex-1 bg-[#f4f4f5] dark:bg-[#27272a] h-6 rounded-md overflow-hidden relative">
                        <div className="bg-[#6366f1]/80 h-full rounded-md" style={{ width: `${percent}%` }} />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white drop-shadow-sm font-mono">
                          {selectedCurrency} {d.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. Unpaid & Credit Days Tab ── */}
      {activeTab === 'unpaid' && (
        <div className="space-y-6">
          
          {/* Aging buckets / Credit Days cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#18181b]">
              <span className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">Current (Within Term)</span>
              <p className="mt-1.5 text-xl font-bold text-[#09090b] dark:text-white">
                {selectedCurrency} {agingGroups.current.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-green-600">{agingGroups.current.count} invoices pending due</span>
            </div>
            
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#18181b]">
              <span className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">1–30 Days Overdue</span>
              <p className="mt-1.5 text-xl font-bold text-amber-600">
                {selectedCurrency} {agingGroups.overdue30.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-amber-500">{agingGroups.overdue30.count} invoices overdue</span>
            </div>

            <div className="rounded-xl border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#18181b]">
              <span className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">31–60 Days Overdue</span>
              <p className="mt-1.5 text-xl font-bold text-orange-600">
                {selectedCurrency} {agingGroups.overdue60.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-orange-500">{agingGroups.overdue60.count} invoices overdue</span>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10 p-4">
              <span className="text-[11px] font-medium text-red-600 dark:text-red-400 uppercase tracking-wider block">60+ Days Overdue</span>
              <p className="mt-1.5 text-xl font-bold text-red-600">
                {selectedCurrency} {agingGroups.overdue90.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-red-500">{agingGroups.overdue90.count} invoices critical</span>
            </div>
          </div>

          {/* Month Unpaid Directory */}
          <div className="rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b]">
            <div className="p-5 border-b border-[#e4e4e7] dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#09090b] dark:text-white">Unpaid Client Balances</h3>
                <p className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">Filter unpaid invoices by billing month</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-[#a1a1aa]" />
                <select 
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="rounded-lg border border-[#e4e4e7] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#09090b] dark:border-[#27272a] dark:bg-[#1c1c1f] dark:text-white outline-none cursor-pointer"
                >
                  <option value="all">All Months</option>
                  {billingMonthsList.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b]">
                    {['Tenant', 'Invoice Info', 'Billing Month', 'Amount Due', 'Credit / Overdue Status', 'Due Date', 'Action'].map((h, i) => (
                      <th key={i} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#27272a] text-[13px]">
                  {unpaidInvoices.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-[#a1a1aa]">No unpaid invoices found for the selected month/criteria.</td></tr>
                  ) : unpaidInvoices.map((inv) => {
                    const daysAnalysis = getCreditDaysAnalysis(inv.due_date);
                    const status = remindingStatus[inv.id] || 'idle';
                    return (
                      <tr key={inv.id} className="hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Building size={13} className="text-[#a1a1aa]" />
                            <span className="font-medium text-[#09090b] dark:text-white">{inv.tenant_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <code className="font-mono text-xs text-[#6366f1] dark:text-[#818cf8]">{inv.invoice_number}</code>
                        </td>
                        <td className="px-5 py-3.5 text-[#71717a] dark:text-[#a1a1aa]">{inv.billing_month}</td>
                        <td className="px-5 py-3.5 font-semibold text-[#09090b] dark:text-white">
                          {inv.currency || 'USD'} {inv.amount}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            daysAnalysis.type === 'overdue' 
                              ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                              : 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                          }`}>
                            <Clock size={10} />
                            {daysAnalysis.text}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[#71717a] dark:text-[#a1a1aa]">
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleSendReminder(inv.id)}
                            disabled={status === 'loading'}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                              status === 'loading'
                                ? 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                                : status === 'success'
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30'
                                : status === 'error'
                                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30'
                                : 'bg-[#6366f1] border-transparent text-white hover:bg-[#4f46e5] shadow-sm'
                            }`}
                          >
                            {status === 'loading' ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : status === 'success' ? (
                              <CheckCircle size={12} />
                            ) : status === 'error' ? (
                              <AlertCircle size={12} />
                            ) : (
                              <Send size={12} />
                            )}
                            {status === 'loading'
                              ? 'Sending...'
                              : status === 'success'
                              ? 'Sent!'
                              : status === 'error'
                              ? 'Failed'
                              : 'Remind'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Operational & Tiers Tab ── */}
      {activeTab === 'operational' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#18181b] text-center">
              <span className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block font-medium">Total Directory</span>
              <p className="mt-1 text-2xl font-bold text-[#09090b] dark:text-white">{totalTenants}</p>
            </div>
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#18181b] text-center">
              <span className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block font-medium">Active Subscriptions</span>
              <p className="mt-1 text-2xl font-bold text-green-600">{activeTenants}</p>
            </div>
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#18181b] text-center">
              <span className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block font-medium">Trial Accounts</span>
              <p className="mt-1 text-2xl font-bold text-[#6366f1]">{trialTenants}</p>
            </div>
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#18181b] text-center">
              <span className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block font-medium">Suspended Tiers</span>
              <p className="mt-1 text-2xl font-bold text-red-500">{suspendedTenants}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b] space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#09090b] dark:text-white">Tier Popularity Distribution</h3>
                <p className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">Registration density mapped against product tiers</p>
              </div>

              {tierDistribution.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#a1a1aa]">No active package allocations found.</div>
              ) : (
                <div className="space-y-4">
                  {tierDistribution.map((t, idx) => {
                    const pct = (t.count / totalTenants) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-semibold text-[#09090b] dark:text-white">{t.name} Suite</span>
                          <span className="text-[#a1a1aa]">{t.count} accounts ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#f4f4f5] dark:bg-[#27272a] overflow-hidden">
                          <div className="bg-[#6366f1] h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b] space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#09090b] dark:text-white">Operational Health Summary</h3>
                <p className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">SaaS state representation</p>
              </div>

              <div className="space-y-3.5">
                {[
                  { name: 'Active Subscriptions', count: activeTenants, color: 'bg-green-500' },
                  { name: 'Onboarding Trial Cycles', count: trialTenants, color: 'bg-[#6366f1]' },
                  { name: 'Inactive / Suspended Accounts', count: suspendedTenants, color: 'bg-red-500' },
                ].map((s, i) => {
                  const pct = totalTenants > 0 ? (s.count / totalTenants) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center justify-between border border-[#e4e4e7] dark:border-[#27272a] rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                        <span className="text-[12px] font-medium text-[#09090b] dark:text-white">{s.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#09090b] dark:text-white">{s.count} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice / Audit footer */}
      <div className="rounded-xl border border-[#e4e4e7] bg-[#fafafa] dark:border-[#27272a] dark:bg-[#18181b] p-4 text-center text-xs text-[#a1a1aa]">
        Nexus Portal Audit System · Reports compiled dynamically at {new Date().toLocaleTimeString()}
      </div>

    </div>
  );
}
