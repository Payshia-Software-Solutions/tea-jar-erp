"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  ShieldCheck, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Calendar,
  Lock,
  ArrowLeft,
  FileText,
  Activity,
  CreditCard,
  Download,
  AlertCircle,
  RefreshCw,
  Users,
  MapPin
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saasData, setSaasData] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const allPossibleModules = React.useMemo(() => {
    const modulesMap = new Map<string, string>();
    
    const extract = (m: any) => {
        try {
            if (Array.isArray(m)) return m;
            if (typeof m === 'string') {
                if (m.startsWith('[')) return JSON.parse(m);
                return m.split(',').map((s: string) => s.trim());
            }
        } catch(e) {}
        return [];
    };

    extract(saasData?.modules).forEach(m => {
        if (m && m !== '*') modulesMap.set(m.toLowerCase(), m.toUpperCase());
    });

    availablePlans.forEach(p => {
        extract(p.modules).forEach(m => {
            if (m && m !== '*') modulesMap.set(m.toLowerCase(), m.toUpperCase());
        });
    });

    return Array.from(modulesMap.entries()).map(([id, label]) => ({
        id,
        label,
        desc: 'Module defined by Nexus Master API.'
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [saasData, availablePlans]);

  const loadSaas = async (force: boolean = false) => {
    try {
      const CACHE_KEY = 'saas_config_cache';
      const CACHE_TIME_KEY = 'saas_config_cache_time';
      const ONE_DAY = 24 * 60 * 60 * 1000;

      if (!force) {
        const cachedStr = window.localStorage.getItem(CACHE_KEY);
        const cachedTime = window.localStorage.getItem(CACHE_TIME_KEY);
        
        if (cachedStr && cachedTime) {
          const isExpired = Date.now() - parseInt(cachedTime, 10) > ONE_DAY;
          if (!isExpired) {
            try {
              const data = JSON.parse(cachedStr);
              setSaasData(data);
              return;
            } catch (e) {
              // ignore parse errors and fetch fresh
            }
          }
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saas/config`);
      const data = await res.json();
      if (data.status === 'success') {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
        window.localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        setSaasData(data.data);
      }
    } catch (err) {
      console.error("SaaS Check Failed", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saas/packages`);
      const data = await res.json();
      if (data.status === 'success') {
        setAvailablePlans(data.data);
      }
    } catch (err) {
      console.error("Packages Fetch Failed", err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saas/sync`);
      const data = await res.json();
      if (data.status === 'success') {
        const CACHE_KEY = 'saas_config_cache';
        const CACHE_TIME_KEY = 'saas_config_cache_time';
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
        window.localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        setSaasData(data.data);
      }
    } catch (err) {
      console.error("SaaS Sync Failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateLicense = async () => {
    if (!newLicenseKey.trim()) return;
    setUpdating(true);
    try {
      const res = await api('/api/saas/update-license', {
        method: 'POST',
        body: JSON.stringify({ license_key: newLicenseKey })
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast({ title: "Success", description: "License key updated. Syncing now..." });
        setNewLicenseKey('');
        await handleSync();
      } else {
        toast({ title: "Error", description: data.message || "Failed to update license key", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Request failed", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadSaas();
    loadPackages();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  const isModuleIncluded = (modId: string) => {
    if (!saasData?.modules) return false;
    if (saasData.modules.includes('*')) return true;
    const currentModules = Array.isArray(saasData.modules) ? saasData.modules : (typeof saasData.modules === 'string' ? (saasData.modules.startsWith('[') ? JSON.parse(saasData.modules) : saasData.modules.split(',').map((s:string)=>s.trim())) : []);
    return currentModules.some((m: string) => m.toLowerCase() === modId.toLowerCase());
  }

  const handleRefreshCache = async () => {
    setLoading(true);
    await loadSaas(true);
    // Because loadSaas sets loading to false in finally block, we don't need to do it here
  };

  if (loading) {
    return (
      <DashboardLayout title="Subscription & Billing">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Subscription & Billing">
      <div className="w-full space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
            >
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl md:text-3xl font-black tracking-tighter truncate">Subscription & Billing</h1>
          </div>
          <p className="text-xs md:text-base text-muted-foreground font-medium pl-10 md:pl-12">Manage license, entitlements & history.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-2 lg:pl-0">
            {saasData?.api_connected === false ? (
              <Badge variant="outline" className="px-2 py-1 bg-red-500/10 text-red-500 border-red-500/20 font-black tracking-widest text-[10px] animate-pulse">
                 Sync: Error
              </Badge>
           ) : (
              <Badge variant="outline" className="px-2 py-1 bg-emerald-500/5 text-emerald-500 border-emerald-500/20 font-black tracking-widest text-[10px]">
                 Sync: Stable
              </Badge>
           )}
           <Badge variant="outline" className="px-2 py-1 bg-blue-500/5 text-blue-400 border-blue-500/20 font-black tracking-widest text-[10px]">
              #01-SG
           </Badge>
           <div className="flex items-center gap-2 ml-auto lg:ml-0">
             <Button 
                  variant="outline" 
                  onClick={handleRefreshCache}
                  disabled={loading}
                  className="h-9 px-4 rounded-xl border-border dark:border-white/5 bg-background dark:bg-white/5 hover:bg-accent/10 text-[10px] font-black tracking-widest gap-2"
              >
                  <RefreshCw className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
                  {loading ? 'Refreshing' : 'Refresh Cache'}
              </Button>
             <Button 
                  variant="outline" 
                  onClick={handleSync}
                  disabled={syncing}
                  className="h-9 px-4 rounded-xl border-border dark:border-white/5 bg-background dark:bg-white/5 hover:bg-accent/10 text-[10px] font-black tracking-widest gap-2"
              >
                  <RefreshCw className={syncing ? "animate-spin w-4 h-4" : "w-4 h-4"} />
                  {syncing ? 'Syncing' : 'Sync Now'}
              </Button>
           </div>
        </div>
      </div>

      {saasData?.api_connected === false && (
         <motion.div 
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
         >
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
               <p className="text-sm font-black text-red-500 tracking-tight">Master API Connection Failed</p>
               <p className="text-xs text-red-400 font-medium">
                  We could not reach the Nexus Licensing Server. The system is currently running on cached credentials (Restricted Mode). Some feature updates may be delayed until connectivity is restored.
               </p>
            </div>
         </motion.div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Active Subscription & Plan Info */}
        <div className="lg:col-span-4 space-y-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 text-white rounded-[2rem] shadow-xl shadow-blue-500/10 p-6 md:p-8"
            >
                {/* Decorative background element */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <ShieldCheck size={28} className="text-blue-200" />
                        </div>
                        <Badge className="bg-emerald-400/20 text-emerald-300 border-emerald-400/30 font-black text-[10px] tracking-widest px-3 py-1">
                            {saasData?.status}
                        </Badge>
                    </div>

                    <div>
                        <p className="text-[10px] font-black tracking-[0.2em] text-blue-200/70 mb-1">Active Subscription</p>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-1">
                            {saasData?.package_name || saasData?.name}
                        </h2>
                        {saasData?.tenant_name && (
                            <p className="text-xs font-bold text-blue-100/60 tracking-widest">{saasData.tenant_name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-blue-200/50 tracking-widest flex items-center gap-1.5">
                                <Users size={10} /> Max Users
                            </p>
                            <p className="text-xl font-black">{saasData?.max_users || 'Unlimited'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-blue-200/50 tracking-widest flex items-center gap-1.5">
                                <MapPin size={10} /> Sites
                            </p>
                            <p className="text-xl font-black">{saasData?.max_locations || '1'}</p>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                         <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-blue-200/70">Price</span>
                            <span className="font-black text-lg">${saasData?.monthly_price || saasData?.price || '0.00'}<span className="text-[10px] opacity-60 ml-0.5">/mo</span></span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-blue-200/70">Renewal</span>
                            <span className="font-black">{formatDate(saasData?.renewal_date)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* License Key & Update */}
            <div className="bg-card dark:bg-slate-900/40 border border-border dark:border-white/5 rounded-[2rem] p-6 space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground">Current Identity</span>
                        <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary">STABLE</Badge>
                    </div>
                    <div className="p-3 bg-muted/50 dark:bg-black/20 rounded-xl font-mono text-[9px] md:text-xs text-primary break-all border border-border dark:border-white/5 select-all">
                        {saasData?.license_key || 'No key active'}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-[10px] font-black tracking-widest text-muted-foreground">Activation Key</div>
                    <div className="relative">
                        <Input 
                            placeholder="NX- Activation Key" 
                            value={newLicenseKey}
                            onChange={(e) => setNewLicenseKey(e.target.value)}
                            className="h-11 pl-4 pr-24 text-xs font-mono bg-muted/30 border-border dark:border-white/10 rounded-xl focus:ring-primary/20"
                        />
                        <Button 
                            onClick={handleUpdateLicense}
                            disabled={updating || !newLicenseKey.trim()}
                            className="absolute right-1 top-1 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-black tracking-widest transition-all active:scale-95"
                        >
                            {updating ? <RefreshCw className="animate-spin w-3 h-3" /> : 'Update'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Upgrade CTA */}
            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <Zap size={16} fill="currentColor" />
                    <span className="text-xs font-black tracking-widest">Enterprise Support</span>
                </div>
                <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 font-medium leading-relaxed">
                    To upgrade your plan or increase your site/user limits, please contact your account manager or visit the Nexus Enterprise Portal.
                </p>
            </div>
        </div>

        {/* Right Column: Entitlements & History */}
        <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allPossibleModules.map((mod) => {
                    const included = isModuleIncluded(mod.id);
                    return (
                        <motion.div 
                            key={mod.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group relative overflow-hidden flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                                included 
                                ? "bg-card hover:bg-emerald-500/[0.02] border-emerald-500/10 dark:border-emerald-500/20 shadow-sm" 
                                : "bg-muted/40 border-transparent opacity-40 grayscale"
                            }`}
                        >
                            {included && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-3xl flex items-center justify-center">
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                </div>
                            )}
                            <div className={`p-2 rounded-xl shrink-0 ${included ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted dark:bg-white/5 text-muted-foreground"}`}>
                                {included ? <ShieldCheck size={18} /> : <Lock size={18} />}
                            </div>
                            <div className="min-w-0 pr-4">
                                <div className="text-[11px] font-black tracking-tight text-foreground truncate">{mod.label}</div>
                                <div className="text-[9px] text-muted-foreground font-medium truncate opacity-60">Nexus Master API</div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card dark:bg-card/40 border border-border dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden"
            >
                <div className="p-6 flex items-center justify-between border-b border-border dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <CreditCard size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tighter">Billing History</h3>
                            <p className="text-[10px] text-muted-foreground font-medium tracking-widest">Recent transactions & invoices</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-black tracking-widest h-9 px-4 border-border dark:border-white/10">
                        <Download size={14} className="mr-2" /> All
                    </Button>
                </div>
                
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border dark:border-white/5">
                                <th className="px-6 py-3 text-[10px] font-black tracking-widest text-muted-foreground/70">Invoice #</th>
                                <th className="px-6 py-3 text-[10px] font-black tracking-widest text-muted-foreground/70">Due Date</th>
                                <th className="px-6 py-3 text-[10px] font-black tracking-widest text-muted-foreground/70 text-right">Amount</th>
                                <th className="px-6 py-3 text-[10px] font-black tracking-widest text-muted-foreground/70">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-white/5">
                            {saasData?.invoices && saasData.invoices.length > 0 ? (
                                saasData.invoices.map((inv: any, idx: number) => (
                                     <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/5 group-hover:bg-blue-500/10 rounded-lg transition-colors">
                                                    <FileText className="text-blue-600/60" size={12} />
                                                </div>
                                                <span className="text-xs font-bold text-foreground">{inv.invoice_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] font-medium text-muted-foreground">{inv.due_date}</td>
                                        <td className="px-6 py-4 text-xs font-black text-foreground text-right">${inv.amount}</td>
                                        <td className="px-6 py-4">
                                            <Badge className={`text-[8px] font-black tracking-widest px-2 py-0.5 ${
                                                inv.status === 'Paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                            }`}>
                                                {inv.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                 ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-muted rounded-full opacity-50">
                                                <FileText size={20} className="text-muted-foreground" />
                                            </div>
                                            <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground">No transaction history found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
      </div>

      {availablePlans.length > 0 && (
         <div className="space-y-6 pt-6 border-t border-border dark:border-white/5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-1 bg-primary rounded-full" />
                <h3 className="text-lg font-black tracking-tighter">Available Upgrade Plans</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availablePlans.filter(p => p.name !== saasData?.name).map((plan, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ y: -4 }}
                        className="bg-card dark:bg-card/40 border border-border dark:border-white/5 p-5 rounded-[2rem] shadow-sm group transition-all"
                    >
                        <div className="space-y-1 mb-4">
                            <div className="text-[10px] font-black text-primary/70 tracking-widest">Plan Option</div>
                            <div className="font-black uppercase text-2xl group-hover:text-primary transition-colors tracking-tighter leading-none">{plan.name}</div>
                        </div>
                        <div className="text-3xl font-black text-foreground mb-4">
                            ${plan.monthly_price || plan.price || '0'}
                            <span className="text-[10px] text-muted-foreground ml-1 opacity-60">Monthly</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-6">
                            {(typeof plan.modules === 'string' && plan.modules.includes('*')) || (Array.isArray(plan.modules) && plan.modules.includes('*')) ? (
                                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none text-[8px] font-black px-2 py-0.5 h-6">Full ERP Access</Badge>
                            ) : (
                                <Badge variant="outline" className="text-[8px] font-black px-2 py-0.5 h-6 border-primary/20">Limited Features</Badge>
                            )}
                        </div>
                        <Button variant="outline" className="w-full rounded-xl border-primary/20 text-primary font-black tracking-widest h-10 group-hover:bg-primary group-hover:text-white transition-all">
                            View Plan
                        </Button>
                    </motion.div>
                ))}
            </div>
         </div>
      )}
    </div>
    </DashboardLayout>
  );
}
