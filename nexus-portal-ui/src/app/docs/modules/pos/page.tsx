"use client";

import React, { useEffect } from "react";
import { useDocs } from "@/app/docs/layout";
import DocsHeader from "@/components/docs/DocsHeader";
import Callout from "@/components/docs/Callout";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsPagination from "@/components/docs/DocsPagination";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function POSPage() {
  const { setTocItems } = useDocs();

  useEffect(() => {
    setTocItems([
      { id: "checkout", title: "POS Checkout", level: 2 },
      { id: "ledgers", title: "Day Ledgers & Auditing", level: 2 },
      { id: "reversal-rules", title: "Cancelled Receipt Reversal Rules", level: 2 },
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
        title="POS & Day Ledger"
        description="Operational guide for the checkout interface, cash drawers, and journal balancing upon receipt cancellations."
        badge="Core Module"
        version="2.4.0"
      />

      {/* Checkout Screen */}
      <section id="checkout" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">POS Checkout</h2>
        <p className="text-muted leading-relaxed font-medium">
          The POS Checkout module handles walk-in retail purchases and repair invoice redemptions. It supports:
        </p>
        <ul className="list-disc pl-6 text-muted text-sm space-y-2 font-medium">
          <li><strong>Split Payments:</strong> Split total across multiple payment gateways (e.g. 50% Cash, 50% Card).</li>
          <li><strong>Sequence Numbers:</strong> Strictly sequential invoice and receipt numbering using database sequence generators.</li>
          <li><strong>Offline Cache:</strong> Temporary local storage queue in case of brief network disconnects.</li>
        </ul>
      </section>

      {/* Day Ledger & Auditing */}
      <section id="ledgers" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Day Ledgers & Auditing</h2>
        <p className="text-muted leading-relaxed font-medium">
          A Day Ledger monitors cash inflows and outflows at a physical terminal during a single day.
        </p>
        <Callout type="info" title="Day End Reconciliation">
          At the end of a shift, cashiers run a "Day End closing process" to match actual cash drawer counts with computed ledger totals. Differences are posted to the `Cash Short/Over` account automatically.
        </Callout>
      </section>

      {/* Cancelled Receipt Reversal Rules */}
      <section id="reversal-rules" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Cancelled Receipt Reversal Rules</h2>
        <p className="text-muted leading-relaxed font-medium">
          To maintain strict financial compliance, paid receipts cannot be simply deleted. If an operator cancels a receipt, the system enforces the following reversal flow:
        </p>

        <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
          <h4 className="font-bold text-strong text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-500" /> System Reversal Flow
          </h4>
          <ul className="text-xs text-muted list-decimal pl-5 space-y-2.5 font-medium leading-relaxed">
            <li><strong>Ledger Exclusion:</strong> The cancelled receipt status updates to `Cancelled`. It is immediately excluded from POS Day Ledger sums and Day End closing sheets.</li>
            <li><strong>Journal Reversals:</strong> Reverse double-entry rows are pushed. The system credits the `Cash/Bank` account and debits `Accounts Receivable`.</li>
            <li><strong>Invoice Balance Restore:</strong> The payment record is purged from the `invoice_payments` tracking table, restoring the invoice's outstanding balance to its pre-payment state.</li>
          </ul>
        </div>

        <CodeBlock
          filename="receipt_cancellation.sql"
          language="sql"
          code={`-- Step 1: Update payment receipt status
UPDATE pos_receipts SET status = 'CANCELLED' WHERE id = 1042;

-- Step 2: Delete mapped invoice payment relation to restore invoice outstanding balance
DELETE FROM invoice_payments WHERE receipt_id = 1042;`}
        />
      </section>

      <DocsPagination
        prev={{ title: "RepairOS (ServiceBay)", href: "/docs/modules/repair-os" }}
        next={{ title: "Inventory & FIFO", href: "/docs/modules/inventory" }}
      />
    </motion.div>
  );
}
