import React, { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/api/apiClient';

export default function BulkUploadModal({ uploadDialogOpen, setUploadDialogOpen, queryClient }) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e) => {
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
        
        if (!product.name || !product.price || !product.category) {
          errors.push(`Row ${i + 1}: Missing required fields (name, price, category)`);
          continue;
        }
        
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
      
      for (const p of products) {
        await api.entities.Product.create(p);
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
  };

  return (
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
              onChange={handleUpload}
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
  );
}
