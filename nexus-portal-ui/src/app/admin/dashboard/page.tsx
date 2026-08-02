"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, Inbox, CreditCard, Users, ArrowUpRight, Plus, 
  RefreshCcw, ArrowRight, ShieldCheck, TrendingUp, PieChart
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Dashboard Currency Selection (Default LKR)
  const [selectedCurrency, setSelectedCurrency] = useState<'LKR' | 'USD'>('LKR');

  // Raw states to cache fetched DB data
  const [rawTenants, setRawTenants] = useState<any[]>([]);
  const [rawInvoices, setRawInvoices] = useState<any[]>([]);
  const [rawPackages, setRawPackages] = useState<any[]>([]);
  const [rawPayments, setRawPayments] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentTenants, setRecentTenants] = useState<any[]>([]);

  // Computed states
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeTenants: 0,
    mrr: 0,
    pendingInvoices: 0,
    totalInvoiced: 0,
    paidRate: 0
  });
  const [revenueHistory, setRevenueHistory] = useState<{ month: string; amount: number }[]>([]);
  const [planSummary, setPlanSummary] = useState<{ name: string; count: number; percent: number }[]>([]);

  const checkAuthAndFetchData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      // 1. Auth check
      const authRes = await fetch(`${API_BASE}/auth/check`, { credentials: 'include', headers });
      if (!authRes.ok) {
        router.push('/admin/login');
        return;
      }
      const authData = await authRes.json();
      if (authData.role !== 'super_admin') {
        router.push('/admin/subscription');
        return;
      }

      // 2. Fetch Dashboard metrics
      const [tenantsRes, requestsRes, invoicesRes, packagesRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/tenants`, { credentials: 'include', headers }),
        fetch(`${API_BASE}/admin/requests`, { credentials: 'include', headers }),
        fetch(`${API_BASE}/admin/billing/list`, { credentials: 'include', headers }),
        fetch(`${API_BASE}/admin/packages`, { credentials: 'include', headers }),
        fetch(`${API_BASE}/admin/billing/payments/all`, { credentials: 'include', headers })
      ]);

      const tenantsData = await tenantsRes.json();
      const requestsData = await requestsRes.json();
      const invoicesData = await invoicesRes.json();
      const packagesData = await packagesRes.json();
      const paymentsData = await paymentsRes.json();

      const tenantsList = tenantsData.data || [];
      const requestsList = requestsData.data || [];
      const invoicesList = invoicesData.data || [];
      const packagesList = packagesData.data || [];
      const paymentsList = paymentsData.data || [];

      // Save raw data
      setRawTenants(tenantsList);
      setRawInvoices(invoicesList);
      setRawPackages(packagesList);
      setRawPayments(paymentsList);

      setRecentRequests(requestsList.slice(0, 5));
      setRecentTenants(tenantsList.slice(0, 5));
    } catch (err) {
      console.error('Dashboard initialization failed', err);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  // Compute stats and trends dynamically when raw data or currency changes
  useEffect(() => {
    if (rawTenants.length === 0 && rawInvoices.length === 0) return;

    // Currency conversion calculator
    const convertToSelected = (amount: number, fromCurrency: string) => {
      const from = (fromCurrency || 'USD').toUpperCase();
      const to = selectedCurrency;
      if (from === to) return amount;
      
      if (from === 'USD' && to === 'LKR') return amount * 300;
      if (from === 'LKR' && to === 'USD') return amount / 300;
      if (from === 'EUR' && to === 'LKR') return amount * 330;
      if (from === 'LKR' && to === 'EUR') return amount / 330;
      if (from === 'EUR' && to === 'USD') return amount * 1.1;
      if (from === 'USD' && to === 'EUR') return amount / 1.1;
      return amount;
    };

    const pendingReqs = recentRequests.filter((r: any) => r.status === 'Pending').length;
    const activeTen = rawTenants.filter((t: any) => t.status === 'Active').length;

    // Calculate MRR projection
    const calculatedMRR = rawTenants.reduce((acc: number, t: any) => {
      if (t.status === 'Active' || t.status === 'Trial') {
        const pkg = rawPackages.find((p: any) => p.id == t.package_id);
        const price = parseFloat(pkg?.monthly_price || 0);
        return acc + convertToSelected(price, t.currency || 'USD');
      }
      return acc;
    }, 0);

    const pendingInvs = rawInvoices.filter((i: any) => i.status !== 'Paid').length;
    const totalInvVal = rawInvoices.reduce((acc: number, i: any) => acc + convertToSelected(parseFloat(i.amount || 0), i.currency), 0);
    const paidInvVal = rawInvoices.filter((i: any) => i.status === 'Paid').reduce((acc: number, i: any) => acc + convertToSelected(parseFloat(i.amount || 0), i.currency), 0);
    const invoicePaidRate = totalInvVal > 0 ? Math.round((paidInvVal / totalInvVal) * 100) : 0;

    setStats({
      pendingRequests: pendingReqs,
      activeTenants: activeTen,
      mrr: calculatedMRR,
      pendingInvoices: pendingInvs,
      totalInvoiced: totalInvVal,
      paidRate: invoicePaidRate
    });

    // Calculate monthly revenue collections trend (last 6 months)
    const monthlyData: Record<string, number> = {};
    rawPayments.forEach((p: any) => {
      const date = new Date(p.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short' });
      const convertedAmt = convertToSelected(parseFloat(p.amount || 0), p.currency);
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + convertedAmt;
    });

    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const idx = (currentMonthIdx - 5 + i + 12) % 12;
      const m = monthsOrder[idx];
      return { month: m, amount: monthlyData[m] || 0 };
    });

    setRevenueHistory(last6Months);

    // Package distributions
    const planCounts = rawPackages.map((pkg: any) => {
      const count = rawTenants.filter((t: any) => t.package_id == pkg.id).length;
      const pct = rawTenants.length > 0 ? Math.round((count / rawTenants.length) * 100) : 0;
      return { name: pkg.name, count, percent: pct };
    }).filter((p: any) => p.count > 0).sort((a: any, b: any) => b.count - a.count);

    setPlanSummary(planCounts);

  }, [selectedCurrency, rawTenants, rawInvoices, rawPackages, rawPayments, recentRequests]);

  // Generate SVG path for line/area graph
  const getGraphPaths = () => {
    const width = 1000;
    const height = 180;
    const padding = 35;
    
    if (revenueHistory.length === 0) return { line: '', area: '', points: [] };
    
    const maxVal = Math.max(...revenueHistory.map(d => d.amount), 5000);
    const minVal = 0;
    
    const points = revenueHistory.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / (revenueHistory.length - 1);
      const y = height - padding - ((d.amount - minVal) * (height - 2 * padding)) / (maxVal - minVal);
      return { x, y, val: d.amount, month: d.month };
    });
    
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY2 = points[i].y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
    
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    
    return { line: linePath, area: areaPath, points };
  };

  const { line, area, points } = getGraphPaths();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8] dark:bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#e4e4e7] border-t-[#6366f1]" />
          <span className="text-[13px] text-[#a1a1aa] font-medium font-sans">Assembling operational analytics…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#6366f1]" /> Operations Hub & Analytics
          </h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Real-time system telemetry, collections trends, and registration funnels</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Dashboard Currency selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#e4e4e7] bg-white px-2.5 py-1.5 dark:border-[#27272a] dark:bg-[#18181b]">
            <span className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Currency:</span>
            <select 
              value={selectedCurrency} 
              onChange={e => setSelectedCurrency(e.target.value as any)}
              className="bg-transparent text-[12px] font-semibold text-[#09090b] dark:text-white outline-none cursor-pointer"
            >
              <option value="LKR">LKR (Rs)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <button 
            onClick={checkAuthAndFetchData}
            className="flex items-center gap-1.5 rounded-lg border border-[#e4e4e7] bg-white px-3 py-2 text-[12px] font-semibold text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:text-[#a1a1aa] dark:hover:bg-[#27272a] transition-all"
          >
            <RefreshCcw size={13} /> Synchronize Data
          </button>
          <button 
            onClick={() => router.push('/admin/tenants/create')}
            className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#4f46e5] shadow-sm transition-all"
          >
            <Plus size={14} /> Register Instance
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Widget 1 */}
        <div 
          onClick={() => router.push('/admin/requests')}
          className="group cursor-pointer rounded-xl border border-[#e4e4e7] bg-white p-5 hover:border-[#6366f1]/40 dark:border-[#27272a] dark:bg-[#18181b] transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">ERP Inquiries</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Inbox size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#09090b] dark:text-white">{stats.pendingRequests}</span>
            <span className="text-[11px] font-medium text-amber-600">Pending Setup</span>
          </div>
          <p className="mt-1 text-[11px] text-[#a1a1aa]">New signups awaiting database generation</p>
        </div>

        {/* Widget 2 */}
        <div 
          onClick={() => router.push('/admin/tenants')}
          className="group cursor-pointer rounded-xl border border-[#e4e4e7] bg-white p-5 hover:border-[#6366f1]/40 dark:border-[#27272a] dark:bg-[#18181b] transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Active Instances</span>
            <div className="rounded-lg bg-green-50 p-2 text-green-600 dark:bg-green-950/20 dark:text-green-400 group-hover:scale-105 transition-transform">
              <Building size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#09090b] dark:text-white">{stats.activeTenants}</span>
            <span className="text-[11px] font-medium text-green-600">Active SaaS Nodes</span>
          </div>
          <p className="mt-1 text-[11px] text-[#a1a1aa]">Deployed customer database environments</p>
        </div>

        {/* Widget 3 */}
        <div 
          onClick={() => router.push('/admin/reports')}
          className="group cursor-pointer rounded-xl border border-[#e4e4e7] bg-white p-5 hover:border-[#6366f1]/40 dark:border-[#27272a] dark:bg-[#18181b] transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Projected MRR</span>
            <div className="rounded-lg bg-[#6366f1]/5 p-2 text-[#6366f1] dark:bg-[#6366f1]/10 dark:text-[#818cf8] group-hover:scale-105 transition-transform">
              <CreditCard size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#09090b] dark:text-white">
              {selectedCurrency === 'LKR' ? 'Rs' : '$'} {stats.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[11px] font-medium text-[#6366f1] dark:text-[#818cf8]">Monthly Value</span>
          </div>
          <p className="mt-1 text-[11px] text-[#a1a1aa]">Aggregated SaaS subscription MRR</p>
        </div>

        {/* Widget 4 */}
        <div 
          onClick={() => router.push('/admin/invoices')}
          className="group cursor-pointer rounded-xl border border-[#e4e4e7] bg-white p-5 hover:border-[#6366f1]/40 dark:border-[#27272a] dark:bg-[#18181b] transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">Outstanding Invoices</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/20 dark:text-red-400 group-hover:scale-105 transition-transform">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#09090b] dark:text-white">{stats.pendingInvoices}</span>
            <span className="text-[11px] font-medium text-red-600">{stats.paidRate}% Collection Rate</span>
          </div>
          <p className="mt-1 text-[11px] text-[#a1a1aa]">Awaiting client payment clearance</p>
        </div>

      </div>

      {/* Analytical Visualizations Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Revenue Collection Trend Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#e4e4e7] dark:border-[#27272a] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#09090b] dark:text-white flex items-center gap-2">
                <TrendingUp size={15} className="text-[#6366f1]" /> Monthly Collections Trend
              </h3>
              <p className="text-[11px] text-[#a1a1aa]">Aggregated resolved billing payments over time (Normalized to {selectedCurrency})</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
              Normalized {selectedCurrency} ({selectedCurrency === 'LKR' ? 'Rs' : '$'})
            </span>
          </div>

          <div className="w-full relative h-[180px] pt-4">
            {points.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#a1a1aa]">No payment transactions recorded</div>
            ) : (
              <svg viewBox="0 0 1000 180" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal gridlines */}
                {[0, 1, 2, 3].map((g) => {
                  const y = 30 + g * 40;
                  return (
                    <line key={g} x1="30" y1={y} x2="970" y2={y} stroke="#e4e4e7" strokeDasharray="3 3" className="dark:stroke-[#27272a]" />
                  );
                })}

                {/* Draw area filled with gradient */}
                <path d={area} fill="url(#areaGrad)" />

                {/* Draw line */}
                <path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" />

                {/* Markers / Circles on points */}
                {points.map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" className="dark:stroke-[#18181b]" />
                    {/* Month labels */}
                    <text x={pt.x} y="172" textAnchor="middle" fontSize="10" fontWeight="600" className="fill-[#a1a1aa] font-sans">
                      {pt.month}
                    </text>
                    {/* Amount labels above points */}
                    <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="9" fontWeight="700" className="fill-[#09090b] dark:fill-white font-mono">
                      {selectedCurrency === 'LKR' ? 'Rs' : '$'}{pt.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Plan subscription Breakdown */}
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b] space-y-4">
          <div className="border-b border-[#e4e4e7] dark:border-[#27272a] pb-3">
            <h3 className="text-sm font-semibold text-[#09090b] dark:text-white flex items-center gap-2">
              <PieChart size={15} className="text-[#6366f1]" /> Package Distribution
            </h3>
            <p className="text-[11px] text-[#a1a1aa]">Allocation of instances against billing plans</p>
          </div>

          <div className="space-y-4 pt-2">
            {planSummary.length === 0 ? (
              <p className="text-xs text-center text-[#a1a1aa] py-12">No active plans detected.</p>
            ) : (
              planSummary.map((p, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[12px] font-medium">
                    <span className="text-[#09090b] dark:text-white">{p.name}</span>
                    <span className="text-[#71717a] dark:text-[#a1a1aa]">{p.count} Nodes ({p.percent}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#f4f4f5] dark:bg-[#27272a] overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        i === 0 ? 'bg-[#6366f1]' : 
                        i === 1 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Split view for recent requests & activity */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Recent requests list */}
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#e4e4e7] dark:border-[#27272a] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#09090b] dark:text-white">Recent ERP Inquiries</h3>
              <p className="text-[11px] text-[#a1a1aa]">Latest registration signals from market portals</p>
            </div>
            <button 
              onClick={() => router.push('/admin/requests')} 
              className="text-[11px] font-semibold text-[#6366f1] hover:text-[#4f46e5] dark:text-[#818cf8] flex items-center gap-1 transition-all"
            >
              See all <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
            {recentRequests.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#a1a1aa]">No recent ERP requests logged.</p>
            ) : recentRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between text-[13px]">
                <div className="space-y-0.5">
                  <span className="font-medium text-[#09090b] dark:text-white">{req.company_name}</span>
                  <div className="text-[10px] text-[#a1a1aa] flex items-center gap-1.5">
                    <span>{req.email}</span>
                    <span>·</span>
                    <span>{req.contact_number || 'No contact'}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  req.status === 'Approved' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                  req.status === 'Rejected' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                  'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent tenants activity list */}
        <div className="rounded-xl border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#18181b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#e4e4e7] dark:border-[#27272a] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#09090b] dark:text-white">Recent Tenant Directories</h3>
              <p className="text-[11px] text-[#a1a1aa]">Latest SaaS system configurations deployed</p>
            </div>
            <button 
              onClick={() => router.push('/admin/tenants')} 
              className="text-[11px] font-semibold text-[#6366f1] hover:text-[#4f46e5] dark:text-[#818cf8] flex items-center gap-1 transition-all"
            >
              See all <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
            {recentTenants.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#a1a1aa]">No active nodes deployed yet.</p>
            ) : (
              recentTenants.map((ten) => (
                <div key={ten.id} className="py-3 flex items-center justify-between text-[13px]">
                  <div className="space-y-0.5">
                    <span className="font-medium text-[#09090b] dark:text-white">{ten.name}</span>
                    <div className="text-[10px] text-[#a1a1aa]">
                      <code>{ten.slug}.nexus.io</code> · Created {new Date(ten.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    ten.status === 'Active' ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}>
                    {ten.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
