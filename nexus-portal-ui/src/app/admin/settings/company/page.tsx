'use client';
import { API_BASE, SITE_URL } from '@/config';

import { useState, useEffect } from 'react';
import { Save, Building2, Mail, MapPin, Globe, Phone, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const inputCls = `
  w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2.5 pl-9 pr-3
  text-[13px] text-[#09090b] placeholder:text-[#a1a1aa]
  focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20
  dark:border-[#27272a] dark:bg-[#27272a] dark:text-white dark:focus:bg-[#18181b]
  transition-all
`;

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState({
    company_name: '', company_address: '', company_email: '',
    company_phone: '', company_website: '', company_logo: ''
  });
  const [availableLogos, setAvailableLogos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      const res  = await fetch(`${API_BASE}/admin/settings/company`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') setSettings(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchLogos = async () => {
    try {
      const res  = await fetch(`${API_BASE}/admin/settings/company/logos`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') setAvailableLogos(data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { Promise.all([fetchSettings(), fetchLogos()]).finally(() => setLoading(false)); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/company/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(settings) });
      setMessage(res.ok ? { type: 'success', text: 'Company branding updated successfully!' } : { type: 'error', text: 'Failed to update settings' });
    } catch { setMessage({ type: 'error', text: 'Connection error' }); }
    finally { setSaving(false); }
  };

  const getLogoUrl = (logo: string) => {
    if (!logo) return '';
    if (logo.startsWith('ui/')) return `/${logo.substring(3)}`;
    return `${API_BASE.replace('/api', '')}/${logo}`;
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
          <h1 className="text-lg font-semibold text-[#09090b] dark:text-white">Company Branding</h1>
          <p className="mt-0.5 text-[13px] text-[#71717a] dark:text-[#a1a1aa]">Manage corporate identity & assets</p>
        </div>
        {message && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message.text}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Company Name</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                  <input type="text" value={settings.company_name} onChange={e => setSettings({...settings, company_name: e.target.value})} required placeholder="Official Name" className={inputCls} />
                </div>
              </div>
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                  <input type="text" value={settings.company_phone} onChange={e => setSettings({...settings, company_phone: e.target.value})} placeholder="+1 (555) 000-0000" className={inputCls} />
                </div>
              </div>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                  <input type="email" value={settings.company_email} onChange={e => setSettings({...settings, company_email: e.target.value})} required placeholder="contact@company.com" className={inputCls} />
                </div>
              </div>
              {/* Website */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Website</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                  <input type="text" value={settings.company_website} onChange={e => setSettings({...settings, company_website: e.target.value})} placeholder="https://company.com" className={inputCls} />
                </div>
              </div>
              {/* Address */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">Address</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-3 text-[#a1a1aa]" />
                  <textarea rows={2} value={settings.company_address} onChange={e => setSettings({...settings, company_address: e.target.value})} required placeholder="Full address…"
                    className="w-full rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] py-2.5 pl-9 pr-3 text-[13px] text-[#09090b] placeholder:text-[#a1a1aa] focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 dark:border-[#27272a] dark:bg-[#27272a] dark:text-white dark:focus:bg-[#18181b] transition-all resize-none" />
                </div>
              </div>
            </div>

            {/* Logo Selection */}
            <div className="rounded-xl border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#18181b] p-5">
              <div className="mb-3 flex items-center gap-2">
                <ImageIcon size={14} className="text-[#6366f1] dark:text-[#818cf8]" />
                <h3 className="text-[13px] font-semibold text-[#09090b] dark:text-white">Logo Assets</h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 gap-2">
                {availableLogos.map(logo => (
                  <button key={logo} type="button" onClick={() => setSettings({...settings, company_logo: logo})}
                    className={`relative aspect-square overflow-hidden rounded-lg border p-2 flex items-center justify-center transition-all group ${
                      settings.company_logo === logo
                        ? 'border-[#6366f1] bg-[#eef2ff] dark:bg-[#6366f1]/10'
                        : 'border-[#e4e4e7] bg-[#f4f4f5] hover:border-[#6366f1]/40 dark:border-[#27272a] dark:bg-[#27272a]'
                    }`}>
                    <img src={getLogoUrl(logo)} alt={logo} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                    {settings.company_logo === logo && (
                      <div className="absolute bottom-0 left-0 w-full bg-[#6366f1] py-0.5 text-center text-[8px] font-bold text-white">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors disabled:opacity-60 shadow-sm">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[#e4e4e7] dark:border-[#27272a] sticky top-4">
            <div className="flex items-center justify-between bg-[#09090b] px-4 py-2.5">
              <span className="text-[11px] font-medium text-[#52525b]">Live Preview</span>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500/50" />
                <div className="h-2 w-2 rounded-full bg-amber-500/50" />
                <div className="h-2 w-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="bg-white p-5 min-h-[220px] scale-90 origin-top-left w-[111.11%]">
              <div className="border-b border-zinc-100 pb-3 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    {settings.company_logo ? (
                      <img src={getLogoUrl(settings.company_logo)} alt="Logo" className="h-6 w-auto object-contain mb-2" />
                    ) : (
                      <div className="mb-2 h-6 w-16 rounded border-2 border-dashed border-zinc-200 flex items-center justify-center text-[7px] font-bold text-zinc-400">LOGO</div>
                    )}
                    <h2 className="text-xs font-bold text-zinc-900 leading-tight">{settings.company_name || 'Company Name'}</h2>
                    <p className="mt-0.5 text-[7px] text-zinc-500 whitespace-pre-line leading-tight max-w-[120px]">{settings.company_address || 'Address'}</p>
                    <p className="mt-0.5 text-[7px] text-zinc-400 font-medium">{settings.company_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-900 tracking-tight opacity-10">INVOICE</p>
                    <p className="text-[7px] font-bold text-[#6366f1]">#INV-101</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 opacity-10">
                {[100, 83, 67].map(w => <div key={w} className="h-2 rounded bg-zinc-100" style={{width: `${w}%`}} />)}
              </div>
              <div className="mt-6 border-t border-zinc-50 pt-2">
                <p className="text-center text-[6px] font-medium text-zinc-400 uppercase tracking-widest">
                  © {new Date().getFullYear()} {settings.company_name || 'Company'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e0e7ff] bg-[#eef2ff] dark:border-[#6366f1]/20 dark:bg-[#6366f1]/8 p-4">
            <p className="text-[11px] font-medium text-[#6366f1] dark:text-[#818cf8]">Global Branding</p>
            <p className="mt-1 text-[12px] text-[#71717a] dark:text-[#a1a1aa]">Applied instantly across all invoice and receipt generators.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
