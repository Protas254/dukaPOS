import React from 'react';
import {
  User, Store, FileText, Building2, GitBranch, Package,
  Phone, DollarSign, Shield, ChevronRight, ChevronLeft,
  Check, Loader2, ShoppingBag, Briefcase, Users, Globe,
  MapPin, Mail, Upload, Plus, Trash2, AlertCircle,
  Receipt, CreditCard, FileCheck, Info, Tag, Headphones,
  UtensilsCrossed, Wine, Coffee, Cake, Scissors, Cpu,
  Hammer, Leaf, Shirt, Hotel, X, Zap
} from 'lucide-react';

export const STEPS = [
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

export const USER_TYPES = [
  { id: 'individual', icon: User,       title: 'Individual & Informal Sector', desc: 'Solo trader, freelancer, or sole proprietor.' },
  { id: 'sme',        icon: Store,      title: 'SME & Informal Sector',        desc: 'Small & medium enterprise with a few staff and products.' },
  { id: 'merchant',   icon: ShoppingBag,title: 'Merchants',                    desc: 'Retailers, shops, restaurants with multiple products and locations.' },
  { id: 'enterprise', icon: Building2,  title: 'Enterprise',                   desc: 'Large organisations with multiple branches and teams.' },
];

export const BUSINESS_TYPES = [
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

export const GOODS_SUGGESTIONS = {
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

export const SERVICES_SUGGESTIONS = {
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

export const POS_TYPES = [
  { value: 'cashier',      label: 'Cashier / Counter POS' },
  { value: 'mobile',       label: 'Mobile POS (Tablet / Phone)' },
  { value: 'self_service', label: 'Self-Service Kiosk' },
  { value: 'table',        label: 'Table-Service POS (Restaurant)' },
  { value: 'online',       label: 'Online / E-commerce' },
  { value: 'hybrid',       label: 'Hybrid (In-store + Online)' },
];

export const CURRENCIES = [
  { code: 'KES', label: 'Kenyan Shilling',     flag: '🇰🇪' },
  { code: 'UGX', label: 'Ugandan Shilling',    flag: '🇺🇬' },
  { code: 'TZS', label: 'Tanzanian Shilling',  flag: '🇹🇿' },
  { code: 'ZMW', label: 'Zambian Kwacha',      flag: '🇿🇲' },
  { code: 'ZWL', label: 'Zimbabwean Dollar',   flag: '🇿🇼' },
  { code: 'USD', label: 'US Dollar',           flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro',                flag: '🇪🇺' },
  { code: 'GBP', label: 'British Pound',       flag: '🇬🇧' },
];

export const PACKAGES = [
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

export const YEAR_OPTIONS = (() => {
  const yrs = [];
  for (let y = new Date().getFullYear(); y >= 1950; y--) yrs.push(y);
  return yrs;
})();

export const EMPLOYEE_RANGES = ['1–5', '6–15', '16–50', '51–100', '101–500', '500+'];

export function StepHeader() {
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

export function StepNav({ current }) {
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

export function NavButtons({ step, onBack, onNext, nextLabel = 'Continue', loading = false, nextDisabled = false }) {
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

export function SelectionCard({ selected, onSelect, id, icon: Icon, title, desc }) {
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

export function SectionTitle({ icon: Icon, title, subtitle }) {
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

export function Field({ label, hint, required, children }) {
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

export function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${className}`}
    />
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none ${className}`}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full h-11 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white transition-all ${className}`}
    >
      {children}
    </select>
  );
}

export function Toggle({ value, onChange, label, hint }) {
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
