import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Search, Building, Phone, Mail, MapPin, User, Package, CreditCard, 
  CheckCircle, XCircle, Edit
} from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.Supplier.list(),
  });

  const createSupplier = useMutation({
    mutationFn: (data) => api.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowForm(false);
      toast.success('Supplier added successfully');
    },
  });

  const updateSupplier = useMutation({
    mutationFn: ({ id, data }) => api.entities.Supplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowForm(false);
      setEditingSupplier(null);
      toast.success('Supplier updated successfully');
    },
  });

  const filtered = suppliers.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && s.is_active) ||
      (filterStatus === "inactive" && !s.is_active);
    return matchesSearch && matchesStatus;
  });

  const activeCount = suppliers.filter(s => s.is_active).length;
  const inactiveCount = suppliers.length - activeCount;

  return (
    <div className="p-6 bg-gradient-to-br from-background via-background to-muted/30 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-primary" />
              </div>
              Suppliers
            </h1>
            <p className="text-muted-foreground mt-1">Manage your supplier network and procurement relationships</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                <DialogDescription>
                  {editingSupplier ? 'Update supplier information' : 'Add a new supplier to your network'}
                </DialogDescription>
              </DialogHeader>
              <SupplierForm 
                supplier={editingSupplier}
                onSubmit={editingSupplier ? 
                  (data) => updateSupplier.mutate({ id: editingSupplier.id, data }) : 
                  (data) => createSupplier.mutate(data)
                } 
                onCancel={() => {
                  setShowForm(false);
                  setEditingSupplier(null);
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">All registered suppliers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Currently active suppliers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveCount}</div>
              <p className="text-xs text-muted-foreground">Currently inactive</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, contact person, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Suppliers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(supplier => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <CardDescription>
                        <Badge variant={supplier.is_active ? "default" : "secondary"} className="mt-1">
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplier.contact_person && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{supplier.contact_person}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{supplier.address}</span>
                  </div>
                )}
                {supplier.products_supplied && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{supplier.products_supplied}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    {supplier.payment_terms?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
              {supplier.notes && (
                <CardFooter className="pt-0">
                  <p className="text-xs text-muted-foreground italic">"{supplier.notes}"</p>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Building className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Get started by adding your first supplier"}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SupplierForm({ supplier, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    products_supplied: supplier?.products_supplied || '',
    payment_terms: supplier?.payment_terms || 'cash',
    is_active: supplier?.is_active ?? true,
    notes: supplier?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Business Name *</Label>
          <Input 
            value={formData.name} 
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
            placeholder="e.g., ABC Distributors Ltd"
            required 
          />
        </div>
        <div>
          <Label>Contact Person</Label>
          <Input 
            value={formData.contact_person} 
            onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
            placeholder="Full name"
          />
        </div>
        <div>
          <Label>Phone Number *</Label>
          <Input 
            value={formData.phone} 
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+254 7XX XXX XXX"
            required 
          />
        </div>
        <div className="col-span-2">
          <Label>Email Address</Label>
          <Input 
            type="email" 
            value={formData.email} 
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="supplier@example.com"
          />
        </div>
        <div className="col-span-2">
          <Label>Physical Address</Label>
          <Input 
            value={formData.address} 
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Street, Building, City"
          />
        </div>
        <div className="col-span-2">
          <Label>Products Supplied</Label>
          <Input 
            value={formData.products_supplied} 
            onChange={e => setFormData(prev => ({ ...prev, products_supplied: e.target.value }))} 
            placeholder="e.g., Dairy products, Beverages, Snacks"
          />
        </div>
        <div>
          <Label>Payment Terms</Label>
          <Select value={formData.payment_terms} onValueChange={v => setFormData(prev => ({ ...prev, payment_terms: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash on Delivery</SelectItem>
              <SelectItem value="net_7">Net 7 Days</SelectItem>
              <SelectItem value="net_15">Net 15 Days</SelectItem>
              <SelectItem value="net_30">Net 30 Days</SelectItem>
              <SelectItem value="credit">Credit Account</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.is_active ? "active" : "inactive"} onValueChange={v => setFormData(prev => ({ ...prev, is_active: v === "active" }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Additional Notes</Label>
          <Textarea 
            value={formData.notes} 
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional information about this supplier..."
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          {supplier ? 'Update Supplier' : 'Add Supplier'}
        </Button>
      </div>
    </form>
  );
}