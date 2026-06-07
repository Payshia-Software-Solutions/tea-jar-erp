"use client";

import React from "react";
import { Info, AlertTriangle, Lightbulb, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";

export type CalloutType = "info" | "warning" | "tip" | "danger";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

export default function Callout({ type = "info", title, children }: CalloutProps) {
  const configs = {
    info: {
      icon: Info,
      bg: "bg-blue-50/70 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-900/50",
      accent: "border-l-4 border-l-blue-500",
      text: "text-blue-800 dark:text-blue-300",
      titleText: "text-blue-900 dark:text-blue-200",
      iconColor: "text-blue-500 dark:text-blue-400",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-amber-50/70 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-900/50",
      accent: "border-l-4 border-l-amber-500",
      text: "text-amber-800 dark:text-amber-300",
      titleText: "text-amber-900 dark:text-amber-200",
      iconColor: "text-amber-500 dark:text-amber-400",
    },
    tip: {
      icon: Lightbulb,
      bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-900/50",
      accent: "border-l-4 border-l-emerald-500",
      text: "text-emerald-800 dark:text-emerald-300",
      titleText: "text-emerald-900 dark:text-emerald-200",
      iconColor: "text-emerald-500 dark:text-emerald-400",
    },
    danger: {
      icon: AlertOctagon,
      bg: "bg-rose-50/70 dark:bg-rose-950/20",
      border: "border-rose-200 dark:border-rose-900/50",
      accent: "border-l-4 border-l-rose-500",
      text: "text-rose-800 dark:text-rose-300",
      titleText: "text-rose-900 dark:text-rose-200",
      iconColor: "text-rose-500 dark:text-rose-400",
    },
  };

  const current = configs[type];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className={`my-6 flex gap-4 rounded-xl border p-4 shadow-sm ${current.bg} ${current.border} ${current.accent}`}
    >
      <div className={`mt-0.5 shrink-0 ${current.iconColor}`}>
        <Icon size={22} className="stroke-[2.25]" />
      </div>
      <div className="flex-1 space-y-1">
        {title && (
          <h5 className={`font-bold tracking-tight text-sm ${current.titleText}`}>
            {title}
          </h5>
        )}
        <div className={`text-sm font-medium leading-relaxed ${current.text}`}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
