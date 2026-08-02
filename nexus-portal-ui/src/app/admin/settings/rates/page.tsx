"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { RefreshCcw, Save, Loader2, DollarSign, TrendingUp, AlertCircle, Globe, Plus, X } from 'lucide-react';

export default function ExchangeRatesPage() {
  const [rates,       setRates]       = useState<any[]>([]);
  const [sources,     setSources]     = useState<string[]>([]);
  const [activeSource, setActiveSource] = useState<string>('');
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [syncSummary, setSyncSummary] = useState<any[] | null>(null);
  const [saving,      setSaving]      = useState<string | null>(null);
  const [message,     setMessage]     = useState<{type: 'success' | 'error', text: string} | null>(null);

  const fetchRates = async (force = false) => {
    if (force) setSyncing(true); else setLoading(true);
    try {
      if (force) {
        const res  = await fetch(`${API_BASE}/admin/settings/exchange-rates/preview`, { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success') setSyncSummary(data.data);
      } else {
        const res  = await fetch(`${API_BASE}/admin/settings/exchange-rates`, { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success') { setRates(data.data.rates); setSources(data.data.sources); setActiveSource(data.data.active_source); }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setSyncing(false); }
  };

  useEffect(() => { fetchRates(); }, []);

  const handleApplySync = async () => {
    if (!syncSummary) return;
    setSyncing(true);
    try {
      const res  = await fetch(`${API_BASE}/admin/settings/exchange-rates/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ items: syncSummary }) });
      const data = await res.json();
      if (data.status === 'success') { setMessage({ type: 'success', text: data.message }); setSyncSummary(null); fetchRates(); }
    } catch { setMessage({ type: 'error', text: 'Failed to apply changes' }); }
    finally { setSyncing(false); }
  };

  const handleReset = async (code: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/exchange-rates/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ currency_code: code }) });
      if (res.ok) { setMessage({ type: 'success', text: `Rate for ${code} reset to market!` }); fetchRates(); }
    } catch { setMessage({ type: 'error', text: 'Failed to reset rate' }); }
  };

  const handleSourceChange = async (source: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/exchange-rates/source`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ source }) });
      if (res.ok) { setActiveSource(source); setMessage({ type: 'success', text: `Sync source changed to ${source}` }); fetchRates(true); }
    } catch { setMessage({ type: 'error', text: 'Failed to update sync source' }); }
  };

  const handleUpdate = async (code: string, newRate: string) => {
    setSaving(code);
    try {
      const res  = await fetch(`${API_BASE}/admin/settings/exchange-rates/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ currency_code: code, rate: parseFloat(newRate) }) });
      const data = await res.json();
      setMessage(data.status === 'success' ? { type: 'success', text: `Rate for ${code} updated!` } : { type: 'error', text: data.message });
      if (data.status === 'success') fetchRates();
    } catch { setMessage({ type: 'error', text: 'Failed to connect to server' }); }
    finally { setSaving(null); setTimeout(() => setMessage(null), 3000); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#a1a1aa]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Loading rates…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Exchange Rates</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Market sync & manual override</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Source selector */}
          <div className="flex items-center gap-2 rounded-lg border border-[#e4e4e7] bg-white px-3 py-2 dark:border-[#27272a] dark:bg-[#18181b]">
            <Globe size={13} className="text-[#a1a1aa]" />
            <select value={activeSource} onChange={e => handleSourceChange(e.target.value)}
              className="bg-transparent text-[13px] text-[#09090b] dark:text-white outline-none cursor-pointer">
              {sources.map(s => <option key={s} value={s}>{s.replace('-', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          <button onClick={() => fetchRates(true)} disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors disabled:opacity-50">
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            {syncing ? '…' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Alert */}
      {message && (
        <div className={`flex items-center gap-2.5 rounded-lg border p-3 text-[13px] font-medium ${
          message.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400'
        }`}>
          <AlertCircle size={14} />{message.text}
        </div>
      )}

      {/* Rates Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {rates.map(rate => (
          <div key={rate.id} className="rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b] p-4 group">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2ff] dark:bg-[#6366f1]/10">
                  <span className="text-[10px] font-bold text-[#6366f1] dark:text-[#818cf8]">{rate.currency_code}</span>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[#09090b] dark:text-white">{rate.currency_code}</div>
                  <div className="text-[10px] text-[#a1a1aa]">{rate.is_manual ? 'Override' : 'Market'}</div>
                </div>
              </div>
              <TrendingUp size={13} className={rate.is_manual ? 'text-amber-500' : 'text-green-500'} />
            </div>
            <div className="relative">
              <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
              <input type="number" defaultValue={rate.rate}
                onBlur={e => { if (parseFloat(e.target.value) !== parseFloat(rate.rate)) handleUpdate(rate.currency_code, e.target.value); }}
                className="w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2 pl-7 pr-2 text-[12px] font-mono font-semibold text-[#09090b] dark:border-[#27272a] dark:bg-[#27272a] dark:text-white focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all" />
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-[#f4f4f5] dark:border-[#27272a] pt-2.5">
              <span className="text-[10px] text-[#a1a1aa]">
                {new Date(rate.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                {rate.is_manual && rate.currency_code !== 'USD' && (
                  <button onClick={() => handleReset(rate.currency_code)} className="text-[10px] font-medium text-[#6366f1] hover:text-[#4f46e5] transition-colors">
                    Reset
                  </button>
                )}
                {saving === rate.currency_code && <Loader2 size={10} className="animate-spin text-[#6366f1]" />}
              </div>
            </div>
          </div>
        ))}

        {/* Add new placeholder */}
        <div className="cursor-not-allowed rounded-xl border border-dashed border-[#e4e4e7] dark:border-[#27272a] p-4 flex flex-col items-center justify-center gap-2 hover:border-[#6366f1]/40 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f4f5] dark:bg-[#27272a]">
            <Plus size={15} className="text-[#a1a1aa]" />
          </div>
          <span className="text-[11px] font-medium text-[#a1a1aa]">New CCY</span>
        </div>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
        <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">Financial Accuracy Notice</p>
          <p className="mt-0.5 text-[12px] text-amber-600 dark:text-amber-500">Manual edits become permanent overrides and will not be auto-synced until reset.</p>
        </div>
      </div>

      {/* Sync Summary Modal */}
      {syncSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-[#e4e4e7] bg-white shadow-2xl dark:border-[#27272a] dark:bg-[#18181b]">
            <div className="flex items-center justify-between border-b border-[#e4e4e7] dark:border-[#27272a] px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-[#09090b] dark:text-white">Sync Preview</h3>
                <p className="text-[12px] text-[#71717a] dark:text-[#a1a1aa]">Market shift via {activeSource.toUpperCase()}</p>
              </div>
              <button onClick={() => setSyncSummary(null)} className="rounded-lg p-1.5 text-[#a1a1aa] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
              {syncSummary.map(item => (
                <div key={item.code} className="flex items-center justify-between rounded-lg border border-[#e4e4e7] bg-[#fafafa] dark:border-[#27272a] dark:bg-[#1c1c1f] p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-[#09090b] dark:text-white">{item.code}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                      item.status === 'Updated' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                      item.status === 'No Change' ? 'bg-[#f4f4f5] text-[#a1a1aa] dark:bg-[#27272a]' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>{item.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-[#a1a1aa] line-through">{Number(item.old).toFixed(3)}</span>
                    <TrendingUp size={9} className="text-[#6366f1]" />
                    <span className="font-semibold text-[#09090b] dark:text-white">{Number(item.new).toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e4e4e7] dark:border-[#27272a] p-4">
              <button onClick={handleApplySync} disabled={syncing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6366f1] py-2.5 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors disabled:opacity-50">
                {syncing && <Loader2 size={14} className="animate-spin" />}
                {syncing ? 'Applying…' : 'Confirm & Apply Rates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
