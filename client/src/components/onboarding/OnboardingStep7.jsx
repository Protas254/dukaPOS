import React from 'react';
import { Headphones, User, Building2, AlertCircle, Phone } from 'lucide-react';
import { SectionTitle, Field, Input, NavButtons } from './onboarding-shared';

export default function Step7Contact({ data, set, step, onBack, onNext }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <Headphones className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Who should we contact?</h2>
        </div>
      </div>

      <div className="space-y-6">
        {/* Primary Contact */}
        <div>
          <SectionTitle
            icon={User}
            title="Primary Contact"
            subtitle="The main person we should reach out to."
          />
          <div className="space-y-3">
            <Field label="Contact Person Name" required>
              <Input
                placeholder="e.g. Jane Doe"
                value={data.contactName}
                onChange={e => set('contactName', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={data.contactPhone}
                    onChange={e => set('contactPhone', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  placeholder="jane@business.co.ke"
                  value={data.contactEmail}
                  onChange={e => set('contactEmail', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Role / Title" hint="e.g. Store Manager, Director, Owner.">
              <Input
                placeholder="e.g. Store Manager"
                value={data.contactRole}
                onChange={e => set('contactRole', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Owner / Manager */}
        <div>
          <SectionTitle
            icon={Building2}
            title="Owner / Manager"
            subtitle="The business owner or top manager."
          />
          <div className="space-y-3">
            <Field label="Owner / Manager Name">
              <Input
                placeholder="e.g. John Doe"
                value={data.ownerManagerName}
                onChange={e => set('ownerManagerName', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Manager Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={data.managerPhone}
                    onChange={e => set('managerPhone', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field label="Manager Email">
                <Input
                  type="email"
                  placeholder="manager@business.co.ke"
                  value={data.managerEmail}
                  onChange={e => set('managerEmail', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Emergency & Backup */}
        <div>
          <SectionTitle
            icon={AlertCircle}
            title="Emergency & Backup"
            subtitle="Who to reach in urgent situations."
          />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Emergency Contact Name">
                <Input
                  placeholder="e.g. Mary Doe"
                  value={data.emergencyContactName}
                  onChange={e => set('emergencyContactName', e.target.value)}
                />
              </Field>
              <Field label="Emergency Contact Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={data.emergencyContactPhone}
                    onChange={e => set('emergencyContactPhone', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </Field>
            </div>
            <Field label="Backup Contact Name" hint="Secondary person if primary is unavailable.">
              <Input
                placeholder="e.g. Peter Doe"
                value={data.backupContactName}
                onChange={e => set('backupContactName', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Backup Contact Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={data.backupContactPhone}
                    onChange={e => set('backupContactPhone', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field label="Backup Contact Email">
                <Input
                  type="email"
                  placeholder="backup@business.co.ke"
                  value={data.backupContactEmail}
                  onChange={e => set('backupContactEmail', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Receipters support banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-semibold text-emerald-800 mb-0.5">Need help or want to talk to Receipters?</p>
          <p className="text-xs text-emerald-700">
            Reach the Receipters team directly for support, partnerships, or inquiries.
          </p>
        </div>

      </div>

      <NavButtons
        step={step} onBack={onBack} onNext={onNext}
        nextDisabled={!data.contactName}
      />
    </div>
  );
}
