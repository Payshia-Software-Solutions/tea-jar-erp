"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';
import * as XLSX from 'xlsx';
import { 
  Send, 
  Users, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X,
  Search,
  Layers,
  Edit3,
  Plus,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

export default function SendEmailPage() {
  const [recipientGroups, setRecipientGroups] = useState<{ tenants: any[], requests: any[] }>({ tenants: [], requests: [] });
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroup, setActiveGroup] = useState<'all' | 'tenants' | 'requests' | 'custom'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Custom Recipient State
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRecipients, setCustomRecipients] = useState<any[]>([]);

  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/communication/recipients`, { credentials: 'include' });
        const data = await res.json();
        setRecipientGroups(data.data || { tenants: [], requests: [] });
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecipients();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && editorRef.current && !quillRef.current) {
      const Quill = require('quill').default;
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link'],
            ['clean']
          ]
        },
        placeholder: 'Design your rich HTML message here...'
      });
    }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = quillRef.current ? quillRef.current.root.innerHTML : '';
    
    if (selectedRecipients.length === 0 || !subject || !body || body === '<p><br></p>') {
      setMessage({ type: 'error', text: 'Please fill in all fields and select at least one recipient.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/admin/communication/send-custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedRecipients,
          subject,
          body
        }),
        credentials: 'include'
      });
      const result = await res.json();
      if (result.status === 'success') {
        setMessage({ type: 'success', text: result.message });
        setSubject('');
        if (quillRef.current) quillRef.current.root.innerHTML = '';
        setSelectedRecipients([]);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send email. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (r: any) => {
    if (selectedRecipients.find(sr => sr.id === r.id)) {
      setSelectedRecipients(selectedRecipients.filter(sr => sr.id !== r.id));
    } else {
      setSelectedRecipients([...selectedRecipients, r]);
    }
  };

  const selectGroup = (type: 'tenants' | 'requests' | 'custom') => {
    const group = type === 'custom' ? customRecipients : recipientGroups[type];
    const allSelected = group.every(r => selectedRecipients.find(sr => sr.id === r.id));
    
    if (allSelected) {
      setSelectedRecipients(selectedRecipients.filter(sr => !group.find(gr => gr.id === sr.id)));
    } else {
      const newRecipients = [...selectedRecipients];
      group.forEach(r => {
        if (!newRecipients.find(sr => sr.id === r.id)) newRecipients.push(r);
      });
      setSelectedRecipients(newRecipients);
    }
  };

  const addManualRecipient = () => {
    if (!customEmail || !customName) return;
    const newR = {
      id: `custom:${Date.now()}-${Math.random()}`,
      name: customName,
      email: customEmail,
      group: 'Manual Entry'
    };
    setCustomRecipients([...customRecipients, newR]);
    setCustomEmail('');
    setCustomName('');
    setActiveGroup('custom');
  };

  const downloadSampleExcel = () => {
    const data = [
      { "Name": "John Doe", "Email": "john@example.com" },
      { "Name": "Jane Smith", "Email": "jane@example.com" }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recipients");
    XLSX.writeFile(wb, "bizzflow_email_sample.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];
      
      const imported = data.map((row, i) => ({
        id: `excel:${Date.now()}-${i}`,
        name: row.Name || row.name || row['Full Name'] || 'Unknown',
        email: row.Email || row.email || row['Email Address'] || '',
        group: 'Excel Import'
      })).filter(r => r.email && r.email.includes('@'));

      setCustomRecipients([...customRecipients, ...imported]);
      setActiveGroup('custom');
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeCustomRecipient = (id: string) => {
    setCustomRecipients(customRecipients.filter(r => r.id !== id));
    setSelectedRecipients(selectedRecipients.filter(sr => sr.id !== id));
  };

  const allAvailable = [
    ...recipientGroups.tenants, 
    ...recipientGroups.requests,
    ...customRecipients
  ];

  const filtered = allAvailable.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = activeGroup === 'all' 
      || (activeGroup === 'tenants' && r.id.startsWith('tenant:')) 
      || (activeGroup === 'requests' && r.id.startsWith('request:'))
      || (activeGroup === 'custom' && (r.id.startsWith('custom:') || r.id.startsWith('excel:')));
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 w-full h-[calc(100vh-2rem)]">
        
        {/* Recipient Selection Panel */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col glass overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Users className="text-indigo-600" size={16} /> Recipients
            </h2>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {/* Manual Add & Excel Import */}
            <div className="space-y-2">
               <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry</span>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[9px] font-black text-emerald-600 hover:text-emerald-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      <FileSpreadsheet size={10} /> Import
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={handleExcelUpload} 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Name" 
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-[10px] outline-none focus:border-indigo-500 font-bold"
                  />
                  <div className="flex gap-1.5">
                    <input 
                      type="email" 
                      placeholder="Email" 
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-[10px] outline-none focus:border-indigo-500 font-bold"
                    />
                    <button 
                      onClick={addManualRecipient}
                      className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[10px] outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="flex p-0.5 bg-slate-100 dark:bg-white/5 rounded-lg">
                {(['all', 'tenants', 'requests', 'custom'] as const).map(g => (
                  <button 
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className={`flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all ${
                      activeGroup === g ? 'bg-white dark:bg-white/10 text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => selectGroup('tenants')} className="py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                  All Tenants
                </button>
                <button type="button" onClick={() => selectGroup('requests')} className="py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                  All Requests
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {filtered.map(r => {
                const isSelected = selectedRecipients.find(sr => sr.id === r.id);
                const isCustom = r.id.startsWith('custom:') || r.id.startsWith('excel:');
                return (
                  <div key={r.id} className="relative group">
                    <button 
                      onClick={() => toggleRecipient(r)}
                      className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all border ${
                        isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/20'
                      }`}
                    >
                      <div className={`w-6 h-6 shrink-0 rounded flex items-center justify-center font-black text-[9px] ${
                        isSelected ? 'bg-white/20' : 
                        r.id.startsWith('tenant:') ? 'bg-indigo-100 text-indigo-600' : 
                        r.id.startsWith('request:') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className={`text-[10px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{r.name}</div>
                        <div className={`text-[8px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>{r.email}</div>
                      </div>
                      {isSelected && <CheckCircle size={10} />}
                    </button>
                    {isCustom && (
                      <button 
                        onClick={() => removeCustomRecipient(r.id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compose Panel */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col glass overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Broadcast Composer</span>
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {selectedRecipients.length} Recipient(s) selected
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col space-y-4">
            {message && (
              <div className={`px-3 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <p className="text-[10px] font-bold">{message.text}</p>
              </div>
            )}

            <div className="border-b border-slate-200 dark:border-white/10 pb-2">
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-black text-slate-400 mt-1.5 min-w-[24px]">To:</span>
                <div className="flex flex-wrap gap-1.5 flex-1 max-h-20 overflow-y-auto custom-scrollbar">
                  {selectedRecipients.length > 0 ? (
                    selectedRecipients.map(r => (
                      <div key={r.id} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-0.5 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-700 dark:border-white/10 text-slate-700 dark:text-slate-300">{r.name}</span>
                        <button type="button" onClick={() => toggleRecipient(r)} className="text-slate-400 hover:text-rose-500">
                          <X size={10} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 italic">No recipients selected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 dark:border-white/10 pb-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 min-w-[24px]">Subject:</span>
                <input 
                  type="text" 
                  placeholder="Enter message subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col rich-editor overflow-hidden">
              <div ref={editorRef} className="flex-1" />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-[8px] font-black uppercase tracking-widest">
                  Individual Dispatches
                </div>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">* BCC Isolation Active</span>
              </div>
              
              <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .rich-editor .ql-toolbar {
          border-radius: 12px 12px 0 0;
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.05) !important;
          padding: 12px !important;
        }
        .rich-editor .ql-container {
          border-radius: 0 0 12px 12px;
          border: 1px solid rgba(0,0,0,0.05) !important;
          border-top: none !important;
          flex: 1;
          font-size: 16px !important;
        }
        .rich-editor .ql-editor {
          min-height: 400px;
          padding: 20px !important;
        }
        .dark .rich-editor .ql-toolbar {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.05) !important;
        }
        .dark .rich-editor .ql-snow .ql-stroke {
          stroke: #94a3b8;
        }
        .dark .rich-editor .ql-snow .ql-fill {
          fill: #94a3b8;
        }
        .dark .rich-editor .ql-snow .ql-picker {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
