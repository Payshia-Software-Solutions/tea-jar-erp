"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCheck, 
  MoreVertical,
  RefreshCcw
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  

  const fetchData = async () => {
    setLoading(true);
    try {
      // Role protection
      const authRes = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
      if (authRes.ok) {
         const authData = await authRes.json();
         if (authData.role !== 'super_admin') {
            router.push('/admin/dashboard');
            return;
         }
      } else {
         router.push('/admin/login');
         return;
      }

      const res = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Client Accounts</h1>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Manage enterprise identities</p>
        </div>
        <button onClick={fetchData} className="p-1.5 glass glass-hover text-slate-400 rounded-lg transition-all">
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="glass p-5 h-fit space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white pb-3 border-b border-white/5">
            <UserCheck size={14} className="text-indigo-600 dark:text-indigo-400" /> Authorize Identity
          </h3>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());
            const res = await fetch(`${API_BASE}/admin/users/create`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              credentials: 'include',
              body: JSON.stringify(data)
            });
            if (res.ok) {
              alert('Account provisioned successfully');
              (e.target as HTMLFormElement).reset();
              fetchData();
            }
          }}>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Username</label>
              <input name="username" required type="text" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Password</label>
              <input name="password" required type="password" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-bold" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md mt-2">Authorize</button>
          </form>
        </div>

        <div className="lg:col-span-3 glass overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Verified Directory</h3>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-black tracking-tighter uppercase border border-indigo-500/20">{users.length} Active</span>
          </div>
          <table className="w-full text-left">
             <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01]">
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Identity</th>
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Tenant</th>
                   <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                 {users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((u) => (
                   <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                      <td className="px-4 py-2">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                               {u.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <div className="text-xs font-bold text-slate-900 dark:text-white">{u.full_name}</div>
                               <div className="text-[9px] text-slate-500 font-mono tracking-tighter">@{u.username}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-4 py-2">
                         <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                            u.role === 'super_admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'
                         }`}>
                            {u.role === 'super_admin' ? 'Master' : 'Client'}
                         </span>
                      </td>
                      <td className="px-4 py-2">
                         <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{u.tenant_name || '—'}</div>
                         <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black">{u.tenant_name ? 'Enterprise' : 'System'}</div>
                      </td>
                      <td className="px-4 py-2 text-right">
                         <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <MoreVertical size={14} />
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(users.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            totalItems={users.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </div>
  );
}
