from django.contrib import admin
from .models import (
    BusinessSettings, Product, Customer, Supplier, Shift, Sale,
    Expense, EmployeeRating, EmployeeSchedule, Promotion, MpesaPayment,
    ShiftAudit, CashFlow
)


@admin.register(BusinessSettings)
class BusinessSettingsAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'business_type', 'currency', 'kra_pin')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'price', 'cost_price', 'stock_quantity', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'sku')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'loyalty_points', 'tier', 'is_active')
    list_filter = ('tier', 'is_active')
    search_fields = ('name', 'phone', 'email')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone', 'payment_terms', 'is_active')
    list_filter = ('payment_terms', 'is_active')
    search_fields = ('name', 'contact_person')


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('id', 'cashier_name', 'status', 'started_at', 'starting_cash', 'total_sales')
    list_filter = ('status',)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'cashier_name', 'total_amount', 'payment_method', 'status', 'etims_status')
    list_filter = ('payment_method', 'status', 'etims_status')
    search_fields = ('receipt_number', 'cuin')


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('category', 'amount', 'description', 'status', 'date')
    list_filter = ('category', 'status')


@admin.register(EmployeeRating)
class EmployeeRatingAdmin(admin.ModelAdmin):
    list_display = ('cashier_name', 'rating')


@admin.register(EmployeeSchedule)
class EmployeeScheduleAdmin(admin.ModelAdmin):
    list_display = ('cashier_name', 'date', 'shift_type')


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'discount_type', 'discount_value', 'is_active')
    list_filter = ('discount_type', 'is_active')


@admin.register(MpesaPayment)
class MpesaPaymentAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'amount', 'status', 'merchant_request_id')
    list_filter = ('status',)


@admin.register(ShiftAudit)
class ShiftAuditAdmin(admin.ModelAdmin):
    list_display = ('shift_id', 'action', 'performed_by', 'timestamp')


@admin.register(CashFlow)
class CashFlowAdmin(admin.ModelAdmin):
    list_display = ('type', 'amount', 'category', 'date')
    list_filter = ('type', 'category')
