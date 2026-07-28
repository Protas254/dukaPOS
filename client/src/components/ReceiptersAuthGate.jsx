import React, { useState } from 'react';
import { Lock, Cpu, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReceiptersLogo from '@/components/ReceiptersLogo';

export default function ReceiptersAuthGate({ children, featureName = "Receipters Engine" }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'Protas@01') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Access denied.');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 bg-slate-50/50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center bg-[#fef2f2] border-b border-[#fee2e2]">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <ReceiptersLogo className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-[#1e3a8a] mb-1">Restricted Access</h2>
          <p className="text-sm text-slate-600">
            Please enter your authorization code to access the <span className="font-semibold">{featureName}</span>.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="auth-password">Authorization Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            Unlock {featureName}
          </Button>
        </form>
      </div>
    </div>
  );
}
