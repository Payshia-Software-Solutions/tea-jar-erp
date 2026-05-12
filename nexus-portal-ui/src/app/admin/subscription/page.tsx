"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Zap, 
  Activity, 
  CreditCard,
  RefreshCcw,
  FileText,
  Download
} from 'lucide-react';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  

  const handleDownload = (id: number, type: string = '') => {
    const link = document.createElement('a');
    link.href = `${API_BASE}/admin/billing/download?id=${id}${type ? `&type=${type}` : ''}`;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, billRes] = await Promise.all([
        fetch(`${API_BASE}/client/subscription`, { credentials: 'include' }),
        fetch(`${API_BASE}/client/billing/history`, { credentials: 'include' })
      ]);
      
      if (subRes.ok) {
        const subData = await subRes.ok ? await subRes.json() : null;
        setSubscription(subData?.data);
      }
      
      if (billRes.ok) {
        const billData = await billRes.json();
        setBillingHistory(billData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 animate-pulse font-bold">
        Synchronizing billing profile...
      </div>
    );
  }

  if (!subscription) {
     return (
        <div className="p-12 text-center">
           <div className="text-rose-400 font-bold">Subscription profile not found.</div>
        </div>
     );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Subscription & Billing</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Manage enterprise license & payments</p>
        </div>
        <button onClick={fetchData} className="p-1.5 glass glass-hover text-slate-400 rounded-lg transition-all">
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
         <div className="grid lg:grid-cols-3 gap-4">
            {/* Package Card */}
            <div className="glass p-5 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                     <Trophy size={18} />
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                     {subscription.status}
                  </div>
               </div>
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Active Plan</div>
               <h3 className="text-xl font-black mb-1 text-slate-900 dark:text-white">{subscription.package_name}</h3>
               <div className="text-lg font-black text-indigo-400 mb-4">
                  ${subscription.monthly_price} <span className="text-[10px] text-slate-500 font-medium">/ mo</span>
               </div>
               <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">License Identity</div>
                  <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-2 font-mono text-[10px] break-all border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300">
                     {subscription.license_key}
                  </div>
               </div>
            </div>

            {/* Modules Card */}
            <div className="lg:col-span-2 glass p-5">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white">
                     <Zap className="text-indigo-400" size={16} /> Active Capabilities
                  </h3>
               </div>
               <div className="grid sm:grid-cols-3 gap-3">
                  {subscription.package_modules?.map((mod: string, i: number) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                           <Activity size={14} />
                        </div>
                        <div>
                           <div className="text-[11px] font-bold text-slate-900 dark:text-white">{mod}</div>
                           <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Online</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Billing Details */}
         <div className="glass p-5">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
               <CreditCard className="text-indigo-400" size={16} /> Enterprise Profile
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
               <div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Company</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{subscription.name}</div>
               </div>
               <div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Identity</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">@{subscription.slug}</div>
               </div>
               <div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Admin Contact</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{subscription.admin_email}</div>
               </div>
               <div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Next Cycle</div>
                  <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400">
                     {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
               </div>
            </div>
         </div>

         {/* Billing History */}
         <div className="glass overflow-x-auto">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/[0.02]">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-indigo-400" size={14} /> Enterprise Ledger
               </h3>
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{billingHistory.length} Record(s)</div>
            </div>
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01]">
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Invoice</th>
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Period</th>
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Amount</th>
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Due Date</th>
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {billingHistory.map((inv) => (
                     <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                        <td className="px-6 py-3.5">
                           <div className="font-mono text-[11px] text-indigo-500 dark:text-indigo-400 font-black">{inv.invoice_number}</div>
                        </td>
                        <td className="px-6 py-3.5 text-xs font-bold text-slate-900 dark:text-white">{inv.billing_month}</td>
                        <td className="px-6 py-3.5 text-center font-black text-slate-900 dark:text-white text-xs">${inv.amount}</td>
                        <td className="px-6 py-3.5 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">{new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-6 py-3.5">
                           <div className="flex items-center justify-end gap-1">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                inv.status === 'Paid' 
                                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                                : inv.status === 'Overdue'
                                ? 'text-rose-500 bg-rose-500/10 border-rose-400/20'
                                : 'text-amber-500 bg-amber-500/10 border-amber-400/20'
                             }`}>
                                {inv.status}
                             </span>
                              <button 
                                onClick={() => handleDownload(inv.id, 'invoice')}
                                className="p-1.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                                title="Download"
                              >
                                <FileText size={14} />
                              </button>
                              {inv.status === 'Paid' && (
                                <button 
                                  onClick={() => handleDownload(inv.id, 'receipt')}
                                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-white/5 text-emerald-500 hover:text-emerald-400 rounded-lg transition-all"
                                  title="Receipt"
                                >
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
