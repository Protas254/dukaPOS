import React, { useState, useRef, useEffect } from 'react';
import ReceiptersAuthGate from '@/components/ReceiptersAuthGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Download, FileDown, Search, Filter, AlertTriangle, 
  TrendingUp, Activity, Bell, ListPlus, Banknote, ShieldAlert, Eye, Calendar,
  Zap, Tag, Maximize, FileText, Printer, Camera, Upload, X, Plus,
  Trash2, Edit2, Save, ArchiveRestore, StickyNote, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/apiClient';
import ReceiptModal from '@/components/receipters/ReceiptModal';

// ─── Budget Tab ──────────────────────────────────────────────────────────────
function BudgetTab() {
  const [activeSubTab, setActiveSubTab] = useState('Budget Items');
  const [budgetNote, setBudgetNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ item: '', qty: '', price: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [phoneNumber, setPhoneNumber] = useState('');
  const [archivedBudgets, setArchivedBudgets] = useState([]);

  const total = items.reduce((sum, i) => sum + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0), 0);

  const handleAdd = () => {
    if (!newItem.item.trim()) { toast.error('Item name is required'); return; }
    const entry = {
      id: Date.now().toString(),
      item: newItem.item.trim(),
      qty: parseFloat(newItem.qty) || 1,
      price: parseFloat(newItem.price) || 0,
    };
    setItems(prev => [...prev, entry]);
    setNewItem({ item: '', qty: '', price: '' });
    toast.success(`"${entry.item}" added to budget`);
  };

  const handleDelete = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ item: item.item, qty: item.qty, price: item.price });
  };

  const handleSaveEdit = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...editForm, qty: parseFloat(editForm.qty) || 1, price: parseFloat(editForm.price) || 0 } : i));
    setEditingId(null);
    toast.success('Item updated');
  };

  const handleSave = () => {
    if (items.length === 0) { toast.error('Add at least one budget item'); return; }
    const budget = {
      id: Date.now().toString(),
      savedAt: new Date().toLocaleString(),
      note: budgetNote,
      items: [...items],
      total,
      phoneNumber,
    };
    setArchivedBudgets(prev => [budget, ...prev]);
    toast.success('Budget saved & archived!');
    setItems([]);
    setBudgetNote('');
    setPhoneNumber('');
    setSavedNote('');
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {['Budget Note', 'Budget Items', 'Archived Budgets'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeSubTab === tab
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Budget Note */}
      {activeSubTab === 'Budget Note' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <StickyNote className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-900">Budget Note</h3>
          </div>
          <p className="text-sm text-slate-500">Add a descriptive note or title for this budget session.</p>
          <textarea
            className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[120px]"
            placeholder="e.g. Monthly groceries for August 2026..."
            value={budgetNote}
            onChange={e => setBudgetNote(e.target.value)}
          />
          <Button
            onClick={() => { setSavedNote(budgetNote); toast.success('Note saved!'); }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" /> Save Note
          </Button>
          {savedNote && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 font-medium">
              ✓ Saved: {savedNote}
            </div>
          )}
        </div>
      )}

      {/* Budget Items */}
      {activeSubTab === 'Budget Items' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-0.5">
              <ListPlus className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900">Budget Items</h3>
            </div>
            <p className="text-xs text-slate-400">Item, Quantity, Price per Qty, and Total. Click Edit to modify a row.</p>
          </div>

          <div className="p-5 space-y-3">
            {/* Add Row */}
            <div className="grid grid-cols-[1fr_100px_160px_120px] gap-2 items-center">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide block mb-1">Item</label>
                <Input
                  placeholder="Item name"
                  value={newItem.item}
                  onChange={e => setNewItem(p => ({ ...p, item: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide block mb-1">Qty</label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={newItem.qty}
                  onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide block mb-1">Price / Qty (KES)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-transparent block mb-1">.</label>
                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                  <Plus className="w-4 h-4 mr-1.5" /> Add
                </Button>
              </div>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                No budget items added yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-slate-500 font-semibold text-xs uppercase">Item</th>
                      <th className="text-right px-4 py-2.5 text-slate-500 font-semibold text-xs uppercase">Qty</th>
                      <th className="text-right px-4 py-2.5 text-slate-500 font-semibold text-xs uppercase">Price/Qty</th>
                      <th className="text-right px-4 py-2.5 text-slate-500 font-semibold text-xs uppercase">Total</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        {editingId === item.id ? (
                          <>
                            <td className="px-3 py-2"><Input value={editForm.item} onChange={e => setEditForm(p => ({ ...p, item: e.target.value }))} className="h-8 text-sm" /></td>
                            <td className="px-3 py-2"><Input type="number" value={editForm.qty} onChange={e => setEditForm(p => ({ ...p, qty: e.target.value }))} className="h-8 text-sm w-20 ml-auto" /></td>
                            <td className="px-3 py-2"><Input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} className="h-8 text-sm w-28 ml-auto" /></td>
                            <td className="px-4 py-2 text-right font-semibold text-slate-700">KES {((parseFloat(editForm.qty) || 0) * (parseFloat(editForm.price) || 0)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                            <td className="px-3 py-2 flex items-center gap-1.5 justify-end">
                              <Button size="sm" onClick={() => handleSaveEdit(item.id)} className="h-7 bg-green-600 hover:bg-green-700 text-white px-2"><Save className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2"><X className="w-3.5 h-3.5" /></Button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.item}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{item.qty}</td>
                            <td className="px-4 py-3 text-right text-slate-600">KES {parseFloat(item.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">KES {(item.qty * item.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                            <td className="px-3 py-3 flex items-center gap-1.5 justify-end">
                              <button onClick={() => handleStartEdit(item)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-bold text-slate-700">TOTAL</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">KES {total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide block mb-1.5">Phone Number</label>
              <Input
                placeholder="e.g. 0712 345 678"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>
      )}

      {/* Archived Budgets */}
      {activeSubTab === 'Archived Budgets' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <ArchiveRestore className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-900">Archived Budgets</h3>
            <Badge variant="secondary" className="ml-auto">{archivedBudgets.length}</Badge>
          </div>
          {archivedBudgets.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No archived budgets yet. Save a budget to archive it.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {archivedBudgets.map(b => (
                <div key={b.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{b.note || 'Budget Session'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.savedAt} • {b.items.length} items{b.phoneNumber && ` • ${b.phoneNumber}`}</p>
                    </div>
                    <span className="font-bold text-blue-700 text-sm">KES {b.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {b.items.map(item => (
                      <span key={item.id} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{item.item} × {item.qty}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Manual Capture Tab ───────────────────────────────────────────────────────
function ManualCaptureTab() {
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraActive(true);
      // Attach stream after state update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      setCameraError('Camera access denied or not available on this device.');
      toast.error('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    toast.success('Receipt photo captured!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target.result);
      toast.success('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    stopCamera();
  };

  const handleSendReceipt = () => {
    if (!capturedImage) return;
    toast.success('Receipt sent to Receipters Vault!');
    setCapturedImage(null);
  };

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-0.5">
          <Camera className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-slate-900">Manual Capture</h3>
        </div>
        <p className="text-xs text-slate-400">Take or upload a photo of a receipt to send as a picture.</p>
      </div>

      <div className="p-5">
        {capturedImage ? (
          // Preview
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center min-h-[320px]">
              <img src={capturedImage} alt="Captured receipt" className="max-h-[480px] object-contain w-full" />
              <button
                onClick={handleRetake}
                className="absolute top-3 right-3 bg-slate-800/80 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleRetake} variant="outline" className="border-slate-200 gap-2">
                <Camera className="w-4 h-4" /> Retake
              </Button>
              <Button onClick={handleSendReceipt} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-1">
                <FileText className="w-4 h-4" /> Send to Vault
              </Button>
            </div>
          </div>
        ) : cameraActive ? (
          // Camera Live View
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300" style={{ minHeight: 320 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[480px] object-cover"
              />
              {/* Viewfinder overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-white/60 rounded-lg w-3/4 h-2/3 relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-md" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Button onClick={stopCamera} variant="outline" className="gap-2">
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8">
                <Camera className="w-4 h-4" /> Capture Photo
              </Button>
            </div>
          </div>
        ) : (
          // Default Upload Zone
          <div
            className="border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center gap-5 p-10 bg-blue-50/30 cursor-pointer hover:bg-blue-50/60 transition-colors min-h-[320px]"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) { fileInputRef.current.files = e.dataTransfer.files; handleFileUpload({ target: { files: e.dataTransfer.files } }); }
            }}
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Camera className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700 text-base">Capture or upload a receipt</p>
              <p className="text-sm text-slate-400 mt-1">Take a photo with your camera or choose an existing image</p>
            </div>
            {cameraError && (
              <p className="text-xs text-red-500 text-center max-w-xs">{cameraError}</p>
            )}
            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
              <Button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Camera className="w-4 h-4" /> Take Photo
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4" /> Upload Image
              </Button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Instructions */}
        {!cameraActive && !capturedImage && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Tips for best results</p>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" /> Place receipt on a flat, well-lit surface</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" /> Ensure all text is visible and not blurry</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" /> Avoid shadows covering the receipt totals</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" /> Supported formats: JPG, PNG, HEIC, WEBP</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ReceiptersEngine Component ──────────────────────────────────────────
export default function ReceiptersEngine() {
  const [activeTab, setActiveTab] = useState('All Receipts');
  const [activeFilter, setActiveFilter] = useState('Search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Fetch VaultDocuments (Receipts)
  const { data: receiptsData, isLoading: receiptsLoading } = useQuery({
    queryKey: ['receipters_receipts'],
    queryFn: async () => {
      const res = await api.get('/entities/VaultDocument');
      const data = Array.isArray(res) ? res : (res.data || []); return data.filter(doc => doc.document_type === 'receipt');
    }
  });

  // Fetch Engine Stats (Mocked AI & Stats)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['receipters_engine_stats'],
    queryFn: async () => {
      const res = await api.get('/receipters/engine-stats');
      return Array.isArray(res) ? res : (res.data || []);
    }
  });

  const receipts = receiptsData || [];
  const overview = statsData?.overview || {};
  const insights = statsData?.insights || [];
  const budgets = statsData?.budgets || [];

  const filteredReceipts = receipts.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filterTabs = [
    { id: 'AI Analysis', icon: Activity, color: 'text-blue-500' },
    { id: 'Anomaly Detection', icon: ShieldAlert, color: 'text-amber-500' },
    { id: 'Trends', icon: TrendingUp, color: 'text-green-600' },
    { id: 'Real-time', icon: Zap, color: 'text-blue-500' },
    { id: 'Search', icon: Search, color: 'text-slate-500' },
    { id: 'Categorize', icon: Tag, color: 'text-purple-500' },
    { id: 'Alerts & Monitoring', icon: Bell, color: 'text-amber-500' },
    { id: 'Manual Capture', icon: Camera, color: 'text-indigo-500' },
    { id: 'Budget', icon: Banknote, color: 'text-emerald-600' },
  ];

  return (
    <ReceiptersAuthGate featureName="Receipters Engine">
      <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-blue-900 uppercase flex items-center gap-2">
              Receipters Engine
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI-powered receipt intelligence & analytics</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm mr-2 sm:mr-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div> {overview.total_receipts || 0} analyzed
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div> {insights.length} insights
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.success("Exporting data...")} className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Opening guide...")} className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <span className="text-xs sm:text-sm">View Guide</span>
            </Button>
            <Button size="sm" onClick={() => toast.success("Downloading PDF report...")} className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileDown className="w-4 h-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Download PDF</span>
            </Button>
          </div>
        </div>

        {/* Top Navigation Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={activeTab === 'All Receipts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('All Receipts')}
            className={`rounded-full ${activeTab === 'All Receipts' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
          >
            All Receipts
          </Button>
          <Button 
            variant={activeTab === 'My Receipts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('My Receipts')}
            className={`rounded-full ${activeTab === 'My Receipts' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
          >
            My Receipts
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          
          {filterTabs.map(({ id, icon: Icon, color }) => (
            <Button
              key={id}
              variant={activeFilter === id ? 'default' : 'outline'}
              onClick={() => setActiveFilter(id)}
              size="sm"
              className={`rounded-full ${activeFilter === id ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
            >
              <Icon className={`w-3.5 h-3.5 mr-1.5 ${activeFilter === id ? 'text-white' : color}`} />
              {id}
            </Button>
          ))}
        </div>

        {/* Dynamic Main Content Based on Filter */}
        {activeFilter === 'AI Analysis' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map(insight => (
              <div key={insight.id} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {insight.impact === 'positive' ? <TrendingUp className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-blue-500" />}
                  <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{insight.description}</p>
                <div className="mt-4">
                  <Badge variant="outline" className={insight.impact === 'positive' ? 'text-green-700 border-green-200 bg-green-50' : 'text-blue-700 border-blue-200 bg-blue-50'}>
                    {insight.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual Capture Panel */}
        {activeFilter === 'Manual Capture' && <ManualCaptureTab />}

        {/* Budget Panel */}
        {activeFilter === 'Budget' && <BudgetTab />}

        {/* Advanced Search Panel */}
        {activeFilter === 'Search' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between text-slate-700 font-semibold border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              Advanced Search
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { label: 'Product', placeholder: 'Name or ID' },
              { label: 'Min Price', placeholder: '0', type: 'number' },
              { label: 'Max Price', placeholder: '∞', type: 'number' },
              { label: 'City', placeholder: 'City' },
              { label: 'Zipcode', placeholder: '10001' },
              { label: 'Store ID', placeholder: 'Branch ID' },
              { label: 'From Date', placeholder: '', type: 'date' },
              { label: 'To Date', placeholder: '', type: 'date' },
              { label: 'Payment', placeholder: 'All Methods' },
            ].map(({ label, placeholder, type = 'text' }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">{label}</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input type={type} className="pl-8 h-9 text-sm" placeholder={placeholder} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button onClick={() => toast.success("Executing advanced search...")} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 rounded-full">
              <Search className="w-3.5 h-3.5 mr-2" /> Search
            </Button>
          </div>
        </div>
        )}

        {/* Receipts List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Receipts ({filteredReceipts.length})</h3>
            <span className="text-sm text-slate-400">Captured receipts from POS</span>
          </div>
          
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {receiptsLoading ? (
              <div className="p-8 text-center text-slate-500">Loading receipts...</div>
            ) : filteredReceipts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No receipts found. Complete a sale in POS to generate one.</div>
            ) : (
              filteredReceipts.map(receipt => {
                const data = receipt.receipt_data || {};
                const itemsCount = (data.items || []).length;
                const payMethod = data.payment_method || 'Unknown';
                
                return (
                  <div key={receipt.id} className="p-5 hover:bg-slate-50 transition-colors flex justify-between items-start">
                    <div className="space-y-1.5 flex-1 max-w-[80%]">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-[15px]">{receipt.reference_number || receipt.title}</span>
                        <Badge variant="secondary" className={`${payMethod.toLowerCase() === 'cash' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'} border-0 px-2 py-0 h-5 text-[11px]`}>{payMethod}</Badge>
                      </div>
                      <div className="text-[13px] text-slate-400">
                        {new Date(receipt.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(receipt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {itemsCount} items • {receipt.stored_by_name || 'System'}
                      </div>
                      <div className="text-[13px] text-slate-400 truncate w-full">
                        {(data.items || []).map(i => `${i.product_name} ${i.quantity > 1 ? `(${i.quantity})` : ''}`).join(', ') || 'No items listed'}
                      </div>
                      <div className="flex items-center gap-2 pt-3">
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(receipt)} className="text-blue-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md h-8 text-xs font-semibold px-3">
                          <Eye className="w-3.5 h-3.5 mr-1.5"/>View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(receipt)} className="text-blue-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md h-8 text-xs font-semibold px-3">
                          <Download className="w-3.5 h-3.5 mr-1.5"/>Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(receipt)} className="text-blue-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md h-8 text-xs font-semibold px-3">
                          <Printer className="w-3.5 h-3.5 mr-1.5"/>Print
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-slate-900">KES {parseFloat(receipt.amount).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Receipt Detail Dialog */}
        <ReceiptModal 
          receipt={selectedReceipt} 
          open={!!selectedReceipt} 
          onClose={() => setSelectedReceipt(null)} 
        />
      </div>
    </ReceiptersAuthGate>
  );
}
