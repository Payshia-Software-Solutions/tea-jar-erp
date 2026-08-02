"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, MoreVertical, RefreshCcw, Plus } from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function UsersPage() {
  const [users,       setUsers]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const authRes = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.role !== 'super_admin') { router.push('/admin/dashboard'); return; }
      } else { router.push('/admin/login'); return; }
      const res  = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const pageItems  = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Client Accounts</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Manage enterprise identities</p>
        </div>
        <button onClick={fetchData} className="rounded-lg border border-[#e4e4e7] bg-white p-2 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors">
          <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {/* Create user form */}
        <div className="rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b] p-5 h-fit">
          <div className="mb-4 flex items-center gap-2 pb-3 border-b border-[#f4f4f5] dark:border-[#27272a]">
            <UserCheck size={14} className="text-[#6366f1] dark:text-[#818cf8]" />
            <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-white">Authorize Account</h3>
          </div>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());
            const res = await fetch(`${API_BASE}/admin/users/create`, { method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify(data) });
            if (res.ok) { alert('Account provisioned successfully'); (e.target as HTMLFormElement).reset(); fetchData(); }
          }}>
            <div>
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] mb-1.5">Username</label>
              <input name="username" required type="text"
                className="w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2 px-3 text-[13px] text-[#09090b] dark:border-[#27272a] dark:bg-[#27272a] dark:text-white outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] mb-1.5">Password</label>
              <input name="password" required type="password"
                className="w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2 px-3 text-[13px] text-[#09090b] dark:border-[#27272a] dark:bg-[#27272a] dark:text-white outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 transition-all" />
            </div>
            <button type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6366f1] py-2 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors mt-1">
              <Plus size={14} /> Create Account
            </button>
          </form>
        </div>

        {/* Users table */}
        <div className="lg:col-span-3 overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b]">
          <div className="flex items-center justify-between border-b border-[#e4e4e7] dark:border-[#27272a] px-5 py-3.5">
            <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-white">Verified Directory</h3>
            <span className="rounded-md border border-[#e0e7ff] bg-[#eef2ff] px-2 py-0.5 text-[11px] font-medium text-[#6366f1] dark:border-[#6366f1]/20 dark:bg-[#6366f1]/10 dark:text-[#818cf8]">
              {users.length} Active
            </span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b]">
                {['Identity', 'Role', 'Tenant', ''].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa] ${i === 3 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-[13px] text-[#a1a1aa]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Loading…
                  </div>
                </td></tr>
              ) : pageItems.map(u => (
                <tr key={u.id} className="group hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1] text-[12px] font-bold text-white">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#09090b] dark:text-white">{u.full_name}</div>
                        <div className="text-[11px] font-mono text-[#71717a] dark:text-[#a1a1aa]">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      u.role === 'super_admin'
                        ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400'
                        : 'border border-[#e0e7ff] bg-[#eef2ff] text-[#6366f1] dark:border-[#6366f1]/20 dark:bg-[#6366f1]/10 dark:text-[#818cf8]'
                    }`}>
                      {u.role === 'super_admin' ? 'Super Admin' : 'Client'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] text-[#09090b] dark:text-white truncate max-w-[150px]">{u.tenant_name || '—'}</div>
                    <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">{u.tenant_name ? 'Enterprise' : 'System'}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={users.length} itemsPerPage={itemsPerPage} />
        </div>
      </div>
    </div>
  );
}
