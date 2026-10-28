import React from 'react';
import { AlertTriangle, CheckSquare, Layers, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InventoryStatsBar({
  selectedIds,
  setSelectedIds,
  openBulkStock,
  setBarcodePrintOpen,
  lowStockCount
}) {
  return (
    <>
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
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-red-800 dark:text-red-300">
            <strong>{lowStockCount}</strong> product{lowStockCount > 1 ? 's' : ''} running low on stock
          </span>
        </div>
      )}
    </>
  );
}
