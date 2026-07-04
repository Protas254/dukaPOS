import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Printer, X } from 'lucide-react';
import BarcodeDisplay from './BarcodeDisplay';

const LABEL_SIZES = {
  small: { label: 'Small (shelf label)', width: 120, minW: '120px', barcodeW: 1.2, barcodeH: 35 },
  medium: { label: 'Medium (price tag)', width: 160, minW: '160px', barcodeW: 1.5, barcodeH: 45 },
  large: { label: 'Large (A4 full)', width: 220, minW: '220px', barcodeW: 2, barcodeH: 60 },
};

export default function ProductBarcodePrintDialog({ open, onClose, products }) {
  const printRef = useRef(null);
  const [labelSize, setLabelSize] = useState('medium');
  const size = LABEL_SIZES[labelSize];

  const handlePrint = () => {
    const svgs = {};
    printRef.current?.querySelectorAll('[data-id]').forEach(el => {
      const id = el.getAttribute('data-id');
      const svg = el.querySelector('svg');
      if (svg) svgs[id] = svg.outerHTML;
    });
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Product Barcodes</title>
          <style>
            body { font-family: sans-serif; margin: 16px; }
            .grid { display: flex; flex-wrap: wrap; gap: 12px; }
            .label { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; text-align: center; page-break-inside: avoid; min-width: ${size.minW}; }
            .name { font-size: 11px; font-weight: 600; margin-bottom: 2px; max-width: ${size.minW}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .price { font-size: 13px; font-weight: 700; margin-top: 4px; color: #1a1a1a; }
            svg { display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${products.map(p => `
              <div class="label">
                <p class="name">${p.name}</p>
                ${svgs[p.id] || '<p style="font-size:10px;color:#888">No SKU</p>'}
                <p class="price">KES ${(p.price || 0).toLocaleString()}</p>
              </div>
            `).join('')}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Product Barcodes
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? 's' : ''} selected</p>
        </DialogHeader>

        <div className="flex items-center gap-3 px-1 pb-1">
          <Label className="text-xs shrink-0">Label size:</Label>
          <Select value={labelSize} onValueChange={setLabelSize}>
            <SelectTrigger className="h-8 text-xs w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LABEL_SIZES).map(([key, s]) => (
                <SelectItem key={key} value={key} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div ref={printRef} className="overflow-y-auto flex-1 p-2">
          <div className="flex flex-wrap gap-3">
            {products.map(p => (
              <div
                key={p.id}
                data-id={p.id}
                className="border rounded-lg p-3 text-center bg-white"
                style={{ minWidth: size.minW }}
              >
                <p className="text-xs font-semibold mb-1 truncate" style={{ maxWidth: size.minW }}>{p.name}</p>
                {p.sku ? (
                  <BarcodeDisplay value={p.sku} width={size.barcodeW} height={size.barcodeH} fontSize={10} />
                ) : (
                  <p className="text-[10px] text-muted-foreground py-3">No SKU assigned</p>
                )}
                <p className="text-sm font-bold mt-1">KES {(p.price || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}