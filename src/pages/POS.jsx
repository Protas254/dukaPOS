import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import ProductGrid from '@/components/pos/ProductGrid';
import Cart from '@/components/pos/Cart';
import CheckoutDialog from '@/components/pos/CheckoutDialog';
import ReceiptView from '@/components/pos/ReceiptView';
import POSTopBar from '@/components/pos/POSTopBar';
import POSFilters from '@/components/pos/POSFilters';
import CustomerSearchBar from '@/components/pos/CustomerSearchBar';

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
  const { toast } = useToast();
  
  // State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [activeShift, setActiveShift] = React.useState(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);

  // Resizable splitter state (desktop: cart width px, mobile: cart height %)
  const [cartWidth, setCartWidth] = useState(280);
  const [cartHeightPct, setCartHeightPct] = useState(45);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  const startDragH = React.useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    const onMove = (ev) => {
      if (!isDragging.current || !containerRef.current) return;
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const newCartWidth = rect.right - clientX;
      setCartWidth(Math.min(500, Math.max(180, newCartWidth)));
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, []);

  const startDragV = React.useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    const onMove = (ev) => {
      if (!isDragging.current || !containerRef.current) return;
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((rect.bottom - clientY) / rect.height) * 100;
      setCartHeightPct(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, []);

  // Load current user and resolve/start their active shift
  React.useEffect(() => {
    base44.auth.me().then(async (user) => {
      setCurrentUser(user);
      if (!user) return;
      // Find an existing active shift for this user today
      const allShifts = await base44.entities.Shift.filter({ cashier_id: user.id, status: 'active' });
      if (allShifts.length > 0) {
        setActiveShift(allShifts[0]);
      } else {
        // Auto-start a new shift
        const shift = await base44.entities.Shift.create({
          cashier_id: user.id,
          cashier_name: user.full_name || user.email?.split('@')[0] || 'Cashier',
          started_at: new Date().toISOString(),
          status: 'active',
          total_sales: 0,
          total_transactions: 0,
        });
        setActiveShift(shift);
      }
    }).catch(() => {});
  }, []);

  // Fetch data
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

  // Filter products by category
  const products = selectedCategory === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === selectedCategory);

  // Cart operations
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
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        tax_rate: product.tax_rate || taxRate,
        stock_quantity: product.stock_quantity 
      }];
    });
  }, [taxRate, toast]);

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

  // Calculations
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const taxableAmount = subtotal - discount;
  const taxTotal = taxableAmount * (taxRate / (100 + taxRate));
  const total = Math.round(taxableAmount + taxTotal);

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
    let sale = null;
    const loyalty_discount = paymentDetails.loyalty_discount || 0;
    const finalTotal = Math.max(1, Math.round(total) - loyalty_discount);
    try {
      const points_redeemed = paymentDetails.points_redeemed || 0;
      const receipt_delivery = paymentDetails.receipt_delivery;
      const pointsEarned = Math.floor(subtotal / 100);

      const items = cart.map(i => {
        const itemTotal = i.price * i.quantity;
        const itemTax = itemTotal * ((i.tax_rate || taxRate) / (100 + (i.tax_rate || taxRate)));
        return {
          product_id: i.id,
          product_name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
          total: Math.round(itemTotal),
          tax_amount: Math.round(itemTax),
        };
      });

      const saleData = {
        receipt_number: generateReceiptNumber(),
        items,
        subtotal: Math.round(subtotal),
        tax_total: Math.round(taxTotal),
        discount_amount: Math.round(discount) + loyalty_discount,
        total_amount: finalTotal,
        points_earned: pointsEarned,
        cashier_name: currentUser?.full_name || 'Cashier',
        cashier_id: currentUser?.id || undefined,
        shift_id: activeShift?.id || undefined,
        payment_method: paymentDetails.payment_method,
      };

      // Only add optional fields if they have real values
      if (paymentDetails.cash_received) saleData.cash_received = paymentDetails.cash_received;
      if (paymentDetails.change_given != null) saleData.change_given = paymentDetails.change_given;
      if (paymentDetails.mpesa_reference) saleData.mpesa_reference = paymentDetails.mpesa_reference;
      if (paymentDetails.customer_id) saleData.customer_id = paymentDetails.customer_id;
      if (paymentDetails.customer_name) saleData.customer_name = paymentDetails.customer_name;
      if (paymentDetails.customer_phone) saleData.customer_phone = paymentDetails.customer_phone;

      // CRITICAL: Only await this — everything else is fire-and-forget
      sale = await base44.entities.Sale.create(saleData);
    } catch (err) {
      const msg = err?.message || err?.response?.data?.detail || JSON.stringify(err) || 'Unknown error';
      console.error('Sale creation failed:', err);
      toast({ title: 'Checkout failed', description: msg, variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Sale saved — show receipt immediately, nothing below can block it
    const receipt_delivery = paymentDetails.receipt_delivery;
    setCompletedSale({ ...sale, etims_status: 'not_submitted', receipt_delivery });
    setCheckoutOpen(false);
    setReceiptOpen(true);
    clearCart();
    setSelectedCustomer(null);
    setIsProcessing(false);

    // Background tasks — all fire-and-forget
    try { base44.functions.invoke('submitEtimsInvoice', { sale }).catch(() => {}); } catch (_) {}

    // Update shift totals
    if (activeShift) {
      base44.entities.Shift.update(activeShift.id, {
        total_sales: (activeShift.total_sales || 0) + finalTotal,
        total_transactions: (activeShift.total_transactions || 0) + 1,
      }).then(updated => setActiveShift(updated)).catch(() => {});
    }

    Promise.all(cart.map(item => {
      const product = allProducts.find(p => p.id === item.id);
      if (!product) return Promise.resolve();
      return base44.entities.Product.update(item.id, { stock_quantity: Math.max(0, (product.stock_quantity || 0) - item.quantity) });
    })).catch(() => {});

    if (paymentDetails.customer_id) {
      base44.entities.Customer.get(paymentDetails.customer_id).then(customer => {
        const pointsEarned = Math.floor(subtotal / 100);
        const points_redeemed = paymentDetails.points_redeemed || 0;
        const newPoints = Math.max(0, (customer.loyalty_points || 0) + pointsEarned - points_redeemed);
        const newSpending = (customer.total_spending || 0) + finalTotal;
        const newTransactions = (customer.total_transactions || 0) + 1;
        let newTier = 'bronze';
        if (newSpending >= 50000) newTier = 'platinum';
        else if (newSpending >= 20000) newTier = 'gold';
        else if (newSpending >= 5000) newTier = 'silver';
        return base44.entities.Customer.update(paymentDetails.customer_id, { loyalty_points: newPoints, total_spending: newSpending, total_transactions: newTransactions, tier: newTier });
      }).catch(() => {});
    }

    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleCloseShiftAndLogout = async () => {
    if (activeShift) {
      await base44.entities.Shift.update(activeShift.id, {
        status: 'closed',
        ended_at: new Date().toISOString(),
      }).catch(() => {});
    }
    base44.auth.logout('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Ultra Compact Top Bar */}
      <div className="h-8 border-b bg-card flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold">POS</span>
          <Badge variant="secondary" className="h-4 text-[9px] px-1">
            {cart.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground truncate max-w-[120px]">
            {currentUser?.full_name || 'Cashier'}
          </span>
          {activeShift && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">SHIFT OPEN</span>
          )}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleCloseShiftAndLogout} title="Close shift & logout">
            ✕
          </Button>
        </div>
      </div>

      {/* Main Content - Resizable Split Layout */}
      <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-h-0" style={{ minWidth: 0 }}>
          {/* Ultra Compact Filters */}
          <div className="h-8 border-b flex items-center gap-1 px-2 bg-muted/30">
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-6 pr-2 py-0.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary h-6"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border rounded px-1.5 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary h-6 max-w-[120px] truncate"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-1">
            <ProductGrid products={products} onAddToCart={addToCart} searchQuery={search} />
          </div>
        </div>

        {/* Vertical drag handle (mobile) */}
        <div
          onMouseDown={startDragV}
          onTouchStart={startDragV}
          className="lg:hidden h-2 bg-border hover:bg-primary/40 cursor-row-resize flex items-center justify-center select-none touch-none"
          title="Drag to resize"
        >
          <div className="w-8 h-1 rounded-full bg-muted-foreground/40" />
        </div>

        {/* Horizontal drag handle (desktop) */}
        <div
          onMouseDown={startDragH}
          onTouchStart={startDragH}
          className="hidden lg:flex w-1.5 bg-border hover:bg-primary/40 cursor-col-resize items-center justify-center select-none touch-none"
          title="Drag to resize"
        >
          <div className="h-8 w-0.5 rounded-full bg-muted-foreground/40" />
        </div>

        {/* Right Panel - Cart */}
        <style>{`
          @media (min-width: 1024px) { .cart-panel { width: ${cartWidth}px; flex-shrink: 0; } }
          @media (max-width: 1023px) { .cart-panel { height: ${cartHeightPct}vh; flex-shrink: 0; } }
        `}</style>
        <div className="cart-panel bg-card border-t lg:border-t-0 flex flex-col min-h-0">
          {/* Customer Search */}
          <div className="px-2 py-1.5 border-b bg-muted/20">
            <CustomerSearchBar selectedCustomer={selectedCustomer} onSelectCustomer={setSelectedCustomer} />
          </div>
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            discount={discount}
            onDiscountChange={setDiscount}
            taxRate={taxRate}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </div>
      </div>

      {/* Dialogs */}
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={total}
        onComplete={handleCheckout}
        isProcessing={isProcessing}
        preselectedCustomer={selectedCustomer}
      />

      <ReceiptView
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        sale={completedSale}
        businessSettings={businessSettings}
        receiptDelivery={completedSale?.receipt_delivery}
      />
    </div>
  );
}