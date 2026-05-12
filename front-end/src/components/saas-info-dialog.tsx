"use client"

import React from "react"
import { 
  ShieldCheck, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Lock,
  RefreshCw
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SaasInfoDialogProps {
  isOpen: boolean
  onClose: () => void
  tenantName: string
  packageName: string
  licenseKey: string
  modules: string[] | null
  renewalDate?: string
  invoices?: any[]
  onSync?: () => Promise<void>
}

const ALL_ERP_MODULES = [
  { id: 'serviceCenter', label: 'Fleet Management', desc: 'Job cards & repair tracking' },
  { id: 'inventory', label: 'Inventory Management', desc: 'Stock & batch tracking' },
  { id: 'vendors', label: 'Vendor Management', desc: 'Supplier & payment profile' },
  { id: 'crm', label: 'CRM', desc: 'Customer lifecycle' },
  { id: 'sales', label: 'Sales', desc: 'Invoicing & retail' },
  { id: 'accounting', label: 'Finance & Accounting', desc: 'Ledgers & reconciliation' },
  { id: 'hrm', label: 'Human Resources', desc: 'Payroll & attendance' },
  { id: 'masterData', label: 'Master Data', desc: 'Core system parameters' },
  { id: 'promotions', label: 'Marketing & Promotions', desc: 'Campaigns & BOGO offers' },
  { id: 'production', label: 'Manufacturing & Production', desc: 'BOM & assembly logic' },
  { id: 'ecommerce', label: 'E-commerce Storefront', desc: 'Online sales & content' },
]

export function SaasInfoDialog({ 
  isOpen, 
  onClose, 
  tenantName, 
  packageName, 
  licenseKey, 
  modules,
  renewalDate,
  invoices,
  onSync
}: SaasInfoDialogProps) {
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    if (!onSync) return;
    setSyncing(true);
    await onSync();
    setSyncing(false);
  };
  
  const isModuleIncluded = (modId: string) => {
    if (!modules) return false
    if (modules.includes('*')) return true
    return modules.includes(modId)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
    } catch { return dateStr || 'N/A'; }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border-white/5 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
        <DialogTitle className="sr-only">License Information</DialogTitle>
        <div className="relative">
          {/* Header Banner */}
          <div className="h-28 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center px-8 border-b border-white/5 relative overflow-hidden">
             <div className="absolute -right-6 -bottom-6 opacity-5">
                <ShieldCheck className="w-32 h-32" />
             </div>
             <div className="flex items-center gap-4">
                <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-500/30">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <Badge variant="outline" className="mb-1 text-[9px] font-black uppercase tracking-widest bg-blue-500/10 border-blue-500/30 text-blue-400">
                        License Status
                    </Badge>
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">{tenantName}</h2>
                </div>
             </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Quick Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plan</span>
                    </div>
                    <div className="text-base font-black text-white uppercase italic tracking-tighter">{packageName}</div>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Renewal</span>
                    </div>
                    <div className="text-base font-black text-white uppercase italic tracking-tighter truncate">{formatDate(renewalDate)}</div>
                </div>
            </div>

            {/* Feature Summary */}
            <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-white">Feature Entitlements</div>
                        <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">
                            {modules?.includes('*') ? 'Unlimited Access' : `${modules?.length || 0} Modules Active`}
                        </div>
                    </div>
                </div>
                <Link 
                    href="/admin/subscription" 
                    onClick={onClose}
                    className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                    Details <ExternalLink size={10} />
                </Link>
            </div>

            {/* License Identity - Collapsed style */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Identity Key</span>
                </div>
                <code className="text-[10px] font-mono text-muted-foreground/40 font-bold truncate max-w-[150px]">{licenseKey}</code>
            </div>

            <footer className="pt-6 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest italic opacity-60">Node #01-SG</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleSync} 
                        disabled={syncing}
                        className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-10 w-10 transition-all active:scale-95"
                    >
                        <RefreshCw className={cn("w-4 h-4 text-blue-400", syncing && "animate-spin")} />
                    </Button>
                    <Button onClick={onClose} className="accent-gradient font-black uppercase text-[9px] tracking-widest px-6 rounded-xl h-10 shadow-lg shadow-blue-500/20">
                        Close View
                    </Button>
                </div>
            </footer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
