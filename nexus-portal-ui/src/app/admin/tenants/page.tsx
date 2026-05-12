"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCcw,
  Search,
  MoreVertical,
  Layers,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/tenants`, { credentials: 'include' });
      const data = await res.json();
      setTenants(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;
    try {
      await fetch(`${API_BASE}/admin/tenants/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const currentTenants = filteredTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">SaaS Tenants</h1>
          <p className="hidden sm:block text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Directory of enterprise instances</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs w-full sm:w-56 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-bold"
            />
          </div>
          <button 
            onClick={() => router.push('/admin/tenants/create')}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md text-[10px] font-black uppercase tracking-widest"
          >
            <Plus size={14} /> Register
          </button>
          <button onClick={fetchData} className="p-1.5 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 rounded-lg transition-all border border-slate-200 dark:border-white/5">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Enterprise Identity</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Plan</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">License</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">API Key</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {currentTenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-3.5">
                   <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-xs">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{tenant.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{tenant.slug}.nexus.io</div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className="px-2 py-0.5 bg-indigo-500/10 rounded text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-500/20">
                    {tenant.package_name}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                   <code className="text-[10px] font-mono bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400">
                     {tenant.license_key}
                   </code>
                </td>
                <td className="px-6 py-3.5">
                   <code className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                     {tenant.api_key}
                   </code>
                </td>
                <td className="px-6 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                      tenant.status === 'Active' 
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                      : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                     {tenant.status}
                   </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                   <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => router.push(`/admin/tenants/edit/${tenant.id}`)}
                        className="p-1.5 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 rounded-lg transition-all" 
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(tenant.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button className="p-1.5 hover:bg-white/5 text-slate-500 rounded-lg transition-all">
                        <MoreVertical size={14} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredTenants.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
