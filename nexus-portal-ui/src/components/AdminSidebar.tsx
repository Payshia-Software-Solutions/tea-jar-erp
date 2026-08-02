"use client";

import React, { useState } from 'react';
import {
  Inbox, Layers, CreditCard, Zap, UserCheck,
  FileText, Mail, Send, Globe, Building2,
  LogOut, Sun, Moon, ChevronRight, X, BarChart
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE } from '@/config';

type AdminSidebarProps = {
  activeTab?: string;
  currentUser: string;
  role?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
};

const menuSections = [
  {
    title: "Overview",
    items: [
      { id: 'dashboard',    label: 'Dashboard',        icon: Inbox,      roles: ['super_admin'] },
      { id: 'reports',      label: 'Reports',          icon: BarChart,   roles: ['super_admin'] },
      { id: 'requests',     label: 'ERP Requests',     icon: Inbox,      roles: ['super_admin'] },
      { id: 'tenants',      label: 'SaaS Tenants',     icon: Layers,     roles: ['super_admin'] },
      { id: 'packages',     label: 'Packages',         icon: CreditCard, roles: ['super_admin'] },
      { id: 'subscription', label: 'Subscription',     icon: Zap,        roles: ['super_admin', 'client'] },
      { id: 'users',        label: 'Client Accounts',  icon: UserCheck,  roles: ['super_admin'] },
    ]
  },
  {
    title: "Finance",
    items: [
      { id: 'invoices',  label: 'Billing',   icon: CreditCard, roles: ['super_admin'] },
      { id: 'payments',  label: 'History',   icon: FileText,   roles: ['super_admin'] },
    ]
  },
  {
    title: "Communications",
    items: [
      { id: 'send-email',  label: 'Broadcast',   icon: Send, roles: ['super_admin'] },
      { id: 'email-logs',  label: 'Audit Logs',  icon: Mail, roles: ['super_admin'] },
    ]
  },
  {
    title: "System",
    items: [
      { id: 'settings/rates',   label: 'Rates',       icon: Globe,      roles: ['super_admin'] },
      { id: 'settings/company', label: 'Branding',    icon: Building2,  roles: ['super_admin'] },
      { id: 'settings/mail',    label: 'Mail Server', icon: Mail,       roles: ['super_admin'] },
    ]
  }
];

export default function AdminSidebar({
  currentUser, role, theme, onToggleTheme, isOpen, onClose
}: AdminSidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    localStorage.removeItem('nexus_token');
    await fetch(`${API_BASE}/auth/logout`, { credentials: 'include' }).catch(() => {});
    window.location.href = '/admin/login';
  };

  const navigate = (id: string) => {
    router.push(`/admin/${id}`);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose?.();
  };

  const isActive = (id: string) => {
    if (id === 'dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.includes(`/admin/${id}`);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70] flex h-screen w-[220px] flex-col
        border-r border-[#e4e4e7] bg-white
        dark:border-[#27272a] dark:bg-[#18181b]
        transition-transform duration-200 ease-in-out
        lg:sticky lg:top-0 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* ── Logo ─────────────────────────────────── */}
        <div className="flex h-14 items-center justify-between border-b border-[#e4e4e7] dark:border-[#27272a] px-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon-bizzflow-logo-optimized.webp" alt="BizzFlow" className="h-6 w-6 object-contain" />
            <span className="text-[13px] font-black tracking-tight text-[#09090b] dark:text-white">
              BIZZFLOW
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-[#a1a1aa] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Navigation ───────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {menuSections.map((section) => {
            const items = section.items.filter(
              (item) => !item.roles || (role && item.roles.includes(role))
            );
            if (!items.length) return null;

            return (
              <div key={section.title}>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa] dark:text-[#52525b]">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon    = item.icon;
                    const active  = isActive(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={`
                          group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2
                          text-[13px] font-medium transition-colors text-left
                          ${active
                            ? 'bg-[#f4f4f5] text-[#09090b] dark:bg-[#27272a] dark:text-white font-semibold'
                            : 'text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#09090b] dark:text-[#71717a] dark:hover:bg-[#27272a] dark:hover:text-white'
                          }
                        `}
                      >
                        {/* Active left-bar indicator */}
                        {active && (
                          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[#6366f1]" />
                        )}
                        <Icon size={15} className="shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Footer ───────────────────────────────── */}
        <div className="border-t border-[#e4e4e7] dark:border-[#27272a] p-3 space-y-2">
          {/* User row */}
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1] text-[12px] font-bold text-white">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-[#09090b] dark:text-white">
                {currentUser}
              </div>
              <div className="text-[10px] text-[#a1a1aa] dark:text-[#52525b]">
                {role === 'super_admin' ? 'Super Admin' : 'Client'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#09090b] dark:hover:bg-[#27272a] dark:hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
