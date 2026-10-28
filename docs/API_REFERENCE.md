# DukaPOS — REST API Reference & Specification

All API endpoints are served under the `/api/` prefix.

## Authentication & Headers

Protected routes require a JSON Web Token (JWT) supplied in the `Authorization` header:
```http
Authorization: Bearer <access_token>
```

When multi-tenant routing requires explicit tenant targeting, clients can optionally send:
```http
X-Tenant-Id: <tenant_id>
```

---

## 1. Authentication Endpoints

### `POST /api/auth/register-tenant/`
Registers a new enterprise tenant and provisions the initial business administrator account.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "business_name": "Mega Duka Supermarket",
    "owner_email": "owner@megaduka.co.ke",
    "owner_name": "David Kamau",
    "owner_phone": "+254712345678",
    "password": "SecurePassword123!",
    "business_type": "supermarket",
    "currency": "KES",
    "plan": "starter"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Business registered successfully!",
    "user": { "id": "u_1", "email": "owner@megaduka.co.ke", "role": "admin" },
    "tenant": { "id": 1, "name": "Mega Duka Supermarket", "slug": "mega-duka-supermarket" },
    "token": "<jwt_access_token>",
    "access_token": "<jwt_access_token>",
    "refresh_token": "<jwt_refresh_token>"
  }
  ```

### `POST /api/auth/login/`
Authenticates a user via email and password, verifying permissions and returning access credentials.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "cashier@megaduka.co.ke",
    "password": "CashierPassword123",
    "role": "cashier"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": 2,
    "username": "cashier_megaduka",
    "email": "cashier@megaduka.co.ke",
    "token": "<jwt_access_token>",
    "access_token": "<jwt_access_token>",
    "refresh_token": "<jwt_refresh_token>",
    "profile": {
      "role": "cashier",
      "tenant": { "id": 1, "name": "Mega Duka Supermarket" }
    }
  }
  ```

### `GET /api/auth/me/`
Returns current authenticated user session, profile role, and active tenant data.
- **Access**: Bearer Token required
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "username": "owner_megaduka",
    "email": "owner@megaduka.co.ke",
    "is_staff": true,
    "profile": { "role": "admin", "tenant": { "id": 1, "name": "Mega Duka Supermarket" } }
  }
  ```

### `POST /api/auth/google/`
Verifies a Google OAuth ID token from the frontend and links or creates the user and tenant.
- **Request Body**: `{ "credential": "<google_id_token>" }`

### `GET & POST /api/auth/invite/accept/`
Validates staff invitation tokens and sets up cashier credentials.
- **GET `?token=<uuid>`**: Returns `{ "email": "staff@...", "tenant_name": "...", "role": "cashier" }`
- **POST**:
  ```json
  { "token": "<uuid>", "name": "Mary Muthoni", "password": "NewStaffPassword" }
  ```

---

## 2. Tenant Management Endpoints

### `POST /api/tenants/onboard/`
Completes the multi-step store configuration (KRA PIN, M-Pesa till, address, initial inventory).
- **Access**: Admin (Bearer Token)
- **Request Body**:
  ```json
  {
    "business_name": "Mega Duka Supermarket",
    "kra_pin": "P051234567Z",
    "vat_registered": true,
    "default_tax_rate": 16.0,
    "mpesa_till": "543210",
    "business_phone": "+254712345678",
    "business_address": "Kenyatta Avenue, Nairobi",
    "initial_products": [
      { "name": "Milk 500ml", "price": 65, "cost_price": 50, "stock_quantity": 40 }
    ]
  }
  ```

### `GET & POST /api/tenants/my-tenants/`
Lists all business tenants the current user is linked to, or registers a secondary branch/store.

### `POST /api/tenants/switch/`
Switches the user's active tenant session context.
- **Request Body**: `{ "tenant_id": 2 }`

### `GET, POST /api/tenants/cashiers/`
- **GET**: Lists all cashiers belonging strictly to the active tenant.
- **POST**: Provisions a new cashier directly with a PIN/password.

### `POST /api/tenants/cashiers/invite/`
Sends a tokenized email invitation to an employee.
- **Request Body**: `{ "email": "newcashier@gmail.com", "role": "cashier" }`

---

## 3. Generic Entity CRUD Engine (`/api/entities/<entity_name>`)

DukaPOS exposes a high-performance scoped entity engine supporting the following models:
- `BusinessSettings`, `Branch`, `Product`, `Customer`, `Supplier`, `Shift`, `Sale`, `Expense`, `EmployeeRating`, `EmployeeSchedule`, `Promotion`, `MpesaPayment`, `ShiftAudit`, `CashFlow`, `PurchaseOrder`, `VaultDocument`, `ReceiptFeedback`, `Subscription`.

### `GET /api/entities/<entity_name>`
Retrieves records scoped to the tenant.
- **Query Parameters**:
  - `sort`: Field to sort by. Prefix with `-` for descending (e.g. `?sort=-created_at`).
  - `limit`: Integer count of items to return.
  - `low_stock=true`: Specifically for `Product`, filters items where `stock_quantity <= low_stock_threshold`.

### `POST /api/entities/<entity_name>`
Creates a new record automatically assigned to the current tenant.

### `POST /api/entities/<entity_name>/filter`
Runs structured queries matching multiple criteria.
- **Request Body**:
  ```json
  {
    "category": "Beverages",
    "is_active": true
  }
  ```

### `GET, PUT, DELETE /api/entities/<entity_name>/<id>`
- **GET**: Returns details of the record. Supports both prefixed IDs (`p_4`, `sale_12`) and raw integer PKs.
- **PUT**: Updates existing record fields.
- **DELETE**: Deletes the entity record.

---

## 4. Business Logic & Custom Functions (`POST /api/functions/invoke`)

The functions engine accepts a command name and payload dictionary.

### A. End-of-Day Shift & Z-Report Reconciliation
```json
{
  "name": "shiftAudit",
  "payload": {
    "shift_id": "shift_12",
    "actual_cash": 14500,
    "action": "close",
    "notes": "Evening shift drawer count completed."
  }
}
```
**Response**:
```json
{
  "status": "success",
  "message": "Shift audit action 'close' processed successfully",
  "z_report": {
    "shift_id": "shift_12",
    "cashier_name": "David Mwangi",
    "total_transactions": 84,
    "total_revenue": 34800,
    "cash_sales": 15000,
    "mpesa_sales": 18200,
    "card_sales": 1600,
    "starting_cash": 2000,
    "cash_expenses": 2500,
    "expected_cash": 14500,
    "actual_cash": 14500,
    "variance": 0.0,
    "is_balanced": true
  }
}
```

### B. KRA eTIMS Invoice Submission
```json
{
  "name": "submitEtimsInvoice",
  "payload": {
    "sale": { "id": "sale_45" }
  }
}
```
**Response**:
```json
{
  "status": "success",
  "message": "Invoice submitted to eTIMS successfully",
  "cuin": "KRAETIMS9482710394",
  "etims_status": "submitted"
}
```

### C. M-Pesa STK Push Prompt
```json
{
  "name": "mpesaStkPush",
  "payload": {
    "phone": "254712345678",
    "amount": 1500,
    "account_reference": "POS-SALE-45"
  }
}
```

### D. Audit Logging for Manager Overrides
Captures loss prevention events (voided items, drawer opened with no sale, manager override):
```json
{
  "name": "logAuditAction",
  "payload": {
    "action": "openDrawer",
    "notes": "Manager opened drawer for change exchange.",
    "shift_id": "shift_12"
  }
}
```

### E. PDF Document & Thermal Receipt Generation
Functions that return `application/pdf` binary stream:
- `generateReceiptPDF`: Prints formatted 80mm thermal receipt with line items, tax breakdown, and eTIMS CUIN.
- `generateHardwarePDF`: Downloads official hardware recommendation guide.
- `generateBrandingPDF`: Downloads branding assets and style guidelines.
- `generateUserManualPDF`: Downloads printable operator instructions.
- `generateEtimsRoadmapPDF`: Downloads step-by-step KRA integration guide.

---

## 5. Comprehensive Analytics Endpoint (`GET /api/analytics`)

Delivers a real-time executive dashboard combining store performance metrics.

### Query Parameters
- `range`: `today`, `7d`, `30d`, `90d`, `ytd` (default: `today`)
- `branch_id`: `all` or specific branch ID

### Response Structure (Excerpt)
```json
{
  "range_label": "Today",
  "live_status": {
    "live_sales_count": 42,
    "live_sales_revenue": 68450.0,
    "active_shifts_count": 2,
    "active_cashiers": ["David Mwangi", "Grace Njeri"]
  },
  "kpis": {
    "today_revenue": 68450.0,
    "yesterday_revenue": 59100.0,
    "today_expenses": 3200.0,
    "net_profit": 18450.0,
    "transactions_count": 42,
    "avg_transaction": 1630.0,
    "low_stock_count": 3
  },
  "profit_loss": {
    "revenue": 68450.0,
    "cogs": 46800.0,
    "gross_profit": 21650.0,
    "operating_expenses": 3200.0,
    "net_profit": 18450.0,
    "gross_margin_pct": 31.6,
    "vat_collected": 9441.38
  },
  "customer_loyalty": {
    "total_customers": 184,
    "loyalty_members": 142,
    "top_customers": [...]
  },
  "compliance_health": {
    "etims_submitted": 42,
    "etims_failed": 0,
    "cuin_coverage_pct": 100.0
  }
}
```
