import React, { useState } from 'react';
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
  ArrowUpDown, AlertTriangle, Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
        <Button onClick={openNew} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const isLow = product.stock_quantity <= (product.low_stock_threshold || 10);
                return (
                  <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {product.category?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      KES {product.price?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "font-semibold",
                        isLow ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {product.stock_quantity}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">{product.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <Badge variant={product.is_active !== false ? 'default' : 'secondary'} className="text-[10px]">
                        {product.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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
              <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="mt-1" />
            </div>
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
    </div>
  );
}