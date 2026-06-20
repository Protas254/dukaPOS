import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StockAlert({ cart, products }) {
  const alerts = [];

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    const stockRemaining = (product.stock_quantity || 0) - item.quantity;
    
    if (stockRemaining < 0) {
      alerts.push({
        type: 'error',
        message: `${item.name}: Only ${product.stock_quantity} in stock`,
        item: item.id
      });
    } else if (stockRemaining <= product.low_stock_threshold) {
      alerts.push({
        type: 'warning',
        message: `${item.name}: Low stock warning (${stockRemaining} left)`,
        item: item.id
      });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-1 p-2 bg-muted/50 border-t">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`flex items-center gap-2 text-xs ${
          alert.type === 'error' ? 'text-red-600' : 'text-amber-600'
        }`}>
          {alert.type === 'error' ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}