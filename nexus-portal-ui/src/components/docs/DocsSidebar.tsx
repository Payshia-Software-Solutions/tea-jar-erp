"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  Terminal, 
  Wrench, 
  CreditCard, 
  Boxes, 
  BarChart3, 
  Users, 
  FileText,
  Search,
  Menu,
  X
} from "lucide-react";

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface SidebarGroup {
  category: string;
  links: SidebarLink[];
}

export default function DocsSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const sidebarGroups: SidebarGroup[] = [
    {
      category: "Getting Started",
      links: [
        { title: "Introduction & Architecture", href: "/docs", icon: BookOpen },
        { title: "Installation & Setup", href: "/docs/getting-started", icon: Terminal },
      ],
    },
    {
      category: "Core Modules",
      links: [
        { title: "RepairOS (ServiceBay)", href: "/docs/modules/repair-os", icon: Wrench },
        { title: "POS & Day Ledger", href: "/docs/modules/pos", icon: CreditCard },
        { title: "Inventory & FIFO", href: "/docs/modules/inventory", icon: Boxes },
        { title: "Accounting Engine", href: "/docs/modules/accounting", icon: BarChart3 },
        { title: "Employee & HRM", href: "/docs/modules/hrm", icon: Users },
        { title: "Invoice Lifecycle", href: "/docs/modules/invoicing", icon: FileText },
      ],
    },
  ];

  const filteredGroups = sidebarGroups.map(group => ({
    ...group,
    links: group.links.filter(link => 
      link.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.links.length > 0);

  const renderContent = () => (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={16} />
        <input 
          type="text" 
          placeholder="Search docs..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors font-semibold text-strong"
        />
      </div>

      <nav className="space-y-6">
        {filteredGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            <h5 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 px-3">
              {group.category}
            </h5>
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all text-left ${
                      isActive 
                        ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500" 
                        : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{link.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg focus:outline-none hover:bg-indigo-700 transition-colors"
          aria-label="Toggle Sidebar Menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop Sidebar (Left side) */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-thin">
        {renderContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Menu Drawer */}
          <div className="relative flex w-full max-w-xs flex-col bg-slate-50 dark:bg-[#070913] border-r border-slate-200 dark:border-slate-800 p-6 pt-20 shadow-xl overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
}
