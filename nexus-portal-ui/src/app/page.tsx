"use client";

import React from 'react';
import { ShieldCheck, ArrowRight, Layers, BarChart3, Users, Box, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Box,
    title: 'Inventory Intel',
    desc: 'Real-time stock tracking with automated restock workflows and demand forecasting.',
  },
  {
    icon: BarChart3,
    title: 'Hyper POS',
    desc: 'Touch-optimized point of sale with multi-payment engine and receipt automation.',
  },
  {
    icon: Users,
    title: 'BizzFlow HRM',
    desc: 'Complete HR lifecycle — attendance, leaves, payroll, and performance tracking.',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<2ms',  label: 'API Latency' },
  { value: '500+',  label: 'Enterprises' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-[#f7f7f8] dark:bg-[#09090b] min-h-screen">

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e0e7ff] bg-[#eef2ff] px-3.5 py-1 text-xs font-medium text-[#6366f1] dark:border-[#6366f1]/20 dark:bg-[#6366f1]/10 dark:text-[#818cf8] mb-6">
            <ShieldCheck size={13} />
            Enterprise ERP Operating System
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#09090b] dark:text-white leading-tight mb-6">
            The Intelligent <span className="text-[#6366f1] dark:text-[#818cf8]">BizzFlow ERP</span> Operating System
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#71717a] dark:text-[#a1a1aa] max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Accelerate your operational lifecycle with deep-integrated modules. Manage inventory, POS transactions, and HRM payroll — all in one unified workspace.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link
              href="/order"
              className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-6 py-3 text-sm font-medium text-white hover:bg-[#4f46e5] transition-colors shadow-sm"
            >
              <span>Get Started Free</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-[#e4e4e7] bg-white px-6 py-3 text-sm font-medium text-[#09090b] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:text-white dark:hover:bg-[#27272a] transition-colors"
            >
              Read Docs
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16 pt-6 border-t border-[#e4e4e7] dark:border-[#27272a]">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#09090b] dark:text-white tracking-tight">{s.value}</div>
                <div className="text-xs text-[#71717a] dark:text-[#a1a1aa] font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Feature Highlights ────────────────────────────────────────── */}
      <section className="py-16 bg-white dark:bg-[#18181b] border-t border-b border-[#e4e4e7] dark:border-[#27272a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#09090b] dark:text-white">
              One Core Engine. Total Operational Control.
            </h2>
            <p className="text-sm text-[#71717a] dark:text-[#a1a1aa] mt-1.5">
              Modular architecture built for speed and reliability.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="rounded-xl border border-[#e4e4e7] bg-[#fafafa] p-6 dark:border-[#27272a] dark:bg-[#1c1c1f]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[#6366f1] dark:text-[#818cf8]">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-[#09090b] dark:text-white mb-1.5">{f.title}</h3>
                  <p className="text-[13px] text-[#71717a] dark:text-[#a1a1aa] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Banner Section ───────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#09090b] dark:bg-[#18181b] border border-[#27272a] p-10 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to Deploy Your ERP Instance?
          </h2>
          <p className="text-sm text-[#a1a1aa] max-w-lg mx-auto mb-6">
            Join enterprises worldwide running BizzFlow ERP. Get your dedicated instance provisioned in under 60 seconds.
          </p>
          <Link
            href="/order"
            className="inline-flex items-center gap-2 rounded-lg bg-[#6366f1] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors"
          >
            <span>Initialize Instance</span>
            <ChevronRight size={15} />
          </Link>
        </div>
      </section>

    </div>
  );
}
