import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, Barcode, Upload, Plus } from 'lucide-react';

export default function InventoryHeader({
  products,
  totalValue,
  setScanRestockMode,
  scanRestockRef,
  setBarcodePrintOpen,
  setSelectedIds,
  setUploadDialogOpen,
  openNew
}) {
  return (
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
  );
}
