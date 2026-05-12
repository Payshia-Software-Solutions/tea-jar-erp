"use client";
import { API_BASE } from '@/config';

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const [serverPackages, setServerPackages] = useState<any[]>([]);

  React.useEffect(() => {
    fetch(`${API_BASE}/saas/packages`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const filtered = data.data.filter((p: any) => 
            p.package_key !== 'free_trial' && 
            p.package_key !== 'custom' && 
            p.is_public == 1
          );
          setServerPackages(filtered);
        }
      })
      .catch(err => console.error('Failed to load packages', err));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gradient mb-6">
          Scale with Nexus
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">
          Transparent, high-velocity pricing designed to support your business from startup stage to global enterprise dominance.
        </p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch"
      >
        {serverPackages.map((plan) => (
          <motion.div key={plan.id} variants={itemVariants} className={`glass p-10 relative flex flex-col group transition-all duration-500 hover:shadow-[0_0_50px_rgba(99,102,241,0.1)] ${plan.package_key === 'pro' ? 'border-indigo-500/50 scale-105 z-10 bg-indigo-500/5 shadow-[0_0_40px_rgba(99,102,241,0.15)] dark:bg-indigo-500/5' : 'hover:scale-[1.02] border-slate-900/5 dark:border-white/5'}`}>
            {plan.package_key === 'pro' && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-600/40">Most Popular</span>
            )}
            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-strong">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-foreground">${parseFloat(plan.monthly_price).toFixed(0)}</span>
                <span className="text-muted text-sm font-medium italic">/month</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-5 mb-12 text-muted">
               {plan.features?.map((f: any, i: number) => (
                 <div key={i} className="flex items-center gap-4 text-sm font-medium">
                    <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{f.feature_name}</span>
                 </div>
               ))}
            </div>

            <button 
              onClick={() => window.location.href = '/order'}
              className={`w-full py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest text-center transition-all ${plan.package_key === 'pro' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 text-white' : 'bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 border border-slate-900/10 dark:border-white/10 text-foreground'}`}
            >
              Select Package
            </button>
          </motion.div>
        ))}
        
        {/* Enterprise Card */}
        <motion.div variants={itemVariants} className="glass p-10 border-slate-900/5 dark:border-white/5 relative flex flex-col group hover:scale-[1.02] transition-all duration-500">
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-gradient">Enterprise</h3>
            <div className="text-5xl font-extrabold italic tracking-tight text-strong">Custom</div>
          </div>
          <div className="flex-1 space-y-5 mb-12 text-muted">
            <div className="flex items-center gap-4 text-sm font-medium">
              <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Unlimited Infrastructure</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>24/7 Dedicated Support</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Custom Module Development</span>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/order'}
            className="w-full py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest text-center bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:hover:bg-white/20 border border-slate-900/20 dark:border-white/20 transition-all text-foreground"
          >
            Connect Experts
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
