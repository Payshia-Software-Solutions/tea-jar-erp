"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  RefreshCcw,
  AlertCircle,
  FileText,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSalesDashboard, type SalesDashboardData } from "@/lib/api";
import { format } from "date-fns";

const PIE_COLORS = ["#2952A3", "#13C9EC", "#4AD991", "#FF9F43", "#FF4560", "#775DD0"];

export default function SalesDashboardPage() {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const d = await fetchSalesDashboard();
      setData(d);
    } catch (e) {
      setError((e as Error).message || "Failed to load sales dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const chartData = useMemo(() => {
    return (data?.revenueTrend || []).map(r => ({
      name: format(new Date(r.date), "MMM d"),
      revenue: r.revenue
    }));
  }, [data]);

  const pieData = useMemo(() => {
    return (data?.paymentMethods || [])
      .filter(p => p.amount > 0)
      .map(p => ({
        name: p.method,
        value: p.amount
      }));
  }, [data]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Crunching sales numbers...</p>
        </div>
      </DashboardLayout>
    );
  }

  const kpis = [
    {
      label: "Revenue Today",
      value: formatCurrency(data?.kpis?.today?.revenue || 0),
      sub: `${data?.kpis?.today?.count || 0} Invoices today`,
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "MTD Revenue",
      value: formatCurrency(data?.kpis?.month?.revenue || 0),
      sub: "Month to date",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Today Collections",
      value: formatCurrency(data?.kpis?.today?.collection || 0),
      sub: "Payments received today",
      icon: CreditCard,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      label: "MTD Collections",
      value: formatCurrency(data?.kpis?.month?.collection || 0),
      sub: "Payments received this month",
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: "Outstanding",
      value: formatCurrency(data?.kpis?.outstanding || 0),
      sub: "Total unpaid balance",
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50"
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time financial performance and revenue insights</p>
          </div>
          <div className="flex items-center gap-2">
             <Button 
              variant="outline" 
              onClick={() => void load(true)} 
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCcw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Sync Data
            </Button>
            <Link href="/cms/invoices/new">
              <Button className="gap-2">
                <FileText className="w-4 h-4" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((k, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{k.label}</p>
                    <p className="text-2xl font-black">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{k.sub}</p>
                  </div>
                  <div className={cn("p-3 rounded-2xl", k.bg, k.color)}>
                    <k.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Trend Area Chart */}
          <Card className="lg:col-span-8 border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                  <CardDescription>Daily gross revenue (last 30 days)</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                  Last 30 Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2952A3" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2952A3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(v) => `LKR ${v/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }} 
                    formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2952A3" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods Pie Chart */}
          <Card className="lg:col-span-4 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Payment Methods</CardTitle>
              <CardDescription>Market share by volume</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-0">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v) => formatCurrency(Number(v))}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full mt-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className="text-xs font-medium text-muted-foreground truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Top Items & Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Top Performing Items</CardTitle>
              </div>
              <CardDescription>Best-selling parts and services this month</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted/50">
                {(data?.topItems || []).length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No data for this period</div>
                ) : (
                  data?.topItems.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-bold truncate max-w-[250px]">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.qty} units sold</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">{formatCurrency(item.revenue)}</p>
                        <div className="w-24 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ 
                              width: `${(item.revenue / (data?.topItems?.[0]?.revenue || 1)) * 100}%` 
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales Invoices */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </div>
              <CardDescription>Latest invoices generated across all locations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted/50">
                {(data?.recentSales || []).length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No recent invoices</div>
                ) : (
                  data?.recentSales.map((sale) => (
                    <Link 
                      key={sale.id} 
                      href={`/cms/invoices/${sale.id}/view`}
                      className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          sale.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 
                          sale.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'
                        )}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{sale.customer_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground">{sale.invoice_no}</span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(sale.date), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-black">{formatCurrency(sale.total)}</p>
                          <Badge className={cn(
                            "text-[9px] uppercase tracking-tighter px-1.5 py-0 h-4 border-none",
                            sale.status === 'Paid' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                            sale.status === 'Cancelled' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-orange-500 hover:bg-orange-600'
                          )}>
                            {sale.status}
                          </Badge>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
            <div className="p-4 bg-muted/10 border-t flex justify-center">
              <Link href="/cms/invoices">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-muted font-bold text-muted-foreground uppercase tracking-widest">
                  View All Invoices
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
