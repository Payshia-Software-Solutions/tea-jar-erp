"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  ShieldCheck,
  ShieldAlert,
  Clock, 
  CreditCard,
  FileJson,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fetchPaymentLogs } from "@/lib/api/orders";
export default function PaymentLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetchPaymentLogs();
      setLogs(res.status === 'success' ? res.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch logs", err);
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.gateway?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout title="Payment Webhook Logs">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Webhook Logs</h1>
            <p className="text-muted-foreground text-sm">Audit trail of all incoming signals.</p>
          </div>
          <Button onClick={loadLogs} variant="outline" size="sm" className="h-9 font-bold">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search logs..." 
                  className="pl-9 h-10 bg-background"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase h-10">Timestamp</TableHead>
                  <TableHead className="font-bold text-xs uppercase h-10">Gateway</TableHead>
                  <TableHead className="font-bold text-xs uppercase h-10">Order ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase h-10">Payment ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase h-10">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase h-10 text-right">Amount</TableHead>
                  <TableHead className="w-[60px] h-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-xs text-muted-foreground font-bold">Loading logs...</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/5 transition-colors border-b">
                      <TableCell className="py-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{format(new Date(log.created_at), "MMM dd, yyyy")}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), "hh:mm a")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {(() => {
                          const g = log.gateway?.toLowerCase();
                          if (g === 'payhere' || g === 'ipg') {
                            return <img src="/payhere.png" alt="PayHere" className="h-4 w-auto" />;
                          }
                          if (g === 'mintpay') {
                            return (
                              <Badge className="bg-emerald-500 text-white border-none text-[8px] h-4 py-0 px-1 font-black">
                                MINTPAY
                              </Badge>
                            );
                          }
                          if (g === 'cod' || g?.includes('cash')) {
                            return (
                              <Badge variant="outline" className="text-[8px] h-4 py-0 px-1 font-black">
                                CASH
                              </Badge>
                            );
                          }
                          return (
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0 px-1 border-indigo-200 text-indigo-600 bg-indigo-50">
                              {log.gateway}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="py-2 font-bold text-xs">{log.order_id || '-'}</TableCell>
                      <TableCell className="py-2 text-[11px] text-muted-foreground font-mono">{log.payment_id || '-'}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-1">
                          {log.status_code == '2' ? (
                            <div className="flex flex-col">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] h-5 py-0 px-1 font-bold w-fit">
                                SUCCESS
                              </Badge>
                              {log.validation_status == 1 && (
                                <span className="text-[8px] font-bold text-emerald-700 uppercase flex items-center gap-0.5 mt-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] h-5 py-0 px-1 font-bold w-fit">
                              ERROR {log.status_code}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right font-bold text-xs">
                        {log.currency} {Number(log.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-md hover:bg-primary/10"
                          onClick={() => setSelectedLog(log)}
                        >
                          <FileJson className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="p-3 border-t bg-muted/20 flex items-center justify-between">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Showing {paginatedLogs.length} of {filteredLogs.length} logs
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 font-bold text-xs" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 font-bold text-xs" 
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-white border-none rounded-3xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold tracking-tight">Raw Webhook Data</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Received from {selectedLog?.gateway} at {selectedLog && format(new Date(selectedLog.created_at), "PPpp")}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-3">
            <div className="bg-zinc-950 rounded-2xl p-6 overflow-auto max-h-[60vh] border border-zinc-800 shadow-2xl">
              <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed">
                {selectedLog && JSON.stringify(JSON.parse(selectedLog.raw_data), null, 2)}
              </pre>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setSelectedLog(null)} className="rounded-xl font-bold h-10 px-6 bg-zinc-900 hover:bg-zinc-800 transition-all text-sm">Close Audit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
