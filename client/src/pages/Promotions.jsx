import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Calendar, Percent, Tag, Clock, TrendingUp, Search, X, Filter, Edit2, Trash2, Gift, Zap, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format, isWithinInterval, isPast, isFuture } from "date-fns";
import { toast } from "sonner";

const PROMOTION_TYPES = [
  { value: 'percentage_discount', label: 'Percentage Discount', icon: Percent },
  { value: 'fixed_discount', label: 'Fixed Amount Discount', icon: Tag },
  { value: 'buy_x_get_y', label: 'Buy X Get Y Free', icon: Gift },
  { value: 'bundle', label: 'Bundle Deal', icon: Zap },
];

export default function Promotions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => api.entities.Promotion.list('-created_date'),
  });

  const createPromotion = useMutation({
    mutationFn: (data) => api.entities.Promotion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions']);
      setDialogOpen(false);
      setEditingPromotion(null);
      toast.success('Promotion created successfully');
    },
  });

  const updatePromotion = useMutation({
    mutationFn: ({ id, data }) => api.entities.Promotion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions']);
      setDialogOpen(false);
      setEditingPromotion(null);
      toast.success('Promotion updated successfully');
    },
  });

  const deletePromotion = useMutation({
    mutationFn: (id) => api.entities.Promotion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions']);
      toast.success('Promotion deleted');
    },
  });

  const now = new Date();
  
  const stats = useMemo(() => {
    const active = promotions.filter(p => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      return p.is_active && start <= now && end >= now;
    });
    const upcoming = promotions.filter(p => {
      const start = new Date(p.start_date);
      return p.is_active && start > now;
    });
    const expired = promotions.filter(p => {
      const end = new Date(p.end_date);
      return end < now;
    });
    return { active: active.length, upcoming: upcoming.length, expired: expired.length, total: promotions.length };
  }, [promotions]);

  const filtered = useMemo(() => {
    return promotions.filter(p => {
      const q = search.toLowerCase();
      if (q && !p.name?.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
      
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      const isActive = p.is_active && start <= now && end >= now;
      const isUpcoming = p.is_active && start > now;
      const isExpired = end < now || !p.is_active;
      
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'upcoming' && !isUpcoming) return false;
      if (statusFilter === 'expired' && !isExpired) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      
      return true;
    });
  }, [promotions, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromotions = filtered.slice(startIndex, endIndex);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Promotions & Discounts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create and manage promotional campaigns to boost sales
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              New Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
              </DialogTitle>
            </DialogHeader>
            <PromotionForm
              promotion={editingPromotion}
              onSubmit={editingPromotion ? (data) => updatePromotion.mutate({ id: editingPromotion.id, data }) : createPromotion.mutate}
              onCancel={() => { setDialogOpen(false); setEditingPromotion(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardDescription className="text-xs font-medium">Active Promotions</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 mt-1">
                {stats.active}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardDescription className="text-xs font-medium">Upcoming</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 mt-1">
                {stats.upcoming}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Scheduled to start</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardDescription className="text-xs font-medium">Expired</CardDescription>
              <CardTitle className="text-2xl font-bold text-orange-600 mt-1">
                {stats.expired}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Past end date</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardDescription className="text-xs font-medium">Total Promotions</CardDescription>
              <CardTitle className="text-2xl font-bold mt-1">
                {stats.total}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search promotions..."
              className="pl-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant={showFilters ? 'default' : 'outline'} size="sm" className="gap-2" onClick={() => setShowFilters(v => !v)}>
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="bg-muted/40 border rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1 rounded-lg">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Promotion Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="mt-1 rounded-lg">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {PROMOTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="capitalize">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}>
                <X className="w-3 h-3" /> Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Promotion List */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">Promotions ({filtered.length})</span>
          </div>
          <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Loading promotions...</p>
            </div>
          ) : paginatedPromotions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No promotions found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            paginatedPromotions.map(p => {
              const start = new Date(p.start_date);
              const end = new Date(p.end_date);
              const isActive = p.is_active && start <= now && end >= now;
              const isUpcoming = p.is_active && start > now;
              const isExpired = end < now || !p.is_active;

              return (
                <div key={p.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        isUpcoming ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-muted'
                      }`}>
                        <Tag className={`w-5 h-5 ${
                          isActive ? 'text-emerald-600' :
                          isUpcoming ? 'text-blue-600' :
                          'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{p.name}</p>
                          <Badge variant={isActive ? 'default' : isUpcoming ? 'secondary' : 'outline'} className="text-[10px]">
                            {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Expired'}
                          </Badge>
                        </div>
                        {p.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{p.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(start, 'MMM d, yyyy')} - {format(end, 'MMM d, yyyy')}
                          </span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {PROMOTION_TYPES.find(t => t.value === p.type)?.label || p.type}
                          </Badge>
                          {p.type === 'percentage_discount' && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-emerald-600">{p.discount_value}% OFF</span>
                            </>
                          )}
                          {p.type === 'fixed_discount' && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-emerald-600">KES {p.discount_value} OFF</span>
                            </>
                          )}
                          {p.type === 'buy_x_get_y' && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-emerald-600">Buy {p.buy_quantity} Get {p.get_quantity} Free</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingPromotion(p); setDialogOpen(true); }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deletePromotion.mutate(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} promotions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function PromotionForm({ promotion, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: promotion?.name || '',
    description: promotion?.description || '',
    type: promotion?.type || 'percentage_discount',
    discount_value: promotion?.discount_value || 0,
    buy_quantity: promotion?.buy_quantity || 1,
    get_quantity: promotion?.get_quantity || 1,
    start_date: promotion?.start_date ? format(new Date(promotion.start_date), 'yyyy-MM-dd HH:mm') : format(new Date(), 'yyyy-MM-dd HH:mm'),
    end_date: promotion?.end_date ? format(new Date(promotion.end_date), 'yyyy-MM-dd HH:mm') : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm'),
    is_active: promotion?.is_active !== undefined ? promotion.is_active : true,
    minimum_purchase: promotion?.minimum_purchase || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      discount_value: parseFloat(formData.discount_value) || 0,
      buy_quantity: parseInt(formData.buy_quantity) || 0,
      get_quantity: parseInt(formData.get_quantity) || 0,
      minimum_purchase: parseFloat(formData.minimum_purchase) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Promotion Name *</Label>
          <Input
            placeholder="e.g., Summer Sale 2024"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Input
            placeholder="Brief description of the promotion"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Promotion Type *</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROMOTION_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value} className="capitalize">
                  <div className="flex items-center gap-2">
                    <t.icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <span className="text-sm">{formData.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        {(formData.type === 'percentage_discount' || formData.type === 'fixed_discount') && (
          <>
            <div>
              <Label>Discount Value *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.discount_value}
                onChange={e => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.type === 'percentage_discount' ? 'Enter percentage (e.g., 20 for 20% off)' : 'Enter amount in KES'}
              </p>
            </div>

            <div>
              <Label>Minimum Purchase (Optional)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={formData.minimum_purchase}
                onChange={e => setFormData(prev => ({ ...prev, minimum_purchase: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum purchase amount to qualify</p>
            </div>
          </>
        )}

        {formData.type === 'buy_x_get_y' && (
          <>
            <div>
              <Label>Buy Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={formData.buy_quantity}
                onChange={e => setFormData(prev => ({ ...prev, buy_quantity: e.target.value }))}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label>Get Free Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={formData.get_quantity}
                onChange={e => setFormData(prev => ({ ...prev, get_quantity: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
          </>
        )}

        <div>
          <Label>Start Date & Time *</Label>
          <Input
            type="datetime-local"
            value={formData.start_date}
            onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label>End Date & Time *</Label>
          <Input
            type="datetime-local"
            value={formData.end_date}
            onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            className="mt-1"
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!formData.name || !formData.start_date || !formData.end_date}>
          {promotion ? 'Save Changes' : 'Create Promotion'}
        </Button>
      </DialogFooter>
    </form>
  );
}