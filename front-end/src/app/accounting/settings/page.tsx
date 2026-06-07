"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw, 
  Save, 
  CheckCircle2,
  Info
} from "lucide-react";
import { 
  fetchAccountMappings, 
  updateAccountMapping, 
  fetchAccounts,
  fetchAccountingSettings,
  updateAccountingSettings,
  fetchFiscalPeriods,
  activateFiscalYear
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";

export default function AccountingSettingsPage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [fiscalYear, setFiscalYear] = useState({ fy_start: "", fy_end: "" });
  const [fiscalPeriods, setFiscalPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingFiscal, setSavingFiscal] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingData, accountData, settings, periods] = await Promise.all([
        fetchAccountMappings(),
        fetchAccounts(),
        fetchAccountingSettings(),
        fetchFiscalPeriods()
      ]);
      setMappings(mappingData || []);
      setAccounts(accountData || []);
      setFiscalPeriods(periods || []);
      setFiscalYear({
        fy_start: settings.fy_start || "",
        fy_end: settings.fy_end || ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounting configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateMapping = async (key: string, accountId: number) => {
    setSaving(key);
    try {
      await updateAccountMapping(key, accountId);
      toast({
        title: "Success",
        description: "Transaction mapping updated successfully",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update mapping",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateFiscal = async (id: number) => {
    setSavingFiscal(true);
    try {
      await activateFiscalYear(id);
      toast({
        title: "Record Activated",
        description: "The selected Fiscal Year is now the operational default.",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate fiscal record",
        variant: "destructive",
      });
    } finally {
      setSavingFiscal(false);
    }
  };

  const categories = Array.from(new Set(mappings.map(m => m.category)));

  return (
    <DashboardLayout title="Accounting Settings">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Accounting Settings</h1>
            <p className="text-muted-foreground">Configure how business events map to your Chart of Accounts.</p>
          </div>
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Financial Year Card */}
        <Card className="border shadow-sm bg-gradient-to-br from-primary/5 to-transparent rounded-xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <CalendarDays className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">Operational Financial Year</CardTitle>
                <CardDescription>Select which standardized fiscal year is currently active for auditing.</CardDescription>
              </div>
              <Button 
                variant="outline"
                className="font-black px-8 rounded-full shadow-md border-primary/20"
                onClick={() => router.push('/accounting/fiscal-years')}
              >
                Manage Years
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 mt-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label className="uppercase text-[10px] font-black tracking-widest opacity-60 px-1">Active Fiscal Record</Label>
                 <Select 
                    value={fiscalPeriods.find(p => p.is_active)?.id?.toString()}
                    onValueChange={(val) => handleUpdateFiscal(parseInt(val))}
                    disabled={savingFiscal}
                 >
                    <SelectTrigger className="h-12 border-primary/20 bg-background/50 rounded-xl font-bold">
                       <SelectValue placeholder="Select Fiscal Year" />
                    </SelectTrigger>
                    <SelectContent>
                       {fiscalPeriods.map(p => (
                         <SelectItem key={p.id} value={p.id.toString()}>
                            <div className="flex items-center justify-between w-[300px]">
                               <span>{p.name} {p.is_closed ? '(LOCKED)' : ''}</span>
                               <span className="text-[10px] opacity-40 font-mono">{p.start_date} → {p.end_date}</span>
                            </div>
                         </SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
               </div>
               
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-black shadow-sm italic text-xs border border-primary/10">
                    FY
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-60">Currently Enforced Period</p>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{fiscalYear.fy_start} to {fiscalYear.fy_end}</p>
                  </div>
               </div>
             </div>
          </CardContent>
          <div className="bg-primary/5 p-4 text-[10px] px-8 flex items-center gap-2 font-medium italic opacity-60 border-t">
             <Info className="w-3 h-3" /> Transitioning to a new active year will update the defaults for Trial Balance and Balance Sheet immediately.
          </div>
        </Card>

        {/* Caution Banner */}
        <div className="p-6 rounded-2xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-600 dark:text-rose-400">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-rose-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-wide">
                System Caution: Advanced Operation
              </h2>
              <p className="text-sm opacity-90 max-w-3xl">
                Modifying these mappings will change how the automated accounting engine records future transactions. 
                Existing journal entries will <strong>not</strong> be retroactively updated. 
                Changing these during active business hours may lead to reconciliation discrepancies.
              </p>
            </div>
          </div>
        </div>

        {/* Mappings by Category */}
        {categories.map(category => (
          <Card key={category} className="overflow-hidden border-none shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {category} Mappings
              </CardTitle>
              <CardDescription>Accounts used for {category.toLowerCase()} related transactions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Transaction Type</TableHead>
                    <TableHead>System Key</TableHead>
                    <TableHead className="w-[400px]">Linked Account</TableHead>
                    <TableHead className="text-right px-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.filter(m => m.category === category).map((mapping) => (
                    <TableRow key={mapping.map_key} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="px-6 font-medium">{mapping.label}</TableCell>
                      <TableCell>
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-mono tracking-tight opacity-70">
                          {mapping.map_key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Select 
                          disabled={saving === mapping.map_key}
                          value={mapping.account_id.toString()}
                          onValueChange={(val) => handleUpdateMapping(mapping.map_key, parseInt(val))}
                        >
                          <SelectTrigger className="w-full bg-background border-primary/20 hover:border-primary transition-all">
                            <SelectValue placeholder="Select Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(acc => {
                              const code = parseInt(acc.code);
                              const isDebit = (code >= 1000 && code < 2000) || (code >= 5000 && code < 6000);
                              return (
                                <SelectItem key={acc.id} value={acc.id.toString()}>
                                  <div className="flex items-center justify-between w-[350px]">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] opacity-70">[{acc.code}]</span>
                                      <span>{acc.name}</span>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[9px] uppercase font-black px-1 py-0 h-4 ${isDebit ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-blue-500 border-blue-500/20 bg-blue-500/5'}`}
                                    >
                                      {isDebit ? 'DR' : 'CR'}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        {saving === mapping.map_key ? (
                          <RefreshCw className="w-4 h-4 animate-spin ml-auto text-primary" />
                        ) : (
                          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {/* Additional Help */}
        <div className="flex gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400 text-sm italic">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>
            If you need to use an account that is not listed, please create it first in the 
            <Link href="/accounting/accounts" className="underline font-bold mx-1 hover:text-blue-700">Chart of Accounts</Link> 
            before attempting to map it here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
