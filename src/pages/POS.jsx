import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import ProductGrid from '@/components/pos/ProductGrid';
import Cart from '@/components/pos/Cart';
import CheckoutDialog from '@/components/pos/CheckoutDialog';
import ReceiptView from '@/components/pos/ReceiptView';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'beverages', label: 'Beverages' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'household', label: 'Household' },
  { id: 'personal_care', label: 'Personal Care' },
  { id: 'electronics', label: 'Electronics' },
];

export default function POS() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => base44.entities.BusinessSettings.list(),
  });

  const businessSettings = settings[0] || {};
  const taxRate = businessSettings.default_tax_rate || 16;

  const products = selectedCategory === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === selectedCategory);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast({ title: 'Stock limit reached', description: `Only ${product.stock_quantity} available`, variant: 'destructive' });
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, tax_rate: product.tax_rate || taxRate, stock_quantity: product.stock_quantity }];
    });
  }, [taxRate]);

  const updateQuantity = (id, qty) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal - discount;

  const generateReceiptNumber = () => {
    const now = new Date();
    const prefix = 'RC';
    const date = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${prefix}${date}${time}${random}`;
  };

  const handleCheckout = async (paymentDetails) => {
    setIsProcessing(true);

    const user = await base44.auth.me();
    const items = cart.map(i => {
      const itemTotal = i.price * i.quantity;
      const taxAmount = itemTotal * (i.tax_rate / (100 + i.tax_rate));
      return {
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        total: itemTotal,
        tax_amount: Math.round(taxAmount)
      };
    });

    const taxTotal = items.reduce((sum, i) => sum + i.tax_amount, 0);

    // Calculate loyalty points (1 point per KES 100 spent)
    const pointsEarned = Math.floor(total / 100);

    const saleData = {
      receipt_number: generateReceiptNumber(),
      items,
      subtotal,
      tax_total: taxTotal,
      discount_amount: discount,
      total_amount: total,
      points_earned: pointsEarned,
      cashier_name: user?.full_name || 'Cashier',
      ...paymentDetails,
    };

    const sale = await base44.entities.Sale.create(saleData);

    // Update stock quantities
    for (const item of cart) {
      const product = allProducts.find(p => p.id === item.id);
      if (product) {
        await base44.entities.Product.update(item.id, {
          stock_quantity: Math.max(0, product.stock_quantity - item.quantity)
        });
      }
    }

    // Update customer loyalty if customer is linked
    if (paymentDetails.customer_id) {
      try {
        const customer = await base44.entities.Customer.get(paymentDetails.customer_id);
        const newPoints = (customer.loyalty_points || 0) + pointsEarned;
        const newSpending = (customer.total_spending || 0) + total;
        const newTransactions = (customer.total_transactions || 0) + 1;
        
        // Calculate new tier
        let newTier = 'bronze';
        if (newSpending >= 50000) newTier = 'platinum';
        else if (newSpending >= 20000) newTier = 'gold';
        else if (newSpending >= 5000) newTier = 'silver';

        await base44.entities.Customer.update(paymentDetails.customer_id, {
          loyalty_points: newPoints,
          total_spending: newSpending,
          total_transactions: newTransactions,
          tier: newTier,
        });
      } catch (err) {
        console.error('Failed to update customer loyalty:', err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });

    setCompletedSale({ ...saleData, id: sale.id, created_date: new Date().toISOString() });
    setCheckoutOpen(false);
    setReceiptOpen(true);
    clearCart();
    setIsProcessing(false);
  };

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen flex flex-col lg:flex-row">
      {/* Product Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search & Filters */}
        <div className="p-4 border-b bg-card space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products or scan barcode..."
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                className="cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid
            products={products}
            onAddToCart={addToCart}
            searchQuery={search}
          />
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l bg-card flex flex-col min-h-[300px] lg:min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            discount={discount}
            onDiscountChange={setDiscount}
            taxRate={taxRate}
          />
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t">
            <Button
              onClick={() => setCheckoutOpen(true)}
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
            >
              Charge KES {total.toLocaleString()}
            </Button>
          </div>
        )}
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={total}
        onComplete={handleCheckout}
        isProcessing={isProcessing}
      />

      <ReceiptView
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        sale={completedSale}
        businessSettings={businessSettings}
      />
    </div>
  );
}