"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Activity, CreditCard, RefreshCcw, FileText, Download, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#18181b]">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#a1a1aa] dark:text-[#52525b]">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-[#09090b] dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-[#71717a] dark:text-[#a1a1aa]">{sub}</p>}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    Paid:    { cls: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-400', icon: <CheckCircle2 size={10} /> },
    Overdue: { cls: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-400',           icon: <AlertCircle size={10} />  },
    Pending: { cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-400',icon: <Clock size={10} />        },
  };
  const cfg = map[status] ?? map['Pending'];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.cls}`}>
      {cfg.icon}{status}
    </span>
  );
}

export default function SubscriptionPage() {
  const [subscription,   setSubscription]   = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);

  const handleDownload = (id: number, type = '') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : '';
    const a = document.createElement('a');
    a.href = `${API_BASE}/admin/billing/download?id=${id}${type ? `&type=${type}` : ''}${token ? `&token=${token}` : ''}`;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, billRes] = await Promise.all([
        fetch(`${API_BASE}/client/subscription`, { credentials: 'include' }),
        fetch(`${API_BASE}/client/billing/history`, { credentials: 'include' }),
      ]);
      if (subRes.ok)  setSubscription((await subRes.json()).data);
      if (billRes.ok) setBillingHistory((await billRes.json()).data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#a1a1aa]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" />
          Loading billing profile…
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[13px] text-red-500">Subscription profile not found.</p>
      </div>
    );
  }

  const nextCycle = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">

      {/* ── Page header ───────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Subscription & Billing</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Manage enterprise license & payments</p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-[#e4e4e7] bg-white p-2 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors"
        >
          <RefreshCcw size={15} />
        </button>
      </div>

      {/* ── Stat cards ────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Plan"  value={subscription.package_name} />
        <StatCard label="Monthly Cost" value={`$${subscription.monthly_price}`} sub="per month" />
        <StatCard label="Status"       value={subscription.status} />
        <StatCard label="Next Cycle"   value={nextCycle} />
      </div>

      {/* ── Plan + modules ────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Plan card */}
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#18181b]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]/10 dark:bg-[#6366f1]/15">
              <Trophy size={16} className="text-[#6366f1] dark:text-[#818cf8]" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {subscription.status}
            </span>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#a1a1aa] dark:text-[#52525b]">Current Plan</p>
          <h3 className="mt-1 text-xl font-bold text-[#09090b] dark:text-white">{subscription.package_name}</h3>
          <p className="mt-0.5 text-[#6366f1] dark:text-[#818cf8] font-bold">${subscription.monthly_price} <span className="text-xs font-normal text-[#a1a1aa]">/ mo</span></p>

          <div className="mt-4 border-t border-[#f4f4f5] dark:border-[#27272a] pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#a1a1aa] dark:text-[#52525b] mb-1.5">License Key</p>
            <code className="block break-all rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] p-2.5 font-mono text-[11px] text-[#71717a] dark:border-[#27272a] dark:bg-[#27272a] dark:text-[#a1a1aa]">
              {subscription.license_key}
            </code>
          </div>
        </div>

        {/* Modules card */}
        <div className="lg:col-span-2 rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#18181b]">
          <div className="mb-4 flex items-center gap-2">
            <Zap size={15} className="text-[#6366f1] dark:text-[#818cf8]" />
            <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-white">Active Capabilities</h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {subscription.package_modules?.map((mod: string, i: number) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-[#e4e4e7] bg-[#fafafa] p-3 dark:border-[#27272a] dark:bg-[#1c1c1f]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#6366f1]/10 dark:bg-[#6366f1]/15">
                  <Activity size={13} className="text-[#6366f1] dark:text-[#818cf8]" />
                </div>
                <div>
                  <div className="text-[12px] font-medium text-[#09090b] dark:text-white">{mod}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-[#a1a1aa]">Online</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Enterprise profile ────────── */}
      <div className="rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#18181b]">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={15} className="text-[#6366f1] dark:text-[#818cf8]" />
          <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-white">Enterprise Profile</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Company',       value: subscription.name         },
            { label: 'Identity',      value: `@${subscription.slug}`   },
            { label: 'Admin Contact', value: subscription.admin_email  },
            { label: 'Next Cycle',    value: nextCycle                 },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#a1a1aa] dark:text-[#52525b]">{item.label}</p>
              <p className="mt-1 text-[13px] font-medium text-[#09090b] dark:text-white truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Billing history ───────────── */}
      <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b]">
        <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-3.5 dark:border-[#27272a]">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#6366f1] dark:text-[#818cf8]" />
            <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-white">Billing History</h3>
          </div>
          <span className="text-[12px] text-[#a1a1aa] dark:text-[#52525b]">{billingHistory.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b]">
                {['Invoice', 'Period', 'Amount', 'Due Date', 'Status', ''].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa] ${i >= 2 && i <= 3 ? 'text-center' : ''} ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
              {billingHistory.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#a1a1aa]">No billing records yet</td></tr>
              ) : billingHistory.map(inv => (
                <tr key={inv.id} className="group hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] transition-colors">
                  <td className="px-5 py-3.5">
                    <code className="font-mono text-[12px] font-semibold text-[#6366f1] dark:text-[#818cf8]">{inv.invoice_number}</code>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-medium text-[#09090b] dark:text-white">{inv.billing_month}</td>
                  <td className="px-5 py-3.5 text-center text-[13px] font-semibold text-[#09090b] dark:text-white">${inv.amount}</td>
                  <td className="px-5 py-3.5 text-center text-[13px] text-[#71717a] dark:text-[#a1a1aa]">
                    {new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5"><InvoiceStatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDownload(inv.id, 'invoice')} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-[#f4f4f5] hover:text-[#6366f1] dark:hover:bg-[#27272a] transition-colors" title="Invoice">
                        <FileText size={14} />
                      </button>
                      {inv.status === 'Paid' && (
                        <button onClick={() => handleDownload(inv.id, 'receipt')} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 transition-colors" title="Receipt">
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
