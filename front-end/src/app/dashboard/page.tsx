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
} from "recharts";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  LayoutGrid,
  RefreshCcw,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchDashboardOverview, type DashboardOverview } from "@/lib/api";
import { format } from "date-fns";

const COLORS = {
  received: "#2952A3",
  completed: "#13C9EC",
  occupied: "#2952A3",
  available: "#4AD991",
  out: "#FF9F43",
};

function parseMysqlDatetime(value: string | null | undefined): Date | null {
  if (!value || typeof value !== "string") return null;
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function timeAgo(value: string) {
  const d = parseMysqlDatetime(value);
  if (!d) return value;
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function niceDateTime(value: string | null) {
  const d = parseMysqlDatetime(value || "");
  return d ? format(d, "MMM d, yyyy HH:mm") : "-";
}

function kpiCardTone(key: string) {
  switch (key) {
    case "pending":
      return {
        bg: "bg-gradient-to-br from-orange-50 via-white to-white dark:from-orange-500/10 dark:via-card dark:to-card",
        icon: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
        ring: "ring-orange-500/15 dark:ring-orange-500/20",
      };
    case "inProgress":
      return {
        bg: "bg-gradient-to-br from-blue-50 via-white to-white dark:from-primary/15 dark:via-card dark:to-card",
        icon: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
        ring: "ring-primary/15 dark:ring-primary/20",
      };
    case "completed":
      return {
        bg: "bg-gradient-to-br from-green-50 via-white to-white dark:from-green-500/10 dark:via-card dark:to-card",
        icon: "bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-300",
        ring: "ring-green-600/15 dark:ring-green-500/20",
      };
    default:
      return {
        bg: "bg-gradient-to-br from-cyan-50 via-white to-white dark:from-cyan-500/10 dark:via-card dark:to-card",
        icon: "bg-cyan-600/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200",
        ring: "ring-cyan-600/15 dark:ring-cyan-500/20",
      };
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDashboardOverview();
      setData(d);
      setLastUpdatedAt(new Date());
    } catch (e) {
      setData(null);
      setError((e as Error).message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(t);
  }, []);

  const ordersByStatus = data?.ordersByStatus ?? {};
  const pending = ordersByStatus["Pending"] ?? 0;
  const inProgress = ordersByStatus["In Progress"] ?? 0;
  const completedToday = data?.completedToday ?? 0;
  const avgRepairHours = data?.avgRepairHours ?? 0;

  const kpis = useMemo(
    () => [
      {
        key: "pending",
        label: "Pending Orders",
        value: pending,
        icon: ClipboardList,
        helper: "Waiting for assignment",
      },
      {
        key: "inProgress",
        label: "In Progress",
        value: inProgress,
        icon: Wrench,
        helper: "Currently being repaired",
      },
      {
        key: "completed",
        label: "Completed Today",
        value: completedToday,
        icon: CheckCircle2,
        helper: "Finished jobs today",
      },
      {
        key: "avg",
        label: "Avg. Repair Time",
        value: avgRepairHours,
        icon: Clock,
        helper: "Last 30 days (completed)",
        suffix: "h",
      },
    ],
    [pending, inProgress, completedToday, avgRepairHours]
  );

  const chartData = useMemo(() => {
    const rows = data?.throughputLast7Days ?? [];
    return rows.map((r) => ({
      name: r.date.slice(5),
      received: r.received,
      completed: r.completed,
    }));
  }, [data]);

  const baysByStatus = data?.serviceBaysByStatus ?? {};
  const bayTotal = data?.serviceBaysTotal ?? 0;
  const bayCounts = {
    occupied: baysByStatus["Occupied"] ?? 0,
    available: baysByStatus["Available"] ?? 0,
    out: baysByStatus["Out of Service"] ?? 0,
    total: bayTotal,
  };

  const bayPie = useMemo(
    () => [
      { name: "Occupied", value: bayCounts.occupied, color: COLORS.occupied },
      { name: "Available", value: bayCounts.available, color: COLORS.available },
      ...(bayCounts.out > 0 ? [{ name: "Out of Service", value: bayCounts.out, color: COLORS.out }] : []),
    ].filter((x) => x.value > 0),
    [bayCounts.occupied, bayCounts.available, bayCounts.out]
  );

  const urgent = data?.urgentAttention ?? [];
  const recent = data?.recentCompletions ?? [];

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
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground font-semibold">
              Workshop Overview
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              BizzFlow Dashboard
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Live data from your server. {lastUpdatedAt ? `Updated ${format(lastUpdatedAt, "HH:mm:ss")}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-background/60"
              onClick={() => void load()}
              disabled={loading}
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Link href="/dashboard/bays">
              <Button variant="outline" size="sm" className="gap-2 bg-background/60">
                <LayoutGrid className="w-4 h-4" />
                Bays Board
              </Button>
            </Link>
            <Link href="/orders/new">
              <Button size="sm" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                New Order
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border-dashed">
          <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-3 bg-muted rounded-full">
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="font-bold">Dashboard Unavailable</div>
            <div className="text-sm text-muted-foreground max-w-lg">{error}</div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((k) => {
          const tone = kpiCardTone(k.key);
          const Icon = k.icon;
          const display = k.suffix ? (k.value ? `${k.value}${k.suffix}` : "-") : String(k.value);
          return (
            <Card
              key={k.key}
              className={cn(
                "border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow",
                tone.bg
              )}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {k.label}
                    </div>
                    <div className="mt-2 text-xl sm:text-3xl font-bold">{display}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{k.helper}</div>
                  </div>
                  <div className={cn("p-2.5 sm:p-3 rounded-2xl ring-1", tone.icon, tone.ring)}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 border-none shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Workshop Throughput</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Received vs completed (last 7 days)
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="text-green-700 border-green-200 bg-green-50 gap-1 text-[10px] sm:text-xs dark:text-green-300 dark:border-green-500/20 dark:bg-green-500/10"
              >
                <TrendingUp className="w-3 h-3" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[360px] p-2 sm:pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.received} stopOpacity={0.14} />
                    <stop offset="95%" stopColor={COLORS.received} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.completed} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={COLORS.completed} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartStroke} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTick, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: chartTick, fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  stroke={COLORS.received}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashReceived)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke={COLORS.completed}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Service Bays</CardTitle>
                <CardDescription>Occupied vs available</CardDescription>
              </div>
              <Link href="/dashboard/bays" className="shrink-0">
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Bays Board
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bayPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={4}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    >
                      {bayPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-sm font-bold">{bayCounts.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Occupied</span>
                  <span className="text-sm font-bold">{bayCounts.occupied}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="text-sm font-bold">{bayCounts.available}</span>
                </div>
                {bayCounts.out > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Out of Service</span>
                    <span className="text-sm font-bold">{bayCounts.out}</span>
                  </div>
                ) : null}

                <div className="pt-2 text-xs text-muted-foreground">
                  Updated from Service Bays master data.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4 sm:pb-0">
        <Card className="lg:col-span-7 border-none shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Urgent Attention
            </CardTitle>
            <CardDescription>High priority orders that need review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6 pb-6">
            {urgent.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No urgent orders.</div>
            ) : (
              urgent.map((u) => {
                const due = u.expected_time ? niceDateTime(u.expected_time) : null;
                const created = niceDateTime(u.created_at);
                const tone =
                  u.priority === "Emergency" || u.priority === "Urgent"
                    ? "border-orange-200 bg-orange-50/40 dark:border-orange-500/20 dark:bg-orange-500/10"
                    : "border-amber-200 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/10";
                return (
                  <Link
                    key={u.id}
                    href={`/orders/${u.id}`}
                    className={cn(
                      "block rounded-xl border p-4 transition-colors hover:bg-muted/20",
                      tone
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{u.vehicle_model || `Order #${u.id}`}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {due ? `Due: ${due}` : `Created: ${created}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-orange-600 text-white border-none text-[10px]">{u.priority || "Urgent"}</Badge>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 border-none shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Recent Completions</CardTitle>
            <CardDescription>Latest finished repair orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4 sm:px-6 pb-6">
            {recent.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No completed orders yet.</div>
            ) : (
              recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/orders/${r.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-semibold truncate">{r.vehicle_model || `Order #${r.id}`}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        Completed {timeAgo(r.completed_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">#{r.id}</div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
