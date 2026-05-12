"use client";

import React from 'react';
import { 
  Zap, 
  Inbox, 
  UserCheck, 
  Layers, 
  CreditCard,
  LogOut,
  Sun,
  Moon,
  Globe,
  Building2,
  FileText,
  Mail,
  Send,
  X
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

type AdminSidebarProps = {
  activeTab?: string;
  currentUser: string;
  role?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function AdminSidebar({ activeTab, currentUser, role, theme, onToggleTheme, isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('http://localhost/rapair-management/nexus-portal-server/public/api/auth/logout', { credentials: 'include' });
    router.push('/admin/login');
  };

  const menuSections = [
    {
      title: "Main",
      items: [
        { id: 'requests', label: 'ERP Requests', icon: Inbox, roles: ['super_admin'] },
        { id: 'tenants', label: 'SaaS Tenants', icon: Layers, roles: ['super_admin'] },
        { id: 'packages', label: 'License Packages', icon: CreditCard, roles: ['super_admin'] },
        { id: 'subscription', label: 'Subscription', icon: Zap, roles: ['super_admin', 'client'] },
        { id: 'users', label: 'Client Accounts', icon: UserCheck, roles: ['super_admin'] },
      ]
    },
    {
      title: "Financials",
      items: [
        { id: 'invoices', label: 'Billing', icon: CreditCard, roles: ['super_admin'] },
        { id: 'payments', label: 'History', icon: FileText, roles: ['super_admin'] },
      ]
    },
    {
      title: "Communications",
      items: [
        { id: 'send-email', label: 'Broadcast', icon: Send, roles: ['super_admin'] },
        { id: 'email-logs', label: 'Audit Logs', icon: Mail, roles: ['super_admin'] },
      ]
    },
    {
      title: "System",
      items: [
        { id: 'settings/rates', label: 'Rates', icon: Globe, roles: ['super_admin'] },
        { id: 'settings/company', label: 'Branding', icon: Building2, roles: ['super_admin'] },
        { id: 'settings/mail', label: 'Mail Server', icon: Mail, roles: ['super_admin'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/5 
        flex flex-col h-screen z-[70] transition-all duration-300 ease-in-out
        lg:sticky lg:top-0 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 shrink-0 relative">
              <img 
                src="/icon-bizzflow-logo-optimized.webp" 
                alt="BizzFlow" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-black tracking-tighter text-indigo-600 dark:text-white uppercase">BIZZFLOW</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto custom-scrollbar">
          {menuSections.map((section, sIdx) => {
            const filteredItems = section.items.filter(item => !item.roles || (role && item.roles.includes(role)));
            if (filteredItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  {section.title}
                </h3>
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.includes(`/admin/${item.id}`) || (item.id === 'requests' && pathname === '/admin/dashboard');
                  
                  return (
                    <button 
                      key={item.id}
                      onClick={() => {
                        router.push(`/admin/${item.id}`);
                        if (window.innerWidth < 1024) onClose?.();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all ${
                        isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 mb-4 border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{currentUser}</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-tighter font-black truncate">{role === 'super_admin' ? 'Master Access' : 'Client Access'}</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              className="flex items-center justify-center p-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button 
              onClick={handleLogout}
              title="Logout"
              className="flex items-center justify-center p-2 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
