from django.contrib import admin
from django.urls import reverse
from .models import (
    Tenant, UserProfile, BusinessSettings, Product, Customer, Supplier, Shift, Sale,
    Expense, EmployeeRating, EmployeeSchedule, Promotion, MpesaPayment,
    ShiftAudit, CashFlow, PurchaseOrder, VaultDocument, ReceiptFeedback,
    Subscription, ReceiptersEngine, ReceiptersVaultHub
)


# ── Base class: auto-filter queryset by ?tenant__id__exact= in the admin ──
class TenantScopedAdmin(admin.ModelAdmin):
    """
    Base ModelAdmin that adds tenant filtering to every tenant-aware model,
    and hides the model from the left sidebar index so operations live under Tenants dashboard.
    """
    def get_list_filter(self, request):
        """Ensure 'tenant' is always the first filter in the sidebar."""
        base = list(super().get_list_filter(request) or [])
        if 'tenant' not in base:
            base.insert(0, 'tenant')
        return base

    def has_module_permission(self, request):
        """Hide individual store models from the main sidebar index so they operate cleanly under Tenants."""
        return False


# ── Helper: entity card config for the tenant dashboard ──
TENANT_ENTITY_CONFIG = [
    # (Model, admin_url_name, label, icon_emoji, bg_color, icon_color)
    (BusinessSettings, 'api_businesssettings', 'Business Settings', '⚙️', '#E8F5E9', '#2E7D32'),
    (Subscription, 'api_subscription', 'Subscriptions', '💳', '#E8F5E9', '#1B5E20'),
    (Product, 'api_product', 'Products', '📦', '#E3F2FD', '#1565C0'),
    (Customer, 'api_customer', 'Customers', '👥', '#FFF3E0', '#E65100'),
    (Sale, 'api_sale', 'Sales', '🧾', '#F3E5F5', '#7B1FA2'),
    (Shift, 'api_shift', 'Shifts', '🕐', '#E0F2F1', '#00695C'),
    (Expense, 'api_expense', 'Expenses', '💸', '#FCE4EC', '#C62828'),
    (CashFlow, 'api_cashflow', 'Cash Flows', '💰', '#FFFDE7', '#F57F17'),
    (Supplier, 'api_supplier', 'Suppliers', '🚚', '#E8EAF6', '#283593'),
    (PurchaseOrder, 'api_purchaseorder', 'Purchase Orders', '📋', '#F1F8E9', '#558B2F'),
    (EmployeeRating, 'api_employeerating', 'Employee Ratings', '⭐', '#FFF8E1', '#FF8F00'),
    (EmployeeSchedule, 'api_employeeschedule', 'Employee Schedules', '📅', '#E0F7FA', '#00838F'),
    (Promotion, 'api_promotion', 'Promotions', '🎁', '#FBE9E7', '#D84315'),
    (MpesaPayment, 'api_mpesapayment', 'Mpesa Payments', '📱', '#E8F5E9', '#1B5E20'),
    (ShiftAudit, 'api_shiftaudit', 'Shift Audits', '🔍', '#ECEFF1', '#455A64'),
    (VaultDocument, 'api_vaultdocument', 'Vault Documents', '🗄️', '#EDE7F6', '#4527A0'),
    (ReceiptFeedback, 'api_receiptfeedback', 'Receipt Feedbacks', '💬', '#E1F5FE', '#0277BD'),
    (UserProfile, 'api_userprofile', 'User Profiles', '👤', '#F3E5F5', '#6A1B9A'),
]


# ── Tenant (Business) — with dashboard of all related entities ──
@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner_name', 'owner_email', 'business_type', 'currency', 'plan', 'is_onboarded', 'is_active', 'created_at')
    list_filter = ('business_type', 'plan', 'is_onboarded', 'is_active')
    search_fields = ('name', 'slug', 'owner_name', 'owner_email')
    ordering = ('-created_at',)
    change_form_template = 'admin/api/tenant/change_form.html'

    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}

        try:
            tenant = Tenant.objects.get(pk=object_id)
            entities = []
            for ModelClass, url_name, label, icon, bg_color, icon_color in TENANT_ENTITY_CONFIG:
                count = ModelClass.objects.filter(tenant=tenant).count()
                changelist_url = reverse(f'admin:{url_name}_changelist') + f'?tenant__id__exact={tenant.pk}'
                add_url = reverse(f'admin:{url_name}_add')
                entities.append({
                    'label': label,
                    'count': count,
                    'url': changelist_url,
                    'add_url': add_url,
                    'icon': icon,
                    'bg_color': bg_color,
                    'icon_color': icon_color,
                })
            extra_context['tenant_entities'] = entities
        except Tenant.DoesNotExist:
            pass

        return super().change_view(request, object_id, form_url, extra_context=extra_context)


# ── User Profile ──
@admin.register(UserProfile)
class UserProfileAdmin(TenantScopedAdmin):
    list_display = ('user', 'tenant', 'role')
    list_filter = ('tenant', 'role')
    search_fields = ('user__username', 'user__email', 'tenant__name')


# ── Business Settings ──
@admin.register(BusinessSettings)
class BusinessSettingsAdmin(TenantScopedAdmin):
    list_display = ('business_name', 'trading_name', 'tenant', 'business_type', 'pos_type', 'currency', 'kra_pin', 'vat_registered', 'etims_enabled')
    list_filter = ('tenant', 'business_type', 'pos_type', 'currency', 'vat_registered', 'etims_enabled')
    search_fields = ('business_name', 'trading_name', 'kra_pin', 'business_email', 'business_phone')


# ── Products ──
@admin.register(Product)
class ProductAdmin(TenantScopedAdmin):
    list_display = ('name', 'sku', 'tenant', 'category', 'price', 'cost_price', 'stock_quantity', 'is_active')
    list_filter = ('tenant', 'category', 'is_active')
    search_fields = ('name', 'sku')
    ordering = ('name',)


# ── Customers ──
@admin.register(Customer)
class CustomerAdmin(TenantScopedAdmin):
    list_display = ('name', 'phone', 'tenant', 'email', 'loyalty_points', 'tier', 'is_active')
    list_filter = ('tenant', 'tier', 'is_active')
    search_fields = ('name', 'phone', 'email')


# ── Suppliers ──
@admin.register(Supplier)
class SupplierAdmin(TenantScopedAdmin):
    list_display = ('name', 'contact_person', 'tenant', 'phone', 'payment_terms', 'is_active')
    list_filter = ('tenant', 'payment_terms', 'is_active')
    search_fields = ('name', 'contact_person')


# ── Shifts ──
@admin.register(Shift)
class ShiftAdmin(TenantScopedAdmin):
    list_display = ('id', 'cashier_name', 'tenant', 'status', 'started_at', 'starting_cash', 'total_sales')
    list_filter = ('tenant', 'status')
    search_fields = ('cashier_name',)


# ── Sales ──
@admin.register(Sale)
class SaleAdmin(TenantScopedAdmin):
    list_display = ('receipt_number', 'cashier_name', 'tenant', 'total_amount', 'payment_method', 'status', 'etims_status', 'created_at')
    list_filter = ('tenant', 'payment_method', 'status', 'etims_status')
    search_fields = ('receipt_number', 'cuin', 'cashier_name')
    ordering = ('-created_at',)


# ── Expenses ──
@admin.register(Expense)
class ExpenseAdmin(TenantScopedAdmin):
    list_display = ('category', 'amount', 'tenant', 'description', 'status', 'date')
    list_filter = ('tenant', 'category', 'status')
    search_fields = ('description', 'category')


# ── Employee Ratings ──
@admin.register(EmployeeRating)
class EmployeeRatingAdmin(TenantScopedAdmin):
    list_display = ('cashier_name', 'tenant', 'rating', 'created_at')
    list_filter = ('tenant', 'rating')
    search_fields = ('cashier_name',)


# ── Employee Schedules ──
@admin.register(EmployeeSchedule)
class EmployeeScheduleAdmin(TenantScopedAdmin):
    list_display = ('cashier_name', 'tenant', 'date', 'shift_type')
    list_filter = ('tenant', 'shift_type')
    search_fields = ('cashier_name',)


# ── Promotions ──
@admin.register(Promotion)
class PromotionAdmin(TenantScopedAdmin):
    list_display = ('name', 'code', 'tenant', 'discount_type', 'discount_value', 'is_active', 'start_date', 'end_date')
    list_filter = ('tenant', 'discount_type', 'is_active')
    search_fields = ('name', 'code')


# ── Mpesa Payments ──
@admin.register(MpesaPayment)
class MpesaPaymentAdmin(TenantScopedAdmin):
    list_display = ('phone_number', 'amount', 'tenant', 'status', 'merchant_request_id', 'created_at')
    list_filter = ('tenant', 'status')
    search_fields = ('phone_number', 'merchant_request_id', 'receipt_number')


# ── Shift Audits ──
@admin.register(ShiftAudit)
class ShiftAuditAdmin(TenantScopedAdmin):
    list_display = ('shift_id', 'tenant', 'action', 'performed_by', 'timestamp')
    list_filter = ('tenant', 'action')
    search_fields = ('shift_id', 'performed_by')


# ── Cash Flows ──
@admin.register(CashFlow)
class CashFlowAdmin(TenantScopedAdmin):
    list_display = ('transaction_type', 'amount', 'tenant', 'category', 'date', 'payment_method')
    list_filter = ('tenant', 'transaction_type', 'category', 'payment_method')
    search_fields = ('description', 'reference_number')


# ── Purchase Orders ──
@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(TenantScopedAdmin):
    list_display = ('order_number', 'supplier_name', 'tenant', 'total_amount', 'status', 'order_date')
    list_filter = ('tenant', 'status')
    search_fields = ('order_number', 'supplier_name')


# ── Vault Documents ──
@admin.register(VaultDocument)
class VaultDocumentAdmin(TenantScopedAdmin):
    list_display = ('title', 'document_type', 'tenant', 'category', 'amount', 'stored_by_name', 'created_at')
    list_filter = ('tenant', 'document_type', 'category')
    search_fields = ('title', 'reference_number')


# ── Receipt Feedbacks ──
@admin.register(ReceiptFeedback)
class ReceiptFeedbackAdmin(TenantScopedAdmin):
    list_display = ('receipt_number', 'tenant', 'merchant_name', 'rating', 'customer_name', 'created_at')
    list_filter = ('tenant', 'rating')
    search_fields = ('receipt_number', 'customer_name', 'merchant_name')


# ── Subscriptions ──
@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'plan_name', 'amount', 'currency', 'billing_cycle', 'payment_status', 'status', 'mpesa_reference', 'start_date', 'end_date')
    list_filter = ('tenant', 'payment_status', 'status', 'plan_name', 'billing_cycle')
    search_fields = ('tenant__name', 'mpesa_reference', 'plan_name')


# ── Receipters Engine ──
@admin.register(ReceiptersEngine)
class ReceiptersEngineAdmin(admin.ModelAdmin):
    list_display = ('engine_name', 'tenant', 'status', 'total_processed_receipts', 'last_sync')
    list_filter = ('tenant', 'status')
    search_fields = ('engine_name', 'tenant__name')


# ── Receipters Vault Hub ──
@admin.register(ReceiptersVaultHub)
class ReceiptersVaultHubAdmin(admin.ModelAdmin):
    list_display = ('hub_name', 'tenant', 'storage_used_mb', 'encrypted_documents_count', 'status')
    list_filter = ('tenant', 'status')
    search_fields = ('hub_name', 'tenant__name')
