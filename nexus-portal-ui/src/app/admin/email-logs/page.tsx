"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { Mail, RefreshCcw, Search, CheckCircle, XCircle, Clock, Building, FileText, Eye, X } from 'lucide-react';
import Pagination from '@/components/Pagination';

function StatusBadge({ status }: { status: string }) {
  const sent = status.includes('Sent') || status === 'Resent';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
      sent
        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-400'
        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-400'
    }`}>
      {sent ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {status}
    </span>
  );
}

export default function EmailLogsPage() {
  const [logs,         setLogs]         = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedLog,  setSelectedLog]  = useState<any | null>(null);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/admin/billing/email-logs`, { credentials: 'include' });
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filtered  = logs.filter(l =>
    l.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageItems  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Communication Log</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Audit trail of system-dispatched messages</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
            <input type="text" placeholder="Search logs…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="rounded-lg border border-[#e4e4e7] bg-white py-2 pl-9 pr-3 text-[13px] text-[#09090b] placeholder:text-[#a1a1aa] w-56 focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 dark:border-[#27272a] dark:bg-[#18181b] dark:text-white transition-all" />
          </div>
          <button onClick={fetchData} className="rounded-lg border border-[#e4e4e7] bg-white p-2 text-[#71717a] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-[#27272a] transition-colors">
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#18181b]">
                {['Type & ID', 'Subject', 'Recipient', 'Status', 'Time', ''].map((h, i) => (
                  <th key={i} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa] ${i === 3 ? 'text-center' : ''} ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f5] dark:divide-[#27272a]">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-[13px] text-[#a1a1aa]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Loading…
                  </div>
                </td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#a1a1aa]">No email logs found</td></tr>
              ) : pageItems.map((log, idx) => (
                <tr key={`${log.id}-${idx}`} className="group hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        log.email_type === 'Receipt' ? 'bg-green-50 dark:bg-green-950/30' :
                        log.email_type === 'Broadcast' ? 'bg-[#eef2ff] dark:bg-[#6366f1]/10' : 'bg-[#f4f4f5] dark:bg-[#27272a]'
                      }`}>
                        <FileText size={14} className={
                          log.email_type === 'Receipt' ? 'text-green-600 dark:text-green-400' :
                          log.email_type === 'Broadcast' ? 'text-[#6366f1] dark:text-[#818cf8]' : 'text-[#71717a]'
                        } />
                      </div>
                      <div>
                        <div className="text-[12px] font-mono font-semibold text-[#09090b] dark:text-white">
                          {log.invoice_number === 'GENERIC' ? 'BROADCAST' : `#${log.invoice_number}`}
                        </div>
                        <div className="text-[11px] text-[#a1a1aa]">{log.email_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] text-[#09090b] dark:text-white truncate max-w-[200px]">{log.subject || 'No Subject'}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building size={10} className="text-[#a1a1aa]" />
                      <span className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] truncate max-w-[160px]">{log.tenant_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Mail size={11} className="text-[#a1a1aa] shrink-0" />
                      <span className="text-[12px] text-[#71717a] dark:text-[#a1a1aa] truncate max-w-[160px]">{log.recipient}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge status={log.status} />
                    {log.error_message && (
                      <div className="mt-0.5 text-[10px] text-red-500 truncate max-w-[120px] mx-auto">{log.error_message}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="text-[13px] font-medium text-[#09090b] dark:text-white">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[11px] text-[#a1a1aa]">
                      {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => log.body && setSelectedLog(log)}
                      disabled={!log.body}
                      className="rounded-md p-1.5 text-[#a1a1aa] hover:bg-[#eef2ff] hover:text-[#6366f1] dark:hover:bg-[#6366f1]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                      title="Preview"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={itemsPerPage} />
      </div>

      {/* Email Preview Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative z-10 flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-2xl dark:border-[#27272a] dark:bg-[#18181b]">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#09090b] px-6 py-4">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-[#818cf8]" />
                <div>
                  <h3 className="text-[13px] font-semibold text-white">Email Preview</h3>
                  <p className="text-[11px] text-[#52525b]">{selectedLog.email_type} → {selectedLog.recipient}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="rounded-lg p-1.5 text-[#52525b] hover:bg-white/10 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            {/* Meta */}
            <div className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#1c1c1f] px-6 py-3 space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-[#a1a1aa] w-14">Subject</span>
                <span className="text-[13px] font-medium text-[#09090b] dark:text-white">{selectedLog.subject || 'No Subject'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-[#a1a1aa] w-14">To</span>
                <span className="text-[13px] text-[#71717a] dark:text-[#a1a1aa]">{selectedLog.recipient}</span>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-white p-6 dark:bg-[#09090b]">
              <div className="prose dark:prose-invert max-w-none text-[#374151] dark:text-[#c9d1d9] text-sm" dangerouslySetInnerHTML={{ __html: selectedLog.body }} />
            </div>
            {/* Footer */}
            <div className="flex justify-end border-t border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#1c1c1f] px-6 py-3">
              <button onClick={() => setSelectedLog(null)} className="rounded-lg border border-[#e4e4e7] bg-white px-4 py-2 text-[13px] font-medium text-[#09090b] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#27272a] dark:text-white dark:hover:bg-[#3f3f46] transition-colors">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
