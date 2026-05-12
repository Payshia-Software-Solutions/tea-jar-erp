"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Lock, 
  User, 
  ShieldAlert,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    fetch(`${API_BASE}/auth/check`, { credentials: 'include' })
      .then(res => res.ok && router.push('/admin/dashboard'))
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (response.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Is the PHP server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md lg:max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white fill-white" size={28} />
            </div>
            <span className="text-3xl font-black tracking-tighter text-gradient uppercase">Nexus Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-strong">Welcome Back</h1>
          <p className="text-muted mt-2 font-medium">Secure access to the Nexus Portal management suite.</p>
        </div>

        <div className="glass p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                Username
              </label>
              <input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                type="text" 
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white placeholder:text-slate-400" 
                placeholder="Enter admin username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                <Lock size={14} className="text-indigo-600 dark:text-indigo-400" />
                Password
              </label>
              <input 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                type="password" 
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-slate-950 dark:text-white placeholder:text-slate-400" 
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3 font-bold">
                <ShieldAlert size={18} className="shrink-0" />
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              type="submit" 
              className="w-full btn-premium py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="font-bold uppercase tracking-[0.2em] text-xs">Connect to Dashboard</span>
                  <ChevronRight size={18} strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-muted text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">
          Protected by Nexus Security Protocols. <br />
          Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
}
