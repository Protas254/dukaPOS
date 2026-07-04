import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to get/set data
const getDB = async () => {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

const saveDB = async (data) => {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

// Seed function if DB doesn't exist
const seedDatabase = async () => {
  try {
    await fs.access(DB_FILE);
    // File exists, no need to seed
  } catch {
    // File does not exist, seed it
    const initialDB = {
      users: [
        {
          id: 'u_admin',
          email: 'admin@store.com',
          password: 'admin',
          full_name: 'John Maina',
          role: 'admin'
        },
        {
          id: 'u_cashier',
          email: 'cashier@store.com',
          password: 'cashier',
          full_name: 'Jane Smith',
          role: 'user'
        }
      ],
      BusinessSettings: [
        {
          id: 'bs_default',
          business_name: 'Duka Smart Shop',
          business_type: 'sme',
          business_phone: '+254 712 345678',
          business_email: 'hello@dukasmart.com',
          business_address: 'Biashara Street, Nairobi, Kenya',
          kra_pin: 'A001234567Z',
          default_tax_rate: 16,
          currency: 'KES',
          receipt_footer: 'Thank you for shopping with us! Welcome again.',
          mpesa_paybill: '174379',
          mpesa_till: '543210',
          mpesa_account: 'Duka Smart Shop'
        }
      ],
      Product: [
        {
          id: 'p_blueband',
          name: 'Blue Band Margarine 500g',
          sku: '6001234567890',
          category: 'groceries',
          price: 150,
          cost_price: 110,
          stock_quantity: 45,
          low_stock_threshold: 10,
          unit: 'piece',
          is_active: true,
          tax_rate: 16
        },
        {
          id: 'p_safari_tea',
          name: 'Safari Tea 250g',
          sku: '6009876543210',
          category: 'beverages',
          price: 80,
          cost_price: 60,
          stock_quantity: 6,
          low_stock_threshold: 15,
          unit: 'piece',
          is_active: true,
          tax_rate: 16
        },
        {
          id: 'p_jogoo',
          name: 'Jogoo Maize Meal 2kg',
          sku: '6004561237890',
          category: 'groceries',
          price: 210,
          cost_price: 180,
          stock_quantity: 60,
          low_stock_threshold: 20,
          unit: 'piece',
          is_active: true,
          tax_rate: 16
        },
        {
          id: 'p_tusker',
          name: 'Tusker Cider 500ml',
          sku: '6003216549870',
          category: 'beverages',
          price: 230,
          cost_price: 190,
          stock_quantity: 4,
          low_stock_threshold: 12,
          unit: 'piece',
          is_active: true,
          tax_rate: 16
        },
        {
          id: 'p_brookside',
          name: 'Brookside Fresh Milk 500ml',
          sku: '6008529637410',
          category: 'dairy',
          price: 70,
          cost_price: 55,
          stock_quantity: 30,
          low_stock_threshold: 10,
          unit: 'piece',
          is_active: true,
          tax_rate: 16
        },
        {
          id: 'p_broadways',
          name: 'Broadways Bread 400g',
          sku: '6007418529630',
          category: 'bakery',
          price: 65,
          cost_price: 50,
          stock_quantity: 25,
          low_stock_threshold: 8,
          unit: 'piece',
          is_active: true,
          tax_rate: 16
        },
        {
          id: 'p_omo',
          name: 'Omo Detergent 1kg',
          sku: '6009638527410',
          category: 'household',
          price: 380,
          cost_price: 320,
          stock_quantity: 18,
          low_stock_threshold: 5,
          unit: 'piece',
          is_active: true,
          tax_rate: 16
        },
        {
          id: 'p_krackles',
          name: 'Krackles Potato Chips',
          sku: '6001593572580',
          category: 'snacks',
          price: 50,
          cost_price: 35,
          stock_quantity: 80,
          low_stock_threshold: 20,
          unit: 'piece',
          is_active: true,
          tax_rate: 16
        }
      ],
      Customer: [
        {
          id: 'c_john',
          name: 'John Doe',
          phone: '+254 700 111222',
          email: 'john@example.com',
          loyalty_points: 120,
          total_spending: 4500,
          total_transactions: 8,
          tier: 'gold',
          is_active: true
        },
        {
          id: 'c_mary',
          name: 'Mary Wanjiku',
          phone: '+254 722 333444',
          email: 'mary@example.com',
          loyalty_points: 35,
          total_spending: 1200,
          total_transactions: 3,
          tier: 'silver',
          is_active: true
        },
        {
          id: 'c_david',
          name: 'David Omondi',
          phone: '+254 733 555666',
          email: 'david@example.com',
          loyalty_points: 250,
          total_spending: 8900,
          total_transactions: 15,
          tier: 'platinum',
          is_active: true
        }
      ],
      Supplier: [
        {
          id: 's_unilever',
          name: 'Unilever Kenya Ltd',
          contact_person: 'Peter Kamau',
          phone: '+254 711 222333',
          email: 'peter.kamau@unilever.com',
          address: 'Commercial Street, Industrial Area, Nairobi',
          products_supplied: 'Blue Band, Omo, Geisha, Vaseline',
          payment_terms: 'net_30',
          is_active: true
        },
        {
          id: 's_kbl',
          name: 'Kenya Breweries Limited',
          contact_person: 'Jane Mwangi',
          phone: '+254 722 555666',
          email: 'jane.mwangi@eabl.com',
          address: 'Ruaraka, Thika Road, Nairobi',
          products_supplied: 'Tusker Cider, Guinness, White Cap',
          payment_terms: 'cash',
          is_active: true
        },
        {
          id: 's_brookside',
          name: 'Brookside Dairies',
          contact_person: 'James Rotich',
          phone: '+254 733 777888',
          email: 'james.rotich@brookside.co.ke',
          address: 'Ruiru, Kiambu County',
          products_supplied: 'Brookside Milk, Yoghurt, Butter',
          payment_terms: 'net_15',
          is_active: true
        }
      ],
      Shift: [
        {
          id: 'shift_active',
          cashier_id: 'u_cashier',
          cashier_name: 'Jane Smith',
          status: 'active',
          started_at: new Date(Date.now() - 4 * 3600000).toISOString(),
          starting_cash: 5000,
          total_sales: 1960
        },
        {
          id: 'shift_past1',
          cashier_id: 'u_cashier',
          cashier_name: 'Jane Smith',
          status: 'closed',
          started_at: new Date(Date.now() - 86400000 - 8 * 3600000).toISOString(),
          ended_at: new Date(Date.now() - 86400000 - 1 * 3600000).toISOString(),
          starting_cash: 5000,
          ending_cash: 18450,
          total_sales: 13450
        },
        {
          id: 'shift_past2',
          cashier_id: 'u_admin',
          cashier_name: 'John Maina',
          status: 'closed',
          started_at: new Date(Date.now() - 172800000 - 8 * 3600000).toISOString(),
          ended_at: new Date(Date.now() - 172800000 - 1 * 3600000).toISOString(),
          starting_cash: 5000,
          ending_cash: 21200,
          total_sales: 16200
        }
      ],
      Sale: [
        {
          id: 'sale_1',
          receipt_number: 'RCP-0001',
          shift_id: 'shift_active',
          cashier_id: 'u_cashier',
          cashier_name: 'Jane Smith',
          created_date: new Date(Date.now() - 3 * 3600000).toISOString(),
          total_amount: 510,
          subtotal: 440,
          tax_total: 70,
          payment_method: 'cash',
          status: 'completed',
          items: [
            { product_id: 'p_jogoo', product_name: 'Jogoo Maize Meal 2kg', quantity: 2, unit_price: 210, total: 420, tax_amount: 58 },
            { product_id: 'p_brookside', product_name: 'Brookside Fresh Milk 500ml', quantity: 1, unit_price: 70, total: 70, tax_amount: 12 }
          ],
          etims_status: 'submitted',
          cuin: 'KRAETIMS0000012345'
        },
        {
          id: 'sale_2',
          receipt_number: 'RCP-0002',
          shift_id: 'shift_active',
          cashier_id: 'u_cashier',
          cashier_name: 'Jane Smith',
          created_date: new Date(Date.now() - 1.5 * 3600000).toISOString(),
          total_amount: 1450,
          subtotal: 1250,
          tax_total: 200,
          payment_method: 'mpesa',
          status: 'completed',
          items: [
            { product_id: 'p_blueband', product_name: 'Blue Band Margarine 500g', quantity: 3, unit_price: 150, total: 450, tax_amount: 62 },
            { product_id: 'p_omo', product_name: 'Omo Detergent 1kg', quantity: 2, unit_price: 380, total: 760, tax_amount: 105 },
            { product_id: 'p_tusker', product_name: 'Tusker Cider 500ml', quantity: 1, unit_price: 230, total: 230, tax_amount: 33 }
          ],
          etims_status: 'submitted',
          cuin: 'KRAETIMS0000012346'
        },
        {
          id: 'sale_3',
          receipt_number: 'RCP-0003',
          shift_id: 'shift_past1',
          cashier_id: 'u_cashier',
          cashier_name: 'Jane Smith',
          created_date: new Date(Date.now() - 86400000 - 4 * 3600000).toISOString(),
          total_amount: 3200,
          subtotal: 2758,
          tax_total: 442,
          payment_method: 'card',
          status: 'completed',
          items: [
            { product_id: 'p_omo', product_name: 'Omo Detergent 1kg', quantity: 5, unit_price: 380, total: 1900, tax_amount: 262 },
            { product_id: 'p_jogoo', product_name: 'Jogoo Maize Meal 2kg', quantity: 5, unit_price: 210, total: 1050, tax_amount: 145 },
            { product_id: 'p_broadways', product_name: 'Broadways Bread 400g', quantity: 3, unit_price: 65, total: 195, tax_amount: 27 },
            { product_id: 'p_brookside', product_name: 'Brookside Fresh Milk 500ml', quantity: 1, unit_price: 70, total: 70, tax_amount: 8 }
          ],
          etims_status: 'submitted',
          cuin: 'KRAETIMS0000012301'
        }
      ],
      Expense: [
        {
          id: 'exp_1',
          amount: 1500,
          category: 'inventory',
          description: 'Purchased packaging bags from supplier',
          date: new Date(Date.now() - 2 * 3600000).toISOString(),
          status: 'approved'
        },
        {
          id: 'exp_2',
          amount: 800,
          category: 'utilities',
          description: 'Electricity tokens',
          date: new Date(Date.now() - 86400000 - 5 * 3600000).toISOString(),
          status: 'approved'
        },
        {
          id: 'exp_3',
          amount: 5000,
          category: 'rent',
          description: 'Store rent partial payment',
          date: new Date(Date.now() - 172800000 - 2 * 3600000).toISOString(),
          status: 'approved'
        }
      ],
      EmployeeRating: [
        {
          id: 'er_jane',
          cashier_name: 'Jane Smith',
          rating: 5,
          notes: 'Excellent customer service and very accurate with cash reconciliation.'
        },
        {
          id: 'er_john',
          cashier_name: 'John Maina',
          rating: 4,
          notes: 'Efficient and friendly, handles rushes well.'
        }
      ],
      EmployeeSchedule: [],
      Promotion: [],
      MpesaPayment: [],
      ShiftAudit: [],
      CashFlow: []
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
    console.log('Seeded database successfully.');
  }
};

await seedDatabase();

// --- Auth Endpoints ---

// Get current user (simple mock session)
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const db = await getDB();
  
  if (token === 'mock_token_cashier') {
    const cashier = db.users.find(u => u.id === 'u_cashier');
    return res.json(cashier);
  }
  if (token === 'mock_token_admin' || token === 'mock_token_u_admin') {
    const admin = db.users.find(u => u.id === 'u_admin');
    return res.json(admin);
  }
  
  // Custom user token decoding
  const userId = token.replace('mock_token_', '');
  const user = db.users.find(u => u.id === userId || u.email === userId);
  if (user) {
    return res.json(user);
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = await getDB();
  
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Auto register demo user
    user = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      email,
      password,
      full_name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' '),
      role: email.includes('admin') ? 'admin' : 'user'
    };
    db.users.push(user);
    await saveDB(db);
  } else if (user.password !== password) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }
  
  return res.json({
    ...user,
    token: 'mock_token_' + user.id
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const db = await getDB();
  
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const pendingUser = {
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    email,
    password,
    full_name: email.split('@')[0],
    role: email.includes('admin') ? 'admin' : 'user'
  };
  
  // Store pending registration temp in database
  db.pending_user = pendingUser;
  await saveDB(db);
  
  return res.json({ email });
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otpCode } = req.body;
  const db = await getDB();
  
  const pending = db.pending_user;
  if (!pending || pending.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(400).json({ error: 'No pending registration found' });
  }
  
  // Remove pending user property, add to users array
  delete db.pending_user;
  db.users.push(pending);
  await saveDB(db);
  
  return res.json({ access_token: 'mock_token_' + pending.id });
});

app.post('/api/auth/resend-otp', (req, res) => {
  res.json({ success: true });
});

// --- Entities Endpoints (Generic CRUD) ---

// List entities
app.get('/api/entities/:entityName', async (req, res) => {
  const { entityName } = req.params;
  const { sort, limit } = req.query;
  const db = await getDB();
  
  const collection = db[entityName] || [];
  let result = [...collection];
  
  if (sort) {
    let isDescending = false;
    let key = sort;
    if (sort.startsWith('-')) {
      isDescending = true;
      key = sort.slice(1);
    }
    
    result.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      
      if (typeof valA === 'string' && !isNaN(Date.parse(valA))) valA = Date.parse(valA);
      if (typeof valB === 'string' && !isNaN(Date.parse(valB))) valB = Date.parse(valB);
      
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      
      if (valA < valB) return isDescending ? 1 : -1;
      if (valA > valB) return isDescending ? -1 : 1;
      return 0;
    });
  }
  
  if (limit) {
    const lim = parseInt(limit, 10);
    if (!isNaN(lim) && lim > 0) {
      result = result.slice(0, lim);
    }
  }
  
  res.json(result);
});

// Filter entities
app.post('/api/entities/:entityName/filter', async (req, res) => {
  const { entityName } = req.params;
  const criteria = req.body || {};
  const db = await getDB();
  
  const collection = db[entityName] || [];
  const filtered = collection.filter(item => {
    return Object.entries(criteria).every(([key, val]) => item[key] === val);
  });
  
  res.json(filtered);
});

// Get entity
app.get('/api/entities/:entityName/:id', async (req, res) => {
  const { entityName, id } = req.params;
  const db = await getDB();
  
  const collection = db[entityName] || [];
  const item = collection.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: `${entityName} with id ${id} not found` });
  }
  res.json(item);
});

// Create entity
app.post('/api/entities/:entityName', async (req, res) => {
  const { entityName } = req.params;
  const data = req.body;
  const db = await getDB();
  
  if (!db[entityName]) {
    db[entityName] = [];
  }
  
  const newItem = {
    id: entityName.toLowerCase() + '_' + Math.random().toString(36).substr(2, 9),
    created_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...data
  };
  
  db[entityName].push(newItem);
  await saveDB(db);
  res.status(201).json(newItem);
});

// Update entity
app.put('/api/entities/:entityName/:id', async (req, res) => {
  const { entityName, id } = req.params;
  const data = req.body;
  const db = await getDB();
  
  const collection = db[entityName] || [];
  const idx = collection.findIndex(i => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: `${entityName} with id ${id} not found` });
  }
  
  const updatedItem = {
    ...collection[idx],
    ...data,
    updated_at: new Date().toISOString()
  };
  
  db[entityName][idx] = updatedItem;
  await saveDB(db);
  res.json(updatedItem);
});

// Delete entity
app.delete('/api/entities/:entityName/:id', async (req, res) => {
  const { entityName, id } = req.params;
  const db = await getDB();
  
  const collection = db[entityName] || [];
  db[entityName] = collection.filter(i => i.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// --- Functions Invoke Endpoints ---
app.post('/api/functions/invoke', async (req, res) => {
  const { name, payload } = req.body;
  
  if (name === 'generateHardwarePDF') {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("DukaPOS Hardware Specifications", 20, 20);
    doc.setFontSize(12);
    doc.text("Recommended hardware setup for optimal POS performance:", 20, 40);
    doc.text("- Tablet/PC: Android 10+ or Windows 10+ with Google Chrome", 20, 55);
    doc.text("- Receipt Printer: 80mm Thermal Printer with USB/Bluetooth/Ethernet", 20, 65);
    doc.text("- Barcode Scanner: USB/Wireless Laser Barcode Scanner", 20, 75);
    doc.text("- Cash Drawer: Standard 24V RJ11 interface cash drawer", 20, 85);
    doc.text("- Network: Stable Wi-Fi or 4G connection", 20, 95);
    
    doc.text("Integration Notes:", 20, 115);
    doc.text("- Connect thermal printer via USB or Bluetooth for instant receipt printing.", 20, 125);
    doc.text("- Enable ESC/POS compatibility on your receipt printer.", 20, 135);
    
    const buffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(Buffer.from(buffer));
  }
  
  if (name === 'generateBrandingPDF') {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("DukaPOS Brand Guidelines", 20, 20);
    doc.setFontSize(12);
    doc.text("Brand guidelines and assets overview:", 20, 40);
    doc.text("- Primary Color: Emerald Green (HSL 142, 70%, 45%)", 20, 55);
    doc.text("- Secondary Color: Sage Green (HSL 142, 30%, 65%)", 20, 65);
    doc.text("- Typography: Inter (UI/Labels) and Outfit (Headers/Headings)", 20, 75);
    doc.text("- Tone of Voice: Professional, modern, empowering, clean", 20, 85);
    
    const buffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(Buffer.from(buffer));
  }
  
  if (name === 'generateUserManualPDF') {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("DukaPOS User Manual", 20, 20);
    doc.setFontSize(12);
    doc.text("Complete guide to operating the DukaPOS system:", 20, 40);
    doc.text("1. Go to Settings and configure your KRA PIN and tax rate (default is 16%).", 20, 55);
    doc.text("2. Go to Inventory and add products with SKUs and stock counts.", 20, 65);
    doc.text("3. Set up employees and schedule shifts.", 20, 75);
    doc.text("4. Open the POS screen, scan or click items to add to cart, and select payment.", 20, 85);
    doc.text("5. Complete checkout - this automatically updates inventory and loyalty points.", 20, 95);
    doc.text("6. View the Dashboard or Reports section to monitor sales in real-time.", 20, 105);
    
    const buffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(Buffer.from(buffer));
  }
  
  if (name === 'generateDukaPOSPDF') {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("DukaPOS System Information", 20, 20);
    doc.setFontSize(12);
    doc.text("DukaPOS is a fully independent local-first POS solution.", 20, 40);
    doc.text("Designed for retail shops, supermarkets, and mini-marts in East Africa.", 20, 55);
    
    const buffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(Buffer.from(buffer));
  }
  
  if (name === 'generateEtimsRoadmapPDF') {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("KRA eTIMS Integration Guide", 20, 20);
    doc.setFontSize(12);
    doc.text("Roadmap for eTIMS integration in Kenya:", 20, 40);
    doc.text("1. Obtain your KRA PIN and register for eTIMS portal access.", 20, 55);
    doc.text("2. Update your business settings in DukaPOS with your KRA PIN.", 20, 65);
    doc.text("3. Ensure all taxable products have a 16% standard VAT rate.", 20, 75);
    doc.text("4. Use the POS to make sales. Invoices sync automatically to eTIMS.", 20, 85);
    doc.text("5. Monitor submission status under the eTIMS Compliance tab.", 20, 95);
    
    const buffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(Buffer.from(buffer));
  }
  
  if (name === 'submitEtimsInvoice') {
    const { sale } = payload || {};
    
    // Simulate updating the sale in DB to 'submitted'
    if (sale && sale.id) {
      const db = await getDB();
      const sales = db.Sale || [];
      const idx = sales.findIndex(s => s.id === sale.id);
      const cuin = 'KRAETIMS' + Math.floor(1000000000 + Math.random() * 9000000000);
      if (idx !== -1) {
        db.Sale[idx] = {
          ...db.Sale[idx],
          cuin,
          etims_status: 'submitted'
        };
        await saveDB(db);
      }
      return res.json({
        status: 'success',
        message: 'Invoice submitted to eTIMS successfully',
        cuin,
        etims_status: 'submitted'
      });
    }
    
    return res.status(400).json({ error: 'Invalid sale payload' });
  }
  
  if (name === 'shiftAudit') {
    return res.json({
      status: 'success',
      message: `Shift audit action '${payload?.action}' processed successfully`
    });
  }
  
  if (name === 'mpesaStkPush') {
    return setTimeout(() => {
      res.json({
        status: 'success',
        MerchantRequestID: 'req_' + Math.random().toString(36).substr(2, 9),
        CheckoutRequestID: 'chk_' + Math.random().toString(36).substr(2, 9),
        ResponseCode: '0',
        CustomerMessage: 'Success. STK push request accepted for processing.'
      });
    }, 1000);
  }
  
  return res.json({ status: 'success' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
