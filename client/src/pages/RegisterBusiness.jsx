import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, ArrowRight, ShieldCheck, Check, Sparkles, Building2, User, Mail, Phone, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter / Free',
    price: 'KES 0 / mo',
    desc: 'Perfect for small shops & single stores',
    features: ['1 Store Location', '2 Cashier Accounts', 'POS Terminal & Receipts', 'Basic Inventory Management']
  },
  {
    id: 'pro',
    name: 'Pro Growth',
    price: 'KES 2,500 / mo',
    desc: 'For growing retail stores & supermarkets',
    features: ['3 Store Locations', 'Unlimited Cashiers', 'Receipters Engine AI Analytics', 'Vault Hub Document Storage (10GB)', 'KRA eTIMS ESD Sync'],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom Pricing',
    desc: 'For multi-branch retail chains & franchises',
    features: ['Unlimited Locations', 'Custom Domain Integration', 'Dedicated Account Manager', 'Priority 24/7 Support']
  }
];

const BUSINESS_TYPES = [
  { value: 'sme', label: 'General Retail / Duka' },
  { value: 'supermarket', label: 'Supermarket / Grocery' },
  { value: 'pharmacy', label: 'Pharmacy / Chemist' },
  { value: 'hardware', label: 'Hardware & Construction' },
  { value: 'electronics', label: 'Electronics & Mobile' },
  { value: 'boutique', label: 'Fashion & Boutique' },
  { value: 'restaurant', label: 'Restaurant & Bakery' },
];

export default function RegisterBusiness() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'sme',
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    plan: 'pro'
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business_name || !formData.email || !formData.password || !formData.owner_name) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register-tenant/', formData);
      if (res && res.token) {
        api.auth.setToken(res.token);
        toast.success(`Welcome! ${formData.business_name} has been registered successfully!`);
        window.location.href = '/onboarding';
      } else {
        toast.error(res?.error || 'Failed to register business.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <Store className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
          Host Your Business on Receipters
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Create your isolated business workspace in less than 2 minutes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <Card className="border-slate-200 shadow-xl bg-white">
          <CardHeader className="bg-slate-900 text-white rounded-t-xl py-6">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> Register Business Workspace
            </CardTitle>
            <CardDescription className="text-slate-300">
              No technical setup or credit card required to start.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Store Name *
                </label>
                <div className="relative">
                  <Store className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    required
                    placeholder="e.g. QuickMart Supermarket or Mama Mboga Store"
                    className="pl-10 h-11 border-slate-200"
                    value={formData.business_name}
                    onChange={e => handleChange('business_name', e.target.value)}
                  />
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Category
                </label>
                <select
                  className="w-full h-11 rounded-md border border-slate-200 px-3 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.business_type}
                  onChange={e => handleChange('business_type', e.target.value)}
                >
                  {BUSINESS_TYPES.map(bt => (
                    <option key={bt.value} value={bt.value}>{bt.label}</option>
                  ))}
                </select>
              </div>

              {/* Owner Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Owner Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <Input
                      required
                      placeholder="James Mwangi"
                      className="pl-9 h-11 border-slate-200"
                      value={formData.owner_name}
                      onChange={e => handleChange('owner_name', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <Input
                      placeholder="+254 712 345678"
                      className="pl-9 h-11 border-slate-200"
                      value={formData.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address (Login) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <Input
                      required
                      type="email"
                      placeholder="owner@business.com"
                      className="pl-9 h-11 border-slate-200"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Account Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 h-11 border-slate-200"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Business Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLANS.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleChange('plan', p.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all relative ${
                        formData.plan === p.id 
                          ? 'border-blue-600 bg-blue-50/60 shadow-sm' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-2.5 right-2 bg-blue-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                      <p className="font-extrabold text-blue-600 text-sm mt-1">{p.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-base rounded-xl shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <span>Registering Workspace...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create My Business Account <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Already have a business on Receipters?{' '}
                <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
                  Log In Here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
