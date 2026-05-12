"use client";
import { API_BASE } from '@/config';

import React, { useState } from 'react';
import { ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderPage() {
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverPackages, setServerPackages] = useState<any[]>([]);

  React.useEffect(() => {
    fetch(`${API_BASE}/saas/packages`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const filtered = data.data.filter((p: any) => p.package_key !== 'free_trial' && p.package_key !== 'custom');
          setServerPackages(filtered);
        }
      })
      .catch(err => console.error('Failed to load packages', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      
      if (response.ok) {
        setFormStatus({ type: 'success', message: result.message });
        (e.target as HTMLFormElement).reset();
      } else {
        setFormStatus({ type: 'error', message: result.message });
      }
    } catch (err) {
      setFormStatus({ type: 'error', message: 'Connection error. Please ensure the PHP server is running.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gradient mb-6">
          Create Your Nexus Account
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          Start your transformation journey today. Enter your details below to initialize your dedicated enterprise workspace.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Company Name</label>
              <input name="company_name" required type="text" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white placeholder:text-slate-400" placeholder="Nexus Global Corp" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Contact Person</label>
              <input name="contact_person" required type="text" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white placeholder:text-slate-400" placeholder="Alex Rivera" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Work Email</label>
              <input name="email" required type="email" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white placeholder:text-slate-400" placeholder="alex@nexus.io" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Business Category</label>
              <select name="business_type" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer font-medium text-slate-950 dark:text-white">
                <option value="Healthcare">Healthcare & Biotech</option>
                <option value="Retail">Retail & E-commerce</option>
                <option value="Construction">Construction & Engineering</option>
                <option value="Finance">Finance & Insurance</option>
                <option value="Tech">Technology & SaaS</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted">Business Address</label>
            <textarea name="address" rows={2} className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white placeholder:text-slate-400 resize-none" placeholder="123 Enterprise Way, Suite 500, Innovation District" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Create Password</label>
              <input name="password" required type="password" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white placeholder:text-slate-400" placeholder="••••••••" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Confirm Password</label>
              <input name="confirm_password" required type="password" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white placeholder:text-slate-400" placeholder="••••••••" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Expected Users</label>
              <select name="expected_users" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer font-medium text-slate-950 dark:text-white">
                <option value="5">1-5 High-Frequency Users</option>
                <option value="20">6-20 Users</option>
                <option value="50">21-50 Users</option>
                <option value="100">Enterprise Scale (50+)</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Selected ERP Plan</label>
              <select name="package_type" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer font-medium text-slate-950 dark:text-white">
                {serverPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.name}>{pkg.name} Suite</option>
                ))}
                <option value="Enterprise">Enterprise Workspace</option>
              </select>
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            type="submit" 
            className="w-full btn-premium py-5 mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
          >
            <div className="flex items-center gap-3">
               <Zap size={20} className="fill-white" />
               <span className="font-bold uppercase tracking-[0.2em]">{isSubmitting ? 'Initializing Workspace...' : 'Initialize My Workspace'}</span>
            </div>
            {!isSubmitting && <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          {formStatus && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`p-8 rounded-2xl text-center font-bold flex flex-col items-center justify-center gap-4 ${formStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
              <div className="flex items-center gap-3">
                {formStatus.type === 'success' ? <ShieldCheck size={28} /> : <Zap size={28} />}
                <span className="text-xl">{formStatus.type === 'success' ? 'Action Required' : 'Submission Failed'}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed opacity-90 max-w-sm mx-auto">
                {formStatus.message}
              </p>
              {formStatus.type === 'success' && (
                <div className="text-[10px] uppercase tracking-widest opacity-60">
                  Please check your spam folder if you don't see the mail.
                </div>
              )}
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
