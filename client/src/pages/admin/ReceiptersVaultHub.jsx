import React, { useState } from 'react';
import ReceiptersAuthGate from '@/components/ReceiptersAuthGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Download, FileText, Search, ShieldCheck, Lock, FolderArchive, Plus, Eye, Trash2, Archive, UploadCloud, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/apiClient';
import ReceiptModal from '@/components/receipters/ReceiptModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReceiptersVaultHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('invoice');
  const [uploadAmount, setUploadAmount] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch VaultDocuments
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['vault_documents'],
    queryFn: async () => {
      const res = await api.get('/entities/VaultDocument');
      return Array.isArray(res) ? res : (res.data || []);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (newDoc) => {
      const res = await api.post('/entities/VaultDocument', newDoc);
      return Array.isArray(res) ? res : (res.data || []);
    },
    onSuccess: () => {
      toast.success("Document added to Vault");
      queryClient.invalidateQueries(['vault_documents']);
      setUploadOpen(false);
      setUploadTitle('');
      setUploadAmount('');
    },
    onError: () => toast.error("Failed to add document")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/entities/VaultDocument/${id}`);
    },
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries(['vault_documents']);
    }
  });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ id, is_locked }) => {
      await api.put(`/entities/VaultDocument/${id}`, { is_locked });
    },
    onSuccess: (data, variables) => {
      toast.success(variables.is_locked ? "Document locked" : "Document unlocked");
      queryClient.invalidateQueries(['vault_documents']);
    }
  });

  const activeCount = documents.filter(d => !d.is_archived).length;
  const lockedCount = documents.filter(d => d.is_locked).length;
  const archivedCount = documents.filter(d => d.is_archived).length;

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = () => {
    if (!uploadTitle) {
      toast.error("Title is required");
      return;
    }
    uploadMutation.mutate({
      title: uploadTitle,
      document_type: uploadType,
      source: "Manual Upload",
      amount: uploadAmount ? parseFloat(uploadAmount) : 0,
      stored_by_name: "Admin",
      is_locked: false
    });
  };

  const handleView = async (doc) => {
    if (doc.s3_file_key) {
      try {
        const res = await api.post('/receipters/vault-sign', { document_id: doc.id });
        if (res.data.url) {
          window.open(res.data.url, '_blank');
          return;
        }
      } catch (e) {
        toast.error("Failed to generate secure URL");
      }
    }
    // Fallback to detail dialog
    setSelectedDoc(doc);
  };

  return (
    <ReceiptersAuthGate featureName="Receipters Vault Hub">
      <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-900 flex items-center gap-2 uppercase">
              <FolderArchive className="w-6 h-6 text-blue-900" />
              Receipters Vault Hub
            </h1>
            <p className="text-muted-foreground mt-1">Securely store, organize, and retrieve receipts & documents.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => toast.success("Exporting CSV...")} className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setUploadOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-blue-100 p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Documents</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Locked</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{lockedCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Archived</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{archivedCount}</h3>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-10 h-11 border-slate-200 bg-white" 
              placeholder="Search title, tags, reference..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select className="h-11 rounded-md border border-slate-200 px-3 text-sm bg-white min-w-[140px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-red-500">
              <option>All Types</option>
              <option>Receipts</option>
              <option>Expenses</option>
              <option>Invoices</option>
              <option>Budgets</option>
              <option>Contracts</option>
              <option>Reports</option>
              <option>Statements</option>
              <option>Other</option>
            </select>
            <select className="h-11 rounded-md border border-slate-200 px-3 text-sm bg-white min-w-[180px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-red-500">
              <option>All Sources / POS</option>
              <optgroup label="POS Generated" className="font-bold">
                <option value="POS Checkout" className="font-normal">&nbsp;&nbsp;POS Checkout</option>
                <option value="POS Expense" className="font-normal">&nbsp;&nbsp;POS Expense</option>
              </optgroup>
              <optgroup label="Imported" className="font-bold">
                <option value="Receipters Engine" className="font-normal">&nbsp;&nbsp;Receipters Engine</option>
                <option value="Transactions" className="font-normal">&nbsp;&nbsp;Transactions</option>
              </optgroup>
              <optgroup label="Manual" className="font-bold">
                <option value="Unknown" className="font-normal">&nbsp;&nbsp;Unknown</option>
              </optgroup>
            </select>
            <Button variant="outline" className="h-11 font-medium bg-white">
              View Archived
            </Button>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {isLoading ? (
               <div className="p-8 text-center text-slate-500">Loading documents...</div>
            ) : filteredDocs.length === 0 ? (
               <div className="p-8 text-center text-slate-500">No documents in Vault.</div>
            ) : (
              filteredDocs.map(doc => (
                <div key={doc.id} className={`p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group ${doc.document_type === 'expense' ? 'bg-amber-50/30' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center ${doc.document_type === 'expense' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{doc.title}</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-medium capitalize border-0">{doc.document_type}</Badge>
                        <span className="text-xs text-slate-400">• {doc.source || 'Unknown Source'}</span>
                        {doc.is_locked && <Lock className="w-3 h-3 text-blue-500" />}
                      </div>
                      <p className="text-xs text-slate-500">
                        Ref: {doc.reference_number || 'N/A'} · By: {doc.stored_by_name || 'System'} · Date: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded border border-slate-200 text-slate-600 bg-white uppercase tracking-wider">{doc.category || 'general'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="font-bold text-slate-900 text-right">KES {parseFloat(doc.amount || 0).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(doc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Eye className="w-4 h-4"/></button>
                      <button onClick={() => toggleLockMutation.mutate({ id: doc.id, is_locked: !doc.is_locked })} className={`p-2 rounded-md transition-colors ${doc.is_locked ? 'text-slate-600 bg-slate-100' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}><Lock className="w-4 h-4"/></button>
                      <button onClick={() => toast.success(`Document ${doc.id} archived`)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"><Archive className="w-4 h-4"/></button>
                      <button onClick={() => deleteMutation.mutate(doc.id)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upload Dialog */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-blue-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5" /> Add Document to Vault
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Document Title</label>
                <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="e.g. Q3 Server Hosting Invoice" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Document Type</label>
                <select 
                  className="w-full mt-1 h-10 rounded-md border border-slate-200 px-3 bg-white text-sm"
                  value={uploadType} onChange={e => setUploadType(e.target.value)}
                >
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="contract">Contract</option>
                  <option value="report">Report</option>
                  <option value="statement">Statement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Amount (Optional)</label>
                <Input type="number" value={uploadAmount} onChange={e => setUploadAmount(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">Drag & drop or click to upload</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleUpload}>Save to Vault</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog — uses ReceiptModal for receipt/invoice types */}
        {selectedDoc?.document_type === 'receipt' || selectedDoc?.document_type === 'invoice' ? (
          <ReceiptModal
            receipt={selectedDoc}
            open={!!selectedDoc}
            onClose={() => setSelectedDoc(null)}
          />
        ) : (
          <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
            <DialogContent className="max-w-xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-blue-900 text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Document Details
                </DialogTitle>
              </DialogHeader>
              {selectedDoc && (
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Title</div>
                      <div className="font-bold text-slate-900 text-lg">{selectedDoc.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Amount</div>
                      <div className="font-bold text-slate-900 text-xl text-blue-700">KES {parseFloat(selectedDoc.amount || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Type</div>
                      <div className="font-medium text-slate-900 capitalize">{selectedDoc.document_type}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase font-semibold">Source</div>
                      <div className="font-medium text-slate-900">{selectedDoc.source || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="pt-4 text-center text-slate-500 text-sm">
                    No physical file is attached to this document record.
                  </div>
                  <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                    <Button variant="outline" onClick={() => setSelectedDoc(null)}>Close</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

      </div>
    </ReceiptersAuthGate>
  );
}
