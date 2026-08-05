import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';

export default function AddCashierModal({ open, onOpenChange, onSubmit, isPending, branches }) {
  const [cashierForm, setCashierForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'cashier',
    branch_id: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(cashierForm, () => {
      setCashierForm({ name: '', email: '', password: '', confirmPassword: '', role: 'cashier', branch_id: '' });
      setShowPwd(false);
      setShowConfirmPwd(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-1">
      <div>
        <label className="text-xs font-semibold text-foreground mb-1 block">Full Name *</label>
        <Input
          required
          placeholder="e.g. Gordon Odera"
          value={cashierForm.name}
          onChange={e => setCashierForm({ ...cashierForm, name: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground mb-1 block">Email Address *</label>
        <Input
          required type="email"
          placeholder="gordon@dukasmart.com"
          value={cashierForm.email}
          onChange={e => setCashierForm({ ...cashierForm, email: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Password / PIN *</label>
          <div className="relative">
            <Input
              required
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              value={cashierForm.password}
              onChange={e => setCashierForm({ ...cashierForm, password: e.target.value })}
              className="pr-9"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPwd ? 'Hide' : 'Show'}>
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Role</label>
          <select
            value={cashierForm.role}
            onChange={e => setCashierForm({ ...cashierForm, role: e.target.value })}
            className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md"
          >
            <option value="cashier">Cashier</option>
            <option value="manager">Store Manager</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground mb-1 block">Confirm Password *</label>
        <div className="relative">
          <Input
            required
            type={showConfirmPwd ? 'text' : 'password'}
            placeholder="Repeat password"
            value={cashierForm.confirmPassword}
            onChange={e => setCashierForm({ ...cashierForm, confirmPassword: e.target.value })}
            className="pr-9"
          />
          <button type="button" tabIndex={-1} onClick={() => setShowConfirmPwd(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPwd ? 'Hide' : 'Show'}>
            {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {cashierForm.confirmPassword && cashierForm.password !== cashierForm.confirmPassword && (
          <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Set a temporary password. The cashier can reset it via{' '}
        <a href="/forgot-password" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Forgot Password</a>.
      </p>
      {branches.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Assigned Branch</label>
          <select
            value={cashierForm.branch_id}
            onChange={e => setCashierForm({ ...cashierForm, branch_id: e.target.value })}
            className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md"
          >
            <option value="">All / Primary Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>
        </div>
      )}
      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button
          type="submit"
          disabled={isPending || (cashierForm.confirmPassword && cashierForm.password !== cashierForm.confirmPassword)}
          className="bg-primary text-white"
        >
          {isPending ? 'Saving...' : 'Add Cashier'}
        </Button>
      </DialogFooter>
    </form>
  );
}
