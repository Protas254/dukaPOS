import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductBarcodePrintDialog from '@/components/barcode/ProductBarcodePrintDialog';

import { emptyProduct } from '@/components/inventory/constants';
import InventoryHeader from '@/components/inventory/InventoryHeader';
import ScanToRestockBar from '@/components/inventory/ScanToRestockBar';
import InventoryFilters from '@/components/inventory/InventoryFilters';
import InventoryStatsBar from '@/components/inventory/InventoryStatsBar';
import InventoryTable from '@/components/inventory/InventoryTable';
import ProductModal from '@/components/inventory/ProductModal';
import BulkUploadModal from '@/components/inventory/BulkUploadModal';
import DeleteConfirmModal from '@/components/inventory/DeleteConfirmModal';
import BulkStockUpdateModal from '@/components/inventory/BulkStockUpdateModal';
import QuickRestockModal from '@/components/inventory/QuickRestockModal';

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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStockOpen, setBulkStockOpen] = useState(false);
  const [bulkStockValues, setBulkStockValues] = useState({});
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [barcodePrintOpen, setBarcodePrintOpen] = useState(false);
  const [scanRestockMode, setScanRestockMode] = useState(false);
  const [scanRestockQuery, setScanRestockQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProducts, setShowProducts] = useState(true);
  const scanRestockRef = useRef(null);
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.entities.Product.list(),
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
        return api.entities.Product.update(editingProduct.id, payload);
      }
      return api.entities.Product.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      setEditingProduct(null);
      toast({ title: editingProduct ? 'Product updated' : 'Product added' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Product.delete(id),
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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <InventoryHeader
        products={products}
        totalValue={totalValue}
        setScanRestockMode={setScanRestockMode}
        scanRestockRef={scanRestockRef}
        setBarcodePrintOpen={setBarcodePrintOpen}
        setSelectedIds={setSelectedIds}
        setUploadDialogOpen={setUploadDialogOpen}
        openNew={openNew}
      />

      <ScanToRestockBar
        scanRestockMode={scanRestockMode}
        setScanRestockMode={setScanRestockMode}
        scanRestockQuery={scanRestockQuery}
        setScanRestockQuery={setScanRestockQuery}
        scanRestockRef={scanRestockRef}
        products={products}
        setRestockProduct={setRestockProduct}
        setRestockQty={setRestockQty}
      />

      <InventoryFilters
        search={search}
        setSearch={setSearch}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        sortField={sortField}
        setSortField={setSortField}
      />

      <InventoryStatsBar
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        openBulkStock={openBulkStock}
        setBarcodePrintOpen={setBarcodePrintOpen}
        lowStockCount={lowStockCount}
      />

      <InventoryTable
        filtered={filtered}
        paginatedProducts={paginatedProducts}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        toggleSelectAll={toggleSelectAll}
        toggleSelect={toggleSelect}
        openEdit={openEdit}
        setDeleteConfirm={setDeleteConfirm}
        setRestockProduct={setRestockProduct}
        setRestockQty={setRestockQty}
        setBarcodePrintOpen={setBarcodePrintOpen}
        showProducts={showProducts}
        setShowProducts={setShowProducts}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
      />

      <ProductModal
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        editingProduct={editingProduct}
        form={form}
        setForm={setForm}
        saveMutation={saveMutation}
        setSelectedIds={setSelectedIds}
        setBarcodePrintOpen={setBarcodePrintOpen}
      />

      <BulkUploadModal
        uploadDialogOpen={uploadDialogOpen}
        setUploadDialogOpen={setUploadDialogOpen}
        queryClient={queryClient}
      />

      <DeleteConfirmModal
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        deleteMutation={deleteMutation}
      />

      <BulkStockUpdateModal
        bulkStockOpen={bulkStockOpen}
        setBulkStockOpen={setBulkStockOpen}
        filtered={filtered}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        bulkStockValues={bulkStockValues}
        setBulkStockValues={setBulkStockValues}
        queryClient={queryClient}
      />

      <QuickRestockModal
        restockProduct={restockProduct}
        setRestockProduct={setRestockProduct}
        restockQty={restockQty}
        setRestockQty={setRestockQty}
        queryClient={queryClient}
      />

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