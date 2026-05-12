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
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/AdminSidebar';

export default function PackageEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState('Portal Manager');
  const [userRole, setUserRole] = useState('client');
  
  const [packageData, setPackageData] = useState({
    name: '',
    package_key: '',
    monthly_price: '',
    modules: [] as string[],
    services: [] as string[],
    server_info: '',
    is_public: 1
  });
  const [newService, setNewService] = useState('');

  

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const authRes = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
        if (authRes.ok) {
           const authData = await authRes.json();
           setCurrentUser(authData.user);
           setUserRole(authData.role);

           if (authData.role !== 'super_admin') {
             router.push('/admin/dashboard');
             return;
           }
        } else {
           router.push('/admin/login');
           return;
        }

        const res = await fetch(`${API_BASE}/admin/packages/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Package not found');
        const data = await res.json();
        if (data.status === 'success') {
          const pkg = data.data;
          setPackageData({
            ...pkg,
            modules: typeof pkg.modules === 'string' ? JSON.parse(pkg.modules) : pkg.modules,
            services: typeof pkg.services === 'string' ? JSON.parse(pkg.services || '[]') : (pkg.services || [])
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [id, router]);

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
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/admin/packages/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...packageData,
          id: id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Package configuration updated successfully');
        setTimeout(() => router.push('/admin/dashboard'), 1500);
      } else {
        setError(data.message || 'Failed to update package');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <button 
        onClick={() => router.push('/admin/dashboard')}
        className="flex items-center gap-2 text-muted hover:text-indigo-500 transition-colors mb-8 font-bold text-xs uppercase tracking-widest"
      >
        <ChevronLeft size={16} /> Back to Control Center
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
                <Trophy className="text-indigo-500" size={24} />
                <h1 className="text-3xl font-black tracking-tight">Edit Package Profile</h1>
              </div>
              <p className="text-muted font-medium">Fine-tune features and pricing for the <span className="text-indigo-500 font-bold">{packageData.name}</span> membership.</p>
            </div>
            <div className="text-right">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">System Identifier</div>
                <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg mt-1">{packageData.package_key}</div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Public Name</label>
                <input 
                  value={packageData.name}
                  onChange={(e) => setPackageData({...packageData, name: e.target.value})}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white"
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-muted block">Visibility Settings</label>
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
                      <div className="text-[10px] uppercase tracking-widest opacity-60">Status: {packageData.is_public == 1 ? 'Live' : 'Private'}</div>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${packageData.is_public == 1 ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${packageData.is_public == 1 ? 'left-7' : 'left-1'}`} />
                  </div>
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Monthly Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                  <input 
                    type="number"
                    value={packageData.monthly_price}
                    onChange={(e) => setPackageData({...packageData, monthly_price: e.target.value})}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-10 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-black text-indigo-600 dark:text-indigo-400"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Infrastructure / Server Info</label>
                <div className="relative">
                  <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    placeholder="e.g. Managed VPS - 4GB RAM"
                    value={packageData.server_info}
                    onChange={(e) => setPackageData({...packageData, server_info: e.target.value})}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-12 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <label className="text-xs font-bold uppercase tracking-widest text-muted block">System Capabilities & Modules</label>
                <div className="grid grid-cols-1 gap-3">
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
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 opacity-60'
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
                <label className="text-xs font-bold uppercase tracking-widest text-muted block">Support Services (ERP Bridge)</label>
                <div className="space-y-4">
                   <div className="flex gap-2">
                      <input 
                        placeholder="Add new service..."
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                        className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"
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
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-8 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl w-full text-center">
                          No services defined
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4">
              <button 
                disabled={saving}
                type="submit"
                className="w-full sm:w-auto btn-premium px-12 py-4 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} />
                    <span className="uppercase tracking-widest text-xs font-black">Sync Changes</span>
                  </>
                )}
              </button>

              {error && (
                <div className="text-rose-500 text-sm font-bold animate-in fade-in slide-in-from-left-2">{error}</div>
              )}
              {success && (
                <div className="text-emerald-500 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 size={18} /> {success}
                </div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    );
}
