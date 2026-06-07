"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface PageLink {
  title: string;
  id?: string;
  href?: string;
}

interface DocsPaginationProps {
  prev?: PageLink | null;
  next?: PageLink | null;
  onPageChange?: (id: string) => void;
}

export default function DocsPagination({ prev, next, onPageChange }: DocsPaginationProps) {
  const renderPrevContent = () => (
    <>
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
        Previous
      </span>
      <span className="mt-2 text-base font-bold text-slate-800 dark:text-slate-200 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
        {prev?.title}
      </span>
    </>
  );

  const renderNextContent = () => (
    <>
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Next
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </span>
      <span className="mt-2 text-base font-bold text-slate-800 dark:text-slate-200 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
        {next?.title}
      </span>
    </>
  );

  const buttonStyle =
    "group flex flex-1 flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-5 transition-all hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:border-indigo-500/50";

  return (
    <div className="mt-12 flex flex-col sm:flex-row gap-4 border-t border-slate-200 dark:border-slate-800 pt-8">
      {/* Previous Link */}
      {prev ? (
        prev.href ? (
          <Link href={prev.href || "#"} className={`${buttonStyle} items-start text-left`}>
            {renderPrevContent()}
          </Link>
        ) : prev.id ? (
          <motion.button
            onClick={() => onPageChange && prev.id && onPageChange(prev.id)}
            whileHover={{ x: -4 }}
            transition={{ duration: 0.2 }}
            className={`${buttonStyle} items-start text-left`}
          >
            {renderPrevContent()}
          </motion.button>
        ) : (
          <div className={`${buttonStyle} items-start text-left opacity-50 cursor-not-allowed`}>
            {renderPrevContent()}
          </div>
        )
      ) : (
        <div className="flex-1 hidden sm:block" />
      )}

      {/* Next Link */}
      {next ? (
        next.href ? (
          <Link href={next.href || "#"} className={`${buttonStyle} items-end text-right`}>
            {renderNextContent()}
          </Link>
        ) : next.id ? (
          <motion.button
            onClick={() => onPageChange && next.id && onPageChange(next.id)}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
            className={`${buttonStyle} items-end text-right`}
          >
            {renderNextContent()}
          </motion.button>
        ) : (
          <div className={`${buttonStyle} items-end text-right opacity-50 cursor-not-allowed`}>
            {renderNextContent()}
          </div>
        )
      ) : (
        <div className="flex-1 hidden sm:block" />
      )}
    </div>
  );
}
// Force Turbopack reload
