"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const inputCls = `
  w-full rounded-lg border border-[#e4e4e7] bg-white py-2.5 px-3.5
  text-[13px] text-[#09090b] placeholder:text-[#a1a1aa]
  focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
  dark:border-[#27272a] dark:bg-[#18181b] dark:text-white
  dark:focus:border-[#818cf8] dark:focus:ring-[#818cf8]/20
  transition-all
`;

function FormField({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-[#09090b] dark:text-white">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function OrderPage() {
  const [formStatus,     setFormStatus]     = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [serverPackages, setServerPackages] = useState<any[]>([]);

  useEffect(() => {
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
    } catch {
      setFormStatus({ type: 'error', message: 'Connection error. Please ensure the PHP server is running.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] dark:bg-[#09090b] pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">

        {/* Page Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> 14-Day Free Trial Included
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#09090b] dark:text-white sm:text-4xl">
            Create Your BizzFlow Instance
          </h1>
          <p className="mt-2 text-sm text-[#71717a] dark:text-[#a1a1aa] max-w-lg mx-auto">
            Fill in your business details to provision your dedicated enterprise workspace instantly.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 sm:p-8 dark:border-[#27272a] dark:bg-[#18181b] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Company Name" required>
                <input name="company_name" required type="text" placeholder="Acme Corp" className={inputCls} />
              </FormField>
              <FormField label="Contact Person" required>
                <input name="contact_person" required type="text" placeholder="Alex Rivera" className={inputCls} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Work Email" required>
                <input name="email" required type="email" placeholder="alex@acme.com" className={inputCls} />
              </FormField>
              <FormField label="Business Category">
                <select name="business_type" className={`${inputCls} appearance-none cursor-pointer`}>
                  <option value="Retail">Retail & E-commerce</option>
                  <option value="Healthcare">Healthcare & Biotech</option>
                  <option value="Construction">Construction & Engineering</option>
                  <option value="Finance">Finance & Insurance</option>
                  <option value="Tech">Technology & SaaS</option>
                </select>
              </FormField>
            </div>

            <FormField label="Business Address">
              <textarea name="address" rows={2} placeholder="123 Innovation Way, Suite 500" className={`${inputCls} resize-none`} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Create Password" required>
                <input name="password" required type="password" placeholder="••••••••" className={inputCls} />
              </FormField>
              <FormField label="Confirm Password" required>
                <input name="confirm_password" required type="password" placeholder="••••••••" className={inputCls} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Expected Users">
                <select name="expected_users" className={`${inputCls} appearance-none cursor-pointer`}>
                  <option value="5">1–5 Users</option>
                  <option value="20">6–20 Users</option>
                  <option value="50">21–50 Users</option>
                  <option value="100">Enterprise (50+)</option>
                </select>
              </FormField>
              <FormField label="ERP Package">
                <select name="package_type" className={`${inputCls} appearance-none cursor-pointer`}>
                  {serverPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.name}>{pkg.name} Suite</option>
                  ))}
                  <option value="Enterprise">Enterprise Workspace</option>
                </select>
              </FormField>
            </div>

            {/* Status Feedback */}
            {formStatus && (
              <div className={`flex items-start gap-3 rounded-lg border p-4 text-[13px] ${
                formStatus.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400'
              }`}>
                {formStatus.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                <div>
                  <p className="font-semibold">{formStatus.type === 'success' ? 'Registration Successful!' : 'Registration Failed'}</p>
                  <p className="mt-0.5 text-xs opacity-90">{formStatus.message}</p>
                </div>
              </div>
            )}

            <button
              disabled={isSubmitting}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6366f1] py-3 text-[13px] font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-60 transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Initializing Workspace…</>
              ) : (
                <><span>Initialize My Workspace</span><ArrowRight size={14} /></>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
