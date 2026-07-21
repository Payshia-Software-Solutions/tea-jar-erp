"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { fetchCompany, type CompanyRow } from "@/lib/api";

export function ReportShell({
  title,
  subtitle,
  actions,
  printMeta,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  printMeta?: React.ReactNode;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const auto = searchParams?.get("autoprint") === "1";

  const [company, setCompany] = React.useState<CompanyRow | null>(null);
  const [companyLoaded, setCompanyLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!isPrint) return;
    fetchCompany()
      .then(setCompany)
      .catch(console.error)
      .finally(() => setCompanyLoaded(true));
  }, [isPrint]);

  React.useEffect(() => {
    if (!isPrint) return;
    if (!auto) return;
    if (!companyLoaded) return;
    const t = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(t);
  }, [isPrint, auto, companyLoaded]);

  if (isPrint) {
    return (
      <>
        <style jsx global>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 12mm;
            }
            html,
            body {
              background: #fff !important;
              color: #0f172a !important;
              font-family: 'Inter', system-ui, sans-serif !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            
            /* Professional Print Table Styling */
            .print-pro-table table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 10pt !important;
            }
            .print-pro-table thead th {
              background-color: #1e293b !important; /* slate-800 */
              color: #ffffff !important;
              font-weight: 600 !important;
              padding: 8px 12px !important;
              border: 1px solid #334155 !important;
              text-transform: uppercase;
              font-size: 9pt !important;
              letter-spacing: 0.05em;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-pro-table tbody td {
              padding: 6px 12px !important;
              border-bottom: 1px solid #e2e8f0 !important;
              color: #334155 !important;
            }
            .print-pro-table tbody tr:nth-child(even) td {
              background-color: #f8fafc !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-pro-table tbody tr.bg-muted\\/30 td,
            .print-pro-table tbody tr.bg-muted\\/40 td {
              background-color: #e2e8f0 !important;
              color: #0f172a !important;
              font-weight: 700 !important;
              border-top: 2px solid #94a3b8 !important;
              border-bottom: 2px solid #94a3b8 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-pro-table .text-right {
              text-align: right !important;
              font-variant-numeric: tabular-nums;
            }
          }
        `}</style>

        <div className="print:hidden sticky top-0 z-10 bg-background/90 backdrop-blur border-b">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="font-semibold">{title}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.print()}>Print / Save as PDF</Button>
            </div>
          </div>
        </div>

        <div className="bg-muted/20 min-h-screen py-6 print:bg-white print:py-0">
          <div className="mx-auto max-w-7xl px-4 print:max-w-none print:px-0">
            <div className="bg-white border shadow-sm rounded-md p-6 print:border-0 print:shadow-none print:rounded-none print:p-0">
              <div className="flex items-start justify-between gap-6 print:border-b-2 print:border-slate-800 print:pb-4 print:mb-4">
                <div>
                  <div className="text-2xl font-bold leading-tight print:text-3xl print:font-extrabold print:uppercase print:tracking-tight print:text-slate-900">{title}</div>
                  {subtitle ? <div className="text-sm text-muted-foreground mt-1 print:font-medium print:text-slate-500">{subtitle}</div> : null}
                </div>
                <div className="text-right text-xs text-muted-foreground print:text-slate-500">
                  <div className="hidden print:block font-bold text-lg text-slate-800 uppercase tracking-widest mb-1">
                    {company?.name || "Official Report"}
                  </div>
                  {company && (company.address || company.phone) ? (
                    <div className="hidden print:block mb-2 text-sm text-slate-600 font-medium">
                      {company.address ? <div>{company.address}</div> : null}
                      {company.phone ? <div>{company.phone}</div> : null}
                    </div>
                  ) : null}
                  <div>Printed: {new Date().toLocaleString()}</div>
                </div>
              </div>
              {printMeta ? <div className="mt-4 text-sm text-muted-foreground print:bg-slate-50 print:p-4 print:rounded print:border print:font-medium print:text-slate-700 print:mb-6">{printMeta}</div> : null}
              <div className="mt-4 print:mt-0 print-pro-table">{children}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Button asChild variant="outline" className="gap-2 shrink-0">
            <Link href="/reports">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">{title}</h1>
            {subtitle ? <p className="text-muted-foreground mt-1 text-sm sm:text-base break-words">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
      {children}
    </DashboardLayout>
  );
}
