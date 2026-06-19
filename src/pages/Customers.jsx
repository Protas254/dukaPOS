import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Plus, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import CustomerProfileDialog from '@/components/customers/CustomerProfileDialog';
import CustomerSummaryDashboard from '@/components/customers/CustomerSummaryDashboard';
import CustomerCard from '@/components/customers/CustomerCard';
import CustomerFilters from '@/components/customers/CustomerFilters';

export default function Customers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });

  const { data: customers = [] } = useQuery({
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
    },
  });

  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }

    if (tierFilter !== 'all') {
      list = list.filter(c => c.tier === tierFilter);
    }

    switch (sort) {
      case 'spending': list.sort((a, b) => (b.total_spending || 0) - (a.total_spending || 0)); break;
      case 'points':   list.sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0)); break;
      case 'visits':   list.sort((a, b) => (b.total_transactions || 0) - (a.total_transactions || 0)); break;
      case 'name':     list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      default: break; // recent = default order from API
    }

    return list;
  }, [customers, search, tierFilter, sort]);

  const resetForm = () => setFormData({ name: '', phone: '', email: '', notes: '' });

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ name: customer.name || '', phone: customer.phone || '', email: customer.email || '', notes: customer.notes || '' });
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
      createMutation.mutate({ ...formData, loyalty_points: 0, total_spending: 0, total_transactions: 0, tier: 'bronze', is_active: true });
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Tier', 'Loyalty Points', 'Total Spending (KES)', 'Total Transactions', 'Member Since'];
    const rows = customers.map(c => [
      c.name, c.phone || '', c.email || '', c.tier || 'bronze',
      c.loyalty_points || 0, c.total_spending || 0, c.total_transactions || 0,
      c.created_date ? format(new Date(c.created_date), 'yyyy-MM-dd') : ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Loyalty program & customer profiles</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
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
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {selectedCustomer ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Dashboard */}
      {customers.length > 0 && <CustomerSummaryDashboard customers={customers} />}

      {/* Filters */}
      <CustomerFilters
        search={search} onSearch={setSearch}
        tier={tierFilter} onTier={setTierFilter}
        sort={sort} onSort={setSort}
      />

      {/* Results count */}
      <p className="text-xs text-muted-foreground -mt-2">
        Showing {filteredCustomers.length} of {customers.length} customers
      </p>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onView={() => setProfileCustomer(customer)}
            onEdit={() => handleEdit(customer)}
            onDelete={() => { if (confirm(`Delete ${customer.name}?`)) deleteMutation.mutate(customer.id); }}
          />
        ))}
      </div>

      <CustomerProfileDialog
        customer={profileCustomer}
        open={!!profileCustomer}
        onClose={() => setProfileCustomer(null)}
      />

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
          <p className="text-muted-foreground font-medium">
            {search || tierFilter !== 'all' ? 'No customers match your filters' : 'No customers yet. Add your first customer!'}
          </p>
          {(search || tierFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setTierFilter('all'); }} className="text-primary text-sm hover:underline mt-1">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Link to="/reports">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous: Reports
          </Button>
        </Link>
        <Link to="/my-shifts">
          <Button className="gap-2">
            Next: My Shifts
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}