"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Wrench, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ServiceHistoryTable({ vehicleId }: { vehicleId: number | string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api(`/api/vehicle/history/${vehicleId}`);
        const data = await res.json();
        if (data.status === "success") {
          setHistory(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch service history:", err);
      } finally {
        setLoading(false);
      }
    };
    if (vehicleId) fetchHistory();
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading service history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-900">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">No Service History</h3>
        <p className="text-sm text-slate-500 mt-1">This vehicle has no completed service records.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Job Type</TableHead>
            <TableHead>Mileage</TableHead>
            <TableHead>Technician</TableHead>
            <TableHead>Notes / Description</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{record.completed_at ? format(new Date(record.completed_at), "MMM d, yyyy") : "N/A"}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={record.job_type === 'Service Booking' ? 'default' : 'secondary'}>
                  {record.job_type || "Repair"}
                </Badge>
              </TableCell>
              <TableCell>
                {record.mileage ? <span className="font-mono">{record.mileage.toLocaleString()} mi</span> : "---"}
              </TableCell>
              <TableCell>
                {record.technician || "Unassigned"}
              </TableCell>
              <TableCell className="max-w-xs truncate" title={record.completion_comments || record.problem_description}>
                {record.completion_comments || record.problem_description || "No notes"}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/orders/${record.id}`}>
                  <Button variant="outline" size="sm" className="gap-2 h-8">
                    <Wrench className="w-3 h-3" />
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
