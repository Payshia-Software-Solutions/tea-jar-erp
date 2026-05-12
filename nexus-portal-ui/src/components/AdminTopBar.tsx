"use client";

import React from 'react';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  User, 
  ChevronRight,
  Sun,
  Moon,
  Zap,
  Menu
} from 'lucide-react';
import { usePathname } from 'next/navigation';

type AdminTopBarProps = {
  currentUser: string;
  role?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
};

export default function AdminTopBar({ currentUser, role, theme, onToggleTheme, onToggleSidebar }: AdminTopBarProps) {
  const pathname = usePathname();
  
  // Format pathname to breadcrumbs/title
  const pathParts = pathname.split('/').filter(p => p && p !== 'admin');
  const pageTitle = pathParts.length > 0 
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1).replace('-', ' ') 
    : 'Dashboard';

  return (
    <header className="h-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300">
      <div className="flex items-center gap-4 lg:gap-8">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
        >
          <Menu size={20} />
        </button>
        {/* Page Identity */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management</div>
          <ChevronRight size={14} className="text-slate-300" />
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{pageTitle}</h2>
        </div>
        <div className="sm:hidden flex items-center">
           <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{pageTitle}</h2>
        </div>

        {/* Global Search */}
        <div className="hidden lg:flex items-center relative group">
          <Search className="absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search resources, tenants, or records..." 
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-xs w-80 focus:w-96 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-4 border-r border-slate-200 dark:border-white/5">
          <button 
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="hidden sm:block p-2.5 text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950"></span>
          </button>
          <button className="hidden sm:block p-2.5 text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all">
            <HelpCircle size={20} />
          </button>
        </div>

        {/* Profile Quick Access */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black opacity-60">
              {role === 'super_admin' ? 'Master Access' : 'Client Admin'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20">
            {currentUser.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
