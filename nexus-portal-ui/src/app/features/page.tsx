"use client";

import React from 'react';
import { 
  Boxes, 
  CreditCard, 
  Users, 
  Wrench, 
  BarChart3, 
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeaturesPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 }
    }
  } as const;

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gradient mb-6 leading-none">
          Deep-Integrated <br /> Modules
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          From high-frequency inventory to complex HRM payroll, Nexus ERP provides the complete infrastructure to power your entire enterprise.
        </p>
      </motion.div>

      {/* ISO Visual in Full Glory */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-32 relative"
      >
        <motion.div
           animate={{ y: [0, -15, 0] }}
           transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src="/hero-viz.png" alt="Nexus Architecture" className="w-full h-auto drop-shadow-[0_0_80px_rgba(99,102,241,0.15)] dark:drop-shadow-[0_0_80px_rgba(99,102,241,0.2)]" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent h-full" />
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {[
          { icon: Boxes, title: 'Inventory Intelligence', desc: 'Advanced stock management with real-time tracking, low-stock alerts, and automated reorder logic.' },
          { icon: CreditCard, title: 'Hyper-Fast POS', desc: 'Touch-optimized point of sale for retail and service industries with multi-payment engine.' },
          { icon: Users, title: 'Nexus HRM Core', desc: 'Complete HR management featuring employee profiles, attendance, leaves, and payroll automation.' },
          { icon: Wrench, title: 'RepairOS Lifecycle', desc: 'End-to-end repair management with status tracking, technician assignment, and customer alerts.' },
          { icon: BarChart3, title: 'Enterprise Finance', desc: 'High-density accounting with automated tax calculation, profit tracking, and detailed P&L.' },
          { icon: Globe, title: 'SaaS Architecture', desc: 'Native multi-tenant support with custom domain mapping and individual database isolation.' },
        ].map((feature, i) => (
          <motion.div key={i} variants={itemVariants} className="glass p-10 glass-hover group border-slate-900/5 dark:border-white/5 shadow-xl dark:shadow-none transition-colors duration-500">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8 font-bold shadow-inner">
              <feature.icon size={30} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-strong">{feature.title}</h3>
            <p className="text-muted text-sm leading-relaxed font-medium">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
