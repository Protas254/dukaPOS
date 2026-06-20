import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building } from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const createSupplier = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowForm(false);
      toast.success('Supplier added');
    },
  });

  const filtered = suppliers.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground">Manage supplier contacts and terms</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              <SupplierForm onSubmit={createSupplier.mutate} onCancel={() => setShowForm(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(supplier => (
            <Card key={supplier.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Contact: {supplier.contact_person}</p>
                  <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                  <p className="text-sm text-muted-foreground">{supplier.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{supplier.payment_terms}</Badge>
                  <Badge variant={supplier.is_active ? "default" : "secondary"}>
                    {supplier.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No suppliers found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SupplierForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    products_supplied: '',
    payment_terms: 'cash',
    is_active: true,
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Business Name *</Label>
        <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
      </div>
      <div>
        <Label>Contact Person</Label>
        <Input value={formData.contact_person} onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Phone *</Label>
          <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label>Address</Label>
        <Input value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} />
      </div>
      <div>
        <Label>Products Supplied</Label>
        <Input value={formData.products_supplied} onChange={e => setFormData(prev => ({ ...prev, products_supplied: e.target.value }))} placeholder="e.g., Dairy products, Beverages" />
      </div>
      <div>
        <Label>Payment Terms</Label>
        <Select value={formData.payment_terms} onValueChange={v => setFormData(prev => ({ ...prev, payment_terms: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="net_7">Net 7 Days</SelectItem>
            <SelectItem value="net_15">Net 15 Days</SelectItem>
            <SelectItem value="net_30">Net 30 Days</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Input value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Supplier</Button>
      </div>
    </form>
  );
}