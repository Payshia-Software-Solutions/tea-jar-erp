"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchReportOverview } from "@/lib/api";
import { BarChart3, Calendar, Download, FileText, Clock, Wrench, Tags, ListChecks, Boxes, ArrowLeftRight, Car, Activity, AlertTriangle, Filter, ChevronRight, TrendingUp, Receipt, MapPin, Users, Percent, Database, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#2952A3", "#13C9EC", "#4AD991", "#FF9F43", "#FF4D4D", "#6C5CE7"];

type Overview = {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  ordersLast7Days: Array<{ date: string; count: number }>;
  counts: {
    vehicles: number;
    technicians: number;
    service_bays: number;
    repair_categories: number;
    checklist_templates: number;
  };
};

type ReportLink = {
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function ReportList({ items }: { items: ReportLink[] }) {
  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/10 transition-colors"
            >
              <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                <r.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">{r.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{r.desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-2" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string>("overview");

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchReportOverview();
      setData(d);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const statusData = useMemo(() => {
    const by = data?.ordersByStatus ?? {};
    return Object.keys(by).map((k) => ({ name: k, value: by[k] }));
  }, [data]);

  const groups = useMemo(() => {
    const inventory: ReportLink[] = [
      { title: "Stock Balance", desc: "All items, all or location-wise balances", href: "/reports/stock-balance", icon: Boxes },
      { title: "Item Movements", desc: "Pick an item to view its movements (GRN, adjustment, transfer, issues)", href: "/reports/item-movements", icon: Activity },
      { title: "Low Stock", desc: "Items below reorder level", href: "/reports/low-stock", icon: AlertTriangle },
      { title: "Stock Transfers", desc: "Transfer requests and fulfillment", href: "/reports/stock-transfers", icon: ArrowLeftRight },
      { title: "Item Master (Filters)", desc: "Filter items by brand/supplier/active", href: "/reports/items", icon: Filter },
    ];
    const purchasing: ReportLink[] = [
      { title: "Purchase Orders", desc: "PO list and exports", href: "/reports/purchase-orders", icon: FileText },
      { title: "GRN Summary", desc: "GRN list and exports", href: "/reports/grn", icon: FileText },
    ];
    const fleet: ReportLink[] = [
      { title: "Vehicles", desc: "Vehicle register and filters", href: "/reports/vehicles", icon: Car },
      { title: "Maintenance History", desc: "Pick a vehicle to view job history", href: "/reports/maintenance-history", icon: FileText },
    ];
      const sales: ReportLink[] = [
      { title: "Sale Summary", desc: "Daily/Monthly aggregation of sales totals", href: "/reports/sales/summary", icon: TrendingUp },
      { title: "Customer Statement", desc: "Detailed ledger of invoices, payments, and balances", href: "/reports/sales/statement", icon: FileText },
      { title: "Accounts Receivable Aging", desc: "Outstanding balances grouped by age (0-30, 30-60, etc)", href: "/reports/sales/aging", icon: AlertTriangle },
      { title: "Credit Sale Summary", desc: "Outstanding balances and credit days count", href: "/reports/sales/credit-summary", icon: TrendingUp },
      { title: "Invoice Report", desc: "Detailed list of invoices with status", href: "/reports/sales/invoices", icon: FileText },
      { title: "Payment Receipts", desc: "List of payment receipts by method", href: "/reports/sales/receipts", icon: Receipt },
      { title: "Day End Report", desc: "Comprehensive report for a specific day", href: "/reports/sales/day-end", icon: Clock },
      { title: "Location Sales", desc: "Sales performance by location", href: "/reports/sales/locations", icon: MapPin },
      { title: "Top Selling Items", desc: "Most popular products and services", href: "/reports/sales/top-items", icon: BarChart3 },
      { title: "Customer Sales", desc: "Sales totals per customer", href: "/reports/sales/customers", icon: Users },
      { title: "Item Wise Sales", desc: "Detailed sales data grouped by item", href: "/reports/sales/item-wise", icon: BarChart3 },
      { title: "Tax Report", desc: "Summary of taxes collected", href: "/reports/sales/tax", icon: Percent },
      { title: "Cancellations Report", desc: "Detailed list of all cancelled documents", href: "/reports/sales/cancellations", icon: AlertTriangle },
    ];
      return [
        { id: "overview", label: "Overview", icon: BarChart3, items: [] as ReportLink[] },
        { id: "sales", label: "Sales", icon: TrendingUp, items: sales },
        { id: "inventory", label: "Stock", icon: Boxes, items: inventory },
        { id: "purchasing", label: "Purchasing", icon: FileText, items: purchasing },
        { id: "fleet", label: "Vehicles", icon: Car, items: fleet },
      ];
    }, []);

  const groupById = useMemo(() => {
    const m = new Map<string, (typeof groups)[number]>();
    for (const g of groups) m.set(g.id, g);
    return m;
  }, [groups]);

  const currentGroup = groupById.get(activeGroup) ?? groups[0];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">Operational reports, exports, and audits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => void load()} disabled={loading}>
            <Download className="w-4 h-4" />
            Refresh
          </Button>
          <Button className="bg-primary gap-2" disabled>
            <Calendar className="w-4 h-4" />
            Last 7 Days
          </Button>
        </div>
      </div>

      <div className="md:hidden mb-6">
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Report Group</div>
            <Select value={activeGroup} onValueChange={setActiveGroup}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block mb-6">
        <Tabs value={activeGroup} onValueChange={setActiveGroup}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {groups.map((g) => (
              <TabsTrigger key={g.id} value={g.id} className="gap-2">
                <g.icon className="w-4 h-4" />
                {g.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {groups.map((g) => (
            <TabsContent key={g.id} value={g.id}>
              {g.id === "overview" ? null : <ReportList items={g.items} />}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {activeGroup !== "overview" ? (
        <div className="md:hidden mb-6">
          <ReportList items={currentGroup.items} />
        </div>
      ) : null}

      {activeGroup === "overview" ? (
        <>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Overview</h2>
              <p className="text-muted-foreground mt-1">Quick snapshot from the last 7 days</p>
            </div>
            {data ? (
              <Badge variant="outline" className="hidden sm:inline-flex">
                Total Orders: {data.totalOrders}
              </Badge>
            ) : null}
          </div>

          {loading || !data ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-md"><CardContent className="p-6">Loading...</CardContent></Card>
              <Card className="border-none shadow-md"><CardContent className="p-6">Loading...</CardContent></Card>
              <Card className="border-none shadow-md"><CardContent className="p-6">Loading...</CardContent></Card>
            </div>
          ) : (
            <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="border-none shadow-md md:col-span-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-3 bg-blue-50 rounded-full mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{data.totalOrders}</h3>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md md:col-span-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-3 bg-green-50 rounded-full mb-4">
                  <Wrench className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold">{data.counts.technicians}</h3>
                <p className="text-sm text-muted-foreground">Technicians</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md md:col-span-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-3 bg-cyan-50 rounded-full mb-4">
                  <Clock className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-2xl font-bold">{data.counts.service_bays}</h3>
                <p className="text-sm text-muted-foreground">Service Bays</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md md:col-span-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-3 bg-purple-50 rounded-full mb-4">
                  <Tags className="w-6 h-6 text-purple-700" />
                </div>
                <h3 className="text-2xl font-bold">{data.counts.repair_categories}</h3>
                <p className="text-sm text-muted-foreground">Categories</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md md:col-span-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-3 bg-rose-50 rounded-full mb-4">
                  <ListChecks className="w-6 h-6 text-rose-700" />
                </div>
                <h3 className="text-2xl font-bold">{data.counts.checklist_templates}</h3>
                <p className="text-sm text-muted-foreground">Checklist Templates</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
                <CardDescription>Current distribution of repair orders</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Orders (Last 7 Days)</CardTitle>
                <CardDescription>Daily creation volume</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ordersLast7Days}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2952A3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
            </>
          )}
        </>
      ) : null}
    </DashboardLayout>
  );
}
