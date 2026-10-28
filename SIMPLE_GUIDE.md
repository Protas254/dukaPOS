# DukaPOS — Simple Function & Feature Guide

A straightforward, practical guide explaining **what each feature and function in DukaPOS does** and **how to use it**, without technical code dumps or raw database fields.

---

## Table of Contents

- [1. User Accounts & Login](#1-user-accounts--login)
- [2. Setting Up Your Business (Onboarding)](#2-setting-up-your-business-onboarding)
- [3. Point of Sale (POS) & Checkout](#3-point-of-sale-pos--checkout)
- [4. Cashier Shifts & Cash Drawer (Z-Report)](#4-cashier-shifts--cash-drawer-z-report)
- [5. Inventory & Restocking](#5-inventory--restocking)
- [6. Customer Loyalty & Discounts](#6-customer-loyalty--discounts)
- [7. Purchasing & Suppliers](#7-purchasing--suppliers)
- [8. Expenses & Cash Flow](#8-expenses--cash-flow)
- [9. M-Pesa & KRA eTIMS Tax Compliance](#9-m-pesa--kra-etims-tax-compliance)
- [10. Reports & Analytics](#10-reports--analytics)
- [11. Document Vault (Receipters Vault)](#11-document-vault-receipters-vault)
- [12. Managing Multiple Branches](#12-managing-multiple-branches)

---

## 1. User Accounts & Login

### Sign In (`auth_login`)
- Cashiers and store owners enter their email, password, and select whether they are logging in as an **Admin** or a **Cashier**.
- Admins gain access to reports, settings, and inventory. Cashiers are directed straight to the sales counter.

### Sign Up (`auth_register` / `register_tenant`)
- Allows a new business owner to sign up with their email and business name.
- Automatically creates a fresh, private workspace for their store so no other business can see their data.

### Google Sign-In (`auth_google_login`)
- Allows owners to log in or register instantly with one click using their Google account.

### Email Verification (`auth_verify_otp` & `auth_resend_otp`)
- Sends a 6-digit verification code to the user's email during signup to confirm that the email address is real.

### Staff Invitation Link (`invite_cashier` & `accept_cashier_invite`)
- **Owner invites staff**: The owner enters a new cashier's email. The system sends them an invite link.
- **Cashier accepts**: The cashier clicks the link, enters their name, sets their password, and is immediately ready to work.

### Cashier Team Management (`tenant_cashiers`)
- Lets the store manager view all cashiers, create cashiers directly with a 4-digit PIN, update their details, or remove them when they leave the job.

---

## 2. Setting Up Your Business (Onboarding)

### 9-Step Setup Wizard (`onboard_tenant`)
When a store owner registers, this wizard sets up everything the shop needs in 9 simple steps:
1. **Store Details**: Enter the business name, phone number, and physical location.
2. **KRA eTIMS & Tax**: Enter your KRA PIN and set your default VAT rate (normally 16% in Kenya).
3. **M-Pesa Details**: Enter your Buy Goods Till number or Paybill number so customers know where to pay.
4. **Receipt Header & Footer**: Write the greeting at the top of receipts and a thank-you note at the bottom.
5. **Add First Products**: Add your most popular items or upload a spreadsheet to get started quickly.
6. **Branch Setup**: Set up your main branch location and opening hours.
7. **Create Cashiers**: Create accounts and PINs for your counter staff.
8. **Pick a Plan**: Choose the subscription tier that fits your store size.
9. **Launch**: Opens the live sales counter ready for customer checkouts!

---

## 3. Point of Sale (POS) & Checkout

### Adding Items to Cart
- **Barcode Scanner**: Scan an item with a handheld barcode scanner. It beeps and instantly appears in the cart.
- **Product Search (`F2`)**: Type any product name or SKU to quickly find and add it.
- **Quick Keys / Favorites Bar**: Tap one-click buttons for top daily items (like milk, bread, sodas, airtime).

### Price Check Mode (`F8`)
- Scan an item to check its price and remaining stock for a customer without adding it to the cart.

### Hold & Resume Orders (`F4` & `F5`)
- **Hold Order (`F4`)**: If a shopper forgets an item and walks away to grab it, the cashier can pause their cart with one key and serve the next person in line.
- **Resume Order (`F5`)**: Brings back the paused cart with all items intact when the customer returns.

### Discounts & Coupons (`F9`)
- Apply a percentage discount (e.g. 10% off), a fixed shilling discount (e.g. KES 100 off), or enter a promotion voucher code.

### Checkout & Payments (`Space` or `F12`)
- **Cash**: Enter the money handed over by the customer. The system calculates the exact change to give back and triggers the cash drawer to open.
- **M-Pesa STK Push**: Enter the customer's phone number and click Send. A payment prompt pops up directly on their phone screen asking for their M-Pesa PIN.
- **M-Pesa Till Number**: If the customer pays the counter till placard, the cashier types in the M-Pesa confirmation code to complete the sale.
- **Card**: For credit or debit card swipe payments.
- **Split Payment**: Allows a customer to pay part of the bill in cash and the remainder via M-Pesa.

### Automatic Stock Deduction
- The instant checkout is finished, the system automatically subtracts the sold items from your warehouse/shelf stock so inventory counts are always accurate.

### Receipt Printing (`generateReceiptPDF`)
- Sends the receipt to an 80mm thermal receipt printer.
- Displays store details, itemized goods, tax breakdown, and the official KRA fiscal number.

---

## 4. Cashier Shifts & Cash Drawer (Z-Report)

### Starting a Shift (Opening Float)
- When a cashier starts work, they log in and enter the cash float placed in the drawer (e.g. KES 2,000 for change).
- The system opens an active work session linked to that cashier.

### During the Shift
- Every sale made (Cash, M-Pesa, Card) and any petty cash paid out of the drawer is recorded under this shift.

### Shift Close & End-of-Day Z-Report (`shiftAudit` / `closeShift`)
At the end of the day or shift:
1. The cashier counts the physical cash in the drawer and types in the total.
2. The system runs the Z-Report formula:
   - `Starting Float + Cash Sales - Cash Drawer Expenses = Expected Cash`
3. The system compares the counted cash against the expected cash:
   - **Balanced**: Count matches expected cash.
   - **Shortage**: Cash is missing (e.g. KES -200). Cashier must enter an explanation.
   - **Surplus**: Excess cash found in drawer.
4. Generates an official Z-Report summary and marks the shift closed.

### Manager Overrides & Audit Log (`logAuditAction`)
- If a cashier needs to open the drawer without making a sale or void an item after ringing it up, a manager must approve it.
- The system permanently records who did it, when, and the reason why, preventing theft.

---

## 5. Inventory & Restocking

### Stock Levels & Alerts
- Products are color-coded:
  - **Green**: Healthy stock.
  - **Amber**: Low stock (reached the reorder point).
  - **Red**: Out of stock.

### Scan-to-Restock
- When a new delivery arrives, click **Scan to Restock**. Scan the barcode on the box, type how many units arrived, and the stock count increases instantly.

### Quick Restock & Bulk Update
- Update prices or restock multiple items at once using the bulk update screen or by uploading a spreadsheet.

### Barcode Label Generator
- For unbranded goods (like fresh produce, local bakery items, or hardware goods), generate and print standard barcode sticker labels to stick directly onto items.

---

## 6. Customer Loyalty & Discounts

### Customer Profile
- Save customer names and phone numbers to track their purchase history and reward them.

### Automatic Loyalty Points
- Customers automatically earn **1 Point for every KES 100 spent**.
- Points can be redeemed during checkout as real cash discounts (e.g. 200 points = KES 200 discount).

### Automatic Customer Tiers
- Shoppers automatically climb loyalty tiers based on lifetime spend:
  - **Bronze**: Regular shoppers.
  - **Silver**: Spent over KES 5,000.
  - **Gold**: Spent over KES 20,000 (VIP customer).

### Customer Feedback
- Customers can give a 1-to-5 star rating and leave feedback on their shopping experience.

---

## 7. Purchasing & Suppliers

### Supplier Directory
- Store vendor contact details, representative names, supplied product types, and agreed payment terms (e.g. Pay after 30 days).

### Purchase Orders
- Create formal order sheets to send to your suppliers with required quantities and agreed purchase costs.

### Automatic Restock on Delivery
- When the supplier delivers the goods to your store, change the purchase order status to **Delivered**.
- The system **automatically adds the delivered items into your product inventory** without needing manual adjustments.

---

## 8. Expenses & Cash Flow

### Recording Expenses
- Log daily operational costs such as electricity (KPLC tokens), store rent, casual worker wages, packaging bags, transport, or equipment repairs.

### Cash Drawer vs. Till Expenses
- If an expense is paid directly from the cash drawer, the system tags it to the active shift.
- This ensures that when the cashier closes the drawer at night, the money taken out for expenses is accounted for and does not appear as a cash shortage!

### Cash Flow Tracker
- Shows a clear summary of all money entering the business versus all money leaving, across cash, M-Pesa, and bank accounts.

---

## 9. M-Pesa & KRA eTIMS Tax Compliance

### Safaricom Lipa Na M-Pesa (STK Push)
- The cashier clicks M-Pesa at checkout.
- An interactive prompt pops up on the customer's phone asking them to enter their secret PIN.
- As soon as they enter their PIN, DukaPOS receives confirmation and prints the receipt automatically.

### KRA eTIMS Invoicing (`submitEtimsInvoice`)
- When a sale finishes, the system sends the invoice data to the Kenya Revenue Authority eTIMS system.
- It generates an official **CUIN (Control Unit Internal Number)** and prints it onto the receipt.
- Calculates 16% standard VAT, zero-rated goods, and tax-exempt items automatically.

---

## 10. Reports & Analytics

### Real-Time Dashboard (`analytics_view`)
- Shows today's revenue, yesterday's comparison, active cashiers on duty, and total transactions.

### Profit & Loss (P&L) Report
- Automatically calculates:
  - **Gross Profit**: Total Sales minus the Wholesale Cost of Goods (COGS).
  - **Gross Margin %**: The profit percentage made on sales.
  - **Net Profit**: Gross Profit minus daily expenses (rent, wages, electricity).

### Sales Velocity & Hourly Heatmap
- Shows what times of day your shop is busiest (e.g. 5:00 PM to 8:00 PM) so you can schedule extra cashiers.

### Fast Movers vs. Dead Stock
- **Fast Movers**: Products that sell out quickly and need frequent restocking.
- **Dead Stock**: Products sitting on shelves for weeks without selling, tying up your capital.

### Cashier Performance
- Compares cashier sales totals, speed per transaction, and cash drawer counting accuracy.

---

## 11. Document Vault (Receipters Vault)

### Digital Document Storage
- Store digital copies of supplier invoices, equipment warranties, KRA tax certificates, lease contracts, and receipts in a secure cloud vault.
- Search and download any past document whenever needed for tax audits or warranty claims.

---

## 12. Managing Multiple Branches

### Branch Management
- For businesses with more than one shop (e.g. CBD Branch, Westlands Branch, Mombasa Branch).
- Each branch has its own supervisor, working hours, rent costs, and local staff.

### One-Click Store Switching (`switch_active_tenant`)
- Business owners can switch between their different shops or branches with a single click without having to log out and log back in.
- View branch-by-branch sales or aggregate totals for the whole enterprise.

---

## Summary of Essential Daily POS Shortcuts

| Keystroke | What It Does |
|---|---|
| **Space** or **F12** | Opens the Payment Dialog to complete checkout |
| **F2** | Puts cursor into Product Search bar |
| **F4** | Holds / pauses the current cart |
| **F5** | Opens held / paused orders to resume them |
| **F8** | Checks item price and stock without adding to cart |
| **F9** | Opens the discount and promo code window |
| **F1** | Opens on-screen help guide |
| **Esc** | Closes any open popup or modal |
