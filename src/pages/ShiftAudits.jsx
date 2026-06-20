import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Filter, Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ShiftAuditTrail from '@/components/shifts/ShiftAuditTrail';
import { toast } from 'sonner';

export default function ShiftAudits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: audits, isLoading } = useQuery({
    queryKey: ['shiftAudits'],
    queryFn: () => base44.entities.ShiftAudit.list('-created_at'),
  });

  const approveMutation = useMutation({
    mutationFn: (auditId) => base44.functions.invoke('shiftAudit', { action: 'approve', auditId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftAudits'] });
      toast.success('Audit record approved');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (auditId) => base44.functions.invoke('shiftAudit', { action: 'reject', auditId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftAudits'] });
      toast.success('Audit record rejected');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject');
    },
  });

  const handleApprove = (auditId) => {
    approveMutation.mutate(auditId);
  };

  const handleReject = (auditId) => {
    rejectMutation.mutate(auditId);
  };

  const filteredAudits = audits?.filter(audit => {
    const matchesSearch = !searchTerm || 
      audit.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || audit.approval_status === filterStatus;
    const matchesType = filterType === 'all' || audit.audit_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const stats = {
    total: audits?.length || 0,
    pending: audits?.filter(a => a.approval_status === 'pending').length || 0,
    approved: audits?.filter(a => a.approval_status === 'approved').length || 0,
    rejected: audits?.filter(a => a.approval_status === 'rejected').length || 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Shift Audit Trail</h1>
            <p className="text-sm text-muted-foreground">Review and approve cash discrepancies & adjustments</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-600/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700">Approved</p>
                <p className="text-2xl font-bold text-emerald-900">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-700">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by cashier name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cash_discrepancy">Cash Discrepancy</SelectItem>
                  <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                  <SelectItem value="refund_override">Refund Override</SelectItem>
                  <SelectItem value="discount_override">Discount Override</SelectItem>
                  <SelectItem value="void_transaction">Void Transaction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Loading audit records...</p>
          </div>
        </div>
      ) : (
        <ShiftAuditTrail
          audits={filteredAudits}
          onApprove={handleApprove}
          onReject={handleReject}
          showActions={true}
        />
      )}
    </div>
  );
}