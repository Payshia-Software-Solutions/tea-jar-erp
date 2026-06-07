"use client";

import React, { useEffect } from "react";
import { useDocs } from "@/app/docs/layout";
import DocsHeader from "@/components/docs/DocsHeader";
import Callout from "@/components/docs/Callout";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsPagination from "@/components/docs/DocsPagination";
import { motion } from "framer-motion";

export default function HRMPage() {
  const { setTocItems } = useDocs();

  useEffect(() => {
    setTocItems([
      { id: "overview", title: "Overview", level: 2 },
      { id: "attendance", title: "Attendance Tracking", level: 2 },
      { id: "leaves", title: "Leaves & Approvals", level: 2 },
      { id: "payroll", title: "Payroll Calculations", level: 2 },
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
        title="Employee & HRM"
        description="Operator guidelines for tracking employee logs, attendance schedules, leave applications, and automated payroll runs."
        badge="Core Module"
        version="2.4.0"
      />

      {/* Overview */}
      <section id="overview" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Overview</h2>
        <p className="text-muted leading-relaxed font-medium">
          The HRM Module manages employee lifecycle events: check-ins, break times, vacation balances, and salary sheets. Integration with ServiceBay also logs diagnostic efficiency metrics for technicians.
        </p>
      </section>

      {/* Attendance Tracking */}
      <section id="attendance" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Attendance Tracking</h2>
        <p className="text-muted leading-relaxed font-medium">
          Cashiers and technicians check-in directly using a terminalPIN code or biometric integration. This creates database shift events:
        </p>
        <CodeBlock
          filename="POST /api/attendance/check-in"
          language="json"
          code={`{
  "employee_pin": "5921",
  "location_id": 1,
  "check_in_time": "2026-06-07T08:00:00Z"
}`}
        />
      </section>

      {/* Leaves & Approvals */}
      <section id="leaves" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Leaves & Approvals</h2>
        <p className="text-muted leading-relaxed font-medium">
          Vacation requests are submitted through employee profiles. Approvals route to branch managers.
        </p>
        <Callout type="info" title="Leave Balances">
          Annual leave balances are accrued monthly based on employment tenure. Overdraft policies can be set per role in the Settings panel.
        </Callout>
      </section>

      {/* Payroll Calculations */}
      <section id="payroll" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Payroll Calculations</h2>
        <p className="text-muted leading-relaxed font-medium">
          Payroll runs occur monthly or bi-weekly. Calculated fields combine base salary, overtime hourly rates, deductions (taxes, leaves), and workshop performance bonuses:
        </p>
        <CodeBlock
          filename="Payroll formula"
          language="javascript"
          code={`Gross Salary = Base Salary + Overtime Pay + Workshop Commission
Net Salary = Gross Salary - Tax Deductions - Unpaid Leave Deductions`}
        />
      </section>

      <DocsPagination
        prev={{ title: "Accounting Engine", href: "/docs/modules/accounting" }}
        next={{ title: "Invoice Lifecycle", href: "/docs/modules/invoicing" }}
      />
    </motion.div>
  );
}
