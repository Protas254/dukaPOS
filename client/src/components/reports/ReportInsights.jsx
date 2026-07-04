import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const types = {
  info:    { icon: Info,          bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   icon_c: 'text-blue-500'   },
  tip:     { icon: Lightbulb,     bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800',  icon_c: 'text-amber-500'  },
  up:      { icon: TrendingUp,    bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon_c: 'text-emerald-500' },
  down:    { icon: TrendingDown,  bg: 'bg-red-50 border-red-200',     text: 'text-red-800',    icon_c: 'text-red-500'    },
  warning: { icon: AlertTriangle, bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', icon_c: 'text-orange-500' },
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

export default function ReportInsights({ section, data }) {
  const insights = buildInsights(section, data);
  if (!insights.length) return null;
  return (
    <div className="space-y-2 mt-3">
      {insights.map((ins, i) => (
        <Insight key={i} type={ins.type} text={ins.text} />
      ))}
    </div>
  );
}

function buildInsights(section, data) {
  const ins = [];
  if (!data) return ins;

  if (section === 'trend') {
    const { dailyData, totalRevenue, periodSales, profitMargin } = data;
    if (!dailyData?.length) return ins;

    const nonZero = dailyData.filter(d => d.revenue > 0);
    const avg = nonZero.length ? totalRevenue / nonZero.length : 0;
    const last = dailyData[dailyData.length - 1]?.revenue || 0;
    const prev = dailyData[dailyData.length - 2]?.revenue || 0;

    ins.push({ type: 'info', text: `This chart shows your daily revenue (green) vs gross profit (amber). The gap between the two lines represents your cost of goods. A narrowing gap means improving margins.` });

    if (last > prev && prev > 0) {
      const pct = Math.round(((last - prev) / prev) * 100);
      ins.push({ type: 'up', text: `Revenue is up ${pct}% compared to yesterday — great momentum! Keep an eye on whether profit is growing at the same rate.` });
    } else if (last < prev && prev > 0) {
      const pct = Math.round(((prev - last) / prev) * 100);
      ins.push({ type: 'down', text: `Revenue dipped ${pct}% from yesterday. Check if it's a slow day pattern or if stock/staffing gaps may have limited sales.` });
    }

    if (profitMargin < 20) {
      ins.push({ type: 'warning', text: `Your profit margin is ${profitMargin}%. Margins below 20% are thin — consider reviewing supplier costs or adjusting prices on low-margin products.` });
    } else if (profitMargin >= 40) {
      ins.push({ type: 'up', text: `Strong profit margin of ${profitMargin}%! You're retaining a healthy portion of each sale. Reinvest in stock or marketing to sustain growth.` });
    }
  }

  if (section === 'payment') {
    const { paymentData } = data;
    if (!paymentData?.length) return ins;

    const top = paymentData.sort((a, b) => b.value - a.value)[0];
    const hasMpesa = paymentData.find(p => p.name?.toLowerCase() === 'm-pesa');
    const hasCash = paymentData.find(p => p.name?.toLowerCase() === 'cash');
    const cashPct = hasCash ? Math.round((hasCash.value / paymentData.reduce((s, p) => s + p.value, 0)) * 100) : 0;

    ins.push({ type: 'info', text: `This donut chart shows the revenue split across payment methods. Use it to ensure your POS is optimised for your most popular method.` });

    if (top) {
      ins.push({ type: 'tip', text: `${top.name} is your #1 payment method. Make sure your ${top.name === 'M-Pesa' ? 'M-Pesa Paybill/Till is clearly visible and always operational' : top.name === 'Cash' ? 'float is adequate at shift start' : 'payment terminal is always charged and connected'}.` });
    }

    if (cashPct > 60) {
      ins.push({ type: 'warning', text: `${cashPct}% of revenue is cash. High cash dependency increases reconciliation risk — consider promoting M-Pesa or card payments to improve traceability.` });
    }

    if (hasMpesa && !hasCash) {
      ins.push({ type: 'tip', text: `No cash transactions recorded. Confirm this is intentional — some customers may not carry mobile money and a no-cash policy could lose you walk-in sales.` });
    }
  }

  if (section === 'category') {
    const { categoryChartData } = data;
    if (!categoryChartData?.length) return ins;

    const top = categoryChartData[0];
    const bottom = categoryChartData[categoryChartData.length - 1];
    const total = categoryChartData.reduce((s, c) => s + c.value, 0);
    const topPct = total ? Math.round((top.value / total) * 100) : 0;

    ins.push({ type: 'info', text: `This bar chart ranks your product categories by revenue. Use it to spot which categories drive your business and which may need attention or promotion.` });

    if (top) {
      ins.push({ type: 'up', text: `"${top.name}" is your top category at ${topPct}% of revenue. Ensure it's always well-stocked and consider expanding the range to capitalise on demand.` });
    }

    if (bottom && bottom.name !== top.name) {
      ins.push({ type: 'tip', text: `"${bottom.name}" is your lowest revenue category. Consider running a promotion, repositioning the products, or replacing with a more popular category.` });
    }
  }

  if (section === 'hours') {
    const { hourlyData } = data;
    if (!hourlyData?.length) return ins;

    const sorted = [...hourlyData].sort((a, b) => b.transactions - a.transactions);
    const peak = sorted[0];
    const quiet = sorted.filter(h => h.transactions === 0);

    ins.push({ type: 'info', text: `This chart shows transaction volume by hour of the day. It helps you schedule staff optimally and plan stock replenishment before your busiest windows.` });

    if (peak?.transactions > 0) {
      ins.push({ type: 'tip', text: `Your peak trading hour is ${peak.hour} with ${peak.transactions} transaction${peak.transactions !== 1 ? 's' : ''}. Schedule your most experienced cashier during this window and ensure the counter is fully stocked beforehand.` });
    }

    if (quiet.length > 8) {
      ins.push({ type: 'tip', text: `You have ${quiet.length} hours with zero transactions. Consider targeted promotions (e.g., "happy hour" discounts) during quiet periods to spread revenue more evenly.` });
    }
  }

  if (section === 'products') {
    const { topProductsList, periodSales } = data;
    if (!topProductsList?.length) return ins;

    const top = topProductsList[0];
    const avgRevPerProduct = topProductsList.reduce((s, p) => s + p.revenue, 0) / topProductsList.length;
    const slowMovers = topProductsList.filter(p => p.revenue < avgRevPerProduct * 0.3);

    ins.push({ type: 'info', text: `Your top-selling products ranked by revenue. Use this to prioritise reordering, plan promotions, and identify your most valuable stock-keeping units.` });

    if (top) {
      ins.push({ type: 'up', text: `"${top.name}" is your best seller (${top.quantity} units, KES ${top.revenue.toLocaleString()}). Never let this item go out of stock — consider setting a higher reorder threshold.` });
    }

    if (slowMovers.length > 0) {
      ins.push({ type: 'tip', text: `${slowMovers.length} product${slowMovers.length > 1 ? 's are' : ' is'} significantly underperforming vs your top sellers. Consider bundling them with popular items or running a clearance promotion.` });
    }
  }

  if (section === 'loyalty') {
    const { salesWithCustomers, periodSales, totalPointsAwarded, customerRevenue } = data;
    const pct = periodSales?.length ? Math.round((salesWithCustomers / periodSales.length) * 100) : 0;
    const avgCustomerSpend = salesWithCustomers > 0 ? Math.round(customerRevenue / salesWithCustomers) : 0;

    ins.push({ type: 'info', text: `Loyalty metrics track how well your loyalty programme is driving repeat business. Linked customer sales indicate how many receipts were tied to a loyalty profile.` });

    if (pct < 30) {
      ins.push({ type: 'warning', text: `Only ${pct}% of sales are linked to a customer profile. Train cashiers to ask for loyalty numbers at checkout — even a small lift in enrollment dramatically improves retention data.` });
    } else if (pct >= 60) {
      ins.push({ type: 'up', text: `${pct}% of sales are linked to customer profiles — excellent engagement! Use this data to identify your top spenders and offer personalised rewards.` });
    }

    if (totalPointsAwarded > 0) {
      ins.push({ type: 'tip', text: `${totalPointsAwarded.toLocaleString()} loyalty points were awarded this period. Remind customers of their balance at checkout to encourage redemption and repeat visits.` });
    }
  }

  return ins;
}