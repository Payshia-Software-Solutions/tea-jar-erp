"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopBar from '@/components/AdminTopBar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('nexus-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const isLoginPage = pathname === '/admin' || pathname === '/admin/login';
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
        setUserRole(data.role);
      } catch (e) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('nexus-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const isLoginPage = pathname === '/admin' || pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine active tab from pathname
  const activeTab = pathname.split('/').pop() || 'dashboard';

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex overflow-hidden transition-colors duration-300">
      <AdminSidebar 
        currentUser={currentUser} 
        role={userRole} 
        activeTab={activeTab} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopBar 
          currentUser={currentUser}
          role={userRole}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={toggleSidebar}
        />
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
