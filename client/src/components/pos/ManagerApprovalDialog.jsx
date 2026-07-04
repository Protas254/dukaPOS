import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ManagerApprovalDialog({ open, onClose, onApprove, actionType, amount, cart }) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [managerAuth, setManagerAuth] = useState({ email: '', password: '' });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleApprove = async () => {
    if (!reason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a reason for this action', variant: 'destructive' });
      return;
    }

    setIsAuthenticating(true);
    try {
      // Try to authenticate as manager
      await api.auth.loginViaEmailPassword(managerAuth.email, managerAuth.password);
      const user = await api.auth.me();
      
      if (user.role !== 'admin') {
        await api.auth.logout();
        toast({ title: 'Access denied', description: 'Manager access required', variant: 'destructive' });
        setIsAuthenticating(false);
        return;
      }

      // Success - approve the action
      onApprove({ reason, approvedBy: user });
      await api.auth.logout();
      onClose();
    } catch (err) {
      toast({ title: 'Authentication failed', description: 'Invalid manager credentials', variant: 'destructive' });
      setIsAuthenticating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Manager Approval Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {actionType === 'discount' && `Discount of KES ${amount} requires approval`}
                {actionType === 'void' && 'Voiding transaction requires approval'}
                {actionType === 'refund' && 'Processing refund requires approval'}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Cart total: KES {cart?.reduce((sum, i) => sum + i.price * i.quantity, 0)}
              </p>
            </div>
          </div>

          <div>
            <Label>Manager Email</Label>
            <Input
              type="email"
              value={managerAuth.email}
              onChange={(e) => setManagerAuth({ ...managerAuth, email: e.target.value })}
              placeholder="manager@store.com"
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={managerAuth.password}
              onChange={(e) => setManagerAuth({ ...managerAuth, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label>Reason for Approval *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action is needed..."
              className="h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAuthenticating}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isAuthenticating || !reason.trim()}>
            {isAuthenticating ? 'Verifying...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}