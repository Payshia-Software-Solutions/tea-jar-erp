"use client";

import React from 'react';
import { 
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Zap,
  Globe,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <header className="relative pt-32 pb-40 lg:pt-48 lg:pb-60 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Background Glows handled by global BackgroundGradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-full h-[500px] horizon-glow opacity-60 -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-muted text-xs font-bold uppercase tracking-widest mb-10"
          >
            <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
            Empowering Modern Enterprises
          </motion.div>
          
          <h1 className="text-hero text-gradient mb-8">
            The intelligent <br />
            BizzFlow ERP Operating System
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg lg:text-xl text-muted mb-14 leading-relaxed font-medium">
            BizzFlow ERP, powered by Nebulync software, accelerates your entire operational lifecycle with deep-integrated modules. Build inventory, manage POS, and scale HRM, all in one unified workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
            <Link href="/order" className="btn-pill shadow-xl dark:shadow-indigo-500/10">
              Get Started Now
            </Link>
            <Link href="/docs" className="btn-pill bg-slate-900/40 border border-white/10 hover:bg-slate-900/60 shadow-xl">
              Read Docs
            </Link>
            <Link href="/features" className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-foreground transition-colors flex items-center gap-2 group">
              Explore Features
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Isometric Visualization Stage */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="relative w-full max-w-5xl mx-auto px-4"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <img src="/hero-viz.png" alt="Nexus Architecture" className="w-full h-auto drop-shadow-[0_0_100px_rgba(99,102,241,0.2)] dark:drop-shadow-[0_0_100px_rgba(99,102,241,0.25)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent h-full" />
          </motion.div>
        </motion.div>
      </header>

      {/* Platform Overview Summary */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div
                 initial={{ opacity: 0, x: -30 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="space-y-8"
              >
                 <div className="inline-flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-[0.2em] text-xs">
                    <Layers size={18} />
                    Platform Ecosystem
                 </div>
                 <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    One Unified Core. <br />
                    <span className="text-slate-400 dark:text-slate-500">Infinite Possibilities.</span>
                 </h2>
                 <p className="text-muted text-lg leading-relaxed font-medium">
                    BizzFlow ERP isn't just software—it's the bedrock for your business. We provide specialized modules that communicate instantly, eliminating data silos and driving growth.
                 </p>
                 <div className="grid gap-6">
                    {[
                       { title: 'Inventory Intel', desc: 'Real-time stock tracking with automated restock workflows.' },
                       { title: 'Hyper POS', desc: 'Touch-optimized point of sale with multi-payment engine.' },
                       { title: 'BizzFlow HRM', desc: 'Complete HR lifecycle, attendance, leaves, and automated payroll.' }
                    ].map((item, i) => (
                       <div key={i} className="flex gap-4 items-start">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          </div>
                          <div>
                             <h4 className="font-bold text-strong text-sm mb-1">{item.title}</h4>
                             <p className="text-muted text-sm leading-snug font-medium">{item.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
                 <Link href="/features" className="inline-flex items-center gap-2 group text-strong font-bold text-xs uppercase tracking-widest mt-4">
                    View Full Module Catalog
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </Link>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className="glass p-12 relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-8">
                     <Globe className="text-indigo-500/10 dark:text-indigo-500/20" size={120} />
                  </div>
                   <h3 className="text-3xl font-extrabold tracking-tight mb-6">Global Scale Ready</h3>
                  <p className="text-muted mb-8 leading-relaxed font-medium">
                     Whether you operate one store or a thousand warehouses, our cloud-native infrastructure scales automatically to handle your traffic spikes.
                  </p>
                  <div className="flex gap-10">
                     <div>
                        <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1 tracking-tight">99.9%</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Uptime SLA</div>
                     </div>
                     <div>
                        <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1 tracking-tight">&lt;2ms</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">API Latency</div>
                     </div>
                  </div>
              </motion.div>
           </div>
        </div>
      </section>

      {/* Final Conversion CTA - The Cinematic Bridge */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 py-16 px-6 sm:px-12 md:py-24 md:px-20 text-center shadow-2xl shadow-indigo-500/10"
          >
            {/* Visual Depth Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
               <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                 Ready to deploy your <br /> 
                 <span className="text-indigo-400">future infrastructure?</span>
               </h2>
               
               <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                 Join 500+ global enterprises scaling with BizzFlow. Initialize your dedicated instance and dominate your market.
               </p>

               <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-6">
                  <Link 
                    href="/order" 
                    className="group relative bg-white hover:bg-slate-100 text-slate-950 px-12 py-5 rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center gap-3"
                  >
                    Get Started Free
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    href="/pricing" 
                    className="text-white hover:text-indigo-400 font-bold text-xs uppercase tracking-widest transition-all py-2 border-b-2 border-transparent hover:border-indigo-500/50"
                  >
                    View Pricing Models
                  </Link>
               </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
