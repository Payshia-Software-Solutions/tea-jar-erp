"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({
  code,
  language = "javascript",
  filename,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Simple tokenization regex for basic syntax highlighting
  const highlightCode = (rawCode: string, lang: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return "";

    // Escape HTML special characters
    let html = cleanCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Syntax highlighting rules
    const rules = [
      // Comments
      {
        regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g,
        class: "text-slate-400 dark:text-slate-500 italic",
      },
      // Strings
      {
        regex: /(["'`])(.*?)\1/g,
        class: "text-emerald-600 dark:text-emerald-400",
      },
      // Keywords
      {
        regex:
          /\b(const|let|var|function|return|import|export|from|default|class|extends|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|typeof|instanceof|async|await|yield|package|public|private|protected|static|interface|type|implements|as|any|string|number|boolean|void)\b/g,
        class: "text-indigo-600 dark:text-indigo-400 font-bold",
      },
      // Numbers
      { regex: /\b(\d+)\b/g, class: "text-amber-600 dark:text-amber-400" },
      // SQL / Terminal keywords
      {
        regex: /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|SET|DELETE|CREATE|TABLE|DATABASE|mysql|npm|run|install|cd)\b/g,
        class: "text-purple-600 dark:text-purple-400 font-bold",
      },
    ];

    // Apply rules step-by-step
    // Note: To avoid nested tag collisions, we tokenize strings and comments first
    // Since this is a simple highlighter, a standard replace is fine.
    rules.forEach((rule) => {
      html = html.replace(rule.regex, (match) => {
        return `<span class="${rule.class}">${match}</span>`;
      });
    });

    return html;
  };

  const highlighted = highlightCode(code, language);
  const lines = code.trim().split("\n");

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 shadow-sm transition-all duration-300">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Decorative OS window dots */}
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 dark:bg-rose-500/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 dark:bg-amber-500/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 dark:bg-emerald-500/40" />
          </div>
          {filename && (
            <span className="ml-2 font-mono text-slate-500 dark:text-slate-400 font-semibold">
              {filename}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all font-semibold"
            aria-label="Copy code to clipboard"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                >
                  <Check size={14} />
                  <span>Copied</span>
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1"
                >
                  <Copy size={14} />
                  <span>Copy</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="relative flex overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        {showLineNumbers && (
          <div className="mr-4 select-none text-right text-xs text-slate-400 dark:text-slate-600">
            {lines.map((_, i) => (
              <div key={i} className="h-6">
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <pre className="flex-1 text-slate-700 dark:text-slate-300 font-mono focus:outline-none">
          <code
            className="block whitespace-pre font-mono"
            dangerouslySetInnerHTML={{ __html: highlighted || code }}
          />
        </pre>
      </div>
    </div>
  );
}
