"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Download,
  Upload,
  Loader2,
  FileCheck,
  History,
  RotateCw,
  Archive,
  Eye
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { 
  fetchVehicleDocuments, 
  addVehicleDocument, 
  deleteVehicleDocument, 
  uploadVehicleDocument,
  contentUrl,
  api
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isPast } from 'date-fns';

interface VehicleDocumentsProps {
  vehicleId: number;
}

const DOCUMENT_TYPES = [
  "Insurance",
  "Revenue License",
  "Fitness Certificate",
  "Registration Card (V5)",
  "Emission Test",
  "Maintenance Record",
  "Warranty Document",
  "Other"
];

export function VehicleDocuments({ vehicleId }: VehicleDocumentsProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [renewingDoc, setRenewingDoc] = useState<any>(null);

  // Form State
  const [docType, setDocType] = useState('Insurance');
  const [docNum, setDocNum] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Renewal Form State (for modal)
  const [renExpiryDate, setRenExpiryDate] = useState('');
  const [renDocNum, setRenDocNum] = useState('');
  const [renFile, setRenFile] = useState<File | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both active and archived if needed
      const status = showArchived ? '' : 'Active';
      const res = await api(`/api/vehicle-document/list/${vehicleId}?status=${status}`);
      const json = await res.json();
      setDocuments(json.status === 'success' ? json.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, showArchived]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isRenewal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isRenewal) {
      setRenFile(file);
    } else {
      setSelectedFile(file);
    }
    toast({ title: "File Selected", description: `${file.name} is ready.` });
  };

  const handleAddDocument = async () => {
    if (!docType) return;

    setSubmitting(true);
    try {
      let uploadedFilename = null;

      // 1. Upload file if selected
      if (selectedFile) {
        setUploading(true);
        const uploadRes = await uploadVehicleDocument(selectedFile);
        uploadedFilename = uploadRes.filename;
        setUploading(false);
      }

      // 2. Save document record
      await addVehicleDocument({
        vehicle_id: vehicleId,
        document_type: docType,
        document_number: docNum,
        file_path: uploadedFilename,
        expiry_date: expiryDate || null
      });
      
      toast({ title: "Success", description: "Document record and file saved." });
      
      // Reset form
      setDocType('Insurance');
      setDocNum('');
      setExpiryDate('');
      setSelectedFile(null);
      void loadDocuments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete document save.", variant: "destructive" });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this document record?')) return;
    try {
      await deleteVehicleDocument(id);
      toast({ title: "Deleted", description: "Document record removed." });
      void loadDocuments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
    }
  };

  const handleRenew = (doc: any) => {
    setRenewingDoc(doc);
    setRenDocNum(doc.document_number || '');
    setRenExpiryDate('');
    setRenFile(null);
  };

  const handleSaveRenewal = async () => {
    if (!renewingDoc) return;

    setSubmitting(true);
    try {
      let uploadedFilename = null;

      // 1. Upload file if selected
      if (renFile) {
        setUploading(true);
        const uploadRes = await uploadVehicleDocument(renFile);
        uploadedFilename = uploadRes.filename;
        setUploading(false);
      }

      // 2. Save document record (Backend handles archiving the old one)
      await addVehicleDocument({
        vehicle_id: vehicleId,
        document_type: renewingDoc.document_type,
        document_number: renDocNum,
        file_path: uploadedFilename,
        expiry_date: renExpiryDate || null
      });
      
      toast({ title: "Renewed", description: `${renewingDoc.document_type} has been updated.` });
      setRenewingDoc(null);
      void loadDocuments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save renewal.", variant: "destructive" });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const getStatusBadge = (expiry: string | null, status: string = 'Active') => {
    if (status === 'Archived') return <Badge variant="secondary" className="bg-slate-200 text-slate-500">Archived</Badge>;
    if (!expiry) return <Badge variant="outline" className="bg-slate-100 text-slate-600">Permanent</Badge>;
    
    const date = new Date(expiry);
    const daysLeft = differenceInDays(date, new Date());

    if (isPast(date)) {
      return <Badge className="bg-red-500 hover:bg-red-600">Expired</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Expiring Soon ({daysLeft} days)</Badge>;
    }
    return <Badge className="bg-emerald-500 hover:bg-emerald-600">Active ({daysLeft} days)</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="bg-primary/[0.03] border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                Compliance Documents
              </CardTitle>
              <CardDescription>Track Insurance, Revenue License, and Fitness certificates.</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 mr-2">
                <Label htmlFor="history-mode" className="text-[10px] uppercase font-black text-slate-500">Show History</Label>
                <Switch 
                  id="history-mode"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
              </div>
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                {documents.length} Records
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 border-b bg-slate-50/30 dark:bg-slate-900/10 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-10 text-sm rounded-xl bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">Doc Number</Label>
              <Input 
                placeholder="e.g. POL-12345" 
                value={docNum} 
                onChange={e => setDocNum(e.target.value)} 
                className="h-10 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">Expiry Date (Optional)</Label>
              <Input 
                type="date" 
                value={expiryDate} 
                onChange={e => setExpiryDate(e.target.value)} 
                className="h-10 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">Attachment</Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center h-10 px-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <Input type="file" className="hidden" onChange={handleFileSelect} />
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : (
                    selectedFile ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Upload className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="ml-2 text-xs text-slate-500 truncate max-w-[80px]">
                    {selectedFile ? selectedFile.name : "Select File"}
                  </span>
                </label>
              </div>
            </div>
            <Button type="button" onClick={handleAddDocument} disabled={submitting} className="h-10 rounded-xl shadow-md">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Document
            </Button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
              <p className="mt-4 text-sm text-slate-400">Loading compliance data...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-4">
                <Clock className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">No compliance documents tracked for this vehicle.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase font-black text-slate-400 border-b">
                  <tr>
                    <th className="px-6 py-4">Document Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Number</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/5 rounded-lg">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{doc.document_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(doc.expiry_date, doc.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-sm font-medium">
                            {doc.expiry_date ? format(new Date(doc.expiry_date), 'PPP') : "Permanent Document"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                          {doc.document_number || "---"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.file_path && (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                              onClick={() => setPreviewDoc(doc)}
                              title="Preview Document"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {doc.status === 'Active' && (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                              onClick={() => handleRenew(doc)}
                              title="Renew Document"
                            >
                              <RotateCw className="w-4 h-4" />
                            </Button>
                          )}
                          {doc.file_path && (
                            <a 
                              href={contentUrl('documents', doc.file_path)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Download Attachment"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            onClick={() => handleDelete(doc.id)}
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Summary / Alert */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl shadow-sm text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-emerald-600/60 tracking-wider">Valid Documents</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
              {documents.filter(d => !isPast(new Date(d.expiry_date)) && differenceInDays(new Date(d.expiry_date), new Date()) > 30).length}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl shadow-sm text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-red-600/60 tracking-wider">Attention Required</p>
            <p className="text-xl font-black text-red-700 dark:text-red-400">
              {documents.filter(d => isPast(new Date(d.expiry_date)) || differenceInDays(new Date(d.expiry_date), new Date()) <= 30).length}
            </p>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-slate-50/50 dark:bg-slate-900/50 flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {previewDoc?.document_type} Preview
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                {previewDoc?.document_number || "No Reference Number"} • {previewDoc?.expiry_date ? `Expires: ${format(new Date(previewDoc.expiry_date), 'PPP')}` : "Permanent Document"}
              </p>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-auto flex items-center justify-center p-4">
            {previewDoc?.file_path && (
              <>
                {['jpg', 'jpeg', 'png', 'webp', 'gif'].some(ext => previewDoc.file_path.toLowerCase().endsWith(ext)) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={contentUrl('documents', previewDoc.file_path)} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md bg-white"
                  />
                ) : previewDoc.file_path.toLowerCase().endsWith('pdf') ? (
                  <iframe 
                    src={contentUrl('documents', previewDoc.file_path)} 
                    className="w-full h-full rounded-lg border-none bg-white shadow-md"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="text-center p-10 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">Preview Not Available</h3>
                    <p className="text-sm text-slate-500 mt-2">This file type cannot be previewed directly. Please download it to view.</p>
                    <Button 
                      type="button"
                      className="mt-6" 
                      onClick={() => window.open(contentUrl('documents', previewDoc.file_path), '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" /> Download File
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Renewal Dialog */}
      <Dialog open={!!renewingDoc} onOpenChange={(open) => !open && setRenewingDoc(null)}>
        <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-primary" />
              Renew {renewingDoc?.document_type}
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">Previous Doc: {renewingDoc?.document_number || "N/A"}</p>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">New Document Number</Label>
              <Input 
                placeholder="Enter new number" 
                value={renDocNum}
                onChange={e => setRenDocNum(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">New Expiry Date (Optional)</Label>
              <Input 
                type="date" 
                value={renExpiryDate}
                onChange={e => setRenExpiryDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-500">New Attachment</Label>
              <label className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <Input type="file" className="hidden" onChange={(e) => handleFileSelect(e, true)} />
                <div className="text-center">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> : (
                    renFile ? <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" /> : <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  )}
                  <p className="mt-2 text-xs text-slate-500 font-medium">
                    {renFile ? renFile.name : "Select new document file"}
                  </p>
                </div>
              </label>
            </div>
            <Button 
              type="button"
              className="w-full h-12 rounded-xl text-md font-bold shadow-lg" 
              onClick={handleSaveRenewal}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RotateCw className="w-5 h-5 mr-2" />}
              Save Renewal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
