import React from 'react';
import { User, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function CashierPerformanceTable({ cashierPerformance = [] }) {
  return (
    <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-display font-bold text-sm text-foreground">Cashier Performance</h3>
        </div>
        <Link to="/reports" className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">
          View detailed report
        </Link>
      </div>

      {/* Table */}
      {cashierPerformance.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-emerald-100 dark:border-emerald-900/40 text-muted-foreground font-semibold text-left">
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3 text-right">Transactions</th>
                <th className="py-2.5 px-3 text-right">Total Revenue</th>
                <th className="py-2.5 px-3 text-right">Avg Sale</th>
                <th className="py-2.5 px-3 text-right">Payment Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100/60 dark:divide-emerald-900/30">
              {cashierPerformance.map((c) => (
                <tr key={c.name} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-foreground">{c.transactions}</td>
                  <td className="py-3 px-3 text-right font-bold text-foreground">KES {c.revenue.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-semibold text-muted-foreground">KES {c.avgSale.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.cashSales > 0 && (
                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                          Cash: {c.cashSales}
                        </Badge>
                      )}
                      {c.mpesaSales > 0 && (
                        <Badge variant="outline" className="text-[10px] font-bold bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
                          M-Pesa: {c.mpesaSales}
                        </Badge>
                      )}
                      {c.cardSales > 0 && (
                        <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                          Card: {c.cardSales}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-sm font-medium text-muted-foreground">
          No cashier sales recorded yet
        </div>
      )}
    </div>
  );
}
