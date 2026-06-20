import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function CashFlow() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: cashflows = [] } = useQuery({
    queryKey: ['cashflow'],
    queryFn: () => base44.entities.CashFlow.list('-date'),
  });

  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => base44.entities.Expense.list() });

  const createCashflow = useMutation({
    mutationFn: (data) => base44.entities.CashFlow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cashflow']);
      setDialogOpen(false);
      toast.success('Transaction recorded');
    },
  });

  const totalInflow = cashflows.filter(c => c.transaction_type === 'inflow').reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalOutflow = cashflows.filter(c => c.transaction_type === 'outflow').reduce((sum, c) => sum + (c.amount || 0), 0);
  const balance = totalInflow - totalOutflow;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cash Flow</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Cash Flow Transaction</DialogTitle></DialogHeader>
            <CashFlowForm onSubmit={createCashflow.mutate} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">KES {totalInflow.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">KES {totalOutflow.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KES {balance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {cashflows.map(cf => (
          <Card key={cf.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{cf.description}</p>
                  <p className="text-sm text-muted-foreground">{cf.date} • {cf.category}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${cf.transaction_type === 'inflow' ? 'text-green-500' : 'text-red-500'}`}>
                    {cf.transaction_type === 'inflow' ? '+' : '-'} KES {cf.amount?.toLocaleString()}
                  </p>
                  <Badge variant="outline">{cf.payment_method}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CashFlowForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    transaction_type: 'inflow',
    category: 'sales',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Type</label>
        <select className="w-full p-2 border rounded" value={formData.transaction_type} onChange={e => setFormData(prev => ({ ...prev, transaction_type: e.target.value }))}>
          <option value="inflow">Inflow</option>
          <option value="outflow">Outflow</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Category</label>
        <select className="w-full p-2 border rounded" value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}>
          <option value="sales">Sales</option>
          <option value="expense">Expense</option>
          <option value="loan">Loan</option>
          <option value="investment">Investment</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Amount</label>
        <Input type="number" value={formData.amount} onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} required />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Input value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} required />
      </div>
      <div>
        <label className="text-sm font-medium">Payment Method</label>
        <select className="w-full p-2 border rounded" value={formData.payment_method} onChange={e => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}>
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Transaction</Button>
      </div>
    </form>
  );
}