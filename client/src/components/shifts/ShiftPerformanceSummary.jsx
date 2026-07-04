import React from 'react';
import { TrendingUp, TrendingDown, Lightbulb, Info, AlertTriangle, Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const types = {
  info:    { icon: Info,          bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',    icon_c: 'text-blue-500'    },
  tip:     { icon: Lightbulb,     bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-800',   icon_c: 'text-amber-500'   },
  good:    { icon: CheckCircle2,  bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon_c: 'text-emerald-500' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800',  icon_c: 'text-orange-500'  },
};

function Insight({ type = 'info', text }) {
  const cfg = types[type];
  const Icon = cfg.icon;
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed', cfg.bg)}>
      <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', cfg.icon_c)} />
      <span className={cfg.text}>{text}</span>
    </div>
  );
}

function TrendBadge({ value, label }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <div className={cn(
      'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
      positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
    )}>
      <Icon className="w-3 h-3" />
      {positive ? '+' : ''}{value}% {label}
    </div>
  );
}

export default function ShiftPerformanceSummary({ mySales, todaySales, weekSales, dailyData, cashierName }) {
  const insights = [];

  const totalRevenue = mySales.reduce((s, x) => s + (x.total_amount || 0), 0);
  const totalTx = mySales.length;
  const avgTicket = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;

  const todayRevenue = todaySales.reduce((s, x) => s + (x.total_amount || 0), 0);
  const todayTx = todaySales.length;
  const todayAvgTicket = todayTx > 0 ? Math.round(todayRevenue / todayTx) : 0;

  const weekRevenue = weekSales.reduce((s, x) => s + (x.total_amount || 0), 0);
  const weekTx = weekSales.length;
  const weekAvgTicket = weekTx > 0 ? Math.round(weekRevenue / weekTx) : 0;

  // Week-over-week trend using dailyData (last 7 days split into two halves)
  const firstHalf = dailyData.slice(0, 3).reduce((s, d) => s + d.revenue, 0);
  const secondHalf = dailyData.slice(4).reduce((s, d) => s + d.revenue, 0);
  const weekTrend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : null;

  // Best day this week
  const bestDay = [...dailyData].sort((a, b) => b.revenue - a.revenue)[0];

  // Customer linkage rate
  const linkedSales = weekSales.filter(s => s.customer_id).length;
  const linkRate = weekTx > 0 ? Math.round((linkedSales / weekTx) * 100) : 0;

  // Discount usage
  const totalDiscount = weekSales.reduce((s, x) => s + (x.discount_amount || 0), 0);
  const discountRate = weekRevenue > 0 ? ((totalDiscount / weekRevenue) * 100).toFixed(1) : 0;

  // Build insights
  if (totalTx === 0) {
    insights.push({ type: 'info', text: `No sales recorded yet for ${cashierName}. Once you start processing transactions, your performance trends will appear here.` });
  } else {
    if (todayTx > 0 && todayAvgTicket > weekAvgTicket * 1.1) {
      insights.push({ type: 'good', text: `Your average ticket today (KES ${todayAvgTicket.toLocaleString()}) is above your weekly average (KES ${weekAvgTicket.toLocaleString()}). You're upselling well — keep suggesting complementary products at checkout!` });
    } else if (todayTx > 0 && todayAvgTicket < weekAvgTicket * 0.85) {
      insights.push({ type: 'tip', text: `Your average ticket today (KES ${todayAvgTicket.toLocaleString()}) is below your weekly average (KES ${weekAvgTicket.toLocaleString()}). Try offering bundle deals or suggesting add-ons to lift each transaction value.` });
    }

    if (weekTrend !== null && weekTrend > 15) {
      insights.push({ type: 'good', text: `Revenue in the second half of the week is ${weekTrend}% higher than the first half — great momentum! Maintain your energy and consistency through the rest of the period.` });
    } else if (weekTrend !== null && weekTrend < -15) {
      insights.push({ type: 'warning', text: `Revenue has dipped ${Math.abs(weekTrend)}% in the latter half of the week compared to the start. Check if it's a slow period pattern or if stock gaps may be holding back sales.` });
    }

    if (bestDay && bestDay.revenue > 0) {
      insights.push({ type: 'info', text: `Your best day this week was ${bestDay.date} with KES ${bestDay.revenue.toLocaleString()} across ${bestDay.transactions} transaction${bestDay.transactions !== 1 ? 's' : ''}. Reflect on what worked well that day — was it timing, product availability, or your approach?` });
    }

    if (linkRate < 25) {
      insights.push({ type: 'tip', text: `Only ${linkRate}% of your sales this week were linked to a loyalty customer. Make it a habit to ask for the customer's phone number at checkout — loyalty tracking helps the store reward your best regulars.` });
    } else if (linkRate >= 50) {
      insights.push({ type: 'good', text: `${linkRate}% of your weekly sales are linked to loyalty profiles — excellent! Loyal customers spend more and return more often. Keep prompting customers to join the programme.` });
    }

    if (parseFloat(discountRate) > 8) {
      insights.push({ type: 'warning', text: `Your discount rate this week is ${discountRate}% of revenue (KES ${Math.round(totalDiscount).toLocaleString()} given away). Ensure each discount is authorised and necessary — excessive discounting reduces the store's profitability.` });
    }

    if (weekTx >= 50) {
      insights.push({ type: 'good', text: `You've processed ${weekTx} transactions this week — great activity level! High transaction volume builds speed and accuracy at the till.` });
    } else if (weekTx < 10 && weekTx > 0) {
      insights.push({ type: 'info', text: `Low transaction count this week (${weekTx}). This may reflect fewer shifts or a slow period — more data will give a clearer picture of your performance trends.` });
    }
  }

  return (
    <div className="bg-card rounded-2xl border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Star className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Your Performance Summary</h3>
            <p className="text-xs text-muted-foreground">Personalised trends & coaching advice</p>
          </div>
        </div>
        {weekTrend !== null && <TrendBadge value={weekTrend} label="vs earlier this week" />}
      </div>

      {/* Quick stats row */}
      {totalTx > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Weekly Avg Ticket</p>
            <p className="text-base font-bold font-display">KES {weekAvgTicket.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Loyalty Link Rate</p>
            <p className={cn('text-base font-bold font-display', linkRate >= 40 ? 'text-emerald-600' : linkRate < 20 ? 'text-orange-500' : '')}>{linkRate}%</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Discount Rate</p>
            <p className={cn('text-base font-bold font-display', parseFloat(discountRate) > 8 ? 'text-orange-500' : 'text-emerald-600')}>{discountRate}%</p>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <Insight key={i} type={ins.type} text={ins.text} />
        ))}
      </div>
    </div>
  );
}