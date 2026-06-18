import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, User, Plus, Pencil, Trash2, Gift, TrendingUp, ShoppingBag, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const tierColors = {
  bronze: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  silver: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  gold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  platinum: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const tierIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

export default function Customers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer added', description: 'Customer profile created successfully' });
      setEditDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer updated', description: 'Profile updated successfully' });
      setEditDialogOpen(false);
      setSelectedCustomer(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer deleted', description: 'Profile removed successfully' });
      setSelectedCustomer(null);
    },
  });

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', notes: '' });
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    resetForm();
    setEditDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data: formData });
    } else {
      createMutation.mutate({
        ...formData,
        loyalty_points: 0,
        total_spending: 0,
        total_transactions: 0,
        tier: 'bronze',
        is_active: true,
      });
    }
  };

  const calculateTier = (spending) => {
    if (spending >= 50000) return 'platinum';
    if (spending >= 20000) return 'gold';
    if (spending >= 5000) return 'silver';
    return 'bronze';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Loyalty program & customer profiles</p>
        </div>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {selectedCustomer ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="pl-10"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
                <Badge className={tierColors[customer.tier]}>
                  {tierIcons[customer.tier]} {customer.tier}
                </Badge>
              </div>

              {/* Loyalty Points Progress */}
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-3 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Loyalty Points</span>
                  </div>
                  <Badge className={cn("font-bold", tierColors[customer.tier])}>
                    {tierIcons[customer.tier]} {customer.tier.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-end justify-between mb-1">
                  <span className="text-2xl font-display font-bold text-primary">
                    {(customer.loyalty_points || 0).toLocaleString()} pts
                  </span>
                  <span className="text-xs text-muted-foreground mb-1">
                    KES {(customer.total_spending || 0).toLocaleString()} spent
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((customer.loyalty_points || 0) / 5000) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {customer.tier === 'platinum' 
                    ? '✓ Maximum tier reached' 
                    : `${((customer.tier === 'bronze' ? 5000 : customer.tier === 'silver' ? 20000 : 50000) - (customer.total_spending || 0)).toLocaleString()} KES to next tier`}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1 p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Total Spent</span>
                  </div>
                  <span className="font-bold text-sm">KES {(customer.total_spending || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1 p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Total Visits</span>
                  </div>
                  <span className="font-bold text-sm">{customer.total_transactions || 0}</span>
                </div>
              </div>

              {/* Discount Recommendations */}
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold">Available Discounts</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {(customer.loyalty_points || 0) >= 500 && (
                    <div className="flex items-center justify-between text-green-700 dark:text-green-400">
                      <span>✓ KES 100 off (500 pts)</span>
                    </div>
                  )}
                  {(customer.loyalty_points || 0) >= 1000 && (
                    <div className="flex items-center justify-between text-green-700 dark:text-green-400">
                      <span>✓ KES 250 off (1000 pts)</span>
                    </div>
                  )}
                  {(customer.loyalty_points || 0) >= 2000 && (
                    <div className="flex items-center justify-between text-green-700 dark:text-green-400">
                      <span>✓ KES 500 off (2000 pts)</span>
                    </div>
                  )}
                  {(customer.loyalty_points || 0) < 500 && (
                    <div className="text-muted-foreground">
                      {500 - (customer.loyalty_points || 0)} pts needed for first discount
                    </div>
                  )}
                </div>
              </div>

              {customer.email && (
                <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleEdit(customer)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete ${customer.name}?`)) {
                      deleteMutation.mutate(customer.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {search ? 'No customers found' : 'No customers yet. Add your first customer!'}
          </p>
        </div>
      )}
    </div>
  );
}