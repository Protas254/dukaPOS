from django.db import models

class BusinessSettings(models.Model):
    business_name = models.CharField(max_length=255, default='Duka Smart Shop')
    business_type = models.CharField(max_length=100, default='sme')
    business_phone = models.CharField(max_length=50, default='+254 712 345678')
    business_email = models.EmailField(default='hello@dukasmart.com')
    business_address = models.TextField(default='Biashara Street, Nairobi, Kenya')
    kra_pin = models.CharField(max_length=50, default='A001234567Z')
    default_tax_rate = models.FloatField(default=16.0)
    currency = models.CharField(max_length=10, default='KES')
    receipt_footer = models.TextField(default='Thank you for shopping with us! Welcome again.')
    return_policy = models.TextField(blank=True, default='')
    mpesa_paybill = models.CharField(max_length=50, default='174379')
    mpesa_till = models.CharField(max_length=50, default='543210')
    mpesa_account = models.CharField(max_length=255, default='Duka Smart Shop')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name


class Product(models.Model):
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
    cashier_name = models.CharField(max_length=255)
    rating = models.IntegerField(default=5)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.cashier_name} - {self.rating} stars"


class EmployeeSchedule(models.Model):
    cashier_name = models.CharField(max_length=255)
    date = models.DateField()
    shift_type = models.CharField(max_length=100)  # e.g., 'morning', 'afternoon', 'night'
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.cashier_name} - {self.date}"


class Promotion(models.Model):
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
    shift_id = models.CharField(max_length=100)
    action = models.CharField(max_length=100)
    performed_by = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Audit {self.action} on Shift {self.shift_id}"


class CashFlow(models.Model):
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
    receipt_number = models.CharField(max_length=100)
    merchant_name = models.CharField(max_length=255, blank=True, null=True)
    rating = models.IntegerField(default=5)
    comment = models.TextField(blank=True, null=True)
    customer_name = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feedback for {self.receipt_number} - {self.rating} stars"
