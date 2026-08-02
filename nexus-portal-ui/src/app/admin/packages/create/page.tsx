"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, X, Loader2, CheckCircle2, Eye, EyeOff, Activity,
  ShoppingCart, Users, Globe, Sparkles, Store, Smartphone, Wallet, Factory, Building2, Music, BarChart, LayoutDashboard, Truck, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const inputCls = `
  w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2.5 px-3.5
  text-[13px] text-[#09090b] placeholder:text-[#a1a1aa]
  focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
  dark:border-[#27272a] dark:bg-[#27272a] dark:text-white
  dark:focus:border-[#818cf8] dark:focus:ring-[#818cf8]/20
  transition-all
`;

export default function PackageCreatePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  
  const [packageData, setPackageData] = useState({
    name: '',
    package_key: '',
    monthly_price: '',
    modules: [] as string[],
    services: [] as string[],
    server_info: 'Cloud Standard',
    is_public: 1
  });
  const [newService, setNewService] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
        const authRes = await fetch(`${API_BASE}/auth/check`, { credentials: 'include', headers });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.role !== 'super_admin') {
            router.push('/admin/dashboard');
            return;
          }
        } else {
          router.push('/admin/login');
          return;
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const AVAILABLE_MODULES = [
    { id: 'coreFeatures', label: 'Core Features',     icon: LayoutDashboard },
    { id: 'fleet',        label: 'Fleet Management',  icon: Truck },
    { id: 'vendors',      label: 'Vendors',           icon: ShoppingCart },
    { id: 'inventory',    label: 'Inventory',         icon: Zap },
    { id: 'crm',          label: 'CRM',               icon: Users },
    { id: 'sales',        label: 'Sales',             icon: Globe },
    { id: 'marketing',    label: 'Marketing',         icon: Sparkles },
    { id: 'ecommerce',    label: 'E-commerce',        icon: Store },
    { id: 'kiosk',        label: 'Kiosk',             icon: Smartphone },
    { id: 'accounting',   label: 'Accounting',        icon: Wallet },
    { id: 'production',   label: 'Production',        icon: Factory },
    { id: 'hrm',          label: 'Human Resources',   icon: Users },
    { id: 'frontOffice',  label: 'Front Office',      icon: Building2 },
    { id: 'banquet',      label: 'Banquet',           icon: Music },
    { id: 'masterData',   label: 'Master Data',       icon: BarChart },
  ];

  const toggleModule = (modId: string) => {
    if (packageData.modules.includes(modId)) {
      setPackageData({ ...packageData, modules: packageData.modules.filter(m => m !== modId) });
    } else {
      setPackageData({ ...packageData, modules: [...packageData.modules, modId] });
    }
  };

  const addService = () => {
    if (newService.trim() && !packageData.services.includes(newService.trim())) {
      setPackageData({ ...packageData, services: [...packageData.services, newService.trim()] });
      setNewService('');
    }
  };

  const removeService = (service: string) => {
    setPackageData({ ...packageData, services: packageData.services.filter(s => s !== service) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageData.package_key) {
      setError('System identifier (Package Key) is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/admin/packages/create`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(packageData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Package created successfully');
        setTimeout(() => router.push('/admin/packages'), 1000);
      } else {
        setError(data.message || 'Failed to create package');
      }
    } catch {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#a1a1aa]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Checking authorization…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <button 
        onClick={() => router.push('/admin/packages')}
        className="flex items-center gap-1 text-[13px] font-medium text-[#71717a] hover:text-[#09090b] dark:text-[#a1a1aa] dark:hover:text-white transition-colors"
      >
        <ChevronLeft size={16} /> Back to Packages
      </button>

      <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 sm:p-8 dark:border-[#27272a] dark:bg-[#18181b]">
        
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Create New Package Tier</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Define a new membership level with custom module access and pricing.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Public Name</label>
              <input 
                placeholder="e.g. Professional Plus"
                value={packageData.name}
                onChange={(e) => setPackageData({...packageData, name: e.target.value})}
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">System Identifier (Key)</label>
              <input 
                placeholder="e.g. PRO_PLUS"
                value={packageData.package_key}
                onChange={(e) => setPackageData({...packageData, package_key: e.target.value.toUpperCase().replace(/\s+/g, '_')})}
                className={`${inputCls} font-mono`}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Monthly Price (USD)</label>
              <input 
                type="number"
                placeholder="0.00"
                value={packageData.monthly_price}
                onChange={(e) => setPackageData({...packageData, monthly_price: e.target.value})}
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Infrastructure / Server Info</label>
              <input 
                placeholder="e.g. Cloud Std"
                value={packageData.server_info}
                onChange={(e) => setPackageData({...packageData, server_info: e.target.value})}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Visibility Setting</label>
            <button 
              type="button"
              onClick={() => setPackageData({...packageData, is_public: packageData.is_public == 1 ? 0 : 1})}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors ${
                packageData.is_public == 1 
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400' 
                  : 'border-[#e4e4e7] bg-[#f4f4f5] text-[#71717a] dark:border-[#27272a] dark:bg-[#27272a] dark:text-white'
              }`}
            >
              {packageData.is_public == 1 ? <Eye size={15} /> : <EyeOff size={15} />}
              {packageData.is_public == 1 ? 'Publicly Visible' : 'Hidden from Public'}
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 pt-6 border-t border-[#f4f4f5] dark:border-[#27272a]">
            {/* Modules selection */}
            <div className="space-y-3">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">System Capabilities & Modules</label>
              <div className="grid gap-1.5 max-h-60 overflow-y-auto pr-1">
                {AVAILABLE_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = packageData.modules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-[13px] font-medium transition-colors ${
                        isActive 
                          ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1] dark:border-[#6366f1]/30 dark:bg-[#6366f1]/10 dark:text-[#818cf8]' 
                          : 'border-[#e4e4e7] bg-white text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:text-[#a1a1aa]'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-[#6366f1] dark:text-[#818cf8]' : 'text-[#a1a1aa]'} />
                      <span>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Support services */}
            <div className="space-y-3">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Support Services</label>
              <div className="flex gap-2">
                <input 
                  placeholder="e.g. 24/7 Priority Support"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                  className="w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2 px-3 text-[13px] text-[#09090b] dark:border-[#27272a] dark:bg-[#27272a] dark:text-white focus:border-[#6366f1] focus:outline-none outline-none transition-all"
                />
                <button 
                  type="button"
                  onClick={addService}
                  className="rounded-lg bg-[#6366f1] p-2 text-white hover:bg-[#4f46e5] transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {packageData.services.map((service) => (
                  <span key={service} className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400">
                    {service}
                    <button type="button" onClick={() => removeService(service)} className="hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {packageData.services.length === 0 && (
                  <span className="text-[12px] text-[#a1a1aa]">No services added yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback & Actions */}
          <div className="pt-6 border-t border-[#f4f4f5] dark:border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              {error && <p className="text-[13px] font-medium text-red-500">{error}</p>}
              {success && <p className="text-[13px] font-medium text-green-600">{success}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => router.push('/admin/packages')}
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
                Create Tier
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
