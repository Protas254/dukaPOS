import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';

import { STEPS, StepHeader, StepNav } from '@/components/onboarding/onboarding-shared';
import Step1UserType from '@/components/onboarding/OnboardingStep1';
import Step2BusinessType from '@/components/onboarding/OnboardingStep2';
import Step3Details from '@/components/onboarding/OnboardingStep3';
import Step4BusinessInfo from '@/components/onboarding/OnboardingStep4';
import Step5Branches from '@/components/onboarding/OnboardingStep5';
import Step6BusinessPackage from '@/components/onboarding/OnboardingStep6';
import Step7Contact from '@/components/onboarding/OnboardingStep7';
import Step8Currency from '@/components/onboarding/OnboardingStep8';
import Step9eTIMS from '@/components/onboarding/OnboardingStep9';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    userType: '', businessType: '', posType: '',
    selectedGoods: [], selectedServices: [], addOwnType: 'good', addOwnInput: '',
    businessName: '', ownerName: '', registrationNumber: '',
    tradingName: '', logoFile: null, logoPreview: null,
    businessDescription: '', businessPhone: '', businessEmail: '',
    businessAddress: '', businessWebsite: '', yearEstablished: '',
    employeeRange: '', businessRegNo: '', receiptHeader: '',
    receiptFooter: '', returnPolicy: '', exchangePolicy: '',
    kraPin: '', vatNumber: '', taxRate: '16',
    licenseNo: '', licenseExpiry: '',
    mpesaPaybill: '', mpesaTill: '', mpesaAccountRef: '',
    branches: [], plan: 'starter',
    contactName: '', contactPhone: '', contactEmail: '', contactRole: '',
    ownerManagerName: '', managerPhone: '', managerEmail: '',
    emergencyContactName: '', emergencyContactPhone: '',
    backupContactName: '', backupContactPhone: '', backupContactEmail: '',
    currency: 'KES', etimsEnabled: false, vatRegistered: false,
  });

  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const next = () => setStep(s => Math.min(s + 1, 9));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload = {
        business_name: data.businessName, trading_name: data.tradingName,
        business_address: data.businessAddress,
        business_phone: data.businessPhone || data.contactPhone,
        business_email: data.businessEmail || data.contactEmail,
        business_website: data.businessWebsite, year_established: data.yearEstablished,
        employee_range: data.employeeRange, registration_number: data.registrationNumber || data.businessRegNo,
        kra_pin: data.kraPin, vat_number: data.vatNumber,
        currency: data.currency, default_tax_rate: parseFloat(data.taxRate) || 16,
        receipt_header: data.receiptHeader, receipt_footer: data.receiptFooter,
        return_policy: data.returnPolicy, exchange_policy: data.exchangePolicy,
        mpesa_paybill: data.mpesaPaybill, mpesa_till: data.mpesaTill, mpesa_account_ref: data.mpesaAccountRef,
        license_no: data.licenseNo, license_expiry: data.licenseExpiry,
        user_type: data.userType, business_type: data.businessType, pos_type: data.posType,
        selected_goods: data.selectedGoods, selected_services: data.selectedServices,
        plan: data.plan, branches: data.branches,
        etims_enabled: data.etimsEnabled, vat_registered: data.vatRegistered,
        contact: {
          name: data.contactName, phone: data.contactPhone,
          email: data.contactEmail, role: data.contactRole,
        },
        initial_products: [],
      };
      await api.tenants.onboard(payload);
      toast.success('🎉 Business set up complete! Welcome to your DukaPOS Dashboard.');
      window.location.href = '/';
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <StepHeader />
        <StepNav current={step} />

        {step === 1 && <Step1UserType data={data} set={set} step={step} onBack={back} onNext={next} />}
        {step === 2 && <Step2BusinessType data={data} set={set} step={step} onBack={back} onNext={next} />}
        {step === 3 && <Step3Details data={data} set={set} step={step} onBack={back} onNext={next} />}
        {step === 4 && <Step4BusinessInfo data={data} set={set} step={step} onBack={back} onNext={next} />}
        {step === 5 && <Step5Branches data={data} set={set} step={step} onBack={back} onNext={next} />}
        {step === 6 && <Step6BusinessPackage data={data} set={set} step={step} onBack={back} onNext={next} />}
        {step === 7 && <Step7Contact data={data} set={set} step={step} onBack={back} onNext={next} />}
        {step === 8 && <Step8Currency data={data} set={set} step={step} onBack={back} onNext={next} />}
        {step === 9 && <Step9eTIMS data={data} set={set} step={step} onBack={back} onNext={handleFinish} loading={loading} />}

        <div className="flex justify-center gap-1.5 mt-6">
          {STEPS.map(s => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                s.id === step ? 'w-6 bg-emerald-500' : s.id < step ? 'w-3 bg-emerald-300' : 'w-3 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}