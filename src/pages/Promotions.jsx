import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Percent } from "lucide-react";
import { toast } from "sonner";

export default function Promotions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: promotions = [] } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => base44.entities.Promotion.list('-created_date'),
  });

  const createPromotion = useMutation({
    mutationFn: (data) => base44.entities.Promotion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions']);
      setDialogOpen(false);
      toast.success('Promotion created');
    },
  });

  const now = new Date();
  const activePromotions = promotions.filter(p => {
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    return p.is_active && start <= now && end >= now;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Promotions & Discounts</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Promotion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Promotion</DialogTitle></DialogHeader>
            <PromotionForm onSubmit={createPromotion.mutate} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Active Promotions ({activePromotions.length})</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePromotions.map(p => (
            <Card key={p.id} className="border-green-500">
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </CardHeader>
              <CardContent>
                <Badge className="bg-green-500">Active</Badge>
                <p className="text-sm mt-2">
                  {p.type === 'percentage_discount' && `${p.discount_value}% OFF`}
                  {p.type === 'fixed_discount' && `KES ${p.discount_value} OFF`}
                  {p.type === 'buy_x_get_y' && `Buy ${p.buy_quantity} Get ${p.get_quantity} Free`}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Ends: {new Date(p.end_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">All Promotions</h2>
        <div className="grid gap-4">
          {promotions.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{p.type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function PromotionForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage_discount',
    discount_value: 0,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Input value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
      </div>
      <div>
        <label className="text-sm font-medium">Type</label>
        <select className="w-full p-2 border rounded" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}>
          <option value="percentage_discount">Percentage Discount</option>
          <option value="fixed_discount">Fixed Amount Discount</option>
          <option value="buy_x_get_y">Buy X Get Y Free</option>
        </select>
      </div>
      {(formData.type === 'percentage_discount' || formData.type === 'fixed_discount') && (
        <div>
          <label className="text-sm font-medium">Discount Value</label>
          <Input type="number" value={formData.discount_value} onChange={e => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))} required />
        </div>
      )}
      {formData.type === 'buy_x_get_y' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium">Buy Quantity</label>
            <Input type="number" value={formData.buy_quantity || 0} onChange={e => setFormData(prev => ({ ...prev, buy_quantity: parseInt(e.target.value) || 0 }))} required />
          </div>
          <div>
            <label className="text-sm font-medium">Get Free Quantity</label>
            <Input type="number" value={formData.get_quantity || 0} onChange={e => setFormData(prev => ({ ...prev, get_quantity: parseInt(e.target.value) || 0 }))} required />
          </div>
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Start Date</label>
        <Input type="datetime-local" value={formData.start_date.slice(0, 16)} onChange={e => setFormData(prev => ({ ...prev, start_date: new Date(e.target.value).toISOString() }))} required />
      </div>
      <div>
        <label className="text-sm font-medium">End Date</label>
        <Input type="datetime-local" value={formData.end_date.slice(0, 16)} onChange={e => setFormData(prev => ({ ...prev, end_date: new Date(e.target.value).toISOString() }))} required />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Create Promotion</Button>
      </div>
    </form>
  );
}