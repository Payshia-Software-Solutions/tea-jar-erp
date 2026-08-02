"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldAlert, Loader2, ArrowRight, Zap, Shield, BarChart3, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

const highlights = [
  { icon: Shield,    title: 'Enterprise Security',   desc: 'Role-based access control with encrypted sessions.' },
  { icon: BarChart3, title: 'Real-Time Analytics',   desc: 'Monitor tenants, billing, and platform health.' },
  { icon: Globe,     title: 'Multi-Tenant Platform', desc: 'Manage unlimited SaaS clients from one dashboard.' },
];

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE}/auth/check`, { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          return res.json().then(data => {
            const dest = data.role === 'super_admin' ? '/admin/requests' : '/admin/subscription';
            router.push(dest);
          });
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (data.token) {
          localStorage.setItem('nexus_token', data.token);
        }
        const dest = data.role === 'super_admin' ? '/admin/requests' : '/admin/subscription';
        window.location.href = dest;
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Cannot connect to the server. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#09090b]">

      {/* ── Left panel (brand) ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-[#09090b] dark:bg-[#18181b] p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6366f1]">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">BIZZFLOW</span>
        </div>

        {/* Main copy */}
        <div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white tracking-tight">
            Nexus Admin<br />
            <span className="text-[#818cf8]">Control Centre</span>
          </h1>
          <p className="mb-10 text-[15px] text-[#71717a] leading-relaxed">
            Manage your entire SaaS ecosystem — tenants, billing, requests, and communications — from one unified workspace.
          </p>

          {/* Feature list */}
          <div className="space-y-5">
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/15">
                    <Icon size={16} className="text-[#818cf8]" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-white">{h.title}</div>
                    <div className="text-[12px] text-[#71717a] leading-snug mt-0.5">{h.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-[11px] text-[#52525b]">
          © 2026 BizzFlow · Powered by Nebulync
        </div>
      </div>

      {/* ── Right panel (form) ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6366f1]">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <span className="text-base font-black tracking-tight text-[#09090b] dark:text-white">BIZZFLOW</span>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[#09090b] dark:text-white">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-[#71717a] dark:text-[#a1a1aa]">
              Sign in to your admin account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#09090b] dark:text-white">
                Username
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  className="
                    w-full rounded-lg border border-[#e4e4e7] bg-white py-2.5 pl-9 pr-3
                    text-[13px] text-[#09090b] placeholder:text-[#a1a1aa]
                    focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
                    dark:border-[#27272a] dark:bg-[#18181b] dark:text-white
                    dark:focus:border-[#818cf8] dark:focus:ring-[#818cf8]/20
                    transition-all
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#09090b] dark:text-white">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="
                    w-full rounded-lg border border-[#e4e4e7] bg-white py-2.5 pl-9 pr-3
                    text-[13px] text-[#09090b] placeholder:text-[#a1a1aa]
                    focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
                    dark:border-[#27272a] dark:bg-[#18181b] dark:text-white
                    dark:focus:border-[#818cf8] dark:focus:ring-[#818cf8]/20
                    transition-all
                  "
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 dark:border-red-900/40 dark:bg-red-950/30">
                <ShieldAlert size={15} className="shrink-0 text-red-500" />
                <span className="text-[12px] font-medium text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                flex w-full items-center justify-center gap-2 rounded-lg bg-[#6366f1] py-2.5
                text-[13px] font-semibold text-white
                hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/40
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all
              "
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : <><span>Sign in</span><ArrowRight size={14} /></>
              }
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-[#a1a1aa] dark:text-[#52525b]">
            Protected by Nexus security. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
