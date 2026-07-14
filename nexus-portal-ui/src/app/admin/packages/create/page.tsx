"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ChevronLeft, 
  Save, 
  Plus, 
  X, 
  Loader2,
  CheckCircle2,
  Trophy,
  Activity,
  Eye,
  EyeOff,
  ShoppingCart,
  Users,
  Globe,
  Wrench,
  Wallet,
  BarChart,
  Sparkles,
  Factory,
  Building2,
  Music
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function PackageCreatePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
        const authRes = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
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
    { id: 'serviceCenter', label: 'Service Center', icon: Wrench },
    { id: 'inventory', label: 'Inventory', icon: Zap },
    { id: 'vendors', label: 'Vendors', icon: ShoppingCart },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'sales', label: 'Sales', icon: Globe },
    { id: 'accounting', label: 'Accounting', icon: Wallet },
    { id: 'hrm', label: 'Human Resources', icon: Users },
    { id: 'masterData', label: 'Master Data', icon: BarChart },
    { id: 'promotions', label: 'Marketing & Promotions', icon: Sparkles },
    { id: 'production', label: 'Manufacturing & Production', icon: Factory },
    { id: 'frontOffice', label: 'Hotel Front Office', icon: Building2 },
    { id: 'banquet', label: 'Banquet Management', icon: Music },
    { id: 'ecommerce', label: 'E-commerce & Kiosk', icon: ShoppingCart },
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
      const res = await fetch(`${API_BASE}/admin/packages/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(packageData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Package created successfully');
        setTimeout(() => router.push('/admin/packages'), 1500);
      } else {
        setError(data.message || 'Failed to create package');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12">
      <button 
        onClick={() => router.push('/admin/packages')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 transition-colors mb-8 font-bold text-xs uppercase tracking-widest"
      >
        <ChevronLeft size={16} /> Back to Packages
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Plus className="text-indigo-500" size={24} />
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create New Tier</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Define a new membership level with custom module access and pricing.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Public Name</label>
              <input 
                placeholder="e.g. Professional Plus"
                value={packageData.name}
                onChange={(e) => setPackageData({...packageData, name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-900 dark:text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">System Identifier (Unique Key)</label>
              <input 
                placeholder="e.g. PRO_PLUS"
                value={packageData.package_key}
                onChange={(e) => setPackageData({...packageData, package_key: e.target.value.toUpperCase().replace(/\s+/g, '_')})}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm text-indigo-600 dark:text-indigo-400"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Monthly Price (USD)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={packageData.monthly_price}
                  onChange={(e) => setPackageData({...packageData, monthly_price: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-black text-indigo-600 dark:text-indigo-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">Visibility Settings</label>
              <button 
                type="button"
                onClick={() => setPackageData({...packageData, is_public: packageData.is_public == 1 ? 0 : 1})}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  packageData.is_public == 1 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
                  : 'bg-slate-500/5 border-slate-500/20 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${packageData.is_public == 1 ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                    {packageData.is_public == 1 ? <Eye size={16} /> : <EyeOff size={16} />}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">{packageData.is_public == 1 ? 'Publicly Visible' : 'Hidden from Public'}</div>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${packageData.is_public == 1 ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${packageData.is_public == 1 ? 'left-7' : 'left-1'}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-white/10">
            <div className="space-y-6">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">System Capabilities & Modules</label>
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {AVAILABLE_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = packageData.modules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        isActive 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' 
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 opacity-60'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-bold">{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">Support Services</label>
              <div className="space-y-4">
                 <div className="flex gap-2">
                    <input 
                      placeholder="e.g. 24/7 Priority Support"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                      className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                    <button 
                      type="button"
                      onClick={addService}
                      className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {packageData.services.map((service) => (
                      <div key={service} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">
                         {service}
                         <button type="button" onClick={() => removeService(service)} className="hover:text-rose-500 transition-colors">
                            <X size={14} />
                         </button>
                      </div>
                    ))}
                    {packageData.services.length === 0 && (
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl w-full text-center">
                        No services added yet
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center gap-6">
            <button 
              disabled={saving}
              type="submit"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 flex items-center justify-center gap-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Plus size={20} />
                  <span>Create Package Tier</span>
                </>
              )}
            </button>

            {error && (
              <div className="text-rose-500 text-sm font-bold flex items-center gap-2">
                <XCircle size={18} /> {error}
              </div>
            )}
            {success && (
              <div className="text-emerald-500 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={18} /> {success}
              </div>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function XCircle({ size, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
