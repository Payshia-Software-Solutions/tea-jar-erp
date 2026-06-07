"use client";

import React, { useEffect } from "react";
import { useDocs } from "@/app/docs/layout";
import DocsHeader from "@/components/docs/DocsHeader";
import Callout from "@/components/docs/Callout";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsPagination from "@/components/docs/DocsPagination";
import { motion } from "framer-motion";

export default function AccountingPage() {
  const { setTocItems } = useDocs();

  useEffect(() => {
    setTocItems([
      { id: "overview", title: "Overview", level: 2 },
      { id: "chart", title: "Chart of Accounts", level: 2 },
      { id: "rules", title: "Automated Journal Posting Rules", level: 2 },
    ]);
  }, [setTocItems]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <DocsHeader
        title="Accounting Engine"
        description="Specifications of the double-entry accounting ledger system, automated postings, and accounting charts."
        badge="Core Module"
        version="2.4.0"
      />

      {/* Overview */}
      <section id="overview" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Overview</h2>
        <p className="text-muted leading-relaxed font-medium">
          BizzFlow utilizes an automated, strict double-entry ledger. Every business action (such as checkout payments, inventory updates, or supplier bills) triggers corresponding ledger balances to debit and credit.
        </p>
      </section>

      {/* Chart of Accounts */}
      <section id="chart" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Chart of Accounts</h2>
        <p className="text-muted leading-relaxed font-medium">
          Accounts are categorized into Assets, Liabilities, Equity, Revenue, and Expenses. Example root accounts include:
        </p>
        <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 font-bold text-strong">Code</th>
                <th className="p-3 font-bold text-strong">Account Name</th>
                <th className="p-3 font-bold text-strong">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-muted font-medium">
              <tr>
                <td className="p-3 font-semibold">10100</td>
                <td className="p-3 text-strong font-semibold">Main Drawer Cash</td>
                <td className="p-3">Asset</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">12000</td>
                <td className="p-3 text-strong font-semibold">Accounts Receivable</td>
                <td className="p-3">Asset</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">13000</td>
                <td className="p-3 text-strong font-semibold">Inventory Assets</td>
                <td className="p-3">Asset</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">41000</td>
                <td className="p-3 text-strong font-semibold">Sales Revenue</td>
                <td className="p-3">Revenue</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Automated Journal Posting Rules */}
      <section id="rules" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Automated Journal Posting Rules</h2>
        <p className="text-muted leading-relaxed font-medium">
          Transactions are posted instantly at checkout, receipt allocation, and stock depletion. Here are the core automation rules:
        </p>
        
        <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 font-bold text-strong">Event</th>
                <th className="p-3 font-bold text-strong">Debit Account</th>
                <th className="p-3 font-bold text-strong">Credit Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-muted font-medium">
              <tr>
                <td className="p-3 font-semibold">Invoice Finalization</td>
                <td className="p-3 text-indigo-600 dark:text-indigo-400 font-semibold">Accounts Receivable</td>
                <td className="p-3">Sales Revenue / Output Tax Payable</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Cash POS Checkout</td>
                <td className="p-3 text-indigo-600 dark:text-indigo-400 font-semibold">Main Drawer Cash</td>
                <td className="p-3">Accounts Receivable</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Inventory Cost of Goods Sold</td>
                <td className="p-3 text-indigo-600 dark:text-indigo-400 font-semibold">Cost of Goods Sold (COGS)</td>
                <td className="p-3">Inventory Assets (FIFO cost)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock
          filename="POST /api/ledger/entry"
          language="json"
          code={`{
  "reference_id": "INV-2026-8041",
  "description": "Invoice sale allocation",
  "items": [
    { "account_id": "12000", "debit": 150.00, "credit": 0.00 },
    { "account_id": "41000", "debit": 0.00, "credit": 135.00 },
    { "account_id": "22000", "debit": 0.00, "credit": 15.00 }
  ]
}`}
        />

        <Callout type="info" title="System Balance Enforcement">
          The system database enforces a database trigger check: the sum of debits must equal the sum of credits for any transaction sequence, or the save transaction rolls back.
        </Callout>
      </section>

      <DocsPagination
        prev={{ title: "Inventory & FIFO", href: "/docs/modules/inventory" }}
        next={{ title: "Employee & HRM", href: "/docs/modules/hrm" }}
      />
    </motion.div>
  );
}
