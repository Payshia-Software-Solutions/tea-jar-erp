"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCcw, 
  Save, 
  Loader2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Globe,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [activeSource, setActiveSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<any[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  

  const fetchRates = async (force = false) => {
    if (force) setSyncing(true);
    else setLoading(true);
    
    try {
      if (force) {
        // Just preview, don't update DB yet
        const res = await fetch(`${API_BASE}/admin/settings/exchange-rates/preview`, { 
          method: 'POST',
          credentials: 'include' 
        });
        const data = await res.json();
        if (data.status === 'success') {
          setSyncSummary(data.data);
        }
      } else {
        const res = await fetch(`${API_BASE}/admin/settings/exchange-rates`, { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success') {
          setRates(data.data.rates);
          setSources(data.data.sources);
          setActiveSource(data.data.active_source);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleApplySync = async () => {
    if (!syncSummary) return;
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/exchange-rates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: syncSummary })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: data.message });
        setSyncSummary(null);
        fetchRates();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to apply changes' });
    } finally {
      setSyncing(false);
    }
  };

  const handleReset = async (code: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/exchange-rates/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currency_code: code })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Rate for ${code} reset to market!` });
        fetchRates();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset rate' });
    }
  };

  const handleSourceChange = async (source: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/exchange-rates/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ source })
      });
      if (res.ok) {
        setActiveSource(source);
        setMessage({ type: 'success', text: `Sync source changed to ${source}` });
        fetchRates(true); // Force sync after source change
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update sync source' });
    }
  };

  const handleUpdate = async (code: string, newRate: string) => {
    setSaving(code);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/exchange-rates/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currency_code: code, rate: parseFloat(newRate) })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: `Rate for ${code} updated successfully!` });
        fetchRates();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setSaving(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <Globe size={18} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Exchange Rates</h1>
            <p className="text-[9px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Market sync</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-lg border border-slate-200 dark:border-white/10">
            <span className="hidden sm:inline text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Source:</span>
            <select 
              value={activeSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none px-2 cursor-pointer"
            >
              {sources.map(s => <option key={s} value={s}>{s.replace('-', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          <button 
            onClick={() => fetchRates(true)}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            {syncing ? <Loader2 className="animate-spin" size={12} /> : <RefreshCcw size={12} />}
            <span>{syncing ? '...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {syncSummary && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/5"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Sync Summary</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Market shift via {activeSource.toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSyncSummary(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {syncSummary.map((item: any) => (
                  <div key={item.code} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-black text-slate-900 dark:text-white">{item.code}</div>
                      <div className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        item.status === 'Updated' ? 'bg-emerald-500/10 text-emerald-500' : 
                        item.status === 'No Change' ? 'bg-slate-500/10 text-slate-400' : 
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="text-slate-400 line-through">{Number(item.old).toFixed(3)}</span>
                        <TrendingUp size={8} className="text-indigo-500" />
                        <span className="text-slate-900 dark:text-white font-black">{Number(item.new).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleApplySync}
                disabled={syncing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {syncing && <Loader2 className="animate-spin" size={12} />}
                {syncing ? 'Applying...' : 'Confirm & Apply Rates'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {rates.map((rate) => (
          <div key={rate.id} className="glass p-4 group flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-[10px]">
                  {rate.currency_code}
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-900 dark:text-white">{rate.currency_code}</div>
                  <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">
                    {rate.is_manual ? 'Override' : 'Market'}
                  </div>
                </div>
              </div>
              <TrendingUp size={14} className={rate.is_manual ? 'text-amber-500' : 'text-emerald-500'} />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="relative">
                   <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                   <input 
                     type="number" 
                     defaultValue={rate.rate}
                     onBlur={(e) => {
                       if (parseFloat(e.target.value) !== parseFloat(rate.rate)) {
                         handleUpdate(rate.currency_code, e.target.value);
                       }
                     }}
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                   />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
                  {new Date(rate.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-1">
                  {rate.is_manual && rate.currency_code !== 'USD' && (
                    <button 
                      onClick={() => handleReset(rate.currency_code)}
                      className="text-[8px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest"
                      title="Reset to Market"
                    >
                      Reset
                    </button>
                  )}
                  {saving === rate.currency_code && (
                    <Loader2 className="animate-spin text-indigo-500" size={10} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 group hover:border-indigo-500/50 transition-all cursor-not-allowed">
           <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
             <Plus size={16} />
           </div>
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">New CCY</div>
        </div>
      </div>
      
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
        <AlertCircle className="text-amber-500 shrink-0" size={16} />
        <div>
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Financial Accuracy Notice</h4>
          <p className="text-[9px] text-amber-500/80 leading-relaxed font-bold">
            Manual edits become **Permanent Overrides** and will not be auto-synced until reset.
          </p>
        </div>
      </div>
    </div>
  );
}
