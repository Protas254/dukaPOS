import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Store, Receipt, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    business_name: '',
    business_phone: '',
    business_email: '',
    business_address: '',
    kra_pin: '',
    default_tax_rate: 16,
    currency: 'KES',
    receipt_footer: 'Thank you for shopping with us!',
  });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => base44.entities.BusinessSettings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setForm({
        business_name: s.business_name || '',
        business_phone: s.business_phone || '',
        business_email: s.business_email || '',
        business_address: s.business_address || '',
        kra_pin: s.kra_pin || '',
        default_tax_rate: s.default_tax_rate || 16,
        currency: s.currency || 'KES',
        receipt_footer: s.receipt_footer || 'Thank you for shopping with us!',
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, default_tax_rate: parseFloat(data.default_tax_rate) || 16 };
      if (settings.length > 0) {
        return base44.entities.BusinessSettings.update(settings[0].id, payload);
      }
      return base44.entities.BusinessSettings.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast({ title: 'Settings saved successfully' });
    },
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configure your business and POS</p>
      </div>

      {/* Business Info */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Business Information</CardTitle>
              <CardDescription className="text-xs">Your store details that appear on receipts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Business Name *</Label>
              <Input
                value={form.business_name}
                onChange={e => handleChange('business_name', e.target.value)}
                placeholder="e.g. Naivas Supermarket"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input
                value={form.business_phone}
                onChange={e => handleChange('business_phone', e.target.value)}
                placeholder="+254 712 345 678"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={form.business_email}
                onChange={e => handleChange('business_email', e.target.value)}
                placeholder="info@business.co.ke"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input
                value={form.business_address}
                onChange={e => handleChange('business_address', e.target.value)}
                placeholder="Moi Avenue, Nairobi"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Compliance */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Tax & Compliance</CardTitle>
              <CardDescription className="text-xs">KRA and VAT configuration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">KRA PIN</Label>
              <Input
                value={form.kra_pin}
                onChange={e => handleChange('kra_pin', e.target.value)}
                placeholder="P051234567A"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Default VAT Rate (%)</Label>
              <Input
                type="number"
                value={form.default_tax_rate}
                onChange={e => handleChange('default_tax_rate', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Input
                value={form.currency}
                onChange={e => handleChange('currency', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Receipt Customization</CardTitle>
              <CardDescription className="text-xs">Customize what appears on printed receipts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Receipt Footer Message</Label>
            <Textarea
              value={form.receipt_footer}
              onChange={e => handleChange('receipt_footer', e.target.value)}
              placeholder="Thank you for shopping with us!"
              className="mt-1 h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={() => saveMutation.mutate(form)}
        disabled={!form.business_name || saveMutation.isPending}
        className="rounded-xl shadow-lg shadow-primary/20"
      >
        {saveMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Save Settings
      </Button>
    </div>
  );
}