"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Plus, Globe, Mail, User, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

const inputCls = `
  w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2.5 px-3.5
  text-[13px] text-[#09090b] placeholder:text-[#a1a1aa]
  focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
  dark:border-[#27272a] dark:bg-[#27272a] dark:text-white
  dark:focus:border-[#818cf8] dark:focus:ring-[#818cf8]/20
  transition-all
`;

export default function TenantCreatePage() {
  const router = useRouter();
  const [saving,   setSaving]   = useState(false);
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${API_BASE}/admin/packages`, { credentials: 'include', headers })
      .then(res => res.json())
      .then(data => setPackages(data.data || []));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/admin/tenants/register`, {
        method: 'POST',
        headers,
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
    <div className="p-6 space-y-6 max-w-4xl">
      <button 
        onClick={() => router.push('/admin/tenants')}
        className="flex items-center gap-1 text-[13px] font-medium text-[#71717a] hover:text-[#09090b] dark:text-[#a1a1aa] dark:hover:text-white transition-colors"
      >
        <ChevronLeft size={16} /> Back to Directory
      </button>

      <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 sm:p-8 dark:border-[#27272a] dark:bg-[#18181b]">
        
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Register New Enterprise Instance</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Initialize a new SaaS environment for an enterprise client.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Enterprise Name</label>
              <input 
                required
                placeholder="e.g. Acme Corp"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">System Slug</label>
              <div className="relative">
                <input 
                  required
                  placeholder="acme-corp"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                  className={`${inputCls} pr-16 font-mono`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#a1a1aa] pointer-events-none">.nexus.io</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Administrative Email</label>
              <input 
                required
                type="email"
                placeholder="admin@enterprise.com"
                value={formData.admin_email}
                onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Subscription Tier</label>
              <select 
                value={formData.package_id}
                onChange={(e) => setFormData({...formData, package_id: e.target.value})}
                className={`${inputCls} appearance-none cursor-pointer`}
              >
                {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Billing Currency</label>
              <select 
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className={`${inputCls} appearance-none cursor-pointer`}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="LKR">LKR - Sri Lankan Rupee</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Billing CC Email (Optional)</label>
              <input 
                type="email"
                placeholder="accounts@enterprise.com"
                value={formData.billing_cc_email}
                onChange={(e) => setFormData({...formData, billing_cc_email: e.target.value})}
                className={inputCls}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-[#f4f4f5] dark:border-[#27272a] flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => router.push('/admin/tenants')}
              className="rounded-lg border border-[#e4e4e7] bg-white px-4 py-2 text-[13px] font-medium text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] dark:text-[#a1a1aa]"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-60 transition-colors shadow-sm"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Provision Instance
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
