"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

export default function PackagesPage() {
  const [packages,    setPackages]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/admin/packages`, { credentials: 'include' });
      const data = await res.json();
      setPackages(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const pageItems  = packages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(packages.length / itemsPerPage);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">License Packages</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Manage subscription tiers & access</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="rounded-lg border border-[#e4e4e7] bg-white p-2 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors">
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/admin/packages/create">
            <button className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors">
              <Plus size={14} /> Create Tier
            </button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b]">
                {['Package', 'Price', 'Modules', 'Services', 'Infrastructure', 'Status', ''].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa] ${i === 5 ? 'text-center' : ''} ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-[13px] text-[#a1a1aa]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Loading packages…
                  </div>
                </td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-[#a1a1aa]">No packages found</td></tr>
              ) : pageItems.map(pkg => (
                <tr key={pkg.id} className="group hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] transition-colors">
                  <td className="px-5 py-3.5 text-[13px] font-medium text-[#09090b] dark:text-white">{pkg.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[13px] font-semibold text-[#6366f1] dark:text-[#818cf8]">${pkg.monthly_price}</span>
                    <span className="text-[11px] text-[#a1a1aa] ml-0.5">/mo</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {JSON.parse(pkg.modules || '[]').map((m: string) => (
                        <span key={m} className="rounded border border-[#e4e4e7] bg-[#f4f4f5] px-1.5 py-0.5 text-[10px] font-medium text-[#71717a] dark:border-[#27272a] dark:bg-[#27272a] dark:text-[#a1a1aa]">{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {JSON.parse(pkg.services || '[]').map((s: string) => (
                        <span key={s} className="rounded border border-[#bbf7d0] bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                      <span className="text-[12px] font-mono text-[#71717a] dark:text-[#a1a1aa] truncate max-w-[120px]">{pkg.server_info || 'Cloud Std'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      pkg.is_public == 1
                        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-400'
                        : 'border-[#e4e4e7] bg-[#f4f4f5] text-[#71717a] dark:border-[#27272a] dark:bg-[#27272a] dark:text-[#a1a1aa]'
                    }`}>
                      {pkg.is_public == 1 ? <Eye size={11} /> : <EyeOff size={11} />}
                      {pkg.is_public == 1 ? 'Public' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/packages/edit/${pkg.id}`} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-[#eef2ff] hover:text-[#6366f1] dark:hover:bg-[#6366f1]/10 transition-colors" title="Edit">
                        <Edit size={14} />
                      </Link>
                      <button onClick={async () => {
                        if (confirm('Delete this package?')) {
                          await fetch(`${API_BASE}/admin/packages/delete`, { method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify({id: pkg.id}) });
                          fetchData();
                        }
                      }} className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={packages.length} itemsPerPage={itemsPerPage} />
      </div>
    </div>
  );
}
