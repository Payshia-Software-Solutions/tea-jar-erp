"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from 'react';
import { Server, ShieldCheck, Mail, Send, Save, RefreshCw, Eye, EyeOff, AlertCircle, CheckCircle2, Lock, User, Hash, Globe } from 'lucide-react';

const inputCls = `
  w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2.5 pl-9 pr-3
  text-[13px] text-[#09090b] placeholder:text-[#a1a1aa]
  focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
  dark:border-[#27272a] dark:bg-[#27272a] dark:text-white
  dark:focus:border-[#818cf8] dark:focus:bg-[#18181b]
  transition-all
`;

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-[#f4f4f5] dark:border-[#27272a] pb-3">
        <Icon size={15} className="text-[#6366f1] dark:text-[#818cf8]" />
        <h2 className="text-[13px] font-semibold text-[#09090b] dark:text-white">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function MailSettingsPage() {
  const [settings, setSettings] = useState({
    smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '',
    smtp_encryption: 'ssl', smtp_from_name: '', smtp_from_email: '',
    smtp_global_cc: '', smtp_global_bcc: ''
  });
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [testing,      setTesting]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message,      setMessage]      = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res  = await fetch(`${API_BASE}/admin/settings/mail`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') setSettings(data.data);
    } catch { console.error('Failed to fetch mail settings'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const res  = await fetch(`${API_BASE}/admin/settings/mail/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings), credentials: 'include' });
      const data = await res.json();
      setMessage({ text: data.status === 'success' ? 'Settings saved successfully' : (data.message || 'Failed to save settings'), type: data.status === 'success' ? 'success' : 'error' });
    } catch { setMessage({ text: 'Network error occurred', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setMessage(null);
    try {
      const res  = await fetch(`${API_BASE}/admin/settings/mail/test`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings), credentials: 'include' });
      const data = await res.json();
      setMessage({ text: data.message || (data.status === 'success' ? 'Test email sent!' : 'Connection test failed'), type: data.status === 'success' ? 'success' : 'error' });
    } catch { setMessage({ text: 'Network error during test', type: 'error' }); }
    finally { setTesting(false); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#a1a1aa]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e4e4e7] border-t-[#6366f1]" /> Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Mail Server Configuration</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Configure SMTP settings for system-wide email</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTest} disabled={testing || saving}
            className="flex items-center gap-2 rounded-lg border border-[#e4e4e7] bg-white px-4 py-2 text-[13px] font-medium text-[#09090b] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:text-white dark:hover:bg-[#27272a] transition-colors disabled:opacity-50">
            {testing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            {testing ? 'Testing…' : 'Send Test'}
          </button>
          <button onClick={handleSave} disabled={saving || testing}
            className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors disabled:opacity-50 shadow-sm">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Configuration'}
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
          {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      )}

      {/* Settings grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Server Details */}
        <Card title="Server Details" icon={ShieldCheck}>
          <Field label="SMTP Host" icon={Globe}>
            <input type="text" value={settings.smtp_host} onChange={e => setSettings({...settings, smtp_host: e.target.value})} className={inputCls} placeholder="smtp.example.com" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Port" icon={Hash}>
              <input type="text" value={settings.smtp_port} onChange={e => setSettings({...settings, smtp_port: e.target.value})} className={inputCls} placeholder="465" />
            </Field>
            <Field label="Encryption" icon={Lock}>
              <select value={settings.smtp_encryption} onChange={e => setSettings({...settings, smtp_encryption: e.target.value})}
                className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="none">None</option>
                <option value="ssl">SSL</option>
                <option value="tls">TLS</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* Authentication */}
        <Card title="Authentication" icon={Lock}>
          <Field label="Username" icon={User}>
            <input type="text" value={settings.smtp_user} onChange={e => setSettings({...settings, smtp_user: e.target.value})} className={inputCls} placeholder="user@example.com" />
          </Field>
          <Field label="Password" icon={Lock}>
            <input type={showPassword ? 'text' : 'password'} value={settings.smtp_pass} onChange={e => setSettings({...settings, smtp_pass: e.target.value})} className={`${inputCls} pr-9`} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#6366f1] transition-colors">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </Field>
        </Card>

        {/* Sender Identity */}
        <Card title="Sender Identity" icon={Mail}>
          <Field label="Display Name" icon={User}>
            <input type="text" value={settings.smtp_from_name} onChange={e => setSettings({...settings, smtp_from_name: e.target.value})} className={inputCls} placeholder="BizzFlow Suite" />
          </Field>
          <Field label="Sender Email" icon={Mail}>
            <input type="email" value={settings.smtp_from_email} onChange={e => setSettings({...settings, smtp_from_email: e.target.value})} className={inputCls} placeholder="no-reply@example.com" />
          </Field>
          <div className="mt-2 border-t border-[#f4f4f5] dark:border-[#27272a] pt-3 space-y-3">
            <p className="text-[11px] font-medium text-[#6366f1] dark:text-[#818cf8] uppercase tracking-wider">Global Audit Recipients</p>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Global CC</label>
              <input type="email" value={settings.smtp_global_cc} onChange={e => setSettings({...settings, smtp_global_cc: e.target.value})}
                className="w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2 px-3 text-[13px] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 dark:border-[#27272a] dark:bg-[#27272a] dark:text-white transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Global BCC</label>
              <input type="email" value={settings.smtp_global_bcc} onChange={e => setSettings({...settings, smtp_global_bcc: e.target.value})}
                className="w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2 px-3 text-[13px] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 dark:border-[#27272a] dark:bg-[#27272a] dark:text-white transition-all" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
