import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function QuickKeysPanel({ products, onAddToCart, recentSales }) {
  // Calculate best-selling products from recent sales
  const productSales = {};
  recentSales?.forEach(sale => {
    sale.items?.forEach(item => {
      productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
    });
  });

  const bestSellers = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([productId]) => products.find(p => p.id === productId))
    .filter(Boolean);

  if (bestSellers.length === 0) return null;

  return (
    <Card className="border-t rounded-none">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-xs font-bold flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-500" />
          Quick Keys
          <Badge variant="secondary" className="ml-auto text-[9px] h-4">Top Sellers</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-2">
        <div className="grid grid-cols-4 gap-1.5">
          {bestSellers.map(product => (
            <Button
              key={product.id}
              variant="outline"
              size="sm"
              onClick={() => onAddToCart(product)}
              className="h-12 flex flex-col items-center justify-center p-1 text-[9px] hover:bg-primary/10 hover:border-primary"
              title={`${product.name} - KES ${product.price}`}
            >
              <TrendingUp className="w-3 h-3 text-green-600 mb-0.5" />
              <span className="font-bold truncate w-full text-center">{product.name.split(' ')[0]}</span>
              <span className="text-[8px] text-muted-foreground">KES {product.price}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}