"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const [serverPackages, setServerPackages] = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/saas/packages`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          // Display ONLY packages marked as public in admin panel (is_public == 1)
          const filtered = data.data.filter((p: any) => Number(p.is_public) === 1);
          setServerPackages(filtered);
        }
      })
      .catch(err => console.error('Failed to load packages', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#09090b] pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e0e7ff] bg-[#eef2ff] px-3 py-1 text-[11px] font-medium text-[#6366f1] dark:border-[#6366f1]/20 dark:bg-[#6366f1]/10 dark:text-[#818cf8] mb-4">
            <Zap size={12} /> Simple, Transparent Pricing
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#09090b] dark:text-white sm:text-4xl">
            Scale Your Business with BizzFlow
          </h1>
          <p className="mt-2 text-sm text-[#71717a] dark:text-[#a1a1aa] max-w-lg mx-auto">
            Choose the tier that fits your growth. Upgrade or downgrade at any time.
          </p>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex items-center gap-2 text-[13px] text-[#a1a1aa]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Loading plans…
            </div>
          </div>
        ) : serverPackages.length === 0 ? (
          <div className="text-center text-[13px] text-[#a1a1aa] py-12">
            No public pricing plans available at the moment.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch justify-center">
            {serverPackages.map((plan) => {
              const isPro = plan.package_key === 'pro';
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-xl border bg-white dark:bg-[#18181b] overflow-hidden transition-all ${
                    isPro
                      ? 'border-[#6366f1] shadow-lg shadow-[#6366f1]/10 dark:border-[#818cf8]'
                      : 'border-[#e4e4e7] dark:border-[#27272a]'
                  }`}
                >
                  {isPro && (
                    <div className="bg-[#6366f1] text-center py-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] dark:text-[#52525b] mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[#09090b] dark:text-white">
                          ${parseFloat(plan.monthly_price).toFixed(0)}
                        </span>
                        <span className="text-xs text-[#71717a] dark:text-[#a1a1aa]">/mo</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2.5 mb-6">
                      {plan.features && Array.isArray(plan.features) ? (
                        plan.features.map((f: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-[13px]">
                            <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${isPro ? 'text-[#6366f1] dark:text-[#818cf8]' : 'text-green-600'}`} />
                            <span className="text-[#09090b] dark:text-[#c9d1d9]">{f.feature_name || f}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-2 text-[13px]">
                          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-green-600" />
                          <span className="text-[#09090b] dark:text-[#c9d1d9]">Full System Access</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href="/order"
                      className={`w-full py-2.5 rounded-lg text-[13px] font-semibold text-center transition-colors ${
                        isPro
                          ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white'
                          : 'border border-[#e4e4e7] bg-white text-[#09090b] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#27272a] dark:text-white dark:hover:bg-[#3f3f46]'
                      }`}
                    >
                      Select Plan
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-[#71717a] dark:text-[#a1a1aa] mt-10">
          All plans include a 14-day free trial. No credit card required.
        </p>

      </div>
    </div>
  );
}
