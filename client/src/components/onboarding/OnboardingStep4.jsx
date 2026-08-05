import React, { useRef } from 'react';
import {
  Building2, Upload, Phone, Mail, MapPin, Globe, Briefcase,
  Receipt, FileCheck, CreditCard
} from 'lucide-react';
import {
  YEAR_OPTIONS, EMPLOYEE_RANGES, SectionTitle, Field, Input,
  Textarea, Select, NavButtons
} from './onboarding-shared';

export default function Step4BusinessInfo({ data, set, step, onBack, onNext }) {
  const logoRef = useRef(null);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('logoFile', file);
    const reader = new FileReader();
    reader.onload = ev => set('logoPreview', ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Complete your business profile.</h2>
          <p className="text-xs text-slate-500">Fill in your business details to get started.</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Business Identity ── */}
        <div>
          <SectionTitle icon={Building2} title="Business Identity" />
          <div className="space-y-4">
            <Field label="Business Name" required>
              <Input
                placeholder="e.g. Naivas Supermarket"
                value={data.businessName}
                onChange={e => set('businessName', e.target.value)}
              />
            </Field>
            <Field label="Trading Name" hint="Public-facing name if different (optional).">
              <Input
                placeholder="e.g. Naivas Express"
                value={data.tradingName}
                onChange={e => set('tradingName', e.target.value)}
              />
            </Field>

            {/* Logo Upload */}
            <Field label="Business Logo" hint="Upload your logo (PNG/JPG).">
              <div
                onClick={() => logoRef.current?.click()}
                className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
              >
                {data.logoPreview ? (
                  <img src={data.logoPreview} alt="Logo preview" className="w-14 h-14 rounded-lg object-contain border border-slate-200" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                    {data.logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </p>
                  <p className="text-xs text-slate-400">PNG or JPG, max 2 MB</p>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </Field>

            <Field label="Business Description" hint="Briefly describe what your business does, products sold, and target customers.">
              <Textarea
                placeholder="e.g. We are a retail supermarket stocking groceries, household items, and fresh produce for families in Nairobi."
                value={data.businessDescription}
                onChange={e => set('businessDescription', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── Contact & Location ── */}
        <div>
          <SectionTitle icon={Phone} title="Contact & Location" />
          <div className="space-y-4">
            <Field label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="tel"
                  placeholder="+254 712 345 678"
                  value={data.businessPhone}
                  onChange={e => set('businessPhone', e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="info@business.co.ke"
                  value={data.businessEmail}
                  onChange={e => set('businessEmail', e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Address">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Moi Avenue, Nairobi"
                  value={data.businessAddress}
                  onChange={e => set('businessAddress', e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Website">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="https://business.co.ke"
                  value={data.businessWebsite}
                  onChange={e => set('businessWebsite', e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* ── Operations ── */}
        <div>
          <SectionTitle icon={Briefcase} title="Operations" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year Established">
                <Select value={data.yearEstablished} onChange={e => set('yearEstablished', e.target.value)}>
                  <option value="">Select year</option>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>
              <Field label="Number of Employees" hint="Approximate headcount across all locations.">
                <Select value={data.employeeRange} onChange={e => set('employeeRange', e.target.value)}>
                  <option value="">Select range</option>
                  {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Business Registration No." hint="Company / business registration number (optional).">
              <Input
                placeholder="e.g. CPR/2015/123456"
                value={data.registrationNumber}
                onChange={e => set('registrationNumber', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── Store Policies & Branding ── */}
        <div>
          <SectionTitle icon={Receipt} title="Store Policies & Branding" />
          <div className="space-y-4">
            <Field label="Receipt Header" hint="Tagline / slogan printed at the top of receipts.">
              <Input
                placeholder="e.g. Quality Products, Fair Prices"
                value={data.receiptHeader}
                onChange={e => set('receiptHeader', e.target.value)}
              />
            </Field>
            <Field label="Receipt Footer" hint="Message printed at the bottom of receipts.">
              <Input
                placeholder="e.g. Thank you for shopping with us!"
                value={data.receiptFooter}
                onChange={e => set('receiptFooter', e.target.value)}
              />
            </Field>
            <Field label="Return Policy">
              <Textarea
                placeholder="e.g. Returns accepted within 7 days with receipt."
                value={data.returnPolicy}
                onChange={e => set('returnPolicy', e.target.value)}
              />
            </Field>
            <Field label="Exchange Policy">
              <Textarea
                placeholder="e.g. Exchanges allowed within 14 days."
                value={data.exchangePolicy}
                onChange={e => set('exchangePolicy', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── Compliance & Tax ── */}
        <div>
          <SectionTitle icon={FileCheck} title="Compliance & Tax" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="KRA PIN">
                <Input
                  placeholder="e.g. P051234567A"
                  value={data.kraPin}
                  onChange={e => set('kraPin', e.target.value.toUpperCase())}
                  className="font-mono tracking-wider"
                />
              </Field>
              <Field label="VAT Number">
                <Input
                  placeholder="e.g. VAT-123-456"
                  value={data.vatNumber}
                  onChange={e => set('vatNumber', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Default Tax Rate (%)" hint="Standard Kenya VAT is 16%.">
              <Input
                type="number" min="0" max="100" step="0.5"
                value={data.taxRate}
                onChange={e => set('taxRate', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Business License No." hint="Trade / operating license number (optional).">
                <Input
                  placeholder="e.g. NCC/TL/2024/01234"
                  value={data.licenseNo}
                  onChange={e => set('licenseNo', e.target.value)}
                />
              </Field>
              <Field label="License Expiry" hint="When your license expires (optional).">
                <Input
                  type="date"
                  value={data.licenseExpiry}
                  onChange={e => set('licenseExpiry', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Payments (M-Pesa) ── */}
        <div>
          <SectionTitle icon={CreditCard} title="Payments (M-Pesa)" />
          <div className="space-y-4">
            <Field label="M-Pesa Paybill" hint="Your Paybill number (optional).">
              <Input
                placeholder="e.g. 174379"
                value={data.mpesaPaybill}
                onChange={e => set('mpesaPaybill', e.target.value)}
              />
            </Field>
            <Field label="M-Pesa Till Number" hint="Buy Goods Till number (optional).">
              <Input
                placeholder="e.g. 9876543"
                value={data.mpesaTill}
                onChange={e => set('mpesaTill', e.target.value)}
              />
            </Field>
            <Field label="M-Pesa Account Reference" hint="Account name to use with Paybill.">
              <Input
                placeholder="e.g. Business name"
                value={data.mpesaAccountRef}
                onChange={e => set('mpesaAccountRef', e.target.value)}
              />
            </Field>
          </div>
        </div>

      </div>

      <NavButtons step={step} onBack={onBack} onNext={onNext} nextDisabled={!data.businessName} />
    </div>
  );
}
