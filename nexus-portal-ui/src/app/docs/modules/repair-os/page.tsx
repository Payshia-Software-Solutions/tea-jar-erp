"use client";

import React, { useEffect } from "react";
import { useDocs } from "@/app/docs/layout";
import DocsHeader from "@/components/docs/DocsHeader";
import Callout from "@/components/docs/Callout";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsPagination from "@/components/docs/DocsPagination";
import { ArrowRight, Wrench, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function RepairOSPage() {
  const { setTocItems } = useDocs();

  useEffect(() => {
    setTocItems([
      { id: "overview", title: "Overview", level: 2 },
      { id: "states", title: "Repair Lifecycle States", level: 2 },
      { id: "allocation", title: "ServiceBay Allocation", level: 2 },
      { id: "metrics", title: "Technician Metrics & Timers", level: 2 },
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
        title="RepairOS (ServiceBay)"
        description="Detailed operator and developer guide for workshop intakes, active bay scheduling, and technician task tracking."
        badge="Core Module"
        version="2.4.0"
      />

      {/* Overview */}
      <section id="overview" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Overview</h2>
        <p className="text-muted leading-relaxed font-medium">
          RepairOS acts as the nervous system for vehicle mechanics and workshop centers. It controls customer service agreements, monitors physical repair spaces (Bays), and logs technician workload and metrics.
        </p>
      </section>

      {/* Repair Lifecycle States */}
      <section id="states" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Repair Lifecycle States</h2>
        <p className="text-muted leading-relaxed font-medium">
          Every repair job transitions through a set of predefined operational states to guarantee data integrity across the POS and inventory modules.
        </p>
        
        <div className="flex flex-col md:flex-row items-stretch gap-4 my-6">
          <div className="flex-1 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between">
            <div>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded">
                PENDING
              </span>
              <p className="text-xs text-muted mt-3 font-medium">
                The customer intake sheet is created. The vehicle is parked in holding, awaiting bay/technician assignment.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center text-muted">
            <ArrowRight className="rotate-90 md:rotate-0" size={16} />
          </div>
          <div className="flex-1 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between">
            <div>
              <span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded">
                IN PROGRESS
              </span>
              <p className="text-xs text-muted mt-3 font-medium">
                The vehicle is moved to a physical bay. Active timers monitor mechanic work logs and track parts consumed.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center text-muted">
            <ArrowRight className="rotate-90 md:rotate-0" size={16} />
          </div>
          <div className="flex-1 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between">
            <div>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded">
                COMPLETED
              </span>
              <p className="text-xs text-muted mt-3 font-medium">
                Technician files checklist, stops timers. Parts and labor pricing items push directly to POS for cashier checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ServiceBay Allocation */}
      <section id="allocation" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">ServiceBay Allocation</h2>
        <p className="text-muted leading-relaxed font-medium">
          Physical shop floor spaces are defined as ServiceBays. You can query bay availability using the bays endpoint:
        </p>
        <CodeBlock
          filename="GET /api/bays/availability"
          language="json"
          code={`[
  {
    "bay_id": 4,
    "bay_name": "Bay D - Heavy Duty Lift",
    "status": "occupied",
    "active_ticket_id": "WO-2026-0042",
    "assigned_technician": "John Doe"
  },
  {
    "bay_id": 5,
    "bay_name": "Bay E - Alignment Rack",
    "status": "available",
    "active_ticket_id": null,
    "assigned_technician": null
  }
]`}
        />
        <Callout type="tip" title="Bay Conflict Validation">
          The database has unique index constraints mapping `active_ticket_id` to `bay_id`. This prevents double-assigning a work order to multiple bays.
        </Callout>
      </section>

      {/* Technician Metrics & Timers */}
      <section id="metrics" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Technician Metrics & Timers</h2>
        <p className="text-muted leading-relaxed font-medium">
          Technician productivity index is calculated from estimated vs actual hours logged. Timers must be dispatched via server endpoints:
        </p>
        <CodeBlock
          filename="POST /api/work-orders/timer"
          language="json"
          code={`{
  "ticket_id": "WO-2026-0042",
  "action": "start", // options: start, pause, stop
  "note": "Replaced transmission mounts"
}`}
        />
      </section>

      <DocsPagination
        prev={{ title: "Installation & Setup", href: "/docs/getting-started" }}
        next={{ title: "POS & Day Ledger", href: "/docs/modules/pos" }}
      />
    </motion.div>
  );
}
