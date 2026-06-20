import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Search, Package, TrendingUp, Calendar, DollarSign, 
  CheckCircle, Clock, XCircle, AlertCircle, Truck, FileText,
  ArrowRight, ShoppingCart, BarChart3, Eye
} from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  partially_delivered: { label: 'Partial', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function PurchaseOrders() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
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
      toast.success('Purchase order created successfully');
    },
  });

  const filtered = orders.filter(o => {
    const matchesSearch = o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    pending: orders.filter(o => ['sent', 'confirmed'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
  };

  return (
    <div className="p-6 bg-gradient-to-br from-background via-background to-muted/30 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              Purchase Orders
            </h1>
            <p className="text-muted-foreground mt-1">Track and manage inventory procurement from suppliers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
                <DialogDescription>
                  Generate a new purchase order for inventory replenishment
                </DialogDescription>
              </DialogHeader>
              <OrderForm suppliers={suppliers} onSubmit={createOrder.mutate} onCancel={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All purchase orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Clock className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">{stats.draft}</div>
              <p className="text-xs text-muted-foreground">Not yet sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting delivery</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">KES {stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All orders combined</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filtered.map(order => {
            const statusInfo = statusConfig[order.status] || statusConfig.draft;
            const StatusIcon = statusInfo.icon;
            const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A';
            const deliveryDate = order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'TBD';

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{order.order_number}</h3>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="w-4 h-4" />
                            <span className="font-medium">{order.supplier_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Ordered: {orderDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Truck className="w-4 h-4" />
                            <span>Expected: {deliveryDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold text-primary">KES {order.total_amount?.toLocaleString()}</span>
                          </div>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''} ordered
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {item.product_name} × {item.quantity_ordered}
                                </Badge>
                              ))}
                              {order.items.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{order.items.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 lg:flex-shrink-0">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No purchase orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first purchase order to get started"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function OrderForm({ suppliers, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    order_number: `PO-${Date.now().toString().slice(-6)}`,
    supplier_id: '',
    supplier_name: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    items: [],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    status: 'draft',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Order Number</Label>
          <Input 
            value={formData.order_number} 
            onChange={e => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
            className="bg-muted/50"
            readOnly
          />
        </div>
        <div className="col-span-2">
          <Label>Supplier *</Label>
          <Select 
            value={formData.supplier_id} 
            onValueChange={v => {
              const supplier = suppliers.find(s => s.id === v);
              setFormData(prev => ({ 
                ...prev, 
                supplier_id: v, 
                supplier_name: supplier?.name || '' 
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>No suppliers available</p>
                  <p className="text-xs mt-1">Please add suppliers first</p>
                </div>
              ) : (
                suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Order Date *</Label>
          <Input 
            type="date"
            value={formData.order_date} 
            onChange={e => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
            required 
          />
        </div>
        <div>
          <Label>Expected Delivery</Label>
          <Input 
            type="date"
            value={formData.expected_delivery_date} 
            onChange={e => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Total Amount (KES) *</Label>
          <Input 
            type="number" 
            value={formData.total_amount} 
            onChange={e => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))} 
            placeholder="0.00"
            required 
          />
        </div>
        <div className="col-span-2">
          <Label>Order Notes</Label>
          <Textarea 
            value={formData.notes} 
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Delivery instructions, special requirements, etc."
            rows={3}
          />
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Quick Tips
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Select a supplier before creating the order</li>
          <li>Set expected delivery date for better tracking</li>
          <li>Start with "Draft" status to review before sending</li>
          <li>Add detailed notes for special delivery instructions</li>
        </ul>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={!formData.supplier_id}>
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </div>
    </form>
  );
}

function Building({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}