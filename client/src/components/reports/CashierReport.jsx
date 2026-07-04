import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { subDays, startOfDay, format, formatDuration, intervalToDuration } from 'date-fns';
import { User, TrendingUp, ShoppingCart, DollarSign, Clock, ChevronDown, ChevronUp, Lightbulb, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const insightTypes = {
  info:    { icon: Info,          bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',    icon_c: 'text-blue-500'    },
  tip:     { icon: Lightbulb,     bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-800',   icon_c: 'text-amber-500'   },
  good:    { icon: TrendingUp,    bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon_c: 'text-emerald-500' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800',  icon_c: 'text-orange-500'  },
};

function Insight({ type = 'info', text }) {
  const cfg = insightTypes[type];
  const Icon = cfg.icon;
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed', cfg.bg)}>
      <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', cfg.icon_c)} />
      <span className={cfg.text}>{text}</span>
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-muted/50 rounded-xl p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold font-display">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CashierReport({ periodSales }) {
  const [expandedShift, setExpandedShift] = useState(null);

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => api.entities.Shift.list('-started_at', 200),
  });

  // Build per-cashier shift history from shifts within period
  const cashierShifts = useMemo(() => {
    const map = {};
    shifts.forEach(shift => {
      const name = shift.cashier_name || 'Unknown';
      if (!map[name]) map[name] = [];
      // Get sales for this specific shift
      const shiftSales = periodSales.filter(s => s.shift_id === shift.id);
      map[name].push({
        ...shift,
        shiftSales,
        shiftRevenue: shiftSales.reduce((s, sale) => s + (sale.total_amount || 0), 0),
        shiftTransactions: shiftSales.length,
        duration: shift.ended_at
          ? intervalToDuration({ start: new Date(shift.started_at), end: new Date(shift.ended_at) })
          : intervalToDuration({ start: new Date(shift.started_at), end: new Date() }),
      });
    });
    return map;
  }, [shifts, periodSales]);

  // Build per-cashier stats from periodSales
  const cashierStats = useMemo(() => {
    const map = {};
    periodSales.forEach(sale => {
      const name = sale.cashier_name || 'Unknown';
      if (!map[name]) {
        map[name] = {
          name,
          transactions: 0,
          revenue: 0,
          discount: 0,
          cashCount: 0,
          mpesaCount: 0,
          cardCount: 0,
          // day-by-day for trend
          byDay: {},
        };
      }
      const c = map[name];
      c.transactions += 1;
      c.revenue += sale.total_amount || 0;
      c.discount += sale.discount_amount || 0;
      if (sale.payment_method === 'cash') c.cashCount += 1;
      if (sale.payment_method === 'mpesa') c.mpesaCount += 1;
      if (sale.payment_method === 'card') c.cardCount += 1;

      const day = format(new Date(sale.created_date), 'MMM d');
      c.byDay[day] = (c.byDay[day] || 0) + (sale.total_amount || 0);
    });

    return Object.values(map)
      .map(c => ({
        ...c,
        avgTicket: c.transactions > 0 ? Math.round(c.revenue / c.transactions) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [periodSales]);

  // Chart data: cashier names vs revenue
  const chartData = cashierStats.map(c => ({
    name: c.name.split(' ')[0], // first name to keep chart compact
    revenue: Math.round(c.revenue),
    transactions: c.transactions,
    avgTicket: c.avgTicket,
  }));

  if (cashierStats.length === 0) {
    return (
      <div className="bg-card rounded-2xl border p-10 text-center text-muted-foreground text-sm">
        No sales data found for the selected period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="bg-card rounded-2xl border p-5">
        <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Revenue by Cashier
        </h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v, name) => {
                  if (name === 'revenue') return [`KES ${v.toLocaleString()}`, 'Revenue'];
                  if (name === 'avgTicket') return [`KES ${v.toLocaleString()}`, 'Avg Ticket'];
                  return [v, name];
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Revenue chart insights */}
        {(() => {
          const top = cashierStats[0];
          const bottom = cashierStats[cashierStats.length - 1];
          const totalRev = cashierStats.reduce((s, c) => s + c.revenue, 0);
          const topPct = totalRev > 0 ? Math.round((top.revenue / totalRev) * 100) : 0;
          const gap = top && bottom && bottom !== top
            ? Math.round(((top.revenue - bottom.revenue) / top.revenue) * 100)
            : 0;
          return (
            <div className="space-y-2 mt-3">
              <Insight type="info" text="This chart compares total revenue generated by each cashier during the selected period. Use it to identify top performers and spot training opportunities." />
              {top && <Insight type="good" text={`${top.name} is your top earner contributing ${topPct}% of period revenue (KES ${Math.round(top.revenue).toLocaleString()}). Recognise their effort — positive reinforcement sustains high performance.`} />}
              {gap > 40 && bottom && bottom.name !== top.name && <Insight type="warning" text={`There's a ${gap}% revenue gap between your top and bottom cashier. This often signals a training need — consider pairing ${bottom.name} with ${top.name} for a shadowing session.`} />}
              {cashierStats.length === 1 && <Insight type="tip" text="Only one cashier recorded sales this period. Add more staff profiles to enable team comparisons and fairer workload distribution." />}
            </div>
          );
        })()}
      </div>

      {/* Cashier cards */}
      {cashierStats.map((c, i) => (
        <div key={c.name} className="bg-card rounded-2xl border p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary text-sm">{i + 1}</span>
              </div>
              <div>
                <p className="font-display font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.transactions} transactions in period</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-display font-bold text-primary">KES {Math.round(c.revenue).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">total revenue</p>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Transactions" value={c.transactions} />
            <MetricCard label="Total Sales" value={`KES ${Math.round(c.revenue).toLocaleString()}`} />
            <MetricCard label="Avg Ticket Size" value={`KES ${c.avgTicket.toLocaleString()}`} />
            <MetricCard label="Discounts Given" value={`KES ${Math.round(c.discount).toLocaleString()}`} />
          </div>

          {/* Payment split */}
          <div className="flex flex-wrap gap-2 text-xs">
            {c.cashCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                Cash: {c.cashCount}
              </span>
            )}
            {c.mpesaCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                M-Pesa: {c.mpesaCount}
              </span>
            )}
            {c.cardCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
                Card: {c.cardCount}
              </span>
            )}
          </div>

          {/* Per-cashier insights */}
          {(() => {
            const totalRev = cashierStats.reduce((s, x) => s + x.revenue, 0);
            const teamAvgTicket = cashierStats.length > 0
              ? Math.round(cashierStats.reduce((s, x) => s + x.avgTicket, 0) / cashierStats.length)
              : 0;
            const discountRate = c.revenue > 0 ? ((c.discount / c.revenue) * 100).toFixed(1) : 0;
            const revShare = totalRev > 0 ? Math.round((c.revenue / totalRev) * 100) : 0;
            const tips = [];

            if (i === 0 && cashierStats.length > 1) {
              tips.push({ type: 'good', text: `Top performer this period with ${revShare}% of total team revenue. Consider assigning them to peak hours for maximum store output.` });
            }
            if (c.avgTicket > teamAvgTicket * 1.2) {
              tips.push({ type: 'good', text: `Average ticket of KES ${c.avgTicket.toLocaleString()} is above the team average (KES ${teamAvgTicket.toLocaleString()}). ${c.name} is effective at upselling — ask them to share techniques with the team.` });
            } else if (c.avgTicket < teamAvgTicket * 0.8 && cashierStats.length > 1) {
              tips.push({ type: 'tip', text: `Average ticket of KES ${c.avgTicket.toLocaleString()} is below the team average (KES ${teamAvgTicket.toLocaleString()}). Encourage ${c.name} to suggest add-ons or bundle deals at checkout.` });
            }
            if (parseFloat(discountRate) > 10) {
              tips.push({ type: 'warning', text: `Discount rate is ${discountRate}% of sales (KES ${Math.round(c.discount).toLocaleString()} given away). Review whether these discounts were authorised — excessive discounting erodes margin.` });
            }
            if (c.transactions < 5) {
              tips.push({ type: 'info', text: `Only ${c.transactions} transaction${c.transactions !== 1 ? 's' : ''} recorded. This may reflect a part-time shift or absence — verify shift hours before drawing performance conclusions.` });
            }
            if (tips.length === 0) {
              tips.push({ type: 'info', text: `${c.name}'s metrics are within normal range. Keep monitoring trends across periods to spot improvements or dips early.` });
            }
            return (
              <div className="space-y-2">
                {tips.map((t, idx) => <Insight key={idx} type={t.type} text={t.text} />)}
              </div>
            );
          })()}

          {/* Shift history */}
          {cashierShifts[c.name]?.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedShift(expandedShift === c.name ? null : c.name)}
                className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              >
                <Clock className="w-3.5 h-3.5" />
                {cashierShifts[c.name].length} shift{cashierShifts[c.name].length > 1 ? 's' : ''} recorded
                {expandedShift === c.name ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {expandedShift === c.name && (
                <div className="mt-2 space-y-2">
                  {cashierShifts[c.name].slice(0, 10).map(shift => {
                    const durationStr = shift.duration
                      ? `${shift.duration.hours || 0}h ${shift.duration.minutes || 0}m`
                      : '—';
                    return (
                      <div key={shift.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-xs">
                        <div>
                          <p className="font-medium">{format(new Date(shift.started_at), 'MMM d, yyyy')}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(shift.started_at), 'h:mm a')}
                            {shift.ended_at ? ` → ${format(new Date(shift.ended_at), 'h:mm a')}` : ' → Active'}
                            {' · '}{durationStr}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">KES {shift.shiftRevenue.toLocaleString()}</p>
                          <p className="text-muted-foreground">{shift.shiftTransactions} sales</p>
                        </div>
                        {shift.status === 'active' && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">LIVE</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Summary table */}
      <div className="bg-card rounded-2xl border p-5">
        <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Comparative Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3 font-medium text-muted-foreground">Cashier</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right">Transactions</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right">Total Sales</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right">Avg Ticket</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right hidden md:table-cell">Discounts</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right hidden md:table-cell">% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalRev = cashierStats.reduce((s, c) => s + c.revenue, 0);
                return cashierStats.map((c, i) => (
                  <tr key={c.name} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                        {c.name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">{c.transactions}</td>
                    <td className="py-3 px-3 text-right font-semibold">KES {Math.round(c.revenue).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">KES {c.avgTicket.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right hidden md:table-cell text-muted-foreground">KES {Math.round(c.discount).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {totalRev > 0 ? ((c.revenue / totalRev) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        {/* Summary table insights */}
        {(() => {
          const totalRev = cashierStats.reduce((s, c) => s + c.revenue, 0);
          const totalTx = cashierStats.reduce((s, c) => s + c.transactions, 0);
          const teamAvgTicket = cashierStats.length > 0
            ? Math.round(cashierStats.reduce((s, c) => s + c.avgTicket, 0) / cashierStats.length)
            : 0;
          const highDiscounter = cashierStats.find(c => c.revenue > 0 && (c.discount / c.revenue) > 0.1);
          return (
            <div className="space-y-2 mt-4">
              <Insight type="info" text="This table provides a side-by-side comparison of all cashiers for the period. Use % of Revenue to assess each person's contribution to overall store performance." />
              {teamAvgTicket > 0 && <Insight type="tip" text={`Team average ticket size is KES ${teamAvgTicket.toLocaleString()}. Set this as a coaching target — even a 10% lift in average ticket across all cashiers meaningfully grows revenue without adding footfall.`} />}
              {highDiscounter && <Insight type="warning" text={`${highDiscounter.name} has a high discount-to-sales ratio. Ensure discount policies are clearly communicated and that manager approval is required for discounts above a set threshold.`} />}
              {cashierStats.length > 1 && <Insight type="tip" text="Share this report in your team briefing. Transparent performance data motivates staff and creates healthy accountability — pair it with recognition for top performers." />}
            </div>
          );
        })()}
      </div>
    </div>
  );
}