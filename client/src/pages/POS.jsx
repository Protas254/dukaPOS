import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, ArrowLeft, ArrowRight, Barcode, Zap, PauseCircle, Tag, Calculator, Keyboard, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductGrid from '@/components/pos/ProductGrid';
import Cart from '@/components/pos/Cart';
import CheckoutDialog from '@/components/pos/CheckoutDialog';
import ReceiptView from '@/components/pos/ReceiptView';
import POSTopBar from '@/components/pos/POSTopBar';
import POSFilters from '@/components/pos/POSFilters';
import CustomerSearchBar from '@/components/pos/CustomerSearchBar';
import FavoritesBar, { useFavorites } from '@/components/pos/FavoritesBar';
import HeldTransactions, { saveHeldTransactions, loadHeldTransactions } from '@/components/pos/HeldTransactions';
import PriceCheckMode from '@/components/pos/PriceCheckMode';
import EndOfDayReconciliation from '@/components/pos/EndOfDayReconciliation';
import KeyboardShortcutsHelp from '@/components/pos/KeyboardShortcutsHelp';
import QuickKeysPanel from '@/components/pos/QuickKeysPanel';
import ManagerApprovalDialog from '@/components/pos/ManagerApprovalDialog';
import CustomerPurchaseHistory from '@/components/pos/CustomerPurchaseHistory';
import StockAlert from '@/components/pos/StockAlert';
import SalesAnalytics from '@/components/pos/SalesAnalytics';
import { playSuccessBeep, playErrorBeep } from '@/utils/audio';

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
  { id: 'clothing', label: 'Clothing' },
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
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();
  const [scanMode, setScanMode] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);
  const searchInputRef = useRef(null);
  const [heldTransactions, setHeldTransactions] = useState(loadHeldTransactions);
  const [heldOpen, setHeldOpen] = useState(false);
  const [priceCheckOpen, setPriceCheckOpen] = useState(false);
  const [eodOpen, setEodOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [customerHistoryOpen, setCustomerHistoryOpen] = useState(false);
  const [pendingDiscount, setPendingDiscount] = useState(0);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

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
    api.auth.me().then(async (user) => {
      setCurrentUser(user);
      if (!user) return;
      // Find an existing active shift for this user today
      const allShifts = await api.entities.Shift.filter({ cashier_id: user.id, status: 'active' });
      if (allShifts.length > 0) {
        setActiveShift(allShifts[0]);
      } else {
        // Auto-start a new shift
        const shift = await api.entities.Shift.create({
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
    queryFn: () => api.entities.Product.list(),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => api.entities.BusinessSettings.list(),
  });

  const { data: allSales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.entities.Sale.list('-created_date', 200),
  });

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
      if (e.key === 'F1') { e.preventDefault(); setCheckoutOpen(true); }
      if (e.key === 'F6') { e.preventDefault(); holdTransaction(); }
      if (e.key === 'F7') { e.preventDefault(); setHeldOpen(true); }
      if (e.key === 'F8') { e.preventDefault(); setPriceCheckOpen(true); }
      if (e.key === 'F9') { e.preventDefault(); setEodOpen(true); }
      if (e.key === '?' && !isInput) { e.preventDefault(); setShortcutsOpen(true); }
      if (e.key === 'Escape') { setSearch(''); searchInputRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart, heldTransactions]);

  const businessSettings = settings[0] || {};
  const taxRate = businessSettings.default_tax_rate || 16;

  // Filter products by category
  const products = selectedCategory === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === selectedCategory);

  // Cart operations
  const [qtyPrompt, setQtyPrompt] = useState(null); // { product, qty }
  const qtyInputRef = useRef(null);

  const addToCart = useCallback((product, qty = null) => {
    const needsQtyPrompt = qty === null && ['kg', 'litre', 'bag'].includes(product.unit);
    if (needsQtyPrompt) {
      setQtyPrompt({ product, qty: 1 });
      setTimeout(() => qtyInputRef.current?.focus(), 50);
      return;
    }
    const addQty = qty || 1;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const newQty = existing.quantity + addQty;
        if (newQty > product.stock_quantity) {
          toast({ title: 'Stock limit reached', description: `Only ${product.stock_quantity} available`, variant: 'destructive' });
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: addQty, 
        unit: product.unit,
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

  // Hold & Recall
  const holdTransaction = () => {
    if (cart.length === 0) return;
    const held = {
      id: Date.now().toString(),
      label: `Cart ${heldTransactions.length + 1}`,
      items: cart,
      discount,
      total,
      savedAt: new Date().toISOString(),
    };
    const updated = [...heldTransactions, held];
    setHeldTransactions(updated);
    saveHeldTransactions(updated);
    clearCart();
    toast({ title: `Transaction held — ${cart.length} item(s) parked` });
  };

  const recallTransaction = (held) => {
    if (cart.length > 0) {
      const ok = window.confirm('Replace current cart with held transaction?');
      if (!ok) return;
    }
    setCart(held.items);
    setDiscount(held.discount || 0);
    const updated = heldTransactions.filter(h => h.id !== held.id);
    setHeldTransactions(updated);
    saveHeldTransactions(updated);
    setHeldOpen(false);
    toast({ title: `Transaction recalled — ${held.items.length} item(s) restored` });
  };

  const deleteHeld = (id) => {
    const updated = heldTransactions.filter(h => h.id !== id);
    setHeldTransactions(updated);
    saveHeldTransactions(updated);
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
        cash_received: paymentDetails.cash_received || undefined,
        change_given: paymentDetails.change_given ?? undefined,
        mpesa_reference: paymentDetails.mpesa_reference || undefined,
        bank_reference: paymentDetails.bank_reference || undefined,
        cheque_number: paymentDetails.cheque_number || undefined,
        split_payments: paymentDetails.split_payments || undefined,
        customer_id: paymentDetails.customer_id || undefined,
        customer_name: paymentDetails.customer_name || undefined,
        customer_phone: paymentDetails.customer_phone || undefined,
      };

      console.log('Creating sale with payment method:', paymentDetails.payment_method, saleData);

      // CRITICAL: Only await this — everything else is fire-and-forget
      sale = await api.entities.Sale.create(saleData);
      console.log('Sale created successfully:', sale.id);
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
    try { api.functions.invoke('submitEtimsInvoice', { sale }).catch(() => {}); } catch (_) {}

    // Update shift totals
    if (activeShift) {
      api.entities.Shift.update(activeShift.id, {
        total_sales: (activeShift.total_sales || 0) + finalTotal,
        total_transactions: (activeShift.total_transactions || 0) + 1,
      }).then(updated => setActiveShift(updated)).catch(() => {});
    }

    Promise.all(cart.map(item => {
      const product = allProducts.find(p => p.id === item.id);
      if (!product) return Promise.resolve();
      return api.entities.Product.update(item.id, { stock_quantity: Math.max(0, (product.stock_quantity || 0) - item.quantity) });
    })).catch(() => {});

    if (paymentDetails.customer_id) {
      api.entities.Customer.get(paymentDetails.customer_id).then(customer => {
        const pointsEarned = Math.floor(subtotal / 100);
        const points_redeemed = paymentDetails.points_redeemed || 0;
        const newPoints = Math.max(0, (customer.loyalty_points || 0) + pointsEarned - points_redeemed);
        const newSpending = (customer.total_spending || 0) + finalTotal;
        const newTransactions = (customer.total_transactions || 0) + 1;
        let newTier = 'bronze';
        if (newSpending >= 50000) newTier = 'platinum';
        else if (newSpending >= 20000) newTier = 'gold';
        else if (newSpending >= 5000) newTier = 'silver';
        return api.entities.Customer.update(paymentDetails.customer_id, { loyalty_points: newPoints, total_spending: newSpending, total_transactions: newTransactions, tier: newTier });
      }).catch(() => {});
    }

    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleCloseShiftAndLogout = async () => {
    if (activeShift) {
      await api.entities.Shift.update(activeShift.id, {
        status: 'closed',
        ended_at: new Date().toISOString(),
      }).catch(() => {});
    }
    api.auth.logout('/login');
  };

  // Manager approval wrapper
  const requestApproval = (actionType, amount) => {
    setApprovalAction({ type: actionType, amount, cart });
    setApprovalOpen(true);
  };

  const handleApprovalApproved = async ({ reason, approvedBy }) => {
    if (approvalAction?.type === 'discount') {
      setDiscount(pendingDiscount);
      toast({ title: 'Discount approved', description: `By ${approvedBy.full_name}` });
    }
    setApprovalAction(null);
    setPendingDiscount(0);
  };

  // Enhanced discount handler with approval
  const handleDiscountChange = (newDiscount) => {
    if (newDiscount > 1000 || newDiscount > subtotal * 0.2) {
      setPendingDiscount(newDiscount);
      requestApproval('discount', newDiscount);
    } else {
      setDiscount(newDiscount);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Ultra Compact Top Bar */}
      <div className="h-8 border-b bg-card flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold">POS</span>
          <Badge variant="secondary" className="h-4 text-[9px] px-1">{cart.length}</Badge>
          {heldTransactions.length > 0 && (
            <button onClick={() => setHeldOpen(true)} className="h-4 px-1.5 text-[9px] bg-amber-100 text-amber-700 rounded-full font-bold hover:bg-amber-200">
              {heldTransactions.length} held
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPriceCheckOpen(true)} title="Price Check (F8)" className="h-6 px-1.5 text-[10px] flex items-center gap-0.5 bg-background border rounded hover:border-primary hover:text-primary">
            <Tag className="w-2.5 h-2.5" /><span className="hidden sm:inline">Price</span>
          </button>
          <button onClick={holdTransaction} disabled={cart.length === 0} title="Hold Transaction (F6)" className="h-6 px-1.5 text-[10px] flex items-center gap-0.5 bg-background border rounded hover:border-amber-500 hover:text-amber-600 disabled:opacity-40">
            <PauseCircle className="w-2.5 h-2.5" /><span className="hidden sm:inline">Hold</span>
          </button>
          <button onClick={() => setEodOpen(true)} title="End of Day (F9)" className="h-6 px-1.5 text-[10px] flex items-center gap-0.5 bg-background border rounded hover:border-primary hover:text-primary">
            <Calculator className="w-2.5 h-2.5" /><span className="hidden sm:inline">EOD</span>
          </button>
          <button onClick={() => setAnalyticsOpen(true)} title="Sales Analytics" className="h-6 px-1.5 text-[10px] flex items-center gap-0.5 bg-background border rounded hover:border-primary hover:text-primary">
            <TrendingUp className="w-2.5 h-2.5" /><span className="hidden sm:inline">Analytics</span>
          </button>
          <button onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts (?)" className="h-6 w-6 flex items-center justify-center bg-background border rounded hover:border-primary hover:text-primary">
            <Keyboard className="w-2.5 h-2.5" />
          </button>
          <span className="text-muted-foreground truncate max-w-[80px] ml-1">{currentUser?.full_name || 'Cashier'}</span>
          {activeShift && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">SHIFT OPEN</span>
          )}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleCloseShiftAndLogout} title="Close shift & logout">✕</Button>
        </div>
      </div>

      {/* Main Content - Resizable Split Layout */}
      <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-h-0" style={{ minWidth: 0 }}>
          {/* Ultra Compact Filters + Barcode Scan */}
          <div className="border-b bg-muted/30">
            <div className="h-8 flex items-center gap-1 px-2">
              <div className="relative flex-1">
                {scanMode
                  ? <Barcode className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-primary animate-pulse" />
                  : <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                }
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && search.trim()) {
                      const q = search.trim().toLowerCase();
                      const match = allProducts.find(p => p.sku?.toLowerCase() === q)
                        || allProducts.find(p => p.sku?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q));
                      if (match && match.stock_quantity > 0) {
                        addToCart(match);
                        setSearch('');
                        setScanFlash(true);
                        playSuccessBeep();
                        setTimeout(() => setScanFlash(false), 400);
                      } else if (search.trim()) {
                        playErrorBeep();
                      }
                    }
                  }}
                  placeholder={scanMode ? "Scan barcode / SKU → Enter to add..." : "Search by name or SKU..."}
                  className={`w-full pl-5 pr-2 py-0.5 text-xs border rounded focus:outline-none focus:ring-1 h-6 transition-colors ${
                    scanMode ? 'border-primary focus:ring-primary bg-primary/5' : 'focus:ring-primary'
                  } ${scanFlash ? 'bg-green-100 border-green-400' : ''}`}
                />
              </div>
              <button
                onClick={() => { setScanMode(m => !m); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                title={scanMode ? "Exit scan mode" : "Enable barcode scan mode"}
                className={`h-6 px-2 text-[10px] font-bold rounded border transition-colors flex items-center gap-0.5 ${
                  scanMode
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
                }`}
              >
                <Barcode className="w-3 h-3" />
                <span className="hidden sm:inline">{scanMode ? 'ON' : 'SCAN'}</span>
              </button>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs border rounded px-1.5 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary h-6 max-w-[100px] truncate"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            {scanMode && (
              <div className="px-2 pb-1 text-[10px] text-primary/70 font-medium flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                Scan mode: scan a barcode or type a SKU and press Enter to add instantly
              </div>
            )}
          </div>
          {/* Favourites Bar */}
          <FavoritesBar
            allProducts={allProducts}
            onAddToCart={addToCart}
            favoriteIds={favoriteIds}
            toggleFavorite={toggleFavorite}
          />
          {/* Quick Keys Panel */}
          <QuickKeysPanel
            products={allProducts}
            onAddToCart={addToCart}
            recentSales={allSales}
          />
          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-1">
            <ProductGrid
              products={products}
              onAddToCart={addToCart}
              searchQuery={search}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
            />
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
            <CustomerSearchBar 
              selectedCustomer={selectedCustomer} 
              onSelectCustomer={(cust) => {
                setSelectedCustomer(cust);
                if (cust) setCustomerHistoryOpen(true);
              }} 
            />
          </div>
          {/* Stock Alerts */}
          <StockAlert cart={cart} products={allProducts} />
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            discount={discount}
            onDiscountChange={handleDiscountChange}
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

      {/* Quantity Prompt Dialog */}
      {qtyPrompt && (
        <Dialog open={!!qtyPrompt} onOpenChange={() => setQtyPrompt(null)}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="font-display text-base">Enter Quantity</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{qtyPrompt.product.name} <span className="font-semibold">({qtyPrompt.product.unit})</span></p>
              <div>
                <Label className="text-xs">Quantity ({qtyPrompt.product.unit})</Label>
                <Input
                  ref={qtyInputRef}
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={qtyPrompt.qty}
                  onChange={e => setQtyPrompt(q => ({ ...q, qty: parseFloat(e.target.value) || 1 }))}
                  className="mt-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      addToCart(qtyPrompt.product, qtyPrompt.qty);
                      setQtyPrompt(null);
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setQtyPrompt(null)}>Cancel</Button>
              <Button size="sm" onClick={() => { addToCart(qtyPrompt.product, qtyPrompt.qty); setQtyPrompt(null); }}>
                Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Hold & Recall */}
      <HeldTransactions
        open={heldOpen}
        onClose={() => setHeldOpen(false)}
        heldTransactions={heldTransactions}
        onRecall={recallTransaction}
        onDelete={deleteHeld}
      />

      {/* Price Check */}
      <PriceCheckMode
        open={priceCheckOpen}
        onClose={() => setPriceCheckOpen(false)}
        products={allProducts}
      />

      {/* End of Day */}
      <EndOfDayReconciliation
        open={eodOpen}
        onClose={() => setEodOpen(false)}
        sales={allSales}
        shift={activeShift}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Manager Approval */}
      <ManagerApprovalDialog
        open={approvalOpen}
        onClose={() => { setApprovalOpen(false); setApprovalAction(null); setPendingDiscount(0); }}
        onApprove={handleApprovalApproved}
        actionType={approvalAction?.type}
        amount={approvalAction?.amount}
        cart={cart}
      />

      {/* Customer Purchase History */}
      <CustomerPurchaseHistory
        customer={selectedCustomer}
        open={customerHistoryOpen}
        onClose={() => setCustomerHistoryOpen(false)}
      />

      {/* Sales Analytics */}
      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <SalesAnalytics
            sales={allSales}
            products={allProducts}
            onClose={() => setAnalyticsOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Navigation Buttons */}
      <div className="flex justify-between p-4 border-t bg-card">
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous: Dashboard
          </Button>
        </Link>
        <Link to="/inventory">
          <Button className="gap-2">
            Next: Inventory
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}