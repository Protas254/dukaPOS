import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Filter, LogOut, User, Trash2, ShoppingCart, Tag, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
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
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

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

  const handleLogout = () => {
    if (window.confirm('Log out of POS? This will end your current session.')) {
      base44.auth.logout('/login');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar - Enhanced */}
      <div className="h-16 border-b bg-card shadow-sm flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{currentUser?.full_name || currentUser?.email || 'Cashier'}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser?.role || 'Staff'}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border mx-2" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Log Out</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Product Area */}
        <div className="flex-1 flex flex-col min-h-0 border-r">
          {/* Search & Filters */}
          <div className="p-4 border-b bg-card/50 backdrop-blur space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products or scan barcode..."
                  className="pl-10 h-12 rounded-xl border-2 focus:border-primary transition-colors"
                />
              </div>
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="h-12 px-4 border-2 hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Clear</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              {categories.map(cat => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedCategory === cat.id 
                      ? "shadow-md shadow-primary/20" 
                      : "hover:bg-primary/10 hover:text-primary"
                  )}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-background">
            <ProductGrid
              products={products}
              onAddToCart={addToCart}
              searchQuery={search}
            />
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-full lg:w-[400px] bg-card border-t lg:border-t-0 lg:border-l shadow-lg flex flex-col">
          <div className="p-4 border-b bg-card/50 backdrop-blur flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-lg">Current Sale</h2>
              </div>
              {cart.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {cart.length} item{cart.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
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
            <div className="p-4 border-t bg-card/50 backdrop-blur space-y-3 flex-shrink-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>KES {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>- KES {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t">
                  <span>Total</span>
                  <span>KES {total.toLocaleString()}</span>
                </div>
              </div>
              <Button
                onClick={() => setCheckoutOpen(true)}
                className="w-full h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Charge KES {total.toLocaleString()}
              </Button>
            </div>
          )}
        </div>
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