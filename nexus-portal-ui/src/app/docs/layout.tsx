"use client";

import React, { createContext, useContext, useState } from "react";
import DocsSidebar from "@/components/docs/DocsSidebar";
import TableOfContents from "@/components/docs/TableOfContents";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface DocsContextType {
  tocItems: TOCItem[];
  setTocItems: (items: TOCItem[]) => void;
}

const DocsContext = createContext<DocsContextType | undefined>(undefined);

export const useDocs = () => {
  const context = useContext(DocsContext);
  if (!context) {
    throw new Error("useDocs must be used within a DocsProvider");
  }
  return context;
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);

  return (
    <DocsContext.Provider value={{ tocItems, setTocItems }}>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background ambient lighting/glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-8 select-none">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
              <Home size={10} />
              Home
            </Link>
            <ChevronRight size={10} />
            <span className="text-strong font-extrabold">Documentation</span>
          </nav>

          {/* Main Layout Grid */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Sidebar Column */}
            <DocsSidebar />

            {/* Main Content Column */}
            <div className="flex-1 min-w-0 w-full lg:max-w-3xl">
              <div className="glass p-6 sm:p-10 border-slate-200 dark:border-white/5 shadow-xl min-h-[500px]">
                {children}
              </div>
            </div>

            {/* Table of Contents Column */}
            <aside className="hidden xl:block w-48 shrink-0 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pl-4 border-l border-slate-200 dark:border-slate-800">
              <TableOfContents items={tocItems} />
            </aside>
          </div>
        </div>
      </div>
    </DocsContext.Provider>
  );
}
