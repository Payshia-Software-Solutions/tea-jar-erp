"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { 
  fetchCustomerNotes, 
  createCustomerNote, 
  CustomerNoteRow 
} from "@/lib/api/customer-notes";
import { fetchCustomers } from "@/lib/api/master-data";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function CustomerNotesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerNoteRow[]>([]);
  const [customers, setCustomers] = useState<Array<{ value: string; label: string }>>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "Credit Note" as "Credit Note" | "Debit Note",
    customer_id: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    reason: ""
  });

  const loadCustomers = async () => {
    try {
      const custData = await fetchCustomers();
      setCustomers(custData.map((x: any) => ({ value: String(x.id), label: `${x.name} - ${x.phone || ''}` })));
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchCustomerNotes();
      setData(res);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!form.customer_id) return toast({ title: "Validation Error", description: "Customer is required", variant: "destructive" });
    if (!form.amount || Number(form.amount) <= 0) return toast({ title: "Validation Error", description: "Valid amount is required", variant: "destructive" });

    try {
      setSubmitting(true);
      await createCustomerNote({
        type: form.type,
        customer_id: Number(form.customer_id),
        date: form.date,
        amount: Number(form.amount),
        reason: form.reason
      });
      toast({ title: "Success", description: "Note created successfully." });
      setIsDialogOpen(false);
      setForm({
        type: "Credit Note",
        customer_id: "",
        date: new Date().toISOString().split("T")[0],
        amount: "",
        reason: ""
      });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Customer Notes" fullWidth={true}>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer Notes</h1>
            <p className="text-muted-foreground">Manage Credit and Debit notes for customer accounts.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Note No</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No customer notes found.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{row.note_no}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.type === 'Credit Note' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3">{row.customer_name} {row.customer_phone ? `(${row.customer_phone})` : ''}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.reason || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Customer Note</DialogTitle>
            <DialogDescription>
              Create a Credit Note (to reduce customer balance) or a Debit Note (to increase balance).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.type} 
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              >
                <option value="Credit Note">Credit Note (Reduce Debt)</option>
                <option value="Debit Note">Debit Note (Increase Debt)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <SearchableSelect 
                options={customers} 
                value={form.customer_id} 
                onValueChange={(val) => setForm({ ...form, customer_id: val })} 
                placeholder="Select Customer..." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date" 
                  value={form.date} 
                  onChange={(e) => setForm({ ...form, date: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={form.amount} 
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason / Description</label>
              <Input 
                placeholder="E.g., Discount, Extra charge, Return adjustment..." 
                value={form.reason} 
                onChange={(e) => setForm({ ...form, reason: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
