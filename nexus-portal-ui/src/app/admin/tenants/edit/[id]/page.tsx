"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Save, RefreshCcw, ShieldCheck, Layers, Plus, Trash2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const inputCls = `
  w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2.5 px-3.5
  text-[13px] text-[#09090b] placeholder:text-[#a1a1aa]
  focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
  dark:border-[#27272a] dark:bg-[#27272a] dark:text-white
  dark:focus:border-[#818cf8] dark:focus:ring-[#818cf8]/20
  transition-all
`;

export default function TenantEditPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params.id;

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    slug: string;
    package_id: string;
    status: string;
    license_key: string;
    api_key: string;
    trial_expiry: string;
    currency: string;
    billing_cc_email: string[];
    admin_email: string;
    contact_number: string;
  }>({
    id: '',
    name: '',
    slug: '',
    package_id: '',
    status: '',
    license_key: '',
    api_key: '',
    trial_expiry: '',
    currency: 'USD',
    billing_cc_email: [],
    admin_email: '',
    contact_number: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [packagesRes, tenantRes] = await Promise.all([
          fetch(`${API_BASE}/admin/packages`, { credentials: 'include', headers }),
          fetch(`${API_BASE}/admin/tenants/${id}`, { credentials: 'include', headers })
        ]);
        
        const packagesData = await packagesRes.json();
        const tenantData   = await tenantRes.json();
        
        setPackages(packagesData.data || []);
        if (tenantData.status === 'success') {
          const tenant = tenantData.data;
          let ccEmails: string[] = [];
          try {
            const decoded = JSON.parse(tenant.billing_cc_email);
            if (Array.isArray(decoded)) ccEmails = decoded;
            else if (tenant.billing_cc_email) ccEmails = [tenant.billing_cc_email];
          } catch {
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const payload = {
        ...formData,
        billing_cc_email: JSON.stringify(formData.billing_cc_email)
      };
      const res = await fetch(`${API_BASE}/admin/tenants/update`, {
        method: 'POST',
        headers,
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
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#a1a1aa]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Loading instance profile…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <button 
        onClick={() => router.push('/admin/tenants')}
        className="flex items-center gap-1 text-[13px] font-medium text-[#71717a] hover:text-[#09090b] dark:text-[#a1a1aa] dark:hover:text-white transition-colors"
      >
        <ChevronLeft size={16} /> Back to Directory
      </button>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info */}
          <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 sm:p-8 dark:border-[#27272a] dark:bg-[#18181b]">
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Edit {formData.name}</h1>
              <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Manage global parameters and subscription details.</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Enterprise Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={inputCls} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">System Slug</label>
                  <input 
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    className={`${inputCls} font-mono`} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Administrative Email</label>
                  <input 
                    required
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                    className={inputCls} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Contact Number</label>
                  <input 
                    value={formData.contact_number || ''}
                    onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                    className={inputCls} 
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t border-[#f4f4f5] dark:border-[#27272a]">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Plan Tier</label>
                  <select 
                    value={formData.package_id}
                    onChange={(e) => setFormData({...formData, package_id: e.target.value})}
                    className={`${inputCls} appearance-none cursor-pointer`}
                  >
                    {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Instance Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className={`${inputCls} appearance-none cursor-pointer`}
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Expired">Expired</option>
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
              </div>

              {/* CC emails */}
              <div className="pt-4 border-t border-[#f4f4f5] dark:border-[#27272a] space-y-3">
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Billing CC Recipients</label>
                <div className="space-y-2">
                  {formData.billing_cc_email.map((email: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="email"
                        placeholder="accounts@enterprise.com"
                        value={email}
                        onChange={(e) => {
                          const newCcs = [...formData.billing_cc_email];
                          newCcs[idx] = e.target.value;
                          setFormData({...formData, billing_cc_email: newCcs});
                        }}
                        className={inputCls} 
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newCcs = formData.billing_cc_email.filter((_, i) => i !== idx);
                          setFormData({...formData, billing_cc_email: newCcs});
                        }}
                        className="rounded-lg p-2.5 text-[#a1a1aa] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, billing_cc_email: [...formData.billing_cc_email, '']})}
                    className="w-full py-2 border border-dashed border-[#e4e4e7] dark:border-[#27272a] rounded-lg text-xs font-semibold text-[#71717a] hover:text-[#6366f1] dark:text-[#a1a1aa] dark:hover:text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={13} /> Add Recipient
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Keys/Security */}
          <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 sm:p-8 dark:border-[#27272a] dark:bg-[#18181b]">
            <div className="mb-4">
              <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-white">Security & API Access</h3>
              <p className="text-[12px] text-[#71717a] dark:text-[#a1a1aa]">Manage license keys and database API credentials.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Application License Key</label>
                <div className="flex gap-2">
                  <input readOnly value={formData.license_key} className={`${inputCls} font-mono bg-[#f4f4f5] select-all`} />
                  <button type="button" onClick={() => regenerateKey('license')} className="rounded-lg border border-[#e4e4e7] bg-white p-2.5 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors">
                    <RefreshCcw size={15} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">API Access Key</label>
                <div className="flex gap-2">
                  <input readOnly value={formData.api_key} className={`${inputCls} font-mono bg-[#f4f4f5] select-all`} />
                  <button type="button" onClick={() => regenerateKey('api')} className="rounded-lg border border-[#e4e4e7] bg-white p-2.5 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors">
                    <RefreshCcw size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Publish card (right side) */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <div className="rounded-xl border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#18181b]">
            <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-white mb-4">Publish Changes</h3>
            <div className="space-y-2">
              <button 
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] py-2.5 text-[13px] font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-60 transition-colors shadow-sm"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
              <button 
                type="button"
                onClick={() => router.push('/admin/tenants')}
                className="w-full rounded-lg border border-[#e4e4e7] py-2.5 text-[13px] font-medium text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:hover:bg-[#27272a] dark:text-[#a1a1aa] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
