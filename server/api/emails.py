"""
DukaPOS — Central Email Notification Module
============================================
All outgoing emails are sent through helpers in this file.
Uses Django's send_mail() with the Gmail SMTP configured in settings.py / .env.

Functions:
  send_welcome_email              — new business owner registration
  send_otp_email                  — OTP verification on sign-up
  send_password_reset_email       — forgot-password reset link
  send_receipt_email              — customer email receipt after checkout
  send_low_stock_alert            — owner alert when product hits low-stock
  send_purchase_order_email       — PO notification to supplier
  send_shift_summary_email        — Z-Report summary to owner on shift close
  send_cash_variance_alert        — alert when shift cash variance is high
  send_loyalty_tier_upgrade_email — customer tier upgrade congratulations
  send_subscription_confirmation  — subscription/payment confirmation to owner
  send_subscription_expiry_warning— owner warned before subscription expires
  send_staff_schedule_email       — notifies employee of published schedule
"""

import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

# ── Helpers ──────────────────────────────────────────────────────────────────

def _from():
    """Return the configured DEFAULT_FROM_EMAIL."""
    return getattr(settings, 'DEFAULT_FROM_EMAIL', 'DukaPOS <noreply@dukapos.com>')


def _admin():
    """Return the admin notification email address."""
    return getattr(settings, 'ADMIN_NOTIFY_EMAIL', _from())


def _send(subject, text_body, recipients, html_body=None, fail_silently=True):
    """
    Core send helper. Logs errors instead of crashing the request.
    Set fail_silently=False in tests or where you want exceptions to bubble up.
    """
    if not recipients:
        return
    if isinstance(recipients, str):
        recipients = [recipients]
    try:
        if html_body:
            msg = EmailMultiAlternatives(subject, text_body, _from(), recipients)
            msg.attach_alternative(html_body, 'text/html')
            msg.send()
        else:
            send_mail(subject, text_body, _from(), recipients, fail_silently=False)
    except Exception as exc:
        logger.error('[DukaPOS Email] Failed to send "%s" to %s: %s', subject, recipients, exc)


# ── 1. Welcome Email (on new owner registration) ─────────────────────────────

def send_welcome_email(owner_email, owner_name, business_name):
    subject = f'Welcome to DukaPOS, {owner_name}! 🎉'
    text = (
        f"Hi {owner_name},\n\n"
        f"Welcome to DukaPOS! Your business account for '{business_name}' has been created successfully.\n\n"
        f"Here's how to get started:\n"
        f"  1. Complete your business profile in Settings\n"
        f"  2. Add your products to Inventory\n"
        f"  3. Add your cashiers under Employees\n"
        f"  4. Start making sales from the POS screen!\n\n"
        f"If you need help, reply to this email anytime.\n\n"
        f"— The DukaPOS Team"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#059669">Welcome to DukaPOS, {owner_name}! 🎉</h2>
      <p>Your business account for <strong>{business_name}</strong> has been created successfully.</p>
      <h3 style="color:#374151">Getting Started</h3>
      <ol>
        <li>Complete your business profile in <strong>Settings</strong></li>
        <li>Add your products to <strong>Inventory</strong></li>
        <li>Add your cashiers under <strong>Employees</strong></li>
        <li>Start making sales from the <strong>POS</strong> screen!</li>
      </ol>
      <p style="color:#6b7280;font-size:13px">If you need help, reply to this email anytime.</p>
      <p style="color:#6b7280;font-size:13px">— The DukaPOS Team</p>
    </div>
    """
    _send(subject, text, owner_email, html_body=html)


# ── 2. OTP Email ──────────────────────────────────────────────────────────────

def send_otp_email(email, otp_code):
    subject = 'Your DukaPOS verification code'
    text = (
        f"Your DukaPOS email verification code is:\n\n"
        f"  {otp_code}\n\n"
        f"This code expires in 10 minutes. Do not share it with anyone.\n\n"
        f"— The DukaPOS Team"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#059669">Email Verification</h2>
      <p>Your DukaPOS verification code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111827;text-align:center;padding:16px 0">{otp_code}</div>
      <p style="color:#6b7280;font-size:13px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#6b7280;font-size:13px">— The DukaPOS Team</p>
    </div>
    """
    _send(subject, text, email, html_body=html)


# ── 3. Password Reset Email ───────────────────────────────────────────────────

def send_password_reset_email(email, reset_link):
    subject = 'Reset your DukaPOS password'
    text = (
        f"Hi,\n\n"
        f"We received a request to reset your DukaPOS password.\n\n"
        f"Click the link below to reset it (expires in 1 hour):\n"
        f"{reset_link}\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"— The DukaPOS Team"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#059669">Reset Your Password</h2>
      <p>We received a request to reset your DukaPOS password. Click the button below to proceed:</p>
      <div style="text-align:center;margin:24px 0">
        <a href="{reset_link}" style="background:#059669;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px">This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.</p>
      <p style="color:#6b7280;font-size:13px">— The DukaPOS Team</p>
    </div>
    """
    _send(subject, text, email, html_body=html)


# ── 4. Customer Receipt Email ─────────────────────────────────────────────────

def send_receipt_email(customer_email, receipt_number, store_name, items, subtotal, tax_total, total_amount, payment_method, cashier_name, sale_date):
    subject = f'Your receipt from {store_name} — #{receipt_number}'

    items_text = '\n'.join(
        f"  {i.get('product_name','Item')} x{i.get('quantity',1)}  KES {i.get('total',0):,.2f}"
        for i in (items or [])
    )
    items_html = ''.join(
        f"<tr><td style='padding:4px 8px'>{i.get('product_name','Item')}</td>"
        f"<td style='padding:4px 8px;text-align:center'>{i.get('quantity',1)}</td>"
        f"<td style='padding:4px 8px;text-align:right'>KES {float(i.get('total',0)):,.2f}</td></tr>"
        for i in (items or [])
    )

    text = (
        f"Thank you for shopping at {store_name}!\n\n"
        f"Receipt: #{receipt_number}\n"
        f"Date: {sale_date}\n"
        f"Cashier: {cashier_name}\n\n"
        f"Items:\n{items_text}\n\n"
        f"Subtotal:  KES {subtotal:,.2f}\n"
        f"Tax (VAT): KES {tax_total:,.2f}\n"
        f"TOTAL:     KES {total_amount:,.2f}\n"
        f"Payment:   {payment_method.upper()}\n\n"
        f"Thank you — we hope to see you again!\n"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#059669;text-align:center">{store_name}</h2>
      <p style="text-align:center;color:#6b7280;font-size:13px">Receipt #{receipt_number} · {sale_date}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f9fafb">
          <th style="padding:6px 8px;text-align:left">Item</th>
          <th style="padding:6px 8px;text-align:center">Qty</th>
          <th style="padding:6px 8px;text-align:right">Amount</th>
        </tr></thead>
        <tbody>{items_html}</tbody>
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb">
      <table style="width:100%">
        <tr><td>Subtotal</td><td style="text-align:right">KES {subtotal:,.2f}</td></tr>
        <tr><td>Tax (VAT)</td><td style="text-align:right">KES {tax_total:,.2f}</td></tr>
        <tr style="font-weight:bold;font-size:16px"><td>TOTAL</td><td style="text-align:right">KES {total_amount:,.2f}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px">Payment</td><td style="text-align:right;color:#6b7280;font-size:13px">{payment_method.upper()}</td></tr>
      </table>
      <p style="text-align:center;color:#059669;margin-top:24px;font-size:14px">Thank you for shopping with us! 🛍</p>
    </div>
    """
    _send(subject, text, customer_email, html_body=html)


# ── 5. Low Stock Alert ────────────────────────────────────────────────────────

def send_low_stock_alert(owner_email, business_name, low_stock_items):
    """
    low_stock_items: list of dicts with keys: name, sku, stock_quantity, low_stock_threshold
    """
    subject = f'⚠️ Low Stock Alert — {business_name}'
    rows_text = '\n'.join(
        f"  • {p['name']} (SKU: {p.get('sku','N/A')}) — {p['stock_quantity']} left (threshold: {p['low_stock_threshold']})"
        for p in low_stock_items
    )
    rows_html = ''.join(
        f"<tr><td style='padding:6px 8px'>{p['name']}</td>"
        f"<td style='padding:6px 8px'>{p.get('sku','N/A')}</td>"
        f"<td style='padding:6px 8px;color:#dc2626;font-weight:bold'>{p['stock_quantity']}</td>"
        f"<td style='padding:6px 8px;color:#6b7280'>{p['low_stock_threshold']}</td></tr>"
        for p in low_stock_items
    )
    text = (
        f"Low Stock Alert for {business_name}\n\n"
        f"The following products are running low and need restocking:\n\n"
        f"{rows_text}\n\n"
        f"Log in to DukaPOS → Inventory to restock or create a Purchase Order.\n\n"
        f"— DukaPOS"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#dc2626">⚠️ Low Stock Alert</h2>
      <p>The following products at <strong>{business_name}</strong> are running low:</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#fef2f2">
          <th style="padding:6px 8px;text-align:left">Product</th>
          <th style="padding:6px 8px;text-align:left">SKU</th>
          <th style="padding:6px 8px;text-align:left">Stock Left</th>
          <th style="padding:6px 8px;text-align:left">Threshold</th>
        </tr></thead>
        <tbody>{rows_html}</tbody>
      </table>
      <p style="margin-top:16px">Log in to <strong>DukaPOS → Inventory</strong> to restock or create a Purchase Order.</p>
    </div>
    """
    _send(subject, text, owner_email, html_body=html)


# ── 6. Purchase Order Email to Supplier ──────────────────────────────────────

def send_purchase_order_email(supplier_email, supplier_name, business_name, po_number, items, notes=''):
    subject = f'Purchase Order #{po_number} from {business_name}'
    rows_text = '\n'.join(
        f"  • {i.get('product_name', i.get('name', 'Product'))} — Qty: {i.get('quantity_ordered', i.get('quantity', 1))}"
        for i in (items or [])
    )
    rows_html = ''.join(
        f"<tr><td style='padding:6px 8px'>{i.get('product_name', i.get('name', 'Product'))}</td>"
        f"<td style='padding:6px 8px;text-align:center'>{i.get('quantity_ordered', i.get('quantity', 1))}</td></tr>"
        for i in (items or [])
    )
    text = (
        f"Dear {supplier_name},\n\n"
        f"{business_name} has placed a purchase order (#{po_number}).\n\n"
        f"Items Requested:\n{rows_text}\n\n"
        f"{('Notes: ' + notes + chr(10)) if notes else ''}"
        f"Please confirm receipt of this order and advise on delivery timelines.\n\n"
        f"— {business_name} via DukaPOS"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#059669">Purchase Order #{po_number}</h2>
      <p>Dear <strong>{supplier_name}</strong>,</p>
      <p><strong>{business_name}</strong> has placed the following purchase order:</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f9fafb">
          <th style="padding:6px 8px;text-align:left">Product</th>
          <th style="padding:6px 8px;text-align:center">Qty Ordered</th>
        </tr></thead>
        <tbody>{rows_html}</tbody>
      </table>
      {f'<p><strong>Notes:</strong> {notes}</p>' if notes else ''}
      <p>Please confirm receipt and advise on delivery timelines.</p>
      <p style="color:#6b7280;font-size:13px">— {business_name} via DukaPOS</p>
    </div>
    """
    _send(subject, text, supplier_email, html_body=html)


# ── 7. Shift Z-Report / Summary Email ────────────────────────────────────────

def send_shift_summary_email(owner_email, business_name, z_report):
    cashier_name = z_report.get('cashier_name', 'Cashier')
    subject = f'📊 Shift Summary — {cashier_name} | {business_name}'
    variance = float(z_report.get('variance', 0))
    variance_flag = '✅ Balanced' if abs(variance) < 1 else f'⚠️ Variance: KES {variance:+,.2f}'

    text = (
        f"Shift Summary — {business_name}\n"
        f"Cashier: {cashier_name}\n"
        f"Started: {z_report.get('started_at','')}\n"
        f"Ended:   {z_report.get('ended_at','')}\n\n"
        f"Transactions:  {z_report.get('total_transactions', 0)}\n"
        f"Total Revenue: KES {float(z_report.get('total_revenue', 0)):,.2f}\n"
        f"  Cash:        KES {float(z_report.get('cash_sales', 0)):,.2f}\n"
        f"  M-Pesa:      KES {float(z_report.get('mpesa_sales', 0)):,.2f}\n"
        f"  Card:        KES {float(z_report.get('card_sales', 0)):,.2f}\n\n"
        f"Starting Cash: KES {float(z_report.get('starting_cash', 0)):,.2f}\n"
        f"Cash Expenses: KES {float(z_report.get('cash_expenses', 0)):,.2f}\n"
        f"Expected Cash: KES {float(z_report.get('expected_cash', 0)):,.2f}\n"
        f"Actual Cash:   KES {float(z_report.get('actual_cash', 0)):,.2f}\n"
        f"Status: {variance_flag}\n"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#059669">📊 Shift Summary</h2>
      <p><strong>{business_name}</strong> | Cashier: <strong>{cashier_name}</strong></p>
      <table style="width:100%;margin:12px 0">
        <tr><td style="color:#6b7280">Transactions</td><td style="text-align:right;font-weight:bold">{z_report.get('total_transactions',0)}</td></tr>
        <tr><td style="color:#6b7280">Total Revenue</td><td style="text-align:right;font-weight:bold">KES {float(z_report.get('total_revenue',0)):,.2f}</td></tr>
        <tr><td style="color:#6b7280;padding-left:16px">Cash</td><td style="text-align:right">KES {float(z_report.get('cash_sales',0)):,.2f}</td></tr>
        <tr><td style="color:#6b7280;padding-left:16px">M-Pesa</td><td style="text-align:right">KES {float(z_report.get('mpesa_sales',0)):,.2f}</td></tr>
        <tr><td style="color:#6b7280;padding-left:16px">Card</td><td style="text-align:right">KES {float(z_report.get('card_sales',0)):,.2f}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb">
      <table style="width:100%;margin:12px 0">
        <tr><td style="color:#6b7280">Expected Cash</td><td style="text-align:right">KES {float(z_report.get('expected_cash',0)):,.2f}</td></tr>
        <tr><td style="color:#6b7280">Actual Cash</td><td style="text-align:right">KES {float(z_report.get('actual_cash',0)):,.2f}</td></tr>
        <tr><td style="font-weight:bold">Status</td><td style="text-align:right;font-weight:bold;color:{'#059669' if abs(variance)<1 else '#dc2626'}">{variance_flag}</td></tr>
      </table>
    </div>
    """
    _send(subject, text, owner_email, html_body=html)


# ── 8. Cash Variance Alert ────────────────────────────────────────────────────

def send_cash_variance_alert(owner_email, business_name, cashier_name, expected, actual, variance):
    subject = f'🚨 Cash Variance Alert — {cashier_name} | {business_name}'
    text = (
        f"CASH VARIANCE DETECTED at {business_name}\n\n"
        f"Cashier:       {cashier_name}\n"
        f"Expected Cash: KES {expected:,.2f}\n"
        f"Actual Cash:   KES {actual:,.2f}\n"
        f"Variance:      KES {variance:+,.2f}\n\n"
        f"Please review this shift in DukaPOS → Shift Audits.\n\n"
        f"— DukaPOS"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #fca5a5;border-radius:8px;background:#fff5f5">
      <h2 style="color:#dc2626">🚨 Cash Variance Detected</h2>
      <p>A cash variance was recorded at <strong>{business_name}</strong>.</p>
      <table style="width:100%;margin:12px 0">
        <tr><td>Cashier</td><td style="text-align:right;font-weight:bold">{cashier_name}</td></tr>
        <tr><td>Expected Cash</td><td style="text-align:right">KES {expected:,.2f}</td></tr>
        <tr><td>Actual Cash</td><td style="text-align:right">KES {actual:,.2f}</td></tr>
        <tr style="color:#dc2626;font-weight:bold"><td>Variance</td><td style="text-align:right">KES {variance:+,.2f}</td></tr>
      </table>
      <p>Review this shift in <strong>DukaPOS → Shift Audits</strong>.</p>
    </div>
    """
    _send(subject, text, owner_email, html_body=html)


# ── 9. Loyalty Tier Upgrade Email ────────────────────────────────────────────

TIER_EMOJIS = {'bronze': '🥉', 'silver': '🥈', 'gold': '🥇', 'platinum': '💎'}

def send_loyalty_tier_upgrade_email(customer_email, customer_name, new_tier, points, business_name):
    emoji = TIER_EMOJIS.get(new_tier, '🏅')
    subject = f"{emoji} You've reached {new_tier.upper()} tier at {business_name}!"
    text = (
        f"Congratulations, {customer_name}!\n\n"
        f"You've been upgraded to {new_tier.upper()} loyalty tier at {business_name}.\n"
        f"Your current points balance: {points:,} pts\n\n"
        f"Keep shopping to unlock even more rewards!\n\n"
        f"— {business_name}"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;text-align:center">
      <div style="font-size:64px">{emoji}</div>
      <h2 style="color:#059669">Congratulations, {customer_name}!</h2>
      <p>You've reached <strong style="font-size:20px">{new_tier.upper()}</strong> loyalty tier at <strong>{business_name}</strong>.</p>
      <p style="font-size:24px;font-weight:bold;color:#111827">{points:,} pts</p>
      <p style="color:#6b7280">Keep shopping to unlock even more rewards!</p>
      <p style="color:#6b7280;font-size:13px">— {business_name}</p>
    </div>
    """
    _send(subject, text, customer_email, html_body=html)


# ── 10. Subscription Confirmation ────────────────────────────────────────────

def send_subscription_confirmation(owner_email, owner_name, business_name, plan_name, amount, billing_cycle, end_date):
    subject = f'✅ Subscription Confirmed — {plan_name} | DukaPOS'
    text = (
        f"Hi {owner_name},\n\n"
        f"Your DukaPOS subscription for '{business_name}' has been activated.\n\n"
        f"Plan:          {plan_name}\n"
        f"Amount:        KES {amount:,.2f}\n"
        f"Billing Cycle: {billing_cycle}\n"
        f"Valid Until:   {end_date}\n\n"
        f"Thank you for using DukaPOS!\n\n"
        f"— The DukaPOS Team"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#059669">✅ Subscription Confirmed</h2>
      <p>Hi <strong>{owner_name}</strong>, your subscription for <strong>{business_name}</strong> is now active.</p>
      <table style="width:100%;margin:12px 0">
        <tr><td style="color:#6b7280">Plan</td><td style="text-align:right;font-weight:bold">{plan_name}</td></tr>
        <tr><td style="color:#6b7280">Amount</td><td style="text-align:right;font-weight:bold">KES {amount:,.2f}</td></tr>
        <tr><td style="color:#6b7280">Billing Cycle</td><td style="text-align:right">{billing_cycle}</td></tr>
        <tr><td style="color:#6b7280">Valid Until</td><td style="text-align:right">{end_date}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px">Thank you for using DukaPOS! — The DukaPOS Team</p>
    </div>
    """
    _send(subject, text, owner_email, html_body=html)


# ── 11. Subscription Expiry Warning ──────────────────────────────────────────

def send_subscription_expiry_warning(owner_email, owner_name, business_name, plan_name, days_left, end_date):
    subject = f'⏰ Your DukaPOS subscription expires in {days_left} day{"s" if days_left != 1 else ""}'
    text = (
        f"Hi {owner_name},\n\n"
        f"Your '{plan_name}' subscription for {business_name} expires in {days_left} day{'s' if days_left != 1 else ''}.\n"
        f"Expiry Date: {end_date}\n\n"
        f"Please renew your subscription to avoid any disruption to your business operations.\n\n"
        f"— The DukaPOS Team"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #fcd34d;border-radius:8px;background:#fffbeb">
      <h2 style="color:#d97706">⏰ Subscription Expiring Soon</h2>
      <p>Hi <strong>{owner_name}</strong>,</p>
      <p>Your <strong>{plan_name}</strong> subscription for <strong>{business_name}</strong> expires in
         <strong style="color:#dc2626">{days_left} day{'s' if days_left != 1 else ''}</strong> on <strong>{end_date}</strong>.</p>
      <p>Please renew your subscription to avoid any disruption.</p>
      <p style="color:#6b7280;font-size:13px">— The DukaPOS Team</p>
    </div>
    """
    _send(subject, text, owner_email, html_body=html)


# ── 12. Staff Schedule Published Email ───────────────────────────────────────

def send_staff_schedule_email(employee_email, employee_name, business_name, schedule_entries):
    """
    schedule_entries: list of dicts with keys: date, start_time, end_time, role
    """
    subject = f'📅 Your schedule at {business_name} has been published'
    rows_text = '\n'.join(
        f"  {s.get('date','')}  {s.get('start_time','')} – {s.get('end_time','')}  ({s.get('role','')})"
        for s in (schedule_entries or [])
    )
    rows_html = ''.join(
        f"<tr><td style='padding:6px 8px'>{s.get('date','')}</td>"
        f"<td style='padding:6px 8px'>{s.get('start_time','')} – {s.get('end_time','')}</td>"
        f"<td style='padding:6px 8px'>{s.get('role','')}</td></tr>"
        for s in (schedule_entries or [])
    )
    text = (
        f"Hi {employee_name},\n\n"
        f"Your upcoming schedule at {business_name} has been published:\n\n"
        f"{rows_text}\n\n"
        f"Log in to DukaPOS to view your full schedule.\n\n"
        f"— {business_name}"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#059669">📅 Your Schedule</h2>
      <p>Hi <strong>{employee_name}</strong>, your upcoming schedule at <strong>{business_name}</strong> has been published:</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f9fafb">
          <th style="padding:6px 8px;text-align:left">Date</th>
          <th style="padding:6px 8px;text-align:left">Hours</th>
          <th style="padding:6px 8px;text-align:left">Role</th>
        </tr></thead>
        <tbody>{rows_html}</tbody>
      </table>
      <p style="color:#6b7280;font-size:13px;margin-top:16px">Log in to DukaPOS to view your full schedule.</p>
    </div>
    """
    _send(subject, text, employee_email, html_body=html)
