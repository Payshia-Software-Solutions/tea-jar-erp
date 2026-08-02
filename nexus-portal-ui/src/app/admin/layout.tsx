"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopBar from '@/components/AdminTopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [currentUser,     setCurrentUser]     = useState('');
  const [userRole,        setUserRole]        = useState('');
  const [loading,         setLoading]         = useState(true);
  const [theme,           setTheme]           = useState<'light' | 'dark'>('light');
  const [isSidebarOpen,   setIsSidebarOpen]   = useState(false);

  useEffect(() => {
    // Restore saved theme
    const saved = localStorage.getItem('nexus-theme') as 'light' | 'dark' | null;
    const resolved = saved ?? 'light';
    setTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');

    const isLoginPage = pathname === '/admin' || pathname === '/admin/login';
    if (isLoginPage) { setLoading(false); return; }

    if (currentUser) {
      setLoading(false);
      return;
    }

    const checkAuth = async (attempt = 1) => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/auth/check`, { credentials: 'include', headers });
        if (!res.ok) {
          if (attempt < 3) {
            setTimeout(() => checkAuth(attempt + 1), 300);
            return;
          }
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
        setUserRole(data.role);
      } catch {
        if (attempt < 3) {
          setTimeout(() => checkAuth(attempt + 1), 300);
          return;
        }
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router, currentUser]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('nexus-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const isLoginPage = pathname === '/admin' || pathname === '/admin/login';
  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8] dark:bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#e4e4e7] border-t-[#6366f1]" />
          <span className="text-xs text-[#a1a1aa] font-medium">Loading workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f8] text-[#09090b] dark:bg-[#09090b] dark:text-white transition-colors duration-200">
      <AdminSidebar
        currentUser={currentUser}
        role={userRole}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopBar
          currentUser={currentUser}
          role={userRole}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
