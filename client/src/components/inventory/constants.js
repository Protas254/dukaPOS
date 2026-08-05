export const CATEGORIES = [
  'groceries', 'beverages', 'dairy', 'bakery', 'snacks',
  'household', 'personal_care', 'electronics', 'stationery', 'other'
];

export const UNITS = ['piece', 'kg', 'litre', 'pack', 'dozen', 'box', 'bag'];

export const emptyProduct = {
  name: '', sku: '', category: 'groceries', price: '', cost_price: '',
  stock_quantity: '', low_stock_threshold: 10, unit: 'piece', is_active: true, tax_rate: 16
};
