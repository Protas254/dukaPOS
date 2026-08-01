import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';
import {
  User, Store, FileText, Building2, GitBranch, Package,
  Phone, DollarSign, Shield, ChevronRight, ChevronLeft,
  Check, Loader2, ShoppingBag, Briefcase, Users, Globe,
  MapPin, Mail, Upload, Plus, Trash2, AlertCircle,
  Receipt, CreditCard, FileCheck, Info, Tag, Headphones,
  UtensilsCrossed, Wine, Coffee, Cake, Scissors, Cpu,
  Hammer, Leaf, Shirt, Hotel, X, Zap
} from 'lucide-react';

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, key: 'userType',        label: 'User Type' },
  { id: 2, key: 'businessType',    label: 'Business Type' },
  { id: 3, key: 'details',         label: 'Details' },
  { id: 4, key: 'businessInfo',    label: 'Business Info' },
  { id: 5, key: 'branches',        label: 'Branches' },
  { id: 6, key: 'businessPackage', label: 'Business Package' },
  { id: 7, key: 'contact',         label: 'Contact' },
  { id: 8, key: 'currency',        label: 'Currency' },
  { id: 9, key: 'etims',           label: 'eTIMS Setup' },
];

const USER_TYPES = [
  { id: 'individual', icon: User,       title: 'Individual & Informal Sector', desc: 'Solo trader, freelancer, or sole proprietor.' },
  { id: 'sme',        icon: Store,      title: 'SME & Informal Sector',        desc: 'Small & medium enterprise with a few staff and products.' },
  { id: 'merchant',   icon: ShoppingBag,title: 'Merchants',                    desc: 'Retailers, shops, restaurants with multiple products and locations.' },
  { id: 'enterprise', icon: Building2,  title: 'Enterprise',                   desc: 'Large organisations with multiple branches and teams.' },
];

const BUSINESS_TYPES = [
  { id: 'retail',       icon: ShoppingBag,      label: 'Retail / Supermarket',      desc: 'General retail & grocery stores' },
  { id: 'restaurant',  icon: UtensilsCrossed,   label: 'Restaurant',                desc: 'Food & beverage dining' },
  { id: 'bar',         icon: Wine,              label: 'Bar / Club / Lounge',       desc: 'Nightlife & entertainment' },
  { id: 'cafe',        icon: Coffee,            label: 'Café / Coffee Shop',        desc: 'Coffee, tea & light bites' },
  { id: 'bakery',      icon: Cake,              label: 'Bakery / Confectionery',    desc: 'Baked goods & sweets' },
  { id: 'butchery',    icon: Briefcase,         label: 'Butchery',                  desc: 'Fresh & frozen meat' },
  { id: 'pharmacy',    icon: Shield,            label: 'Pharmacy / Chemist',        desc: 'Medicines & health products' },
  { id: 'hardware',    icon: Hammer,            label: 'Hardware / Construction',   desc: 'Building materials & tools' },
  { id: 'agrovet',     icon: Leaf,              label: 'Agrovet / Farm Supply',     desc: 'Farm inputs & feeds' },
  { id: 'fashion',     icon: Shirt,             label: 'Fashion / Boutique',        desc: 'Apparel & accessories' },
  { id: 'electronics', icon: Cpu,               label: 'Electronics / Gadgets',     desc: 'Phones, devices & accessories' },
  { id: 'hotel',       icon: Hotel,             label: 'Hotel / Hospitality',       desc: 'Lodging & accommodation' },
  { id: 'salon',       icon: Scissors,          label: 'Salon / Barber',            desc: 'Hair & grooming services' },
  { id: 'spa',         icon: Zap,               label: 'Spa / Wellness',            desc: 'Relaxation & beauty treatments' },
  { id: 'wholesale',   icon: Package,           label: 'Wholesale / Distribution',  desc: 'Bulk goods & supply chain' },
  { id: 'liquor',      icon: Wine,              label: 'Liquor Store',              desc: 'Wines, spirits & beverages' },
  { id: 'other',       icon: Briefcase,         label: 'Other',                     desc: 'Any other business type' },
];

// Goods & Services suggestions keyed by business type
const GOODS_SUGGESTIONS = {
  retail:      ['Groceries', 'Beverages', 'Household Items', 'Snacks', 'Cleaning Products'],
  restaurant:  ['Meals', 'Drinks', 'Desserts', 'Takeaway Packs', 'Sauces'],
  bar:         ['Beer', 'Wines', 'Spirits', 'Cocktails', 'Snacks'],
  cafe:        ['Coffee', 'Tea', 'Pastries', 'Smoothies', 'Sandwiches'],
  bakery:      ['Bread', 'Cakes', 'Pastries', 'Cookies', 'Pies'],
  butchery:    ['Beef', 'Chicken', 'Pork', 'Fish', 'Sausages'],
  pharmacy:    ['Medicines', 'Vitamins', 'First Aid', 'Beauty Products', 'Medical Devices'],
  hardware:    ['Cement', 'Timber', 'Tools', 'Paints', 'Pipes'],
  agrovet:     ['Seeds', 'Fertiliser', 'Pesticides', 'Animal Feeds', 'Equipment'],
  fashion:     ['Clothing', 'Shoes', 'Accessories', 'Bags', 'Jewellery'],
  electronics: ['Phones', 'Laptops', 'Accessories', 'TVs', 'Appliances'],
  hotel:       ['Room Bookings', 'Meals', 'Beverages', 'Laundry', 'Spa'],
  salon:       ['Hair Products', 'Shampoo', 'Conditioner', 'Styling Products'],
  spa:         ['Essential Oils', 'Lotions', 'Scrubs', 'Candles'],
  wholesale:   ['Bulk Goods', 'Cartons', 'Pallets', 'Raw Materials'],
  liquor:      ['Beer', 'Wine', 'Spirits', 'Cider', 'RTD Drinks'],
  other:       ['Products', 'Items', 'Goods'],
};

const SERVICES_SUGGESTIONS = {
  retail:      ['Delivery', 'Loyalty Programme', 'Gift Wrapping'],
  restaurant:  ['Dine-in', 'Takeaway', 'Delivery', 'Catering', 'Table Reservations'],
  bar:         ['Table Service', 'Events', 'Live Music', 'VIP Bookings'],
  cafe:        ['Dine-in', 'Takeaway', 'Delivery', 'Catering'],
  bakery:      ['Custom Orders', 'Delivery', 'Catering', 'Subscriptions'],
  butchery:    ['Cutting & Packing', 'Delivery', 'Marinating'],
  pharmacy:    ['Prescription Filling', 'Delivery', 'Consultation'],
  hardware:    ['Delivery', 'Installation', 'Consulting'],
  agrovet:     ['Delivery', 'Vet Services', 'Farm Consulting'],
  fashion:     ['Alterations', 'Delivery', 'Styling Consultation'],
  electronics: ['Repair', 'Installation', 'Delivery', 'Warranty Service'],
  hotel:       ['Check-in / Check-out', 'Room Service', 'Airport Transfer', 'Conference Rooms'],
  salon:       ['Haircut', 'Colouring', 'Braiding', 'Shaving', 'Facial'],
  spa:         ['Massage', 'Facial', 'Manicure', 'Pedicure', 'Body Wraps'],
  wholesale:   ['Bulk Delivery', 'Invoicing', 'Credit Terms'],
  liquor:      ['Delivery', 'Gift Wrapping', 'Events'],
  other:       ['Consultation', 'Delivery', 'Support'],
};

const POS_TYPES = [
  { value: 'cashier',      label: 'Cashier / Counter POS' },
  { value: 'mobile',       label: 'Mobile POS (Tablet / Phone)' },
  { value: 'self_service', label: 'Self-Service Kiosk' },
  { value: 'table',        label: 'Table-Service POS (Restaurant)' },
  { value: 'online',       label: 'Online / E-commerce' },
  { value: 'hybrid',       label: 'Hybrid (In-store + Online)' },
];

const CURRENCIES = [
  { code: 'KES', label: 'Kenyan Shilling',     flag: '🇰🇪' },
  { code: 'UGX', label: 'Ugandan Shilling',    flag: '🇺🇬' },
  { code: 'TZS', label: 'Tanzanian Shilling',  flag: '🇹🇿' },
  { code: 'ZMW', label: 'Zambian Kwacha',      flag: '🇿🇲' },
  { code: 'ZWL', label: 'Zimbabwean Dollar',   flag: '🇿🇼' },
  { code: 'USD', label: 'US Dollar',           flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro',                flag: '🇪🇺' },
  { code: 'GBP', label: 'British Pound',       flag: '🇬🇧' },
];

const PACKAGES = [
  {
    id: 'starter', name: 'Starter', price: 'Free', color: 'border-slate-200', badge: '',
    features: ['1 Branch', 'Up to 3 Staff', '500 Products', 'Basic Reports'],
  },
  {
    id: 'pro', name: 'Pro', price: 'KES 2,999/mo', color: 'border-blue-500', badge: 'Most Popular',
    features: ['3 Branches', 'Unlimited Staff', '5,000 Products', 'Advanced Reports', 'eTIMS Integration'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'Custom', color: 'border-purple-500', badge: 'Best Value',
    features: ['Unlimited Branches', 'Unlimited Staff', 'Unlimited Products', 'Priority Support', 'Custom Integrations'],
  },
];

const YEAR_OPTIONS = (() => {
  const yrs = [];
  for (let y = new Date().getFullYear(); y >= 1950; y--) yrs.push(y);
  return yrs;
})();

const EMPLOYEE_RANGES = ['1–5', '6–15', '16–50', '51–100', '101–500', '500+'];

// ─── Reusable sub-components ─────────────────────────────────────────────────
function StepHeader() {
  return (
    <div className="mb-8 text-center">
      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        <ShoppingBag className="w-6 h-6 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Merchant Onboarding</h1>
      <p className="text-sm text-slate-500 mt-1">Set up your store profile, tax configuration, and compliance settings.</p>
    </div>
  );
}

function StepNav({ current }) {
  return (
    <div className="w-full overflow-x-auto mb-8">
      <div className="flex items-center min-w-max mx-auto gap-1 border border-slate-200 rounded-xl p-1 bg-white shadow-sm">
        {STEPS.map((s) => {
          const done   = s.id < current;
          const active = s.id === current;
          return (
            <div
              key={s.id}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[72px] ${
                active ? 'bg-emerald-500 text-white shadow' :
                done   ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-xs font-bold border-2 ${
                active ? 'bg-white/20 border-white/30 text-white' :
                done   ? 'bg-emerald-100 border-emerald-300 text-emerald-600' :
                         'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[10px] font-semibold leading-tight text-center">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavButtons({ step, onBack, onNext, nextLabel = 'Continue', loading = false, nextDisabled = false }) {
  return (
    <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
      {step > 1 ? (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      ) : <div />}
      <button
        onClick={onNext}
        disabled={loading || nextDisabled}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>{nextLabel} <ChevronRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

function SelectionCard({ selected, onSelect, id, icon: Icon, title, desc }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        selected === id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          selected === id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
        }`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{title}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>}
        </div>
        {selected === id && (
          <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none ${className}`}
    />
  );
}

function Select({ className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full h-11 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white transition-all ${className}`}
    >
      {children}
    </select>
  );
}

function Toggle({ value, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
      <div>
        <p className="font-semibold text-slate-900 text-sm">{label}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

// ─── Step 3: Goods & Services + POS Config ──────────────────────────────────
function Step3Details({ data, set, step, onBack, onNext }) {
  const bt = data.businessType;
  const suggestedGoods    = GOODS_SUGGESTIONS[bt]    || GOODS_SUGGESTIONS.other;
  const suggestedServices = SERVICES_SUGGESTIONS[bt] || SERVICES_SUGGESTIONS.other;

  const toggleItem = (list, setKey, item) => {
    const current = data[setKey];
    if (current.includes(item)) {
      set(setKey, current.filter(i => i !== item));
    } else {
      set(setKey, [...current, item]);
    }
  };

  const addCustom = () => {
    const val = data.addOwnInput.trim();
    if (!val) return;
    const key = data.addOwnType === 'good' ? 'selectedGoods' : 'selectedServices';
    if (!data[key].includes(val)) set(key, [...data[key], val]);
    set('addOwnInput', '');
  };

  const removeItem = (key, item) =>
    set(key, data[key].filter(i => i !== item));

  const totalSelected = data.selectedGoods.length + data.selectedServices.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-5">Tell us a bit more about your business.</h2>

      {/* ── Goods & Services ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-bold text-slate-800">Goods & Services</p>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Select what your business offers. Suggestions are based on your chosen business type.
        </p>

        {!bt ? (
          <p className="text-xs text-emerald-600 font-medium">
            Pick a business type or POS type first to see relevant suggestions.
          </p>
        ) : (
          <>
            {/* Suggested Goods */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingBag className="w-3 h-3 text-slate-400" />
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Suggested Goods / Products</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedGoods.map(g => {
                  const on = data.selectedGoods.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleItem(data.selectedGoods, 'selectedGoods', g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        on
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggested Services */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Suggested Services</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedServices.map(s => {
                  const on = data.selectedServices.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleItem(data.selectedServices, 'selectedServices', s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        on
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add your own */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Add your own</p>
              <div className="flex items-center gap-2">
                {/* Toggle Good / Service */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => set('addOwnType', 'good')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all ${
                      data.addOwnType === 'good'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3" /> Good
                  </button>
                  <button
                    onClick={() => set('addOwnType', 'service')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all border-l border-slate-200 ${
                      data.addOwnType === 'service'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-3 h-3" /> Service
                  </button>
                </div>
                <input
                  value={data.addOwnInput}
                  onChange={e => set('addOwnInput', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustom()}
                  placeholder="e.g. Fresh Juice"
                  className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
                <button
                  onClick={addCustom}
                  className="flex items-center gap-1.5 h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Selected pills */}
            {totalSelected > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Selected ({totalSelected})</p>
                <div className="flex flex-wrap gap-2">
                  {data.selectedGoods.map(g => (
                    <span
                      key={g}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      {g}
                      <button onClick={() => removeItem('selectedGoods', g)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {data.selectedServices.map(s => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700"
                    >
                      <Briefcase className="w-3 h-3" />
                      {s}
                      <button onClick={() => removeItem('selectedServices', s)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── POS Configuration ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-800">POS Configuration</p>
        </div>

        <Field label="POS Type">
          <Select value={data.posType} onChange={e => set('posType', e.target.value)}>
            <option value="">Select a POS type</option>
            {POS_TYPES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
        {!data.posType && (
          <p className="text-xs text-emerald-600 font-medium mt-2">
            Pick a POS type above to see the relevant settings checklist.
          </p>
        )}
      </div>

      <NavButtons step={step} onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ─── Main Onboarding Component ───────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const logoRef = useRef(null);

  // Form state for all steps
  const [data, setData] = useState({
    // Step 1
    userType: '',
    // Step 2
    businessType: '',
    posType: '',
    // Step 3 – Details (Goods & Services)
    selectedGoods: [],
    selectedServices: [],
    addOwnType: 'good',    // 'good' | 'service'
    addOwnInput: '',
    // Step 3 – Basic details (still collected in step 4 Business Info but seeded here)
    businessName: '',
    ownerName: '',
    registrationNumber: '',
    // Step 4 – Business Info
    tradingName: '',
    logoFile: null,
    logoPreview: null,
    businessDescription: '',
    businessPhone: '',
    businessEmail: '',
    businessAddress: '',
    businessWebsite: '',
    yearEstablished: '',
    employeeRange: '',
    businessRegNo: '',
    receiptHeader: '',
    receiptFooter: '',
    returnPolicy: '',
    exchangePolicy: '',
    kraPin: '',
    vatNumber: '',
    taxRate: '16',
    licenseNo: '',
    licenseExpiry: '',
    mpesaPaybill: '',
    mpesaTill: '',
    mpesaAccountRef: '',
    // Step 5 – Branches (first branch)
    branches: [],           // array of { name, address, phone, email, manager }
    // Step 6
    plan: 'starter',
    // Step 7 – Contact
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactRole: '',
    ownerManagerName: '',
    managerPhone: '',
    managerEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    backupContactName: '',
    backupContactPhone: '',
    backupContactEmail: '',
    // Step 8
    currency: 'KES',
    // Step 9
    etimsEnabled: false,
    vatRegistered: false,
  });

  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const next = () => setStep(s => Math.min(s + 1, 9));
  const back = () => setStep(s => Math.max(s - 1, 1));

  // Branch helpers
  const addBranch = () =>
    setData(prev => ({
      ...prev,
      branches: [...prev.branches, { name: '', address: '', phone: '', email: '', manager: '' }],
    }));

  const updateBranch = (i, key, val) =>
    setData(prev => {
      const updated = [...prev.branches];
      updated[i] = { ...updated[i], [key]: val };
      return { ...prev, branches: updated };
    });

  const removeBranch = (i) =>
    setData(prev => ({ ...prev, branches: prev.branches.filter((_, idx) => idx !== i) }));

  // Logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('logoFile', file);
    const reader = new FileReader();
    reader.onload = ev => set('logoPreview', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload = {
        business_name:       data.businessName,
        trading_name:        data.tradingName,
        business_address:    data.businessAddress,
        business_phone:      data.businessPhone || data.contactPhone,
        business_email:      data.businessEmail || data.contactEmail,
        business_website:    data.businessWebsite,
        year_established:    data.yearEstablished,
        employee_range:      data.employeeRange,
        registration_number: data.registrationNumber || data.businessRegNo,
        kra_pin:             data.kraPin,
        vat_number:          data.vatNumber,
        currency:            data.currency,
        default_tax_rate:    parseFloat(data.taxRate) || 16,
        receipt_header:      data.receiptHeader,
        receipt_footer:      data.receiptFooter,
        return_policy:       data.returnPolicy,
        exchange_policy:     data.exchangePolicy,
        mpesa_paybill:       data.mpesaPaybill,
        mpesa_till:          data.mpesaTill,
        mpesa_account_ref:   data.mpesaAccountRef,
        license_no:          data.licenseNo,
        license_expiry:      data.licenseExpiry,
        user_type:           data.userType,
        business_type:       data.businessType,
        pos_type:            data.posType,
        selected_goods:      data.selectedGoods,
        selected_services:   data.selectedServices,
        plan:                data.plan,
        branches:            data.branches,
        etims_enabled:       data.etimsEnabled,
        vat_registered:      data.vatRegistered,
        contact: {
          name:  data.contactName,
          phone: data.contactPhone,
          email: data.contactEmail,
          role:  data.contactRole,
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

  const card = (content) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      {content}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <StepHeader />

        {/* Step Nav */}
        <StepNav current={step} />

        {/* ── Step 1: User Type ── */}
        {step === 1 && card(
          <>
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Select the type of account that best describes you:
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {USER_TYPES.map(t => (
                <SelectionCard
                  key={t.id} id={t.id}
                  selected={data.userType} onSelect={v => set('userType', v)}
                  icon={t.icon} title={t.title} desc={t.desc}
                />
              ))}
            </div>
            <NavButtons step={step} onBack={back} onNext={next} nextDisabled={!data.userType} />
          </>
        )}

        {/* ── Step 2: Business Type ── */}
        {step === 2 && card(
          <>
            <h2 className="text-lg font-bold text-slate-900 mb-5">What best describes your business?</h2>

            {/* 3-column card grid */}
            <div className="grid grid-cols-3 gap-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
              {BUSINESS_TYPES.map(t => {
                const isSelected = data.businessType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => set('businessType', t.id)}
                    className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border-2 transition-all text-left relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <t.icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-tight ${
                        isSelected ? 'text-emerald-700' : 'text-slate-800'
                      }`}>{t.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <NavButtons step={step} onBack={back} onNext={next} nextDisabled={!data.businessType} />
          </>
        )}

        {/* ── Step 3: Details (Goods & Services + POS Config) ── */}
        {step === 3 && <Step3Details data={data} set={set} step={step} onBack={back} onNext={next} />}

        {/* ── Step 4: Business Info (Comprehensive) ── */}
        {step === 4 && card(
          <>
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

            </div>{/* end space-y-6 */}

            <NavButtons step={step} onBack={back} onNext={next} nextDisabled={!data.businessName} />
          </>
        )}

        {/* ── Step 5: Branches ── */}
        {step === 5 && card(
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Add your first branch or location.</h2>
              <p className="text-sm text-slate-500 mt-1">
                Add your first branch or location. You can{' '}
                <span className="text-emerald-600 font-medium">add more later</span> from the Branches page.
              </p>
            </div>

            {/* Branch list */}
            {data.branches.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400 mb-4">No branches added yet.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {data.branches.map((b, i) => (
                  <div key={i} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Branch {i + 1}</span>
                      <button
                        onClick={() => removeBranch(i)}
                        className="w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <Field label="Branch Name" required>
                        <Input
                          placeholder="e.g. Nairobi CBD Branch"
                          value={b.name}
                          onChange={e => updateBranch(i, 'name', e.target.value)}
                        />
                      </Field>
                      <Field label="Address">
                        <Input
                          placeholder="e.g. Moi Avenue, Ground Floor"
                          value={b.address}
                          onChange={e => updateBranch(i, 'address', e.target.value)}
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Phone">
                          <Input
                            type="tel"
                            placeholder="+254 7XX XXX XXX"
                            value={b.phone}
                            onChange={e => updateBranch(i, 'phone', e.target.value)}
                          />
                        </Field>
                        <Field label="Email">
                          <Input
                            type="email"
                            placeholder="branch@business.co.ke"
                            value={b.email}
                            onChange={e => updateBranch(i, 'email', e.target.value)}
                          />
                        </Field>
                      </div>
                      <Field label="Branch Manager">
                        <Input
                          placeholder="e.g. Jane Wanjiku"
                          value={b.manager}
                          onChange={e => updateBranch(i, 'manager', e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Branch button */}
            <button
              onClick={addBranch}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all text-sm"
            >
              <MapPin className="w-4 h-4" />
              Add a Branch
            </button>

            {data.branches.length === 0 && (
              <p className="text-xs text-slate-400 mt-3">
                Prefer to do this later?{' '}
                <button onClick={next} className="text-emerald-600 hover:underline font-medium">Click Continue to proceed.</button>
              </p>
            )}

            <NavButtons step={step} onBack={back} onNext={next} />
          </>
        )}

        {/* ── Step 6: Business Package ── */}
        {step === 6 && card(
          <>
            <h2 className="text-base font-semibold text-slate-800 mb-5">Choose your business package</h2>
            <div className="space-y-3">
              {PACKAGES.map(p => (
                <button
                  key={p.id}
                  onClick={() => set('plan', p.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    data.plan === p.id
                      ? `${p.color} bg-blue-50/30 shadow-sm`
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{p.name}</span>
                      {p.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{p.badge}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 text-sm">{p.price}</span>
                      {data.plan === p.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {p.features.map(f => (
                      <span key={f} className="text-xs text-slate-500 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" /> {f}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <NavButtons step={step} onBack={back} onNext={next} />
          </>
        )}

        {/* ── Step 7: Contact ── */}
        {step === 7 && card(
          <>
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
              step={step} onBack={back} onNext={next}
              nextDisabled={!data.contactName}
            />
          </>
        )}

        {/* ── Step 8: Currency ── */}
        {step === 8 && card(
          <>
            <h2 className="text-base font-semibold text-slate-800 mb-5">Currency & Tax Settings</h2>
            <div className="space-y-4">
              <Field label="Currency">
                <Select value={data.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag}  {c.code} — {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Default VAT / Tax Rate (%)">
                <Input
                  type="number" min="0" max="100" step="0.5"
                  value={data.taxRate}
                  onChange={e => set('taxRate', e.target.value)}
                />
              </Field>
            </div>
            <NavButtons step={step} onBack={back} onNext={next} />
          </>
        )}

        {/* ── Step 9: eTIMS Setup ── */}
        {step === 9 && card(
          <>
            <h2 className="text-base font-semibold text-slate-800 mb-2">eTIMS & Tax Compliance</h2>
            <p className="text-xs text-slate-500 mb-6">
              eTIMS (Electronic Tax Invoice Management System) is required by the Kenya Revenue Authority (KRA) for VAT-registered businesses.
            </p>

            <div className="space-y-4">
              <Field label="KRA PIN">
                <Input
                  placeholder="A001234567Z"
                  value={data.kraPin}
                  onChange={e => set('kraPin', e.target.value.toUpperCase())}
                  className="font-mono tracking-widest"
                />
              </Field>

              <Toggle
                value={data.vatRegistered}
                onChange={v => set('vatRegistered', v)}
                label="VAT Registered Business"
                hint="Are you registered for VAT with KRA?"
              />

              <Toggle
                value={data.etimsEnabled}
                onChange={v => set('etimsEnabled', v)}
                label="Enable eTIMS Integration"
                hint="Automatically send invoices to KRA eTIMS portal."
              />

              {!data.etimsEnabled && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  💡 You can enable eTIMS later from <strong>Settings → eTIMS Compliance</strong>.
                </div>
              )}
            </div>

            {/* Summary card */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Setup Summary</p>
              {[
                ['Business',  data.businessName],
                ['Type',      BUSINESS_TYPES.find(t => t.id === data.businessType)?.label || '—'],
                ['Address',   data.businessAddress || '—'],
                ['Plan',      data.plan?.charAt(0).toUpperCase() + data.plan?.slice(1)],
                ['Currency',  data.currency],
                ['VAT Rate',  `${data.taxRate}%`],
                ['Branches',  data.branches.length || 0],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>

            <NavButtons
              step={step}
              onBack={back}
              onNext={handleFinish}
              nextLabel="Launch My Store 🚀"
              loading={loading}
            />
          </>
        )}

        {/* Dots progress */}
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