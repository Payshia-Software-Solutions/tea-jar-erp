"use client";

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  ShieldCheck, 
  Mail, 
  Send, 
  Save, 
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Hash,
  Globe
} from 'lucide-react';

export default function MailSettingsPage() {
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    smtp_encryption: 'ssl',
    smtp_from_name: '',
    smtp_from_email: '',
    smtp_global_cc: '',
    smtp_global_bcc: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const API_BASE = 'http://localhost/rapair-management/nexus-portal-server/public/api';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/mail`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        setSettings(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch mail settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/mail/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage({ text: 'Settings saved successfully', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Failed to save settings', type: 'error' });
      }
    } catch (e) {
      setMessage({ text: 'Network error occurred', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/mail/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage({ text: data.message, type: 'success' });
      } else {
        setMessage({ text: data.message || 'Connection test failed', type: 'error' });
      }
    } catch (e) {
      setMessage({ text: 'Network error during test', type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Server className="text-indigo-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Mail Server Configuration
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure SMTP settings for system-wide email notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleTest}
            disabled={testing || saving}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {testing ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
            {testing ? 'Testing...' : 'Test'}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || testing}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? 'Save' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl flex items-center gap-3 border animate-in zoom-in duration-300 text-sm ${
          message.type === 'success' 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
          : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Server Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
            <ShieldCheck className="text-blue-500" size={18} />
            <h2 className="text-sm font-black uppercase tracking-wider">Server Details</h2>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Host</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500">
                  <Globe size={14} />
                </div>
                <input 
                  type="text" 
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none font-bold text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Port</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500">
                    <Hash size={14} />
                  </div>
                  <input 
                    type="text" 
                    value={settings.smtp_port}
                    onChange={(e) => setSettings({...settings, smtp_port: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none font-bold text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encryption</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500">
                    <Lock size={14} />
                  </div>
                  <select 
                    value={settings.smtp_encryption}
                    onChange={(e) => setSettings({...settings, smtp_encryption: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none font-bold text-xs text-slate-900 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="ssl">SSL</option>
                    <option value="tls">TLS</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
            <Lock className="text-indigo-500" size={18} />
            <h2 className="text-sm font-black uppercase tracking-wider">Authentication</h2>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500">
                  <User size={14} />
                </div>
                <input 
                  type="text" 
                  value={settings.smtp_user}
                  onChange={(e) => setSettings({...settings, smtp_user: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none font-bold text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500">
                  <Lock size={14} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={settings.smtp_pass}
                  onChange={(e) => setSettings({...settings, smtp_pass: e.target.value})}
                  className="w-full pl-9 pr-10 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none font-bold text-xs text-slate-900 dark:text-white"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sender Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
            <Mail className="text-purple-500" size={18} />
            <h2 className="text-sm font-black uppercase tracking-wider">Sender Identity</h2>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500">
                  <User size={14} />
                </div>
                <input 
                  type="text" 
                  value={settings.smtp_from_name}
                  onChange={(e) => setSettings({...settings, smtp_from_name: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none font-bold text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Email</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500">
                  <Mail size={14} />
                </div>
                <input 
                  type="email" 
                  value={settings.smtp_from_email}
                  onChange={(e) => setSettings({...settings, smtp_from_email: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none font-bold text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/5">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Global Audit Recipients</h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global CC</label>
                  <input 
                    type="email" 
                    value={settings.smtp_global_cc}
                    onChange={(e) => setSettings({...settings, smtp_global_cc: e.target.value})}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 outline-none font-bold text-[10px] text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global BCC</label>
                  <input 
                    type="email" 
                    value={settings.smtp_global_bcc}
                    onChange={(e) => setSettings({...settings, smtp_global_bcc: e.target.value})}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 outline-none font-bold text-[10px] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </div>
);
}
