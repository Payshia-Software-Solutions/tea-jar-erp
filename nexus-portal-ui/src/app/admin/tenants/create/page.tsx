"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Save, 
  Loader2,
  Plus,
  Globe,
  Mail,
  User,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TenantCreatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    package_id: '1',
    admin_email: '',
    business_type: '',
    address: '',
    currency: 'USD',
    billing_cc_email: ''
  });

  

  useEffect(() => {
    fetch(`${API_BASE}/admin/packages`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPackages(data.data || []));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/tenants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push('/admin/tenants');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full py-8 lg:py-12 px-8 lg:px-12">
      <button 
        onClick={() => router.push('/admin/tenants')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 transition-colors mb-8 font-black text-[10px] uppercase tracking-widest"
      >
        <ChevronLeft size={16} /> Back to Directory
      </button>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
           <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Plus size={20} />
           </div>
           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Enterprise Provisioning</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Register New Instance</h1>
        <p className="text-slate-500 font-medium mt-2">Initialize a new SaaS environment for an enterprise client.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="glass p-8 space-y-8">
           <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enterprise Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    placeholder="e.g. Acme Corp"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Slug</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    placeholder="acme-corp"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-mono" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">.nexus.io</span>
                </div>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrative Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    type="email"
                    placeholder="admin@enterprise.com"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subscription Tier</label>
                <div className="relative">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    value={formData.package_id}
                    onChange={(e) => setFormData({...formData, package_id: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Billing Currency</label>
                <select 
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Billing CC Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="email"
                    placeholder="accounts@enterprise.com"
                    value={formData.billing_cc_email}
                    onChange={(e) => setFormData({...formData, billing_cc_email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                  />
                </div>
              </div>
           </div>
        </div>

        <div className="flex items-center justify-end gap-4">
           <button 
             type="button"
             onClick={() => router.push('/admin/tenants')}
             className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
           >
             Cancel
           </button>
           <button 
             type="submit"
             disabled={saving}
             className="btn-premium px-12 py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
           >
             {saving ? <Loader2 className="animate-spin" size={20} /> : (
               <>
                 <span className="text-xs font-black uppercase tracking-widest">Provision Instance</span>
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
