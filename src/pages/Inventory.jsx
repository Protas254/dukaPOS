import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Search, Package, Pencil, Trash2, 
  ArrowUpDown, AlertTriangle, Loader2, Upload, Download, ArrowLeft, ArrowRight, Layers, CheckSquare, Barcode, Printer
} from 'lucide-react';
import ProductBarcodePrintDialog from '@/components/barcode/ProductBarcodePrintDialog';
import BarcodeDisplay from '@/components/barcode/BarcodeDisplay';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'groceries', 'beverages', 'dairy', 'bakery', 'snacks',
  'household', 'personal_care', 'electronics', 'stationery', 'other'
];

const UNITS = ['piece', 'kg', 'litre', 'pack', 'dozen', 'box', 'bag'];

const emptyProduct = {
  name: '', sku: '', category: 'groceries', price: '', cost_price: '',
  stock_quantity: '', low_stock_threshold: 10, unit: 'piece', is_active: true, tax_rate: 16
};

export default function Inventory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStockOpen, setBulkStockOpen] = useState(false);
  const [bulkStockValues, setBulkStockValues] = useState({});
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restocking, setRestocking] = useState(false);
  const [barcodePrintOpen, setBarcodePrintOpen] = useState(false);
  const [scanRestockMode, setScanRestockMode] = useState(false);
  const [scanRestockQuery, setScanRestockQuery] = useState('');
  const scanRestockRef = useRef(null);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        price: parseFloat(data.price) || 0,
        cost_price: parseFloat(data.cost_price) || 0,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        low_stock_threshold: parseInt(data.low_stock_threshold) || 10,
        tax_rate: parseFloat(data.tax_rate) || 16,
      };
      if (editingProduct) {
        return base44.entities.Product.update(editingProduct.id, payload);
      }
      return base44.entities.Product.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      setEditingProduct(null);
      toast({ title: editingProduct ? 'Product updated' : 'Product added' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteConfirm(null);
      toast({ title: 'Product deleted' });
    },
  });

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || 'groceries',
      price: String(product.price || ''),
      cost_price: String(product.cost_price || ''),
      stock_quantity: String(product.stock_quantity || ''),
      low_stock_threshold: product.low_stock_threshold || 10,
      unit: product.unit || 'piece',
      is_active: product.is_active !== false,
      tax_rate: product.tax_rate || 16,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  let filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );
  if (filterCategory !== 'all') {
    filtered = filtered.filter(p => p.category === filterCategory);
  }
  filtered.sort((a, b) => {
    if (sortField === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortField === 'price') return (b.price || 0) - (a.price || 0);
    if (sortField === 'stock') return (a.stock_quantity || 0) - (b.stock_quantity || 0);
    return 0;
  });

  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0);
  const lowStockCount = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 10)).length;

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const openBulkStock = () => {
    const initial = {};
    filtered.filter(p => selectedIds.has(p.id)).forEach(p => {
      initial[p.id] = String(p.stock_quantity ?? '');
    });
    setBulkStockValues(initial);
    setBulkStockOpen(true);
  };

  const handleQuickRestock = async () => {
    const qty = parseInt(restockQty);
    if (isNaN(qty) || qty < 0) return;
    setRestocking(true);
    await base44.entities.Product.update(restockProduct.id, { stock_quantity: qty });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast({ title: `Stock updated for ${restockProduct.name}` });
    setRestocking(false);
    setRestockProduct(null);
    setRestockQty('');
  };

  const handleBulkStockSave = async () => {
    setBulkUpdating(true);
    let count = 0;
    for (const [id, qty] of Object.entries(bulkStockValues)) {
      const parsed = parseInt(qty);
      if (!isNaN(parsed)) {
        await base44.entities.Product.update(id, { stock_quantity: parsed });
        count++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setBulkStockOpen(false);
    setSelectedIds(new Set());
    setBulkUpdating(false);
    toast({ title: `Stock updated for ${count} product(s)` });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {products.length} products • Stock value KES {totalValue.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { setScanRestockMode(true); setTimeout(() => scanRestockRef.current?.focus(), 50); }} className="rounded-xl gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
            <Package className="w-4 h-4" /> Scan to Restock
          </Button>
          <Button variant="outline" onClick={() => { setBarcodePrintOpen(true); setSelectedIds(new Set(products.filter(p => p.sku && p.is_active !== false).map(p => p.id))); }} className="rounded-xl gap-2">
            <Barcode className="w-4 h-4" /> Print All Barcodes
          </Button>
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)} className="rounded-xl">
            <Upload className="w-4 h-4 mr-2" /> Bulk Upload
          </Button>
          <Button onClick={openNew} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* Scan to Restock Bar */}
      {scanRestockMode && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl">
          <Barcode className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
          <Input
            ref={scanRestockRef}
            value={scanRestockQuery}
            onChange={e => setScanRestockQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && scanRestockQuery.trim()) {
                const q = scanRestockQuery.trim().toLowerCase();
                const match = products.find(p => p.sku?.toLowerCase() === q)
                  || products.find(p => p.sku?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q));
                if (match) {
                  setRestockProduct(match);
                  setRestockQty(String(match.stock_quantity));
                  setScanRestockQuery('');
                  setScanRestockMode(false);
                } else {
                  toast({ title: 'Product not found', description: `No match for "${scanRestockQuery}"`, variant: 'destructive' });
                }
              }
              if (e.key === 'Escape') { setScanRestockMode(false); setScanRestockQuery(''); }
            }}
            placeholder="Scan barcode or type SKU/name → Enter to open restock..."
            className="flex-1 h-8 text-sm border-amber-300 focus:border-amber-500 bg-white"
            autoFocus
          />
          <Button size="sm" variant="ghost" className="h-8 text-xs text-amber-700" onClick={() => { setScanRestockMode(false); setScanRestockQuery(''); }}>
            Cancel
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortField} onValueChange={setSortField}>
          <SelectTrigger className="w-[140px] rounded-xl">
            <ArrowUpDown className="w-3 h-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="stock">Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-primary">{selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())} className="text-xs h-8">
            Clear
          </Button>
          <Button size="sm" onClick={openBulkStock} className="text-xs h-8 gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Update Stock Levels
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBarcodePrintOpen(true)} className="text-xs h-8 gap-1.5">
            <Barcode className="w-3.5 h-3.5" /> Print Barcodes
          </Button>
        </div>
      )}

      {/* Stats bar */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-amber-800 dark:text-amber-200">
            <strong>{lowStockCount}</strong> product{lowStockCount > 1 ? 's' : ''} running low on stock
          </span>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-input cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Barcode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Margin</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const threshold = product.low_stock_threshold || 10;
                const isLow = product.stock_quantity <= threshold;
                const isOutOfStock = product.stock_quantity <= 0;
                const isCritical = product.stock_quantity <= Math.floor(threshold * 0.5);
                return (
                  <tr key={product.id} className={cn(
                    "border-b transition-colors",
                    selectedIds.has(product.id) ? "bg-primary/5" :
                    isOutOfStock ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100/80 dark:hover:bg-red-900/20" :
                    isCritical ? "bg-red-50/60 dark:bg-red-900/10 hover:bg-red-100/60 dark:hover:bg-red-900/20" :
                    isLow ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100/60 dark:hover:bg-amber-900/20" :
                    "hover:bg-muted/30"
                  )}>
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-input cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.sku && <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {product.sku ? (
                        <div className="flex items-center gap-2">
                          <div className="bg-white border rounded p-1.5 shadow-sm">
                            <BarcodeDisplay value={product.sku} width={1.2} height={32} fontSize={8} />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                            title="Print label"
                            onClick={() => { setSelectedIds(new Set([product.id])); setBarcodePrintOpen(true); }}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="text-xs text-muted-foreground/60 italic hover:text-primary transition-colors"
                          onClick={() => openEdit(product)}
                        >
                          No SKU — click edit
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {product.category?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      KES {product.price?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {product.cost_price > 0 && product.price > 0 ? (
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          ((product.price - product.cost_price) / product.price * 100) >= 30
                            ? "bg-emerald-100 text-emerald-700"
                            : ((product.price - product.cost_price) / product.price * 100) >= 15
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        )}>
                          {((product.price - product.cost_price) / product.price * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <div>
                          <span className={cn(
                            "font-semibold",
                            isOutOfStock ? "text-red-600" :
                            isCritical ? "text-red-500" :
                            isLow ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {product.stock_quantity}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{product.unit}</span>
                        </div>
                        {isLow && (
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            isOutOfStock ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            isCritical ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          )}>
                            {isOutOfStock ? 'Out of stock' : isCritical ? 'Critical' : `Low ≤ ${threshold}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <Badge variant={product.is_active !== false ? 'default' : 'secondary'} className="text-[10px]">
                        {product.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isLow && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                            onClick={() => { setRestockProduct(product); setRestockQty(String(product.stock_quantity)); }}
                          >
                            <Package className="w-3 h-3" /> Restock
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(product)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No products found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs">Product Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">SKU / Barcode</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs px-2"
                  onClick={() => {
                    const prefix = form.name ? form.name.slice(0, 3).toUpperCase().replace(/\s/g, '') : 'SKU';
                    const rand = Math.floor(Math.random() * 900000 + 100000);
                    setForm(f => ({ ...f, sku: `${prefix}${rand}` }));
                  }}
                >
                  Auto-generate
                </Button>
              </div>
            </div>
            {form.sku && (
              <div className="col-span-2 flex items-center gap-4 p-3 bg-muted/40 rounded-lg border">
                <div className="bg-white border rounded-lg p-2 shadow-sm flex-shrink-0">
                  <BarcodeDisplay value={form.sku} width={1.6} height={50} fontSize={10} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Barcode Preview</p>
                  <p className="text-sm font-mono font-medium truncate">{form.sku}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Print this label for shelf tagging</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 text-xs"
                  onClick={() => {
                    if (editingProduct) {
                      setSelectedIds(new Set([editingProduct.id]));
                      setBarcodePrintOpen(true);
                    }
                  }}
                  disabled={!editingProduct}
                >
                  <Printer className="w-3.5 h-3.5" /> Print Label
                </Button>
              </div>
            )}
            <div>
              <Label className="text-xs">Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Selling Price (KES) *</Label>
              <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Cost Price (KES)</Label>
              <Input type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Stock Quantity</Label>
              <Input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Low Stock Alert</Label>
              <Input type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 10 })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">VAT Rate (%)</Label>
              <Input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 16 })} className="mt-1" />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <Label className="text-xs">Active (available for sale)</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.price || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Bulk Upload Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
              <p className="text-sm font-medium mb-2">CSV Format Required:</p>
              <p className="text-xs text-muted-foreground mb-3">
                Columns: name, sku, category, price, cost_price, stock_quantity, low_stock_threshold, unit, tax_rate, is_active
              </p>
              <div className="text-xs bg-background p-3 rounded font-mono overflow-x-auto">
                <p>name,sku,category,price,cost_price,stock_quantity,low_stock_threshold,unit,tax_rate,is_active</p>
                <p>Milk,SKU001,dairy,150,120,50,10,litre,16,true</p>
                <p>Bread,SKU002,bakery,80,60,30,5,piece,16,true</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const csv = 'name,sku,category,price,cost_price,stock_quantity,low_stock_threshold,unit,tax_rate,is_active\nProduct Name,SKU001,groceries,100,80,100,10,piece,16,true';
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'product_template.csv';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" /> Download Template
              </Button>
            </div>
            <div>
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                className="mt-1"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setUploading(true);
                  try {
                    const text = await file.text();
                    const rows = text.split('\n').filter(r => r.trim());
                    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
                    
                    const products = [];
                    const errors = [];
                    
                    for (let i = 1; i < rows.length; i++) {
                      const values = rows[i].split(',').map(v => v.trim());
                      if (values.length !== headers.length) {
                        errors.push(`Row ${i + 1}: Wrong number of columns`);
                        continue;
                      }
                      
                      const product = {};
                      headers.forEach((h, idx) => {
                        product[h] = values[idx];
                      });
                      
                      // Validate required fields
                      if (!product.name || !product.price || !product.category) {
                        errors.push(`Row ${i + 1}: Missing required fields (name, price, category)`);
                        continue;
                      }
                      
                      // Convert types
                      const parsed = {
                        name: product.name,
                        sku: product.sku || '',
                        category: product.category,
                        price: parseFloat(product.price) || 0,
                        cost_price: parseFloat(product.cost_price) || 0,
                        stock_quantity: parseInt(product.stock_quantity) || 0,
                        low_stock_threshold: parseInt(product.low_stock_threshold) || 10,
                        unit: product.unit || 'piece',
                        tax_rate: parseFloat(product.tax_rate) || 16,
                        is_active: product.is_active !== 'false',
                      };
                      
                      products.push(parsed);
                    }
                    
                    if (errors.length > 0) {
                      toast({
                        title: 'Import errors',
                        description: errors.slice(0, 5).join('\n'),
                        variant: 'destructive',
                      });
                      if (products.length === 0) {
                        setUploading(false);
                        return;
                      }
                    }
                    
                    // Bulk create products
                    for (const p of products) {
                      await base44.entities.Product.create(p);
                    }
                    
                    toast({
                      title: 'Success!',
                      description: `Imported ${products.length} product(s)`,
                    });
                    
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    setUploadDialogOpen(false);
                    e.target.value = '';
                  } catch (err) {
                    toast({
                      title: 'Upload failed',
                      description: err.message,
                      variant: 'destructive',
                    });
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading}
              />
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing products...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Stock Update Dialog */}
      <Dialog open={bulkStockOpen} onOpenChange={setBulkStockOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">Update Stock Levels</DialogTitle>
            <p className="text-sm text-muted-foreground">{Object.keys(bulkStockValues).length} products selected</p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {filtered.filter(p => selectedIds.has(p.id)).map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Current: {p.stock_quantity} {p.unit}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Input
                    type="number"
                    min="0"
                    value={bulkStockValues[p.id] ?? ''}
                    onChange={e => setBulkStockValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-24 h-8 text-sm text-right"
                    placeholder="Qty"
                  />
                  <span className="text-xs text-muted-foreground w-8">{p.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setBulkStockOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkStockSave} disabled={bulkUpdating}>
              {bulkUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Restock Dialog */}
      <Dialog open={!!restockProduct} onOpenChange={(open) => { if (!open) { setRestockProduct(null); setRestockQty(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" /> Quick Restock
            </DialogTitle>
          </DialogHeader>
          {restockProduct && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="font-medium text-sm">{restockProduct.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current stock: <span className="font-semibold text-amber-700">{restockProduct.stock_quantity}</span> {restockProduct.unit} · Threshold: {restockProduct.low_stock_threshold || 10}
                </p>
              </div>
              <div>
                <Label className="text-xs">New Stock Quantity ({restockProduct.unit})</Label>
                <Input
                  type="number"
                  min="0"
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRestockProduct(null); setRestockQty(''); }}>Cancel</Button>
            <Button onClick={handleQuickRestock} disabled={restocking || restockQty === ''}>
              {restocking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Print Dialog */}
      <ProductBarcodePrintDialog
        open={barcodePrintOpen}
        onClose={() => setBarcodePrintOpen(false)}
        products={filtered.filter(p => selectedIds.has(p.id))}
      />

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Link to="/pos">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous: POS
          </Button>
        </Link>
        <Link to="/transactions">
          <Button className="gap-2">
            Next: Transactions
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}