import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Package, DollarSign, Calendar, TrendingUp } from 'lucide-react';

export default function CustomerPurchaseHistory({ customer, open, onClose }) {
  if (!customer) return null;

  const totalSpent = customer.total_spending || 0;
  const totalOrders = customer.total_transactions || 0;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Purchase History</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Profile Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
                </div>
                <div className="text-right">
                  <Badge className={
                    customer.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                    customer.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                    customer.tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }>
                    {customer.tier?.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {customer.loyalty_points || 0} points
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <DollarSign className="w-4 h-4 mx-auto text-green-600 mb-1" />
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="font-bold text-lg">KES {totalSpent.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Calendar className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="font-bold text-lg">{totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <TrendingUp className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                <p className="text-xs text-muted-foreground">Avg Order</p>
                <p className="font-bold text-lg">KES {Math.round(avgOrderValue).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions Placeholder */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <Package className="w-4 h-4" />
              Recent Transactions
            </h4>
            <p className="text-xs text-muted-foreground">
              Transaction history will appear here as customer makes purchases
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}