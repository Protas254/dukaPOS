from django.db import models
from django.conf import settings

class Tenant(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    owner_name = models.CharField(max_length=255)
    owner_email = models.EmailField()
    owner_phone = models.CharField(max_length=50, blank=True, null=True)
    business_type = models.CharField(max_length=100, default='sme')
    currency = models.CharField(max_length=10, default='KES')
    plan = models.CharField(max_length=50, default='starter')
    is_active = models.BooleanField(default=True)
    is_onboarded = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tenant (Business)'
        verbose_name_plural = 'Tenants (Businesses)'

    def __str__(self):
        return f"{self.name} ({self.slug})"


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='user_profiles', null=True, blank=True)
    role = models.CharField(max_length=50, default='admin')

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.username} - {self.tenant.name if self.tenant else 'Global'}"


class BusinessSettings(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='settings', null=True, blank=True)
    business_name = models.CharField(max_length=255, default='Duka Smart Shop')
    trading_name = models.CharField(max_length=255, blank=True, null=True)
    business_type = models.CharField(max_length=100, default='sme')
    pos_type = models.CharField(max_length=100, blank=True, null=True)
    business_phone = models.CharField(max_length=50, default='+254 712 345678')
    business_email = models.EmailField(default='hello@dukasmart.com')
    business_address = models.TextField(default='Biashara Street, Nairobi, Kenya')
    business_website = models.URLField(max_length=255, blank=True, null=True)
    year_established = models.CharField(max_length=50, blank=True, null=True)
    employee_range = models.CharField(max_length=50, blank=True, null=True)
    registration_number = models.CharField(max_length=100, blank=True, null=True)
    kra_pin = models.CharField(max_length=50, default='A001234567Z')
    vat_number = models.CharField(max_length=50, blank=True, null=True)
    vat_registered = models.BooleanField(default=False)
    etims_enabled = models.BooleanField(default=False)
    default_tax_rate = models.FloatField(default=16.0)
    currency = models.CharField(max_length=10, default='KES')
    receipt_header = models.TextField(blank=True, default='')
    receipt_footer = models.TextField(default='Thank you for shopping with us! Welcome again.')
    return_policy = models.TextField(blank=True, default='')
    exchange_policy = models.TextField(blank=True, default='')
    license_no = models.CharField(max_length=100, blank=True, null=True)
    license_expiry = models.CharField(max_length=100, blank=True, null=True)
    mpesa_paybill = models.CharField(max_length=50, default='174379')
    mpesa_till = models.CharField(max_length=50, default='543210')
    mpesa_account = models.CharField(max_length=255, default='Duka Smart Shop')
    mpesa_account_ref = models.CharField(max_length=255, blank=True, null=True)
    selected_goods = models.JSONField(default=list, blank=True)
    selected_services = models.JSONField(default=list, blank=True)
    branches = models.JSONField(default=list, blank=True)
    contact_info = models.JSONField(default=dict, blank=True)
    owner_role = models.CharField(max_length=100, blank=True, null=True)
    logo_url = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Business Setting'
        verbose_name_plural = 'Business Settings'

    def __str__(self):
        return self.business_name


class Product(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    category = models.CharField(max_length=100)
    price = models.FloatField()
    cost_price = models.FloatField()
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    unit = models.CharField(max_length=50, default='piece')
    is_active = models.BooleanField(default=True)
    tax_rate = models.FloatField(default=16.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Customer(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='customers', null=True, blank=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True)
    loyalty_points = models.IntegerField(default=0)
    total_spending = models.FloatField(default=0.0)
    total_transactions = models.IntegerField(default=0)
    tier = models.CharField(max_length=50, default='bronze')
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Supplier(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='suppliers', null=True, blank=True)
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    products_supplied = models.TextField(blank=True, null=True)
    payment_terms = models.CharField(max_length=100, default='net_30')
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Shift(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='shifts', null=True, blank=True)
    cashier_id = models.CharField(max_length=100)
    cashier_name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='active')  # 'active', 'closed'
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    starting_cash = models.FloatField(default=0.0)
    total_sales = models.FloatField(default=0.0)
    total_transactions = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Shift {self.id} - {self.cashier_name} ({self.status})"


class Sale(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='sales', null=True, blank=True)
    receipt_number = models.CharField(max_length=100, unique=True)
    shift_id = models.CharField(max_length=100, blank=True, null=True)
    cashier_id = models.CharField(max_length=100)
    cashier_name = models.CharField(max_length=255)
    total_amount = models.FloatField()
    subtotal = models.FloatField()
    tax_total = models.FloatField()
    payment_method = models.CharField(max_length=50)  # 'cash', 'mpesa', 'card'
    status = models.CharField(max_length=50, default='completed')  # 'completed', 'refunded'
    items = models.JSONField()  # Store sale items as JSON
    etims_status = models.CharField(max_length=50, default='pending')  # 'pending', 'submitted', 'failed'
    cuin = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def created_date(self):
        """Alias for created_at — used by the frontend for date filtering/sorting."""
        return self.created_at

    def __str__(self):
        return f"{self.receipt_number} - {self.total_amount}"


class Expense(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    shift_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.FloatField()
    category = models.CharField(max_length=100)
    description = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='approved')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Expense {self.category} - {self.amount}"


class EmployeeRating(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='employee_ratings', null=True, blank=True)
    cashier_name = models.CharField(max_length=255)
    rating = models.IntegerField(default=5)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.cashier_name} - {self.rating} stars"


class EmployeeSchedule(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='employee_schedules', null=True, blank=True)
    cashier_name = models.CharField(max_length=255)
    date = models.DateField()
    shift_type = models.CharField(max_length=100)  # e.g., 'morning', 'afternoon', 'night'
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.cashier_name} - {self.date}"


class Promotion(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='promotions', null=True, blank=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    discount_type = models.CharField(max_length=50)  # 'percentage', 'fixed'
    discount_value = models.FloatField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class MpesaPayment(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='mpesa_payments', null=True, blank=True)
    merchant_request_id = models.CharField(max_length=100)
    checkout_request_id = models.CharField(max_length=100)
    amount = models.FloatField()
    phone_number = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='pending')
    transaction_date = models.DateTimeField(null=True, blank=True)
    receipt_number = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Mpesa {self.phone_number} - {self.amount}"


class ShiftAudit(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='shift_audits', null=True, blank=True)
    shift_id = models.CharField(max_length=100)
    action = models.CharField(max_length=100)
    performed_by = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Shift Audit'
        verbose_name_plural = 'Shift Audits'

    def __str__(self):
        return f"Audit {self.action} on Shift {self.shift_id}"


class CashFlow(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='cashflows', null=True, blank=True)
    transaction_type = models.CharField(max_length=50, default='inflow')  # 'inflow', 'outflow'
    amount = models.FloatField()
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    payment_method = models.CharField(max_length=50, default='cash')
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.amount}"


class PurchaseOrder(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='purchase_orders', null=True, blank=True)
    order_number = models.CharField(max_length=100, unique=True)
    supplier_id = models.CharField(max_length=100)
    supplier_name = models.CharField(max_length=255)
    order_date = models.DateField(auto_now_add=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    items = models.JSONField(default=list, blank=True)
    subtotal = models.FloatField(default=0.0)
    tax_amount = models.FloatField(default=0.0)
    total_amount = models.FloatField(default=0.0)
    status = models.CharField(max_length=50, default='draft')
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order_number} - {self.supplier_name}"


class VaultDocument(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='vault_documents', null=True, blank=True)
    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50) # receipt, invoice, budget, etc.
    source = models.CharField(max_length=100, default='DukaPOS')
    category = models.CharField(max_length=100, blank=True, null=True)
    file_url = models.URLField(max_length=1024, blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file_type = models.CharField(max_length=50, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, null=True)
    amount = models.FloatField(default=0.0)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    receipt_data = models.JSONField(blank=True, null=True)
    is_locked = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    stored_by_name = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.document_type})"


class ReceiptFeedback(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='receipt_feedbacks', null=True, blank=True)
    receipt_number = models.CharField(max_length=100)
    merchant_name = models.CharField(max_length=255, blank=True, null=True)
    rating = models.IntegerField(default=5)
    comment = models.TextField(blank=True, null=True)
    customer_name = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Receipt Feedback'
        verbose_name_plural = 'Receipt Feedbacks'

    def __str__(self):
        return f"Feedback for {self.receipt_number} - {self.rating} stars"


class Subscription(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='subscriptions')
    plan_name = models.CharField(max_length=100, default='Starter')
    amount = models.FloatField(default=0.0)
    currency = models.CharField(max_length=10, default='KES')
    billing_cycle = models.CharField(max_length=50, default='monthly')
    status = models.CharField(max_length=50, default='active')
    payment_status = models.CharField(max_length=50, default='paid')
    mpesa_reference = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Subscription Payment'
        verbose_name_plural = 'Subscriptions'

    def __str__(self):
        return f"{self.tenant.name if self.tenant else 'Global'} - {self.plan_name} ({self.payment_status})"


class ReceiptersEngine(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='engine_logs', null=True, blank=True)
    engine_name = models.CharField(max_length=255, default='Receipters Engine v1.0')
    status = models.CharField(max_length=50, default='operational')
    total_processed_receipts = models.IntegerField(default=0)
    last_sync = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Receipters Engine'
        verbose_name_plural = 'Receipters Engine'

    def __str__(self):
        return f"{self.engine_name} - {self.status}"


class ReceiptersVaultHub(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='vault_hubs', null=True, blank=True)
    hub_name = models.CharField(max_length=255, default='Receipters Vault Hub')
    storage_used_mb = models.FloatField(default=0.0)
    encrypted_documents_count = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default='active')

    class Meta:
        verbose_name = 'Receipters Vault Hub'
        verbose_name_plural = 'Receipters Vault Hub'

    def __str__(self):
        return f"{self.hub_name} - {self.status}"


