# DukaPOS — Enterprise Retail POS & ERP System

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61dafb?logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Backend-Django_5.2_%2B_DRF-092e20?logo=django)](https://www.djangoproject.com/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind_CSS_%2B_shadcn-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Compliance](https://img.shields.io/badge/Fiscal-KRA_eTIMS_Compliant-red)](./docs/KENYA_COMPLIANCE_MPESA.md)
[![Payments](https://img.shields.io/badge/Payments-Safaricom_M--Pesa_Daraja-green)](./docs/KENYA_COMPLIANCE_MPESA.md)

**DukaPOS** is a modern, high-performance, multi-tenant Point of Sale (POS) and Retail ERP system built specifically for retail shops, supermarkets, wholesale outlets, and mini-marts in Kenya and across East Africa.

It features out-of-the-box support for **Safaricom M-Pesa STK Push**, **KRA eTIMS electronic fiscal invoicing**, **multi-branch inventory synchronization**, **cashier shift reconciliation with Z-Reports**, **automated loyalty rewards**, and **loss-prevention audit tracking**.

---

## 📚 Documentation Suite

Comprehensive and detailed documentation is organized in the [`docs/`](./docs/) directory and available as a single master handbook:

- 📖 **[Master Documentation Handbook (DOCUMENTATION.md)](./DOCUMENTATION.md)** — Complete all-in-one technical reference & user guide.
- 🏛️ **[System Architecture (docs/ARCHITECTURE.md)](./docs/ARCHITECTURE.md)** — Multi-tenant architecture, scoping model, RBAC, and directory structure.
- 🗄️ **[Database Models (docs/DATABASE_MODELS.md)](./docs/DATABASE_MODELS.md)** — Complete schema reference for all 22 database entities.
- 🔌 **[REST API Reference (docs/API_REFERENCE.md)](./docs/API_REFERENCE.md)** — Endpoints, payloads, headers, query parameters, and responses.
- 🧑‍💼 **[Operations & User Manual (docs/USER_GUIDE.md)](./docs/USER_GUIDE.md)** — Step-by-step cashier and manager operations (POS checkout, Z-reports, shifts, barcodes).
- 🇰🇪 **[eTIMS & M-Pesa Compliance (docs/KENYA_COMPLIANCE_MPESA.md)](./docs/KENYA_COMPLIANCE_MPESA.md)** — KRA fiscalization, CUIN signing, and Safaricom Daraja STK Push setup.
- 🚀 **[Installation & Deployment (docs/SETUP_AND_DEPLOYMENT.md)](./docs/SETUP_AND_DEPLOYMENT.md)** — Local setup, Docker Compose, Linux production hosting (Nginx + Gunicorn), and POS hardware configuration.

---

## ⚡ Key Features

- **Multi-Tenant Architecture**: Complete row-level database isolation supporting multiple businesses or franchises on a single backend.
- **High-Speed POS Counter**: Touch-friendly product grid, instant barcode laser scanner detection, favorites bar, keyboard shortcuts (F1-F12), and audio cues.
- **Kenya Fiscal & Regulatory Compliance**: Real-time KRA eTIMS invoice generation, CUIN allocation, and tax breakdown (16% standard VAT, exempt, zero-rated).
- **Mobile Money (Safaricom Daraja)**: Seamless M-Pesa STK Push prompts directly to customer mobile handsets and Buy Goods Till verification.
- **Cash Drawer Loss Prevention & Z-Reports**: Audited cashier shifts with opening float tracking, blind cash counts, and variance detection:
  $$\text{Expected Cash} = \text{Starting Cash} + \text{Cash Sales} - \text{Cash Expenses}$$
- **Inventory & Supply Chain Intelligence**: Automatic stock deduction on sale, automatic stock replenishment on purchase order delivery, low-stock alerts, scan-to-restock, and thermal barcode sticker generation.
- **Customer CRM & Loyalty Engine**: Automatic loyalty points accrual (1 pt / 100 KES spent), checkout points redemption, and automatic tier upgrades (Bronze, Silver, Gold).
- **Receipters Vault Hub**: Secure digital vault for electronic invoice storage, warranties, and fiscal records.
- **Executive Analytics & Real-Time P&L**: Live sales KPIs, Cost of Goods Sold (COGS), Gross Profit, Net Margins, hourly heatmaps, and cashier performance comparisons.

---

## 🛠️ Quick Start

### 1. Prerequisites
- **Node.js** 18+ LTS
- **Python** 3.10+
- **npm** and **pip**

### 2. Installation
Clone the repository and install all dependencies for both frontend and backend with a single command:
```bash
git clone https://github.com/your-org/dukaPOS.git
cd dukaPOS
npm run install:all
```

### 3. Run in Development
```bash
# Starts both frontend (Vite) and backend (Django) concurrently:
npm run dev

# Or start services individually:
npm run client   # Starts Vite dev server on http://localhost:5173
npm run server   # Starts Django API server on http://localhost:5000
```

### 4. Run with Docker Compose
```bash
# Start PostgreSQL, Django backend, and Vite frontend in isolated containers:
docker compose up --build
```

---

## 🏗️ Repository Layout

```
dukaPOS/
├── client/                     # React 18 + Vite frontend application
│   ├── src/
│   │   ├── api/                # API client with JWT & entity bindings
│   │   ├── components/         # POS, barcode, inventory, and UI widgets
│   │   ├── pages/              # 30+ Application routes
│   │   └── App.jsx             # Route definitions & RBAC guards
│   └── package.json
│
├── server/                     # Django 5.2 + Django REST Framework backend
│   ├── api/
│   │   ├── views/              # Modular controllers (auth, tenant, cashier, crud, analytics)
│   │   ├── models.py           # 22 Database models
│   │   ├── serializers.py      # DRF ModelSerializers
│   │   └── urls.py             # Internal routing table
│   ├── server/                 # Django settings & wsgi configuration
│   ├── requirements.txt        # Python package dependencies
│   └── manage.py
│
├── docs/                       # Comprehensive documentation suite
├── DOCUMENTATION.md            # Master all-in-one documentation handbook
├── docker-compose.yml          # Multi-container local development setup
├── docker-compose.prod.yml     # Multi-container production setup
└── package.json                # Root orchestration scripts
```

---

## 📄 License & Intellectual Property

Proprietary software engineered for Kenyan retail enterprises. All rights reserved.
