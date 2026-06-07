"use client";

import React from "react";
import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DocsHeaderProps {
  title: string;
  category?: string;
  description?: string;
  version?: string;
  badge?: string;
  breadcrumbs?: BreadcrumbItem[];
  onMenuToggle?: () => void;
}

export default function DocsHeader({
  title,
  category,
  description,
  version = "Version 2.4.0",
  badge = "BizzFlow Showcase",
  breadcrumbs,
  onMenuToggle,
}: DocsHeaderProps) {
  return (
    <div className="mb-8 space-y-6">
      {/* Top Bar with Breadcrumbs & Mobile Trigger */}
      {(breadcrumbs || onMenuToggle) && (
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
          {breadcrumbs ? (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 font-bold uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight size={12} className="text-slate-400 dark:text-slate-600" />}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? "text-slate-800 dark:text-slate-200 font-extrabold" : ""}>
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          ) : (
            <div />
          )}

          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden transition-all"
              aria-label="Open documentation menu"
            >
              <Menu size={16} />
              <span>Menu</span>
            </button>
          )}
        </div>
      )}

      {/* Badges & Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          {badge && (
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/10">
              {badge}
            </span>
          )}
          {version && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {version}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {category && (
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-indigo-500/70">
              {category}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-strong">
            {title}
          </h1>
          {description && (
            <p className="text-muted text-base leading-relaxed font-medium">
              {description}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
