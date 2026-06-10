"use client"

import React, { useEffect, useState, useMemo } from "react";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  MessageSquare,
  Wrench,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  ArrowRight,
  ClipboardList,
  Building2,
  Calendar as CalendarIcon,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchDashboardOverview, 
  fetchSalesDashboard, 
  fetchEmployees, 
  fetchInquiries, 
  fetchCustomers, 
  fetchParts,
  fetchHotelReservations,
  fetchBanquetBookings,
  fetchOnlineOrders,
  type DashboardOverview, 
  type SalesDashboardData 
} from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";

const COLORS = {
  sales: "#2952A3",
  orders: "#13C9EC",
  inventory: "#4AD991",
  crm: "#FF9F43",
};

export default function OverallDashboardPage() {
  const [workshopData, setWorkshopData] = useState<DashboardOverview | null>(null);
  const [salesData, setSalesData] = useState<SalesDashboardData | null>(null);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [newInquiriesCount, setNewInquiriesCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  
  // Hospitality & E-commerce metrics
  const [activeReservations, setActiveReservations] = useState<number>(0);
  const [activeBanquets, setActiveBanquets] = useState<number>(0);
  const [pendingOnlineOrders, setPendingOnlineOrders] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, s, staff, inq, cust, parts, hotel, banquets, online] = await Promise.all([
        fetchDashboardOverview().catch(() => null),
        fetchSalesDashboard().catch(() => null),
        fetchEmployees().catch(() => []),
        fetchInquiries({ status: 'New' }).catch(() => ({ data: [] })),
        fetchCustomers().catch(() => []),
        fetchParts().catch(() => []),
        fetchHotelReservations().catch(() => ({ data: [] })),
        fetchBanquetBookings().catch(() => ({ data: [] })),
        fetchOnlineOrders().catch(() => ({ data: [] }))
      ]);
      
      setWorkshopData(w);
      setSalesData(s);
      
      // Real data processing
      setStaffCount(Array.isArray(staff) ? staff.filter(e => e.status === 'Active').length : 0);
      
      const inqList = inq?.data || (Array.isArray(inq) ? inq : []);
      setNewInquiriesCount(inqList.length);
      
      setCustomerCount(Array.isArray(cust) ? cust.length : 0);
      
      const lowStock = Array.isArray(parts) 
        ? parts.filter(p => p.item_type === 'Part' && p.stock_quantity <= (p.reorder_level || 0)).length 
        : 0;
      setLowStockCount(lowStock);

      // Hospitality & E-commerce
      const hotelList = hotel?.data || (Array.isArray(hotel) ? hotel : []);
      setActiveReservations(hotelList.filter((r: any) => r.status === 'CheckedIn').length);
      
      const banquetList = banquets?.data || (Array.isArray(banquets) ? banquets : []);
      setActiveBanquets(banquetList.filter((b: any) => b.status === 'Confirmed').length);

      const onlineList = online?.data || (Array.isArray(online) ? online : []);
      setPendingOnlineOrders(onlineList.filter((o: any) => o.order_status === 'Pending').length);

      setLastUpdatedAt(new Date());
    } catch (e) {
      setError("Failed to load some dashboard data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    const t = window.setInterval(() => void loadAll(), 60000); // Update every minute
    return () => window.clearInterval(t);
  }, []);

  const workshopStats = useMemo(() => {
    if (!workshopData) return null;
    const status = workshopData.ordersByStatus || {};
    return {
      pending: status["Pending"] || 0,
      active: status["In Progress"] || 0,
      completed: workshopData.completedToday || 0,
    };
  }, [workshopData]);

  const salesStats = useMemo(() => {
    if (!salesData) return null;
    return {
      today: salesData.kpis?.today?.revenue || 0,
      count: salesData.kpis?.today?.count || 0,
      month: salesData.kpis?.month?.revenue || 0,
    };
  }, [salesData]);

  const combinedTrendData = useMemo(() => {
    return salesData?.revenueTrend?.map(r => ({
      date: r.date.slice(5),
      amount: r.amount || r.revenue || 0
    })) || [];
  }, [salesData]);

  const kpis = useMemo(() => [
    {
      key: "sales",
      label: "Revenue Today",
      value: salesStats ? `LKR ${salesStats.today.toLocaleString()}` : "---",
      icon: DollarSign,
      helper: `${salesStats?.count || 0} Invoices today`,
      tone: {
        bg: "bg-gradient-to-br from-blue-50 via-white to-white dark:from-primary/15 dark:via-card dark:to-card",
        icon: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
        ring: "ring-primary/15 dark:ring-primary/20",
      }
    },
    {
      key: "workshop",
      label: "Active Jobs",
      value: workshopStats ? workshopStats.active : "---",
      icon: Wrench,
      helper: `${workshopStats?.pending || 0} pending orders`,
      tone: {
        bg: "bg-gradient-to-br from-cyan-50 via-white to-white dark:from-cyan-500/10 dark:via-card dark:to-card",
        icon: "bg-cyan-600/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200",
        ring: "ring-cyan-600/15 dark:ring-cyan-500/20",
      }
    },
    {
      key: "crm",
      label: "New Inquiries",
      value: newInquiriesCount,
      icon: MessageSquare,
      helper: newInquiriesCount > 0 ? "Needs attention" : "No new inquiries",
      tone: {
        bg: "bg-gradient-to-br from-orange-50 via-white to-white dark:from-orange-500/10 dark:via-card dark:to-card",
        icon: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
        ring: "ring-orange-500/15 dark:ring-orange-500/20",
      }
    },
    {
      key: "inventory",
      label: "Low Stock Alert",
      value: lowStockCount,
      icon: Package,
      helper: lowStockCount > 0 ? "Immediate restock needed" : "Stock health good",
      tone: {
        bg: "bg-gradient-to-br from-green-50 via-white to-white dark:from-green-500/10 dark:via-card dark:to-card",
        icon: "bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-300",
        ring: "ring-green-600/15 dark:ring-green-500/20",
      }
    }
  ], [salesStats, workshopStats, newInquiriesCount, lowStockCount]);

  const chartStroke = "hsl(var(--border))";
  const chartTick = "hsl(var(--muted-foreground))";
  const tooltipStyle = {
    borderRadius: "12px",
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--popover))",
    color: "hsl(var(--popover-foreground))",
    boxShadow: "0 10px 30px rgba(2, 6, 23, 0.25)",
    fontSize: "12px",
  } as const;

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
              Executive Overview
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              System Dashboard
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Overall business performance. {lastUpdatedAt ? `Updated ${format(lastUpdatedAt, "HH:mm:ss")}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-background/60"
              onClick={loadAll}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Link href="/reports">
              <Button variant="outline" size="sm" className="gap-2 bg-background/60">
                <TrendingUp className="w-4 h-4" />
                Full Reports
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card
              key={k.key}
              className={cn(
                "border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow",
                k.tone.bg
              )}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {k.label}
                    </div>
                    <div className="mt-2 text-xl sm:text-2xl font-bold truncate">{k.value}</div>
                    <div className="mt-1 text-[10px] sm:text-xs text-muted-foreground">{k.helper}</div>
                  </div>
                  <div className={cn("p-2 sm:p-3 rounded-2xl ring-1 shrink-0", k.tone.icon, k.tone.ring)}>
                    <Icon className="w-5 h-5 sm:w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Specialized Operations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-500/10 dark:to-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Front Office</p>
              <p className="text-xl font-black">{activeReservations} Guests</p>
              <p className="text-[10px] text-muted-foreground">Active Reservations</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl ring-1 ring-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-500/10 dark:to-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Banquet & Events</p>
              <p className="text-xl font-black">{activeBanquets} Bookings</p>
              <p className="text-[10px] text-muted-foreground">Upcoming Events</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl ring-1 ring-purple-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-sky-50/50 to-white dark:from-sky-500/10 dark:to-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">E-Commerce</p>
              <p className="text-xl font-black">{pendingOnlineOrders} Orders</p>
              <p className="text-[10px] text-muted-foreground">Pending Online Orders</p>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-600 rounded-2xl ring-1 ring-sky-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 border-none shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Consolidated Growth</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Revenue trajectory (last 30 days)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[360px] p-2 sm:pt-4">
            {combinedTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.sales} stopOpacity={0.14} />
                                <stop offset="95%" stopColor={COLORS.sales} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartStroke} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: chartTick, fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: chartTick, fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke={COLORS.sales}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorOverall)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">
                    Insufficient data for trend analysis.
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-lg font-bold">Operations Hub</CardTitle>
                <CardDescription>Live system stats</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-transparent hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-500/10 text-cyan-600 rounded-lg flex items-center justify-center">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">Technicians Online</span>
                    </div>
                    <span className="text-sm font-black italic">{staffCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-transparent hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">Avg. Ticket Value</span>
                    </div>
                    <span className="text-sm font-black italic">LKR {salesData?.kpis?.avgOrderValue?.toLocaleString() || "0"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-transparent hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500/10 text-orange-600 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">Active Customers</span>
                    </div>
                    <span className="text-sm font-black italic">{customerCount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-muted/50">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Module Health</h4>
                        <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-600 bg-emerald-50 h-5">Operational</Badge>
                    </div>
                    <div className="space-y-1.5">
                        <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[85%]" />
                        </div>
                        <p className="text-[8px] text-muted-foreground italic">System resources: 85% stable</p>
                    </div>
                </div>
                
                <Link href="/dashboard/sales" className="block pt-2">
                    <Button className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-xl shadow-lg border border-white/5 h-12">
                        <span className="text-sm font-bold uppercase tracking-tight">Financial Analytics</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
