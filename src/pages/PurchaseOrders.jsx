import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function PurchaseOrders() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => base44.entities.PurchaseOrder.list('-created_date'),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const createOrder = useMutation({
    mutationFn: (data) => base44.entities.PurchaseOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchase-orders']);
      setDialogOpen(false);
      toast.success('Order created');
    },
  });

  const filtered = orders.filter(o => 
    o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Order</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
            <OrderForm suppliers={suppliers} onSubmit={createOrder.mutate} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search orders..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid gap-4">
        {filtered.map(order => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">{order.supplier_name}</p>
                  <p className="text-sm">KES {order.total_amount?.toLocaleString()}</p>
                </div>
                <Badge>{order.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OrderForm({ suppliers, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    order_number: `PO-${Date.now()}`,
    supplier_id: '',
    supplier_name: '',
    order_date: new Date().toISOString().split('T')[0],
    items: [],
    total_amount: 0,
    status: 'draft',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Supplier</label>
        <select
          className="w-full p-2 border rounded"
          value={formData.supplier_id}
          onChange={e => {
            const supplier = suppliers.find(s => s.id === e.target.value);
            setFormData(prev => ({ ...prev, supplier_id: e.target.value, supplier_name: supplier?.name || '' }));
          }}
          required
        >
          <option value="">Select supplier</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Total Amount</label>
        <Input type="number" value={formData.total_amount} onChange={e => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))} required />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Create Order</Button>
      </div>
    </form>
  );
}