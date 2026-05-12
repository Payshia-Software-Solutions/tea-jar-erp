"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCcw,
  Search,
  MoreVertical
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function ERPRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/requests`, { credentials: 'include' });
      const data = await res.json();
      setRequests(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const filteredRequests = requests.filter(req => 
    req.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const currentRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">ERP Requests</h1>
          <p className="hidden sm:block text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage enterprise deployment pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950/50 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs w-64 focus:border-indigo-500 outline-none transition-all font-bold"
            />
          </div>
          <button onClick={fetchData} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Company & Contact</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {currentRequests.map((req) => (
              <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-3.5">
                  <div className="text-xs font-bold text-white">{req.company_name}</div>
                  <div className="text-[11px] text-slate-500">{req.email}</div>
                </td>
                <td className="px-6 py-3.5">
                  <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-black text-slate-400 uppercase tracking-wider border border-white/5">
                    {req.business_type}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-[11px] font-medium text-slate-400">
                  {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex justify-center">
                    {req.status === 'Pending' && (
                      <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-amber-400/20">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3.5 text-right">
                   <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-lg transition-all" title="Approve">
                        <CheckCircle2 size={14} />
                      </button>
                      <button className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all" title="Reject">
                        <XCircle size={14} />
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
          totalItems={filteredRequests.length}
          itemsPerPage={itemsPerPage}
        />
        {filteredRequests.length === 0 && !loading && (
          <div className="py-12 text-center">
            <div className="text-[11px] text-slate-600 font-black uppercase tracking-widest">No deployment requests found</div>
          </div>
        )}
      </div>
    </div>
  );
}
