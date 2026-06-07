"use client";

import React, { useEffect } from "react";
import { useDocs } from "@/app/docs/layout";
import DocsHeader from "@/components/docs/DocsHeader";
import Callout from "@/components/docs/Callout";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsPagination from "@/components/docs/DocsPagination";
import { Boxes, MoveDown, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function InventoryPage() {
  const { setTocItems } = useDocs();

  useEffect(() => {
    setTocItems([
      { id: "overview", title: "Overview", level: 2 },
      { id: "batches", title: "Batch Management", level: 2 },
      { id: "fifo", title: "FIFO Stock Control", level: 2 },
      { id: "grn", title: "Goods Receive Notes (GRN)", level: 2 },
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
        title="Inventory & FIFO Stock Control"
        description="Understand how batch-tracked items are logged through GRNs and dynamically decremented via First-In-First-Out (FIFO) logic."
        badge="Core Module"
        version="2.4.0"
      />

      {/* Overview */}
      <section id="overview" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Overview</h2>
        <p className="text-muted leading-relaxed font-medium">
          The Inventory Module controls parts tracking, purchasing, supplier catalogs, and real-time quantities. It supports multiple warehouse locations and automates stock re-order triggers.
        </p>
      </section>

      {/* Batch Management */}
      <section id="batches" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Batch Management</h2>
        <p className="text-muted leading-relaxed font-medium">
          Items in the database (particularly high-value items, oils, or batteries) are tracked by individual batches. Each batch records:
        </p>
        <ul className="list-disc pl-6 text-muted text-sm space-y-2 font-medium">
          <li><strong>Batch ID & Code:</strong> Unique identifiers like `BCH-5942-01`.</li>
          <li><strong>Unit Cost:</strong> Supplier purchase price associated with that specific batch.</li>
          <li><strong>Dates:</strong> Manufacture and expiration dates to warn when items are getting close to retirement.</li>
        </ul>
      </section>

      {/* FIFO Stock Control */}
      <section id="fifo" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">FIFO Stock Control</h2>
        <p className="text-muted leading-relaxed font-medium">
          When an item is invoiced, the system employs **First-In-First-Out (FIFO)** logic. It automatically scans available batches for that product code, sorted by the oldest receipt date, and decrements stock.
        </p>
        
        <div className="my-6 border border-slate-200 dark:border-slate-800 p-6 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
          <h4 className="text-sm font-bold text-strong mb-4">FIFO Deduction Priority</h4>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex justify-between items-center">
              <span>Batch A (Created: Jan 01)</span>
              <span>10 units available (DEDUCTED FIRST)</span>
            </div>
            <div className="flex justify-center text-slate-400">
              <MoveDown size={16} />
            </div>
            <div className="p-3 bg-indigo-500/5 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg flex justify-between items-center">
              <span>Batch B (Created: Feb 15)</span>
              <span>25 units available (DEDUCTED NEXT)</span>
            </div>
          </div>
        </div>

        <Callout type="warning" title="Negative Stock Override">
          If physical stocks are depleted, the system flags the sale. Negative stock levels are blocked unless overriding administrator privileges are granted in settings.
        </Callout>
      </section>

      {/* Goods Receive Notes (GRN) */}
      <section id="grn" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Goods Receive Notes (GRN)</h2>
        <p className="text-muted leading-relaxed font-medium">
          Goods Receive Notes register arrival of parts from vendors. Generating a GRN updates the associated Purchase Order status and automatically instantiates a new batch in the database:
        </p>
        <CodeBlock
          filename="POST /api/grn/new"
          language="json"
          code={`{
  "purchase_order_id": "PO-10904",
  "received_items": [
    {
      "product_id": "PROD-8841",
      "quantity_received": 50,
      "unit_cost": 42.50,
      "batch_code": "BCH-10904-A"
    }
  ]
}`}
        />
      </section>

      <DocsPagination
        prev={{ title: "POS & Day Ledger", href: "/docs/modules/pos" }}
        next={{ title: "Accounting Engine", href: "/docs/modules/accounting" }}
      />
    </motion.div>
  );
}
