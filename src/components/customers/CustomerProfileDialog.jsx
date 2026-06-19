import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, differenceInDays, subDays } from 'date-fns';
import {
  User, Gift, TrendingUp, ShoppingBag, Star, Receipt,
  Calendar, Clock, BarChart3, Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tierColors = {
  bronze:   'bg-amber-100 text-amber-700',
  silver:   'bg-gray-100 text-gray-700',
  gold:     'bg-yellow-100 text-yellow-700',
  platinum: 'bg-blue-100 text-blue-700',
};
const tierIcons = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };

const PMT_LABELS = { cash: 'Cash', mpesa: 'M-PESA', card: 'Card', split: 'Split' };

function StatBox({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={cn("rounded-xl p-3 border", highlight ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-transparent")}>
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
      <p className={cn("text-lg font-bold font-display", highlight && "text-primary")}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CustomerProfileDialog({ customer, open, onClose }) {
  const { data: allSales = [], isLoading } = useQuery({
    queryKey: ['customer-sales', customer?.id],
    queryFn: () => base44.entities.Sale.filter({ customer_id: customer.id, status: 'completed' }),
    enabled: !!customer?.id && open,
  });

  const sales = useMemo(() => [...allSales].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)), [allSales]);

  const stats = useMemo(() => {
    if (!sales.length) return null;
    const total = sales.reduce((s, x) => s + (x.total_amount || 0), 0);
    const avg = total / sales.length;
    const dates = sales.map(s => new Date(s.created_date)).sort((a, b) => a - b);
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const spanDays = differenceInDays(lastDate, firstDate) || 1;
    const freqDays = sales.length > 1 ? Math.round(spanDays / (sales.length - 1)) : null;

    // Last 30 days
    const cutoff = subDays(new Date(), 30);
    const recent = sales.filter(s => new Date(s.created_date) >= cutoff).length;

    // Most used payment
    const pmtCounts = {};
    sales.forEach(s => { pmtCounts[s.payment_method] = (pmtCounts[s.payment_method] || 0) + 1; });
    const topPmt = Object.entries(pmtCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Most bought item
    const itemCounts = {};
    sales.forEach(s => s.items?.forEach(i => {
      itemCounts[i.product_name] = (itemCounts[i.product_name] || 0) + i.quantity;
    }));
    const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

    return { total, avg, freqDays, recent, topPmt, topItem, firstDate, lastDate };
  }, [sales]);

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Customer header */}
        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-lg leading-tight">{customer.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm text-muted-foreground">{customer.phone}</span>
                {customer.email && <span className="text-sm text-muted-foreground">· {customer.email}</span>}
                <Badge className={cn("text-xs", tierColors[customer.tier])}>
                  {tierIcons[customer.tier]} {customer.tier?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="history" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 mb-0 grid grid-cols-2 flex-shrink-0">
            <TabsTrigger value="profile">Profile &amp; Loyalty</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          {/* ── PROFILE TAB ── */}
          <TabsContent value="profile" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-3">
              <StatBox icon={Gift} label="Loyalty Points" value={`${(customer.loyalty_points || 0).toLocaleString()} pts`} highlight />
              <StatBox icon={TrendingUp} label="Total Spent" value={`KES ${(customer.total_spending || 0).toLocaleString()}`} />
              <StatBox icon={ShoppingBag} label="Total Visits" value={customer.total_transactions || 0} />
              <StatBox icon={Star} label="Avg. per Visit" value={customer.total_transactions ? `KES ${Math.round((customer.total_spending || 0) / customer.total_transactions).toLocaleString()}` : '—'} />
            </div>

            {/* Tier progress */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Tier Progress</span>
                <Badge className={cn(tierColors[customer.tier])}>{tierIcons[customer.tier]} {customer.tier?.toUpperCase()}</Badge>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((customer.total_spending || 0) / 50000) * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {customer.tier === 'platinum'
                  ? '✓ Maximum tier reached'
                  : `KES ${((customer.tier === 'bronze' ? 5000 : customer.tier === 'silver' ? 20000 : 50000) - (customer.total_spending || 0)).toLocaleString()} to next tier`}
              </p>
            </div>

            {/* Available discounts */}
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold">Available Discounts</span>
              </div>
              <div className="space-y-1 text-xs">
                {[{pts:500,val:100},{pts:1000,val:250},{pts:2000,val:500}].map(({pts,val}) =>
                  (customer.loyalty_points||0)>=pts && (
                    <div key={pts} className="text-green-700 dark:text-green-400">✓ KES {val} off ({pts} pts)</div>
                  )
                )}
                {(customer.loyalty_points||0)<500 && (
                  <div className="text-muted-foreground">{500-(customer.loyalty_points||0)} pts needed for first discount</div>
                )}
              </div>
            </div>

            {customer.notes && (
              <div className="border rounded-xl p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground text-xs mb-1">Notes</p>
                {customer.notes}
              </div>
            )}
          </TabsContent>

          {/* ── HISTORY TAB ── */}
          <TabsContent value="history" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Loading history...</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No transactions yet
              </div>
            ) : (
              <>
                {/* Frequency stats */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatBox icon={Receipt} label="Total Transactions" value={sales.length} />
                    <StatBox icon={BarChart3} label="Avg. Basket" value={`KES ${Math.round(stats.avg).toLocaleString()}`} />
                    <StatBox icon={Repeat} label="Avg. Frequency" value={stats.freqDays ? `Every ${stats.freqDays}d` : '1 visit'} />
                    <StatBox icon={Clock} label="Last 30 Days" value={`${stats.recent} visit${stats.recent !== 1 ? 's' : ''}`} highlight={stats.recent > 0} />
                  </div>
                )}

                {/* Top insights */}
                {stats && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {stats.topPmt && (
                      <span className="bg-muted rounded-full px-3 py-1">
                        💳 Prefers <strong>{PMT_LABELS[stats.topPmt] || stats.topPmt}</strong>
                      </span>
                    )}
                    {stats.topItem && (
                      <span className="bg-muted rounded-full px-3 py-1">
                        🛒 Top item: <strong>{stats.topItem[0]}</strong> ({stats.topItem[1]}×)
                      </span>
                    )}
                    {stats.firstDate && (
                      <span className="bg-muted rounded-full px-3 py-1">
                        📅 Customer since <strong>{format(stats.firstDate, 'MMM yyyy')}</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Transaction list */}
                <div className="space-y-2">
                  {sales.map(sale => (
                    <div key={sale.id} className="border rounded-xl p-3 space-y-2 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs font-semibold">{sale.receipt_number}</span>
                        </div>
                        <span className="font-bold text-sm">KES {(sale.total_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(sale.created_date), 'dd MMM yyyy, HH:mm')}
                          </span>
                          <span className="uppercase font-medium">
                            {PMT_LABELS[sale.payment_method] || sale.payment_method}
                          </span>
                        </div>
                        {sale.points_earned > 0 && (
                          <span className="text-primary font-medium">+{sale.points_earned} pts</span>
                        )}
                      </div>
                      {/* Items list */}
                      <div className="border-t pt-2 space-y-0.5">
                        {sale.items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-muted-foreground">
                            <span>{item.product_name} × {item.quantity}</span>
                            <span>KES {(item.total || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}