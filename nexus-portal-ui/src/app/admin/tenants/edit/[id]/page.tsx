"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Save, 
  Loader2,
  Layers,
  Key,
  RefreshCcw,
  ShieldCheck,
  Globe,
  Plus,
  Trash2
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function TenantEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    package_id: '',
    status: '',
    license_key: '',
    api_key: '',
    trial_expiry: '',
    currency: 'USD',
    billing_cc_email: '',
    admin_email: '',
    contact_number: ''
  });

  const API_BASE = 'http://localhost/rapair-management/nexus-portal-server/public/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesRes, tenantRes] = await Promise.all([
          fetch(`${API_BASE}/admin/packages`, { credentials: 'include' }),
          fetch(`${API_BASE}/admin/tenants/${id}`, { credentials: 'include' })
        ]);
        
        const packagesData = await packagesRes.json();
        const tenantData = await tenantRes.json();
        
        setPackages(packagesData.data || []);
        setPackages(packagesData.data || []);
        if (tenantData.status === 'success') {
          const tenant = tenantData.data;
          let ccEmails: string[] = [];
          try {
            const decoded = JSON.parse(tenant.billing_cc_email);
            if (Array.isArray(decoded)) ccEmails = decoded;
            else if (tenant.billing_cc_email) ccEmails = [tenant.billing_cc_email];
          } catch (e) {
            if (tenant.billing_cc_email) ccEmails = tenant.billing_cc_email.split(',').map((e: string) => e.trim());
          }
          setFormData({
            ...tenant,
            billing_cc_email: ccEmails
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        billing_cc_email: JSON.stringify(formData.billing_cc_email)
      };
      const res = await fetch(`${API_BASE}/admin/tenants/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
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

  const regenerateKey = (type: 'license' | 'api') => {
    if (type === 'license') {
      const random = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const newLicense = `RM-${formData.slug.toUpperCase()}-${random.substring(0, 5)}-${random.substring(5, 10)}-${random.substring(10, 15)}-${random.substring(15, 20)}`;
      setFormData({ ...formData, license_key: newLicense });
    } else {
      const apiRandom = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
      setFormData({ ...formData, api_key: `NX-${apiRandom}` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full py-8 lg:py-12 px-8 lg:px-12">
      <button 
        onClick={() => router.push('/admin/tenants')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 transition-colors mb-8 font-black text-[10px] uppercase tracking-widest"
      >
        <ChevronLeft size={16} /> Back to Directory
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <Layers size={20} />
             </div>
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Instance Configuration</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Edit {formData.name}</h1>
          <p className="text-slate-500 font-medium mt-2">Manage global parameters, security keys, and subscription status.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 space-y-8">
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enterprise Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Slug</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-mono" 
                    />
                  </div>
                </div>
             </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrative Email</label>
                   <input 
                     required
                     type="email"
                     value={formData.admin_email}
                     onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Number</label>
                   <input 
                     value={formData.contact_number || ''}
                     onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                   />
                 </div>
              </div>

             <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan Tier</label>
                  <select 
                    value={formData.package_id}
                    onChange={(e) => setFormData({...formData, package_id: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instance Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Expired">Expired</option>
                  </select>
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
                 <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Billing CC Recipients</label>
                   <div className="space-y-3">
                     {(Array.isArray(formData.billing_cc_email) ? formData.billing_cc_email : []).map((email: string, idx: number) => (
                       <div key={idx} className="flex gap-2">
                         <input 
                           type="email"
                           placeholder="accounts@enterprise.com"
                           value={email}
                           onChange={(e) => {
                             const newCcs = [...(formData.billing_cc_email as unknown as string[])];
                             newCcs[idx] = e.target.value;
                             setFormData({...formData, billing_cc_email: newCcs});
                           }}
                           className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                         />
                         <button 
                           type="button"
                           onClick={() => {
                             const newCcs = (formData.billing_cc_email as unknown as string[]).filter((_, i) => i !== idx);
                             setFormData({...formData, billing_cc_email: newCcs});
                           }}
                           className="p-3 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                     ))}
                     <button 
                       type="button"
                       onClick={() => {
                         const current = Array.isArray(formData.billing_cc_email) ? formData.billing_cc_email : [];
                         setFormData({...formData, billing_cc_email: [...current, '']});
                       }}
                       className="w-full py-3 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-500/50 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                     >
                       <Plus size={14} /> Add Recipient
                     </button>
                   </div>
                 </div>
              </div>
          </div>

          <div className="glass p-8 space-y-6">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security & API Access</h3>
                  <p className="text-xs text-slate-500">Manage sensitive access keys for this instance.</p>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Application License Key</label>
                  <div className="flex gap-3">
                    <input 
                      readOnly
                      value={formData.license_key}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none font-mono opacity-80" 
                    />
                    <button 
                      type="button"
                      onClick={() => regenerateKey('license')}
                      className="px-4 bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-500 rounded-xl border border-slate-200 dark:border-white/5 transition-all"
                    >
                      <RefreshCcw size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secure API Access Key</label>
                  <div className="flex gap-3">
                    <input 
                      readOnly
                      value={formData.api_key}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-indigo-600 dark:text-indigo-400 outline-none font-mono opacity-80" 
                    />
                    <button 
                      type="button"
                      onClick={() => regenerateKey('api')}
                      className="px-4 bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-500 rounded-xl border border-slate-200 dark:border-white/5 transition-all"
                    >
                      <RefreshCcw size={18} />
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-8 sticky top-24">
             <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Publish Changes</h3>
             <div className="space-y-4">
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full btn-premium py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <Save size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Sync Profile</span>
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => router.push('/admin/tenants')}
                  className="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Discard Changes
                </button>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}
