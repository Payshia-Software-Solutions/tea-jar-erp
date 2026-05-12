"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2,
  RefreshCcw,
  CreditCard,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/packages`, { credentials: 'include' });
      const data = await res.json();
      setPackages(data.data || []);
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
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">License Packages</h1>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Manage subscription tiers & access</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-1.5 glass glass-hover text-slate-400 rounded-lg transition-all">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/admin/packages/create">
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md">
              <Plus size={16} /> Create Tier
            </button>
          </Link>
        </div>
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Identity</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Price</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Modules</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Services</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Infrastructure</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {packages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((pkg) => (
              <tr key={pkg.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-3.5 text-xs font-bold text-slate-900 dark:text-white">{pkg.name}</td>
                <td className="px-6 py-3.5 text-center font-black text-indigo-600 dark:text-indigo-400 text-xs">
                  ${pkg.monthly_price}
                </td>
                <td className="px-6 py-3.5">
                   <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {JSON.parse(pkg.modules || '[]').map((m: string) => (
                        <span key={m} className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-black text-slate-500 uppercase tracking-tighter border border-slate-200 dark:border-white/5">
                          {m}
                        </span>
                      ))}
                   </div>
                </td>
                <td className="px-6 py-3.5">
                   <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {JSON.parse(pkg.services || '[]').map((s: string) => (
                        <span key={s} className="px-1.5 py-0.5 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-black uppercase tracking-tighter border border-emerald-500/10">
                          {s}
                        </span>
                      ))}
                   </div>
                </td>
                <td className="px-6 py-3.5">
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono truncate max-w-[120px]">
                        {pkg.server_info || 'Cloud Std'}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                    pkg.is_public == 1 
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-slate-400 bg-slate-400/10 border-slate-400/20'
                  }`}>
                    {pkg.is_public == 1 ? 'Public' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                   <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/admin/packages/edit/${pkg.id}`}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-lg transition-all" 
                        title="Edit"
                      >
                        <Edit size={14} />
                      </Link>
                      <button 
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this package?')) {
                            await fetch(`${API_BASE}/admin/packages/delete`, {
                              method: 'POST',
                              headers: {'Content-Type': 'application/json'},
                              credentials: 'include',
                              body: JSON.stringify({id: pkg.id})
                            });
                            fetchData();
                          }
                        }}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination 
          currentPage={currentPage}
          totalPages={Math.ceil(packages.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          totalItems={packages.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
