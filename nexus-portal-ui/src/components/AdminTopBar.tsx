"use client";

import React from 'react';
import { Search, Bell, Sun, Moon, Menu, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

type AdminTopBarProps = {
  currentUser: string;
  role?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
};

export default function AdminTopBar({
  currentUser, role, theme, onToggleTheme, onToggleSidebar
}: AdminTopBarProps) {
  const pathname = usePathname();

  const pathParts  = pathname.split('/').filter(p => p && p !== 'admin');
  const rawTitle   = pathParts[0] ?? 'Dashboard';
  const pageTitle  = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).replace(/-/g, ' ');

  return (
    <header className="
      sticky top-0 z-40 flex h-14 items-center justify-between
      border-b border-[#e4e4e7] bg-white px-4 lg:px-6
      dark:border-[#27272a] dark:bg-[#18181b]
      transition-colors duration-200
    ">
      {/* ── Left ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden rounded-md p-1.5 text-[#a1a1aa] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] transition-colors"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:block text-[#a1a1aa] dark:text-[#52525b] text-xs font-medium">
            Admin
          </span>
          <ChevronRight size={13} className="hidden sm:block text-[#d4d4d8] dark:text-[#3f3f46]" />
          <span className="font-semibold text-[#09090b] dark:text-white text-[13px]">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* ── Centre: Search ────────────────────── */}
      <div className="hidden lg:flex flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] dark:text-[#52525b]" />
          <input
            type="text"
            placeholder="Search..."
            className="
              w-full rounded-md border border-[#e4e4e7] bg-[#f4f4f5]
              py-1.5 pl-8 pr-3 text-[13px] text-[#09090b]
              placeholder:text-[#a1a1aa]
              focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
              dark:border-[#27272a] dark:bg-[#27272a] dark:text-white dark:placeholder:text-[#52525b]
              dark:focus:border-[#818cf8] dark:focus:bg-[#18181b]
              transition-all duration-150
            "
          />
        </div>
      </div>

      {/* ── Right ────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="rounded-md p-2 text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#09090b] dark:hover:bg-[#27272a] dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button className="relative rounded-md p-2 text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#09090b] dark:hover:bg-[#27272a] dark:hover:text-white transition-colors">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-[#e4e4e7] dark:bg-[#27272a]" />

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <div className="text-[12px] font-semibold text-[#09090b] dark:text-white leading-none">
              {currentUser}
            </div>
            <div className="mt-0.5 text-[10px] text-[#a1a1aa] dark:text-[#52525b]">
              {role === 'super_admin' ? 'Super Admin' : 'Client Admin'}
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1] text-[12px] font-bold text-white">
            {currentUser.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
