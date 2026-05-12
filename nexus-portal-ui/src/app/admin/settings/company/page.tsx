'use client';

import { useState, useEffect } from 'react';
import { Save, Building2, Mail, MapPin, Globe, Phone, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost/rapair-management/nexus-portal-server/public/api';

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState({
    company_name: '',
    company_address: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    company_logo: ''
  });
  const [availableLogos, setAvailableLogos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/company`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        setSettings(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogos = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/company/logos`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'success') {
        setAvailableLogos(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchSettings(), fetchLogos()]).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/company/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Company branding updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const getLogoUrl = (logo: string) => {
    if (!logo) return '';
    if (logo.startsWith('ui/')) {
      return `/${logo.substring(3)}`;
    }
    return `http://localhost/rapair-management/nexus-portal-server/public/${logo}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Building2 size={20} />
            </div>
            Company Branding
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage corporate identity & assets</p>
        </div>
        
        {message && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm border ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={14} /> : <ImageIcon size={14} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="glass p-3">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Entity Name</label>
              <div className="relative group">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  value={settings.company_name}
                  onChange={e => setSettings({...settings, company_name: e.target.value})}
                  className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                  placeholder="Official Name"
                  required
                />
              </div>
            </div>

            <div className="glass p-3">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hotline</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  value={settings.company_phone}
                  onChange={e => setSettings({...settings, company_phone: e.target.value})}
                  className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                  placeholder="Phone"
                />
              </div>
            </div>

            <div className="glass p-3">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="email"
                  value={settings.company_email}
                  onChange={e => setSettings({...settings, company_email: e.target.value})}
                  className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                  placeholder="Email"
                  required
                />
              </div>
            </div>

            <div className="glass p-3">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Website</label>
              <div className="relative group">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  value={settings.company_website}
                  onChange={e => setSettings({...settings, company_website: e.target.value})}
                  className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                  placeholder="Website"
                />
              </div>
            </div>

            <div className="md:col-span-2 glass p-3">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Address</label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <textarea 
                  rows={2}
                  value={settings.company_address}
                  onChange={e => setSettings({...settings, company_address: e.target.value})}
                  className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all resize-none"
                  placeholder="Full Address"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 glass p-3">
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <ImageIcon size={12} /> Logo Assets
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {availableLogos.map((logo) => (
                  <button
                    key={logo}
                    type="button"
                    onClick={() => setSettings({...settings, company_logo: logo})}
                    className={`relative aspect-square rounded-lg border transition-all overflow-hidden flex items-center justify-center p-1.5 group ${
                      settings.company_logo === logo 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-500/30'
                    }`}
                  >
                    <img 
                      src={getLogoUrl(logo)} 
                      alt={logo} 
                      className="max-w-full max-h-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform"
                    />
                    <div className={`absolute bottom-0 left-0 w-full text-[6px] font-black text-center py-0.5 transition-all ${
                      settings.company_logo === logo 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100'
                    }`}>
                      {logo.split('/').pop()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end mt-2">
              <button 
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Apply Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Branding Preview */}
        <div className="space-y-4">
          <div className="glass overflow-hidden sticky top-4">
            <div className="bg-slate-900 px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Live Preview</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-rose-500/50" />
                <div className="w-1 h-1 rounded-full bg-amber-500/50" />
                <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
              </div>
            </div>
            <div className="p-4 bg-white min-h-[250px] scale-90 origin-top">
              {/* Document Header Mockup */}
              <div className="border-b border-slate-100 pb-3 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    {settings.company_logo ? (
                      <img 
                        src={getLogoUrl(settings.company_logo)} 
                        alt="Logo" 
                        className="h-6 w-auto object-contain mb-2"
                      />
                    ) : (
                      <div className="w-16 h-6 bg-slate-50 border border-dashed border-slate-200 rounded flex items-center justify-center text-[6px] font-bold text-slate-400 mb-2">
                        NO LOGO
                      </div>
                    )}
                    <h2 className="text-xs font-black text-slate-900 leading-tight">{settings.company_name || 'Organization Name'}</h2>
                    <p className="text-[6px] text-slate-500 mt-0.5 whitespace-pre-line leading-tight max-w-[120px]">
                      {settings.company_address || 'Address Placeholder'}
                    </p>
                    <p className="text-[6px] text-slate-400 mt-0.5 font-bold">
                      {settings.company_email}
                    </p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-[10px] font-black text-slate-900 tracking-tighter opacity-10">INVOICE</h1>
                    <p className="text-[6px] font-black text-indigo-600">#INV-101</p>
                  </div>
                </div>
              </div>

              {/* Sample Content */}
              <div className="space-y-2 opacity-10">
                <div className="h-2 bg-slate-100 rounded w-full" />
                <div className="h-2 bg-slate-100 rounded w-5/6" />
                <div className="h-2 bg-slate-100 rounded w-4/6" />
              </div>

              <div className="mt-8 border-t border-slate-50 pt-2">
                <p className="text-[5px] text-slate-400 text-center font-bold uppercase tracking-widest">
                   &copy; {new Date().getFullYear()} {settings.company_name || 'Organization'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
            <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Global Branding</h4>
            <p className="text-[9px] text-slate-500 leading-relaxed font-bold italic">
              Applied instantly across all generators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
