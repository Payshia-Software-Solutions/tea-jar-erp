"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';

function StatusBadge({ status }: { status: string }) {
  const active = status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
      active
        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-400'
        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-400'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-amber-500'}`} />
      {status}
    </span>
  );
}

export default function TenantsPage() {
  const [tenants,     setTenants]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/admin/tenants`, { credentials: 'include' });
      const data = await res.json();
      setTenants(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tenant? This cannot be undone.')) return;
    try {
      await fetch(`${API_BASE}/admin/tenants/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filtered   = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageItems  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">SaaS Tenants</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Directory of enterprise instances</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
            <input
              type="text"
              placeholder="Search tenants…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="
                rounded-lg border border-[#e4e4e7] bg-white py-2 pl-9 pr-3
                text-[13px] text-[#09090b] placeholder:text-[#a1a1aa] w-52
                focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
                dark:border-[#27272a] dark:bg-[#18181b] dark:text-white
                transition-all
              "
            />
          </div>
          <button
            onClick={() => router.push('/admin/tenants/create')}
            className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors"
          >
            <Plus size={14} /> Register
          </button>
          <button
            onClick={fetchData}
            className="rounded-lg border border-[#e4e4e7] bg-white p-2 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b]">
                {['Tenant', 'Plan', 'License Key', 'API Key', 'Status', ''].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa] ${i === 4 ? 'text-center' : ''} ${i === 5 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#a1a1aa]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" />
                      Loading tenants…
                    </div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#a1a1aa]">No tenants found</td>
                </tr>
              ) : pageItems.map(tenant => (
                <tr key={tenant.id} className="group hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[12px] font-bold text-[#6366f1] dark:bg-[#6366f1]/15 dark:text-[#818cf8]">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#09090b] dark:text-white">{tenant.name}</div>
                        <div className="text-[11px] font-mono text-[#71717a] dark:text-[#a1a1aa]">{tenant.slug}.nexus.io</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md border border-[#e0e7ff] bg-[#eef2ff] px-2 py-0.5 text-[11px] font-medium text-[#6366f1] dark:border-[#6366f1]/20 dark:bg-[#6366f1]/10 dark:text-[#818cf8]">
                      {tenant.package_name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded border border-[#e4e4e7] bg-[#f4f4f5] px-1.5 py-0.5 font-mono text-[11px] text-[#71717a] dark:border-[#27272a] dark:bg-[#27272a] dark:text-[#a1a1aa]">
                      {tenant.license_key}
                    </code>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded border border-[#e0e7ff] bg-[#eef2ff] px-1.5 py-0.5 font-mono text-[11px] text-[#6366f1] dark:border-[#6366f1]/20 dark:bg-[#6366f1]/10 dark:text-[#818cf8]">
                      {tenant.api_key}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => router.push(`/admin/tenants/edit/${tenant.id}`)} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-[#f4f4f5] hover:text-[#6366f1] dark:hover:bg-[#27272a] transition-colors" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(tenant.id)} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                      <button className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={itemsPerPage} />
      </div>
    </div>
  );
}
