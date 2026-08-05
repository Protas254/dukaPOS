import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, UserCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invite token found. Please use the link from your email.');
      setLoading(false);
      return;
    }
    api.cashiers.validateInvite(token)
      .then(data => { setInvite(data); setLoading(false); })
      .catch(err => {
        setError(err?.message || 'Invalid or expired invite link.');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.cashiers.acceptInvite({
        token,
        name: form.name,
        password: form.password,
      });
      // Store token and redirect to dashboard
      localStorage.setItem('access_token', res.access);
      localStorage.setItem('refresh_token', res.refresh);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Accept Invitation</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your DukaPOS account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validating your invite…</p>
            </div>
          )}

          {!loading && error && !invite && (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-sm font-medium text-red-600">{error}</p>
              <Link to="/login">
                <Button variant="outline" className="mt-2">Go to Login</Button>
              </Link>
            </div>
          )}

          {!loading && success && (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700">Account created successfully!</p>
              <p className="text-xs text-muted-foreground">Redirecting you to the dashboard…</p>
            </div>
          )}

          {!loading && invite && !success && (
            <>
              {/* Invite info banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">You've been invited to join</p>
                <p className="font-bold text-primary text-base mt-0.5">{invite.tenant_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">as a <span className="font-semibold capitalize">{invite.role}</span></p>
                <p className="text-[11px] text-muted-foreground mt-1">Account email: <span className="font-mono font-medium">{invite.email}</span></p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name" className="text-xs font-semibold">Full Name *</Label>
                  <Input
                    id="invite-name"
                    required
                    placeholder="e.g. Jane Wanjiku"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="invite-pwd" className="text-xs font-semibold">Password *</Label>
                  <div className="relative">
                    <Input
                      id="invite-pwd"
                      required
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="invite-confirm" className="text-xs font-semibold">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="invite-confirm"
                      required
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold bg-primary text-white"
                  disabled={submitting || (form.confirmPassword && form.password !== form.confirmPassword)}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
                  ) : 'Create My Account'}
                </Button>
              </form>

              <p className="text-[11px] text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
