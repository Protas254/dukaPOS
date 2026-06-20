import React from 'react';
import { FileText, AlertCircle, CheckCircle, XCircle, Clock, DollarSign, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const AUDIT_TYPE_LABELS = {
  cash_discrepancy: { label: 'Cash Discrepancy', icon: '💰' },
  manual_adjustment: { label: 'Manual Adjustment', icon: '✏️' },
  refund_override: { label: 'Refund Override', icon: '↩️' },
  discount_override: { label: 'Discount Override', icon: '🏷️' },
  void_transaction: { label: 'Void Transaction', icon: '❌' },
};

const CATEGORY_COLORS = {
  cash_shortage: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cash_overage: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  manager_approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  system_error: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  customer_issue: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const APPROVAL_STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
};

export default function ShiftAuditTrail({ audits = [], onApprove, onReject, showActions = false }) {
  if (audits.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No audit records</p>
          <p className="text-xs text-muted-foreground mt-1">All shifts completed without discrepancies</p>
        </CardContent>
      </Card>
    );
  }

  const totalDiscrepancy = audits
    .filter(a => a.audit_type === 'cash_discrepancy')
    .reduce((sum, a) => {
      const diff = (a.actual_amount || 0) - (a.expected_amount || 0);
      return sum + diff;
    }, 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertCircle className="w-4 h-4" />
            Audit Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 mb-1">Total Records</p>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{audits.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 mb-1">Pending Approval</p>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                {audits.filter(a => a.approval_status === 'pending').length}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 mb-1">Net Discrepancy</p>
              <p className={`text-lg font-bold ${totalDiscrepancy >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalDiscrepancy >= 0 ? '+' : ''}KES {totalDiscrepancy.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Records List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {audits.map((audit, index) => {
            const typeInfo = AUDIT_TYPE_LABELS[audit.audit_type] || { label: audit.audit_type, icon: '📝' };
            const statusConfig = APPROVAL_STATUS_CONFIG[audit.approval_status] || APPROVAL_STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={audit.id || index} className="relative">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{typeInfo.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold">{typeInfo.label}</h4>
                          <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[audit.category]}`}>
                            {audit.category?.replace('_', ' ')}
                          </Badge>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {audit.cashier_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            KES {audit.amount?.toLocaleString() || '0'}
                          </span>
                          <span>
                            {audit.created_at ? new Date(audit.created_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">Reason:</p>
                    <p className="text-muted-foreground">{audit.reason}</p>
                    {audit.notes && (
                      <>
                        <p className="font-medium mt-2 mb-1">Notes:</p>
                        <p className="text-muted-foreground">{audit.notes}</p>
                      </>
                    )}
                    {audit.audit_type === 'cash_discrepancy' && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Expected</p>
                          <p className="font-semibold">KES {audit.expected_amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Actual</p>
                          <p className="font-semibold">KES {audit.actual_amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Difference</p>
                          <p className={`font-semibold ${(audit.actual_amount - audit.expected_amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {(audit.actual_amount - audit.expected_amount) >= 0 ? '+' : ''}KES {(audit.actual_amount - audit.expected_amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Approval Actions */}
                  {showActions && audit.approval_status === 'pending' && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1"
                        onClick={() => onApprove(audit.id)}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 gap-1"
                        onClick={() => onReject(audit.id)}
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Approved By */}
                  {audit.approval_status === 'approved' && audit.approved_by_name && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>Approved by <strong>{audit.approved_by_name}</strong></span>
                      {audit.approved_at && (
                        <span>• {new Date(audit.approved_at).toLocaleString()}</span>
                      )}
                    </div>
                  )}

                  {audit.approval_status === 'rejected' && audit.approved_by_name && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                      <XCircle className="w-3 h-3" />
                      <span>Rejected by <strong>{audit.approved_by_name}</strong></span>
                      {audit.approved_at && (
                        <span>• {new Date(audit.approved_at).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}