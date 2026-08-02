"use client";

import React from 'react';
import { Boxes, CreditCard, Users, Wrench, BarChart3, Globe } from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  const modules = [
    { icon: Boxes,      title: 'Inventory Intelligence', desc: 'Real-time stock tracking with automated restock alerts, batch management, and FIFO valuation.' },
    { icon: CreditCard, title: 'Hyper-Fast POS',          desc: 'Touch-optimized point of sale with multi-payment engine, split tender, and digital receipt generation.' },
    { icon: Users,      title: 'BizzFlow HRM',            desc: 'Complete HR lifecycle — attendance, leaves, payroll calculation, and employee performance tracking.' },
    { icon: Wrench,     title: 'RepairOS Lifecycle',      desc: 'End-to-end repair management with status updates, technician assignment, and customer SMS notifications.' },
    { icon: BarChart3,  title: 'Enterprise Finance',     desc: 'Automated double-entry general ledger with tax rules, multi-currency support, and real-time profit reports.' },
    { icon: Globe,      title: 'SaaS Architecture',       desc: 'Native multi-tenant support with custom subdomains, license key verification, and isolated databases.' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#09090b] pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#09090b] dark:text-white sm:text-4xl">
            Deep-Integrated Enterprise Modules
          </h1>
          <p className="mt-2 text-sm text-[#71717a] dark:text-[#a1a1aa] max-w-xl mx-auto">
            From retail POS to workshop repairs and financial ledger, BizzFlow powers every facet of your operations.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={i}
                className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b] hover:border-[#6366f1]/40 transition-all"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef2ff] text-[#6366f1] dark:bg-[#6366f1]/10 dark:text-[#818cf8]">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-[#09090b] dark:text-white mb-1.5">
                  {m.title}
                </h3>
                <p className="text-[13px] text-[#71717a] dark:text-[#a1a1aa] leading-relaxed">
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/order"
            className="inline-flex items-center justify-center rounded-lg bg-[#6366f1] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors shadow-sm"
          >
            Start 14-Day Free Trial
          </Link>
        </div>

      </div>
    </div>
  );
}
