# DukaPOS — Master Technical Documentation & Operations Guide

> **Version**: 1.0.0 Enterprise  
> **Target Region**: Kenya & East Africa  
> **Platform**: React 18 (Vite) + Django 5.2 (REST Framework) + PostgreSQL / SQLite  
> **Compliance**: KRA eTIMS Standard, Safaricom Daraja Lipa Na M-Pesa  

---

# Table of Contents
1. [Executive Summary & System Vision](#1-executive-summary--system-vision)
2. [System Architecture](#2-system-architecture)
   - [2.1 High-Level Architecture](#21-high-level-architecture)
   - [2.2 Technology Stack](#22-technology-stack)
   - [2.3 Multi-Tenancy & Data Isolation Model](#23-multi-tenancy--data-isolation-model)
   - [2.4 Role-Based Access Control (RBAC)](#24-role-based-access-control-rbac)
   - [2.5 Codebase & Directory Structure](#25-codebase--directory-structure)
3. [Database Schema & Data Models](#3-database-schema--data-models)
   - [3.1 Multi-Tenant & Identity Entities](#31-multi-tenant--identity-entities)
   - [3.2 Organization & Branch Hierarchy](#32-organization--branch-hierarchy)
   - [3.3 Product Catalog & Stock Entities](#33-product-catalog--stock-entities)
   - [3.4 Sales, Shifts & Cash Operations](#34-sales-shifts--cash-operations)
   - [3.5 Customers, Loyalty & Feedback](#35-customers-loyalty--feedback)
   - [3.6 Procurement & Suppliers](#36-procurement--suppliers)
   - [3.7 Financials, Expenses & Audits](#37-financials-expenses--audits)
   - [3.8 Document Vault & Subscriptions](#38-document-vault--subscriptions)
4. [REST API Reference & Specifications](#4-rest-api-reference--specifications)
   - [4.1 Authentication Endpoints](#41-authentication-endpoints)
   - [4.2 Tenant & Staff Administration](#42-tenant--staff-administration)
   - [4.3 Scoped Generic Entity CRUD](#43-scoped-generic-entity-crud)
   - [4.4 Custom Business Functions Engine](#44-custom-business-functions-engine)
   - [4.5 Real-Time Analytics & P&L Engine](#45-real-time-analytics--pl-engine)
5. [Business Workflows & Operator Manual](#5-business-workflows--operator-manual)
   - [5.1 9-Step Store Onboarding](#51-9-step-store-onboarding)
   - [5.2 Cashier Shift Lifecycle & Cash Float](#52-cashier-shift-lifecycle--cash-float)
   - [5.3 Point of Sale Checkout & Scanning](#53-point-of-sale-checkout--scanning)
   - [5.4 Customer Loyalty & Points Redemption](#54-customer-loyalty--points-redemption)
   - [5.5 End-of-Day Z-Report Reconciliation](#55-end-of-day-z-report-reconciliation)
   - [5.6 Inventory Restocking & Barcode Printing](#56-inventory-restocking--barcode-printing)
6. [Kenyan Regulatory & Payment Integrations](#6-kenyan-regulatory--payment-integrations)
   - [6.1 KRA eTIMS Compliance & CUIN Generation](#61-kra-etims-compliance--cuin-generation)
   - [6.2 Safaricom M-Pesa (Daraja API) Integration](#62-safaricom-m-pesa-daraja-api-integration)
7. [Installation, Setup & Deployment](#7-installation-setup--deployment)
   - [7.1 Local Development Setup](#71-local-development-setup)
   - [7.2 Docker & Container Orchestration](#72-docker--container-orchestration)
   - [7.3 Production Server Architecture (Linux, Nginx, Gunicorn)](#73-production-server-architecture-linux-nginx-gunicorn)
   - [7.4 Point of Sale Hardware Integration](#74-point-of-sale-hardware-integration)
8. [Security & Loss Prevention Audit Trail](#8-security--loss-prevention-audit-trail)

---

# 1. Executive Summary & System Vision

**DukaPOS** is a comprehensive, local-first, cloud-synchronized Point of Sale (POS) and Retail Enterprise Resource Planning (ERP) platform. It is engineered specifically to address the daily operational, fiscal, and logistics challenges faced by retail businesses in Kenya and across East Africa.

Retailers in this market operate under demanding conditions:
- **Stringent Regulatory Oversight**: Compliance with the Kenya Revenue Authority (KRA) electronic Tax Invoice Management System (eTIMS) is legally mandated for VAT-registered and non-VAT traders alike.
- **Mobile Money Dominance**: Safaricom M-Pesa is the ubiquitous payment medium, requiring seamless STK Push prompts and C2B till reconciliation.
- **Cash Drawer Loss Prevention**: Ensuring cash drawers balance with starting floats, recorded cash sales, and authorized float expenses.
- **Supply Chain Agility**: Rapid barcode scanning, restock workflows, purchase order lifecycle tracking, and supplier credit management.
- **Multi-Store Scaling**: Centralized oversight across multiple retail branches while enforcing strict multi-tenant boundaries.

DukaPOS satisfies all these requirements within a unified, modern, high-speed software architecture.

---

# 2. System Architecture

## 2.1 High-Level Architecture

The system utilizes a decoupled Client-Server model. The client is a lightweight React 18 single-page application communicating via RESTful JSON over HTTPS with a Python/Django REST Framework backend.

```mermaid
graph TD
    subgraph Client Layer [Frontend - React 18 / Vite]
        UI[Tailwind CSS + shadcn/ui Components]
        State[TanStack Query v5 + Context API]
        Router[React Router DOM v6 - Protected & Admin Routes]
        APIClient[Axios/Fetch API Client with JWT Interceptors]
    end

    subgraph Gateway / Network Layer
        Nginx[Nginx Reverse Proxy / SSL Termination]
        StaticCDN[WhiteNoise / S3 Storage]
    end

    subgraph Backend Layer [Django 5.2 + Django REST Framework]
        AuthMW[JWT Authentication & Multi-Tenant Middleware]
        Views[Modular API Views: Auth, Tenant, Cashier, CRUD, Functions, Analytics]
        Engines[Business Logic Engines: Stock Deduction, Loyalty Engine, Shift Z-Reconciliation]
        PDFGen[ReportLab Thermal & PDF Generator Engine]
    end

    subgraph Data & External Services
        DB[(PostgreSQL / SQLite Database)]
        KRA[KRA eTIMS VSCU / OSCU Engine]
        Daraja[Safaricom M-Pesa Daraja STK Push API]
        S3Vault[AWS S3 / Document Vault Hub]
    end

    UI --> State --> Router --> APIClient
    APIClient -->|HTTPS / REST API| Nginx
    Nginx --> AuthMW --> Views
    Views --> Engines --> DB
    Views --> PDFGen
    Engines --> KRA
    Engines --> Daraja
    Views --> S3Vault
```

## 2.2 Technology Stack

### Frontend (Client)
- **Framework**: React 18.2.0 initialized with Vite 6.1 bundler.
- **UI Kit & Styles**: Tailwind CSS 3.4, Radix UI primitives (`@radix-ui`), custom shadcn/ui components, Lucide icons (`lucide-react`).
- **Server Cache & Async State**: TanStack React Query v5 (`@tanstack/react-query`) ensuring instant optimistic updates and intelligent cache invalidation.
- **Client Routing**: React Router DOM v6 with role-aware route barriers (`ProtectedRoute`, `AdminRoute`).
- **Data Visualization**: Recharts 2.15 for interactive revenue charts, payment method distribution, and sales velocity heatmaps.
- **Printing & Documents**: `jsPDF`, `html2canvas`, and native browser ESC/POS print styles for 80mm thermal receipt printers.
- **Barcode & Audio**: `JsBarcode` for Code128 generation and Web Audio API for cashier auditory confirmations.

### Backend (Server)
- **Core Framework**: Python 3.10+ with Django 5.2 LTS and Django REST Framework 3.17.
- **Authentication**: Stateless JSON Web Tokens (`djangorestframework-simplejwt`) with auto-rotation.
- **Relational Database**: PostgreSQL 15 for production high-concurrency environments; SQLite for zero-config local development.
- **Document Engine**: ReportLab 5.0 generating binary PDF streams for thermal receipts, hardware manuals, and fiscal roadmaps.
- **Object Storage**: AWS S3 via `boto3` and `django-storages` for the Receipters Vault document hub.
- **Asset Pipeline**: WhiteNoise 6.9 for ultra-fast static file delivery.

## 2.3 Multi-Tenancy & Data Isolation Model

DukaPOS utilizes a **Row-Level Shared Database Multi-Tenancy** architecture:
1. Every business organization is provisioned with a discrete `Tenant` record containing its slug, plan, and operational flags.
2. Every business record (`Product`, `Sale`, `Shift`, `Customer`, etc.) has a foreign key pointing to `Tenant`.
3. The request context automatically extracts the operating tenant through `get_tenant_for_user(request)`:
   - Evaluates `X-Tenant-Id` header or `?tenant_id=` query parameter.
   - Evaluates `request.user.profile.tenant`.
   - Rejects cross-tenant access attempts.
4. Database queries are dynamically scoped through `get_scoped_queryset(request, ModelClass)`, ensuring complete data isolation between competing retail shops.

## 2.4 Role-Based Access Control (RBAC)

System users belong to one of three roles:
- **Admin (Business Owner / Superadmin)**: Unrestricted access across all operational modules, settings, staff hiring, gross profit analytics, and fiscal configurations.
- **Manager (Branch Supervisor)**: Oversight of branch cashiers, inventory replenishment, purchase orders, and shift audit approvals.
- **Cashier (Counter Operator)**: Dedicated access to the POS checkout screen, self shift clock-in, Z-report cash counts, and price lookups. Restricted from viewing cost prices, supplier margins, or editing catalog prices.

## 2.5 Codebase & Directory Structure

```
dukaPOS/
├── client/                     # Frontend Application (React 18 + Vite)
│   ├── public/                 # Favicons, static images, sound clips
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.js    # Centralized HTTP Client & API bindings
│   │   ├── components/         # Modular React components
│   │   │   ├── barcode/        # Barcode generation and print dialogs
│   │   │   ├── dashboard/      # Executive KPI cards and charts
│   │   │   ├── inventory/      # Stock tables, restock modals
│   │   │   ├── layout/         # AppLayout, Sidebar, Navigation
│   │   │   ├── onboarding/     # 9-step store setup wizard
│   │   │   ├── pos/            # Cart, ProductGrid, Z-Report, HeldOrders
│   │   │   └── ui/             # Radix UI + shadcn atomic widgets
│   │   ├── lib/                # AuthContext, QueryClient, formatters
│   │   ├── pages/              # 30+ Route views
│   │   ├── App.jsx             # Main router configuration
│   │   └── main.jsx            # Application entrypoint
│   └── package.json
│
├── server/                     # Backend Application (Django 5.2 + DRF)
│   ├── api/
│   │   ├── views/              # Modular controller/view layer
│   │   │   ├── analytics_views.py # P&L, KPI, Sales velocity
│   │   │   ├── auth_views.py   # JWT, OTP, Google OAuth
│   │   │   ├── cashier_views.py# Staff management, cashier invitations
│   │   │   ├── crud_views.py   # Scoped generic entity handlers
│   │   │   ├── function_views.py# Z-report, eTIMS, PDF generation
│   │   │   ├── helpers.py      # Scoping, stock deduction, loyalty engine
│   │   │   └── tenant_views.py # Tenant onboarding & multi-branch
│   │   ├── models.py           # 22 Database models
│   │   ├── serializers.py      # Model serializers
│   │   └── urls.py             # Route definitions
│   ├── server/                 # Django settings & wsgi/asgi
│   ├── manage.py
│   └── requirements.txt
│
├── docs/                       # Modular documentation files
├── docker-compose.yml          # Local multi-container environment
└── package.json                # Root automation scripts
```

---

# 3. Database Schema & Data Models

DukaPOS incorporates 22 specialized models in `server/api/models.py`.

```mermaid
erDiagram
    Tenant ||--o{ UserProfile : has
    Tenant ||--o{ BusinessSettings : configures
    Tenant ||--o{ Branch : operates
    Tenant ||--o{ CashierInvite : issues
    Tenant ||--o{ Product : stocks
    Tenant ||--o{ Customer : registers
    Tenant ||--o{ Supplier : purchases_from
    Tenant ||--o{ Shift : records
    Tenant ||--o{ Sale : transacts
    Tenant ||--o{ Expense : tracks
    Tenant ||--o{ EmployeeRating : reviews
    Tenant ||--o{ EmployeeSchedule : schedules
    Tenant ||--o{ Promotion : publishes
    Tenant ||--o{ MpesaPayment : receives
    Tenant ||--o{ ShiftAudit : audits
    Tenant ||--o{ CashFlow : monitors
    Tenant ||--o{ PurchaseOrder : procures
    Tenant ||--o{ VaultDocument : archives
    Tenant ||--o{ ReceiptFeedback : collects
    Tenant ||--o{ Subscription : pays
```

## 3.1 Multi-Tenant & Identity Entities

### `Tenant`
Represents an enterprise retail subscriber.
- `id` (`AutoField`): Primary key.
- `name` (`CharField(255)`): Business organization name.
- `slug` (`SlugField(100, unique=True)`): Unique URL-safe identifier.
- `owner_name`, `owner_email`, `owner_phone`: Primary proprietor details.
- `business_type` (`CharField(100)`): SME, supermarket, pharmacy, etc.
- `currency` (`CharField(10, default='KES')`): Currency code.
- `plan` (`CharField(50, default='starter')`): Subscription tier.
- `is_active` (`BooleanField(default=True)`): Active tenant flag.
- `is_onboarded` (`BooleanField(default=False)`): Indicates completion of setup wizard.

### `UserProfile`
Binds a Django `User` to a `Tenant` with an explicit role.
- `user` (`OneToOneField(User, related_name='profile')`).
- `tenant` (`ForeignKey(Tenant, related_name='user_profiles')`).
- `role` (`CharField(50, default='admin')`): `admin`, `manager`, or `cashier`.

### `CashierInvite`
Tokenized invitation management for employee onboarding.
- `tenant` (`ForeignKey(Tenant)`).
- `email` (`EmailField`): Destination staff email.
- `role` (`CharField(50, default='cashier')`).
- `token` (`UUIDField(default=uuid.uuid4, unique=True)`).
- `accepted` (`BooleanField(default=False)`).
- `expires_at` (`DateTimeField`): Default 48-hour lifespan.

## 3.2 Organization & Branch Hierarchy

### `BusinessSettings`
Store operational rules, tax configurations, and payment parameters.
- `tenant` (`ForeignKey(Tenant)`).
- `business_name`, `trading_name`: Formal legal and retail brand names.
- `kra_pin` (`CharField(50, default='A001234567Z')`): Kenya Revenue Authority tax identifier.
- `vat_registered` (`BooleanField`), `default_tax_rate` (`FloatField(default=16.0)`).
- `etims_enabled` (`BooleanField(default=False)`): Automatic fiscal submission toggle.
- `mpesa_paybill`, `mpesa_till`, `mpesa_account`: Safaricom payment routing credentials.
- `receipt_header`, `receipt_footer`: Printable receipt custom text.

### `Branch`
Multi-location store support.
- `tenant` (`ForeignKey(Tenant)`).
- `name` (`CharField(255)`), `code` (`CharField(50)`): e.g. "Nairobi CBD", "NBI-01".
- `location` (`TextField`): Physical address.
- `manager` (`CharField(255)`): Designated supervisor.
- `monthly_rent`, `debt`: Financial overhead tracking per branch.
- `status`: `active`, `maintenance`, `closed`.

## 3.3 Product Catalog & Stock Entities

### `Product`
Master merchandise record.
- `tenant` (`ForeignKey(Tenant)`).
- `name` (`CharField(255)`): Item title.
- `sku` (`CharField(100, unique=True)`): Barcode or stock keeping unit.
- `category` (`CharField(100)`): Grouping (e.g. Dairy, Beverages, Household).
- `price` (`FloatField`): Retail selling price.
- `cost_price` (`FloatField`): Wholesale purchase cost.
- `stock_quantity` (`IntegerField(default=0)`): Current shelf inventory.
- `low_stock_threshold` (`IntegerField(default=10)`): Reorder trigger alert point.
- `tax_rate` (`FloatField(default=16.0)`): Applicable VAT percentage.
- `is_active` (`BooleanField(default=True)`).

## 3.4 Sales, Shifts & Cash Operations

### `Shift`
Cashier work session tracking.
- `tenant` (`ForeignKey(Tenant)`).
- `cashier_id`, `cashier_name`: Staff identification.
- `status`: `active` or `closed`.
- `started_at`, `ended_at`: Timestamps.
- `starting_cash`: Opening cash float in the drawer.
- `total_sales`, `total_transactions`: Session totals.

### `Sale`
Immutable checkout ledger.
- `tenant` (`ForeignKey(Tenant)`).
- `receipt_number` (`CharField(100, unique=True)`): Unique transaction code.
- `shift_id` (`CharField(100)`): Active shift linkage.
- `cashier_id`, `cashier_name`: Operating cashier.
- `subtotal`, `tax_total`, `total_amount`: Financial breakdown.
- `payment_method`: `cash`, `mpesa`, `card`, `split`.
- `status`: `completed`, `refunded`, `voided`.
- `items` (`JSONField`): Complete snapshot of purchased products, quantities, prices.
- `etims_status`: `pending`, `submitted`, `failed`.
- `cuin` (`CharField(100)`): KRA eTIMS Control Unit Internal Number.

### `MpesaPayment`
Mobile money transaction log.
- `merchant_request_id`, `checkout_request_id`: Safaricom gateway IDs.
- `amount`, `phone_number`: Transaction details.
- `status`: `pending`, `success`, `failed`.
- `receipt_number`: Safaricom M-Pesa code (e.g. `QHD8492019`).

## 3.5 Customers, Loyalty & Feedback

### `Customer`
CRM profile with automated loyalty engine.
- `tenant` (`ForeignKey(Tenant)`).
- `name`, `phone`, `email`.
- `loyalty_points` (`IntegerField(default=0)`): Earned balance (1 pt per 100 KES spent).
- `total_spending` (`FloatField`), `total_transactions` (`IntegerField`).
- `tier` (`CharField(50)`): `bronze` (< 5,000 KES), `silver` (>= 5,000 KES), `gold` (>= 20,000 KES).

### `ReceiptFeedback`
Customer feedback and ratings.
- `receipt_number`, `merchant_name`, `rating` (1-5 stars), `comment`.

## 3.6 Procurement & Suppliers

### `Supplier`
Vendor profile for inventory supply.
- `name`, `contact_person`, `phone`, `email`, `address`.
- `payment_terms`: `cash_on_delivery`, `net_15`, `net_30`, `net_60`.

### `PurchaseOrder`
Procurement document.
- `order_number` (`CharField(100, unique=True)`).
- `supplier_id`, `supplier_name`.
- `items` (`JSONField`), `subtotal`, `tax_amount`, `total_amount`.
- `status`: `draft`, `submitted`, `approved`, `delivered`, `cancelled`.
  > **Stock Automation**: Transitioning status to `delivered` automatically invokes `process_purchase_order_stock_increase()`, incrementing product stock counts!

## 3.7 Financials, Expenses & Audits

### `Expense`
Operational expenditure logging.
- `shift_id`: Linked cashier shift if paid out of drawer float.
- `amount`, `category` (Rent, Utilities, Wages, Repairs, Restock).
- `payment_method`: `cash`, `mpesa`, `card`, `bank_transfer`.
- `reference_number`, `receipt_url`, `is_recurring`.

### `CashFlow`
Cash flow monitoring.
- `transaction_type`: `inflow` or `outflow`.
- `amount`, `category`, `payment_method`, `date`.

### `ShiftAudit`
Loss prevention and audit trail.
- `shift_id`, `action` (`close`, `openDrawer`, `voidItem`, `managerOverride`).
- `performed_by`: Username.
- `notes`: Contains cash variance diagnostic:
  $$\text{Expected Cash} = \text{Starting Cash} + \text{Cash Sales} - \text{Cash Drawer Expenses}$$
  $$\text{Variance} = \text{Actual Cash} - \text{Expected Cash}$$

## 3.8 Document Vault & Subscriptions

### `VaultDocument`
Digital archiving for receipts, tax certificates, and invoices.
- `title`, `document_type`, `file_url`, `tags`, `is_locked`, `is_archived`.

### `Subscription`
Tenant SaaS licensing and M-Pesa billing.
- `plan_name`, `amount`, `billing_cycle`, `status`, `mpesa_reference`.

---

# 4. REST API Reference & Specifications

Base URI: `/api/`  
Auth Header: `Authorization: Bearer <jwt_access_token>`  
Optional Tenant Override: `X-Tenant-Id: <tenant_id>`

## 4.1 Authentication Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/auth/login/` | POST | Public | Authenticates user; returns JWT access/refresh tokens and profile. |
| `/auth/register/` | POST | Public | User registration endpoint. |
| `/auth/register-tenant/` | POST | Public | Registers business entity and initializes primary admin user. |
| `/auth/me/` | GET | Authenticated | Fetches active user session and tenant details. |
| `/auth/verify-otp/` | POST | Public | Validates 6-digit email OTP during registration. |
| `/auth/resend-otp/` | POST | Public | Re-transmits fresh registration OTP via email. |
| `/auth/google/` | POST | Public | Verifies Google OAuth token; provisions user and tenant. |
| `/auth/invite/accept/` | GET, POST | Public | Validates invitation token (`GET`) and creates staff password (`POST`). |

## 4.2 Tenant & Staff Administration

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/tenants/onboard/` | POST | Admin | Submits 9-step store setup wizard configurations. |
| `/tenants/my-tenants/` | GET, POST | Authenticated | Lists all accessible tenant stores or registers an additional store. |
| `/tenants/switch/` | POST | Authenticated | Switches active tenant workspace context. |
| `/tenants/cashiers/` | GET, POST | Admin/Manager | Lists active tenant cashiers or provisions a new cashier account. |
| `/tenants/cashiers/<id>` | GET, PUT, DELETE | Admin | Manages individual staff record. |
| `/tenants/cashiers/invite/` | POST | Admin | Dispatches tokenized email invitation link. |

## 4.3 Scoped Generic Entity CRUD

**Endpoints**:
- `GET /entities/<entity_name>`: List items with `?sort=`, `?limit=`, and `?low_stock=true`.
- `POST /entities/<entity_name>`: Create record with automatic tenant association.
- `GET /entities/<entity_name>/<pk>`: Retrieve single record by ID.
- `PUT /entities/<entity_name>/<pk>`: Update record fields.
- `DELETE /entities/<entity_name>/<pk>`: Delete record.
- `POST /entities/<entity_name>/filter`: Complex query matching criteria payload.

**Supported Entity Names**:
`BusinessSettings`, `Branch`, `Product`, `Customer`, `Supplier`, `Shift`, `Sale`, `Expense`, `EmployeeRating`, `EmployeeSchedule`, `Promotion`, `MpesaPayment`, `ShiftAudit`, `CashFlow`, `PurchaseOrder`, `VaultDocument`, `ReceiptFeedback`, `Subscription`.

## 4.4 Custom Business Functions Engine

**Endpoint**: `POST /api/functions/invoke`

### Function Actions:
1. **`shiftAudit` / `closeShift` / `getZReport`**: Reconciles drawer cash against sales and float; generates official Z-Report.
2. **`submitEtimsInvoice`**: Issues KRA eTIMS CUIN and updates sales record to `submitted`.
3. **`mpesaStkPush`**: Triggers Safaricom Daraja STK Push prompt to customer handset.
4. **`logAuditAction`**: Records critical cashier actions (`openDrawer`, `voidItem`, `managerOverride`).
5. **PDF Binary Generators**:
   - `generateReceiptPDF`: Generates 80mm ESC/POS formatted thermal receipt.
   - `generateHardwarePDF`: Downloads POS hardware guide.
   - `generateBrandingPDF`: Downloads store branding guide.
   - `generateUserManualPDF`: Downloads operator guide.
   - `generateEtimsRoadmapPDF`: Downloads eTIMS compliance steps.

## 4.5 Real-Time Analytics & P&L Engine

**Endpoint**: `GET /api/analytics`  
**Query Parameters**: `range` (`today`, `7d`, `30d`, `90d`, `ytd`), `branch_id` (`all` or ID).

**Core Metric Sections**:
- **KPIs**: Today revenue, yesterday revenue, today expenses, transactions count, average basket value, low stock items count.
- **Profit & Loss (P&L)**:
  $$\text{Gross Profit} = \text{Revenue} - \text{COGS}$$
  $$\text{Net Profit} = \text{Gross Profit} - \text{Operating Expenses}$$
  $$\text{Gross Margin \%} = \frac{\text{Gross Profit}}{\text{Revenue}} \times 100$$
- **Velocity & Breakdowns**: Weekly sales curve, payment method breakdown (Cash vs M-Pesa vs Card), hourly sales heatmap, dead stock vs fast movers.
- **Compliance Health**: eTIMS submission rate, CUIN coverage %, audit alerts.

---

# 5. Business Workflows & Operator Manual

## 5.1 9-Step Store Onboarding

When a new business signs up, DukaPOS guides the owner through `/onboarding`:
1. Business identity (Legal Name, Trading Name, Business Type).
2. Tax & Fiscal registration (KRA PIN, VAT status, standard 16% rate).
3. Payment credentials (M-Pesa Till & Paybill numbers).
4. Receipt layout (Logo, greetings, return policies).
5. Fast-moving initial inventory catalog.
6. Primary branch location and hours.
7. Cashier team creation & PIN assignment.
8. Plan subscription selection.
9. Final activation and redirection to live POS!

## 5.2 Cashier Shift Lifecycle & Cash Float

1. **Clock In**: Staff logs in, navigates to POS, and inputs their starting cash float.
2. **Active Shift**: All sales, returns, and cash expenses logged during the shift are linked to `shift.id`.
3. **Clock Out / Z-Report**: At shift completion, the cashier inputs the physical cash counted in the drawer. The system compares counted cash to theoretical expected cash, logging any surplus or shortage variance in `ShiftAudit`.

## 5.3 Point of Sale Checkout & Scanning

1. **Scan / Select Items**: Scan barcodes with a handheld laser scanner, search by name (`F2`), or tap quick-key buttons.
2. **Adjust Quantities & Discounts**: Modify counts, apply percentage or fixed discounts (`F9`), or scan promo vouchers.
3. **Tender Payment (`F12` / `Space`)**:
   - **Cash**: Enter tendered sum. System computes change due and plays the cash drawer trigger tone.
   - **M-Pesa STK Push**: Enter customer phone number and tap **Send STK**. The phone immediately prompts for PIN.
   - **Card / Split**: Enter card approval codes or split payment across cash and M-Pesa.
4. **Receipt Dispatch**: The receipt is automatically generated with its KRA CUIN number and printed via thermal receipt printer or shared digitally.
5. **Inventory Automation**: DukaPOS immediately deducts sold product quantities from live stock balances.

## 5.4 Customer Loyalty & Points Redemption

- **Point Accrual**: Every completed sale credits the customer profile with **1 Point per 100 KES spent**.
- **Redemption**: Cashiers can redeem accumulated points at checkout (1 Point = 1 KES credit).
- **Automated Tier Progression**:
  - **Bronze**: Default new customer tier.
  - **Silver**: Automatically achieved at KES 5,000 lifetime spend.
  - **Gold**: Automatically achieved at KES 20,000 lifetime spend.

## 5.5 End-of-Day Z-Report Reconciliation

The daily Z-Report provides managerial accountability:
- Summarizes total gross revenue, transaction counts, and average transaction value.
- Itemizes sales by payment method (Cash, M-Pesa, Card).
- Accounts for opening float and float expenses (e.g. casual wages or emergency stock purchases).
- Produces an immutable audit ledger entry for loss prevention and accounting compliance.

## 5.6 Inventory Restocking & Barcode Printing

- **Scan-to-Restock**: Click the scan-to-restock bar in `/inventory`. Scan any product barcode to instantly increment stock by delivery quantities.
- **Purchase Order Delivery**: When an incoming PO is marked `delivered`, all line items automatically update store inventory.
- **Barcode Generator**: For unpackaged or local produce, generate standard Code128 barcodes from the UI and print directly to thermal barcode sticker labels.

---

# 6. Kenyan Regulatory & Payment Integrations

## 6.1 KRA eTIMS Compliance & CUIN Generation

The system complies with the electronic Tax Invoice Management System regulations:
- **Trader PIN Validation**: Ensures strict format compliance (e.g. `P051234567Z` or `A001234567Z`).
- **CUIN (Control Unit Internal Number)**: Generates and records unique fiscal serials for every invoice.
- **Tax Breakdown**: Automatically computes Standard 16% VAT, Exempt supplies, and Zero-rated commodities.
- **Fiscal Receipts**: Prints official receipt headers with trader PIN, tax summary, and fiscal control number.

## 6.2 Safaricom M-Pesa (Daraja API) Integration

- **Lipa Na M-Pesa Online (STK Push)**: Initiates instantaneous USSD push notifications to shopper handsets.
- **Buy Goods & Services Till Integration**: Supports direct Till number transactions with cashier transaction code verification.
- **Paybill Integration**: Accommodates retail businesses requiring customer account references.

---

# 7. Installation, Setup & Deployment

## 7.1 Local Development Setup

### 1. System Requirements
- Node.js 18+ LTS
- Python 3.10+
- Git, npm, and pip

### 2. Installation
```bash
git clone https://github.com/your-org/dukaPOS.git
cd dukaPOS

# Install both client and server dependencies with one command
npm run install:all
```

### 3. Running Development
```bash
# Start frontend and backend concurrently:
npm run dev

# Or start individually:
npm run client  # Runs Vite on http://localhost:5173
npm run server  # Runs Django on http://localhost:5000
```

## 7.2 Docker & Container Orchestration

### Development Mode
```bash
docker compose up --build
```
Spins up PostgreSQL, Django backend, and Vite frontend with volume-mounted hot reload.

### Production Mode
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 7.3 Production Server Architecture (Linux, Nginx, Gunicorn)

In production environments, DukaPOS is served via Nginx (reverse proxy and SSL termination) pointing to Gunicorn application workers and a dedicated PostgreSQL database.

```mermaid
graph LR
    Client((Browser / POS Tablet)) -->|HTTPS :443| Nginx[Nginx Reverse Proxy]
    Nginx -->|Static Assets| StaticFiles[/var/www/dukapos/client/dist]
    Nginx -->|Proxy Pass /api/| Gunicorn[Gunicorn WSGI :8000]
    Gunicorn --> Django[Django Application]
    Django --> Postgres[(PostgreSQL 15)]
    Django --> S3[(AWS S3 Vault)]
```

### Essential Production Environment Variables
| Variable | Description | Example |
|---|---|---|
| `DEBUG` | Django debug toggle | `False` |
| `SECRET_KEY` | Django cryptographic secret | `production-entropy-key` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/dbname` |
| `ALLOWED_HOSTS` | Authorized host domain names | `pos.yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `https://pos.yourdomain.com` |
| `ETIMS_KRA_PIN` | KRA registered trader PIN | `P051234567Z` |
| `MPESA_PASSKEY` | Safaricom Daraja passkey | `bf6b3716...` |

## 7.4 Point of Sale Hardware Integration

1. **Thermal Receipt Printers (80mm & 58mm)**:
   - USB, LAN, or Bluetooth ESC/POS printers.
   - Configure browser print settings to "Margins: None" and "Headers/Footers: Off".
2. **Barcode Scanners (Laser / 2D QR)**:
   - USB or Wireless 2.4GHz HID keyboard wedge scanners.
   - Requires carriage return (`Enter`) suffix for automatic cart addition.
3. **Cash Drawers (RJ11)**:
   - Connects to the DK (Drawer Kick) port of the thermal printer.
   - Auto-triggers open on checkout or via manual manager override.

---

# 8. Security & Loss Prevention Audit Trail

Loss prevention is fundamental to retail survival. DukaPOS enforces security through:
- **Tenant Data Isolation**: Database-level query scoping prevents unauthorized cross-tenant data access.
- **Cryptographic Authentication**: High-security PBKDF2 password hashing and rotating JWT access tokens.
- **Manager Overrides**: Critical actions (drawer opening without sale, voiding rang-up items, price overrides) require administrative authorization and are permanently recorded in the `ShiftAudit` ledger.
- **Blind Cash Drawer Count**: Cashiers perform physical drawer counts without being pre-shown the expected balance, preventing cash reconciliation manipulation.

---

*DukaPOS — Empowering Kenyan Retail Enterprises with Reliable, Compliant, and High-Speed Point of Sale Technology.*
