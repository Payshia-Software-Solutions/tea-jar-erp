"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  RefreshCcw, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building,
  FileText,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const API_BASE = 'http://localhost/rapair-management/nexus-portal-server/public/api';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/billing/email-logs`, { credentials: 'include' });
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = logs.filter(l => 
    l.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Communication Log</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Audit trail of system-dispatched messages</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-[10px] font-bold w-48 lg:w-64 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button onClick={fetchData} className="p-1.5 glass glass-hover text-slate-400 rounded-lg transition-all border border-slate-200 dark:border-white/5">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-right-4 duration-500 overflow-x-auto">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCcw size={32} className="animate-spin text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Audit Ledger...</span>
          </div>
        ) : filtered.length > 0 ? (
          <div className="glass overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.01] border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Audit ID & Type</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Subject & Content</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Identity</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Dispatch Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {currentItems.map((log, index) => (
                  <tr key={`${log.id}-${index}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          log.email_type === 'Receipt' ? 'bg-emerald-500/10 text-emerald-500' : 
                          log.email_type === 'Broadcast' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className={`text-[11px] font-black ${log.invoice_number === 'GENERIC' ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {log.invoice_number === 'GENERIC' ? 'BROADCAST' : `#${log.invoice_number}`}
                          </div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{log.email_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col gap-1">
                        <div className={`text-[10px] font-bold truncate max-w-[200px] ${log.subject ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 italic'}`} title={log.subject}>
                          {log.subject || 'No Subject'}
                        </div>
                        <button 
                          onClick={() => setSelectedLog(log)}
                          disabled={!log.body}
                          className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all w-fit ${
                            log.body 
                            ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700' 
                            : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          <Eye size={10} /> Preview
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Building size={10} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{log.tenant_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail size={10} className="text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-500 truncate max-w-[150px]">{log.recipient}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                          log.status.includes('Sent') || log.status === 'Resent'
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                        }`}>
                          {log.status.includes('Sent') || log.status === 'Resent' ? <CheckCircle size={8} /> : <XCircle size={8} />}
                          {log.status}
                        </span>
                        {log.error_message && (
                          <span className="text-[9px] text-rose-400 font-bold max-w-[120px] truncate" title={log.error_message}>
                            ERROR: {log.error_message}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                          {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
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
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        ) : (
          <div className="py-20 text-center glass">
            <Mail size={32} className="mx-auto text-slate-200 dark:text-white/5 mb-3" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">No Communication History</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Enterprise audit trail is currently empty.</p>
          </div>
        )}
      </div>

      {/* Message Preview Dialog */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative glass w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl ring-1 ring-white/10">
            {/* Modal Header */}
            <div className="px-8 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Email Preview</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{selectedLog.email_type} Dispatch to {selectedLog.recipient}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Email Metadata */}
            <div className="px-8 py-6 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[60px]">Subject:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedLog.subject || 'No Subject'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[60px]">To:</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{selectedLog.recipient}</span>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-950">
              <div 
                className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: selectedLog.body }}
              />
              {selectedLog.email_type !== 'Broadcast' && (
                <div className="mt-8 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center">
                  <p className="text-[11px] text-slate-500 italic">
                    Note: Automated {selectedLog.email_type} emails are generated with the BizzFlow system template. The preview above shows the primary message content.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
