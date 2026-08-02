"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, RefreshCcw, Search, MoreVertical } from 'lucide-react';
import Pagination from '@/components/Pagination';

/* ── tiny reusable badge ─────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending:  'bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    Approved: 'bg-green-50  text-green-700  border-green-200  dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/40',
    Rejected: 'bg-red-50    text-red-700    border-red-200    dark:bg-red-950/40   dark:text-red-400   dark:border-red-800/40',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'}`}>
      {status === 'Pending'  && <Clock      size={10} />}
      {status === 'Approved' && <CheckCircle2 size={10} />}
      {status === 'Rejected' && <XCircle    size={10} />}
      {status}
    </span>
  );
}

export default function ERPRequestsPage() {
  const [requests,     setRequests]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/admin/requests`, { credentials: 'include' });
      const data = await res.json();
      setRequests(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filtered = requests.filter(r =>
    r.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageItems  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 space-y-5">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">ERP Requests</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">
            Manage enterprise deployment pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
            <input
              type="text"
              placeholder="Search company or email…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="
                rounded-lg border border-[#e4e4e7] bg-white py-2 pl-9 pr-3
                text-[13px] text-[#09090b] placeholder:text-[#a1a1aa] w-60
                focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
                dark:border-[#27272a] dark:bg-[#18181b] dark:text-white
                transition-all
              "
            />
          </div>
          <button
            onClick={fetchData}
            className="flex items-center justify-center rounded-lg border border-[#e4e4e7] bg-white p-2 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b]">
                {['Company & Contact', 'Type', 'Date', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa] ${i === 3 ? 'text-center' : ''} ${i === 4 ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#a1a1aa]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" />
                      Loading requests…
                    </div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#a1a1aa]">
                    No requests found
                  </td>
                </tr>
              ) : pageItems.map(req => (
                <tr key={req.id} className="group hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-medium text-[#09090b] dark:text-white">{req.company_name}</div>
                    <div className="text-[12px] text-[#71717a] dark:text-[#a1a1aa]">{req.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md border border-[#e4e4e7] bg-[#f4f4f5] px-2 py-0.5 text-[11px] font-medium text-[#71717a] dark:border-[#27272a] dark:bg-[#27272a] dark:text-[#a1a1aa]">
                      {req.business_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">
                    {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400 transition-colors" title="Approve">
                        <CheckCircle2 size={14} />
                      </button>
                      <button className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors" title="Reject">
                        <XCircle size={14} />
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
