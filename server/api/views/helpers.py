import io
import os
import random
from datetime import datetime, timedelta
from django.utils import timezone
from django.http import HttpResponse, Http404
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db.models import Model, F, Q
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils.text import slugify
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from ..models import (
    Tenant, UserProfile, BusinessSettings, Branch, CashierInvite, Product, Customer, Supplier, Shift, Sale,
    Expense, EmployeeRating, EmployeeSchedule, Promotion, MpesaPayment,
    ShiftAudit, CashFlow, PurchaseOrder, VaultDocument, ReceiptFeedback,
    Subscription, ReceiptersEngine, ReceiptersVaultHub
)
from ..serializers import (
    TenantSerializer, UserProfileSerializer, UserSerializer,
    BusinessSettingsSerializer, BranchSerializer, ProductSerializer, CustomerSerializer,
    SupplierSerializer, ShiftSerializer, SaleSerializer, ExpenseSerializer,
    EmployeeRatingSerializer, EmployeeScheduleSerializer, PromotionSerializer,
    MpesaPaymentSerializer, ShiftAuditSerializer, CashFlowSerializer, PurchaseOrderSerializer,
    VaultDocumentSerializer, ReceiptFeedbackSerializer, SubscriptionSerializer,
    ReceiptersEngineSerializer, ReceiptersVaultHubSerializer
)

User = get_user_model()

# Model and Serializer map for generic CRUD
MODEL_MAP = {
    'BusinessSettings': (BusinessSettings, BusinessSettingsSerializer, 'bs_'),
    'Branch': (Branch, BranchSerializer, 'br_'),
    'Product': (Product, ProductSerializer, 'p_'),
    'Customer': (Customer, CustomerSerializer, 'c_'),
    'Supplier': (Supplier, SupplierSerializer, 's_'),
    'Shift': (Shift, ShiftSerializer, 'shift_'),
    'Sale': (Sale, SaleSerializer, 'sale_'),
    'Expense': (Expense, ExpenseSerializer, 'exp_'),
    'EmployeeRating': (EmployeeRating, EmployeeRatingSerializer, 'er_'),
    'EmployeeSchedule': (EmployeeSchedule, EmployeeScheduleSerializer, ''),
    'Promotion': (Promotion, PromotionSerializer, ''),
    'MpesaPayment': (MpesaPayment, MpesaPaymentSerializer, ''),
    'ShiftAudit': (ShiftAudit, ShiftAuditSerializer, ''),
    'CashFlow': (CashFlow, CashFlowSerializer, ''),
    'PurchaseOrder': (PurchaseOrder, PurchaseOrderSerializer, 'po_'),
    'User': (User, UserSerializer, 'u_'),
    'users': (User, UserSerializer, 'u_'),
    'VaultDocument': (VaultDocument, VaultDocumentSerializer, 'vd_'),
    'ReceiptFeedback': (ReceiptFeedback, ReceiptFeedbackSerializer, 'rf_'),
    'Subscription': (Subscription, SubscriptionSerializer, 'sub_'),
    'ReceiptersEngine': (ReceiptersEngine, ReceiptersEngineSerializer, ''),
    'ReceiptersVaultHub': (ReceiptersVaultHub, ReceiptersVaultHubSerializer, ''),
}

# ── Role-Based Access Control ──────────────────────────────
# Entities that only admins can read or write
ADMIN_ONLY_ENTITIES = {
    'BusinessSettings', 'Supplier', 'Expense', 'EmployeeRating',
    'EmployeeSchedule', 'Promotion', 'CashFlow', 'PurchaseOrder',
    'ShiftAudit', 'User', 'users', 'Subscription',
}

# Entities that cashiers can both read AND write
CASHIER_WRITE_ENTITIES = {
    'Sale', 'Shift', 'MpesaPayment',
}

# Entities that cashiers can read but NOT write (admin can do both)
CASHIER_READ_ONLY_ENTITIES = {
    'Product', 'Customer',
}


def is_admin_user(user):
    """Check if a user has admin privileges.
    
    Checks both Django staff/superuser flags AND the UserProfile.role field,
    since app-level business admins are stored as role='admin' in UserProfile.
    """
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    # Check app-level role stored on UserProfile
    profile = getattr(user, 'profile', None)
    if profile and getattr(profile, 'role', None) == 'admin':
        return True
    return False


def check_entity_permission(request, entity_name, is_write=False):
    """
    Check if the request user has permission to access the entity.
    Returns (user, error_response) — error_response is None if allowed.
    """
    user = request.user
    if not user or not user.is_authenticated:
        return None, Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Admin can do everything
    if is_admin_user(user):
        return user, None

    # Admin-only entities: block non-admin entirely
    if entity_name in ADMIN_ONLY_ENTITIES:
        return user, Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Cashier read-only entities: block writes
    if entity_name in CASHIER_READ_ONLY_ENTITIES and is_write:
        return user, Response(
            {'error': 'Admin access required to modify this resource'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Cashier-writable entities or reads on read-only entities: allow
    return user, None


def get_pk_from_prefixed_id(id_str, prefix=''):
    if not id_str:
        return None
    if prefix and id_str.startswith(prefix):
        try:
            return int(id_str[len(prefix):])
        except ValueError:
            pass
    # Strip any common prefix just in case
    for p in ['p_', 'c_', 's_', 'shift_', 'sale_', 'exp_', 'er_', 'u_']:
        if id_str.startswith(p):
            try:
                return int(id_str[len(p):])
            except ValueError:
                pass
    try:
        return int(id_str)
    except ValueError:
        return None


def get_tenant_for_user(request):
    """
    Returns the active tenant associated with the user request.
    - If superuser/staff and tenant_id query param or X-Tenant-Id header is set, returns that tenant.
    - Otherwise returns request.user.profile.tenant.
    """
    if not request.user or not request.user.is_authenticated:
        return None

    if is_admin_user(request.user):
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-Id')
        if tenant_id:
            tenant = Tenant.objects.filter(pk=tenant_id).first()
            if tenant:
                return tenant

    profile = getattr(request.user, 'profile', None)
    if profile and profile.tenant:
        return profile.tenant

    return None


def get_scoped_queryset(request, ModelClass):
    """
    Scopes ModelClass querysets to the user's active tenant if the model has a 'tenant' field,
    or via profile__tenant if ModelClass is User.
    Superusers without a specific tenant filter see all data.
    """
    queryset = ModelClass.objects.all()

    if ModelClass == User:
        tenant = get_tenant_for_user(request)
        if tenant:
            return User.objects.filter(profile__tenant=tenant)
        elif not is_admin_user(request.user):
            return User.objects.none()
        return queryset

    model_field_names = [f.name for f in ModelClass._meta.get_fields()]
    if 'tenant' not in model_field_names:
        return queryset

    tenant = get_tenant_for_user(request)
    if tenant:
        queryset = queryset.filter(tenant=tenant)
    elif not is_admin_user(request.user):
        queryset = queryset.none()

    return queryset


# Helper to generate JWT tokens for user
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ── Seed helper ─────────────────────────────────────────────
def seed_database_if_empty():
    """
    No-op in multi-tenant mode. Each business creates its own data through
    onboarding and normal operations. Called in several legacy places so kept
    as a safe stub to prevent NameError crashes.
    """
    pass

def process_sale_stock_deduction(sale_instance):
    """Automate stock deduction when a sale is completed."""
    if not sale_instance.items or not isinstance(sale_instance.items, list):
        return
    
    for item in sale_instance.items:
        if not isinstance(item, dict):
            continue
        prod_id = item.get('product_id') or item.get('id')
        qty = item.get('quantity') or item.get('qty') or 0
        if not prod_id or qty <= 0:
            continue
        
        pk_val = get_pk_from_prefixed_id(str(prod_id), 'p_')
        if pk_val:
            try:
                sale_tenant = getattr(sale_instance, 'tenant', None)
                product = Product.objects.get(tenant=sale_tenant, pk=pk_val)
                product.stock_quantity = max(0, product.stock_quantity - int(qty))
                product.save()
            except Product.DoesNotExist:
                pass


def process_purchase_order_stock_increase(po_instance):
    """Automate stock increase when a purchase order is delivered."""
    if po_instance.status != 'delivered':
        return
    if not po_instance.items or not isinstance(po_instance.items, list):
        return

    for item in po_instance.items:
        if not isinstance(item, dict):
            continue
        prod_id = item.get('product_id') or item.get('id')
        sku = item.get('sku')
        qty = item.get('quantity_ordered') or item.get('quantity') or item.get('qty') or 0
        if qty <= 0:
            continue

        product = None
        po_tenant = getattr(po_instance, 'tenant', None)
        if prod_id:
            pk_val = get_pk_from_prefixed_id(str(prod_id), 'p_')
            if pk_val:
                product = Product.objects.filter(tenant=po_tenant, pk=pk_val).first()
        if not product and sku:
            product = Product.objects.filter(tenant=po_tenant, sku__iexact=str(sku)).first()
        if not product and item.get('product_name'):
            product = Product.objects.filter(tenant=po_tenant, name__iexact=str(item.get('product_name'))).first()

        if product:
            product.stock_quantity += int(qty)
            product.save()


def process_customer_loyalty_and_tier(sale_instance, payload_data):
    """Automate loyalty point earning, point redemption, and customer tier auto-upgrades."""
    customer_id = payload_data.get('customer_id') or getattr(sale_instance, 'customer_id', None)
    if not customer_id:
        return

    pk_val = get_pk_from_prefixed_id(str(customer_id), 'c_')
    if not pk_val:
        return

    sale_tenant = getattr(sale_instance, 'tenant', None)
    customer = Customer.objects.filter(tenant=sale_tenant, pk=pk_val).first()
    if not customer:
        return

    # Update total spending and transaction count
    sale_total = float(getattr(sale_instance, 'total_amount', 0.0))
    customer.total_spending += sale_total
    customer.total_transactions += 1

    # Loyalty Points Engine: 1 point per 100 KES spent
    earned_points = int(sale_total // 100)
    customer.loyalty_points += earned_points

    # Deduct points if redeemed during checkout
    points_redeemed = int(payload_data.get('points_redeemed') or payload_data.get('points_used') or 0)
    if points_redeemed > 0:
        customer.loyalty_points = max(0, customer.loyalty_points - points_redeemed)

    # Customer Tiers Auto-upgrade logic
    if customer.total_spending >= 20000:
        customer.tier = 'gold'
    elif customer.total_spending >= 5000:
        customer.tier = 'silver'
    else:
        customer.tier = 'bronze'

    customer.save()


def seed_branches_if_empty(tenant):
    if not tenant:
        return
    if Branch.objects.filter(tenant=tenant).exists():
        return
    default_branches = [
        {
            'name': 'Nairobi CBD',
            'code': 'NBI-01',
            'location': 'Moja Towers, Kenyatta Avenue, Nairobi',
            'manager': 'Grace Wanjiku',
            'phone': '0712345678',
            'working_hours': '08:00 - 20:00',
            'status': 'active',
            'monthly_rent': 45000,
            'debt': 0
        },
        {
            'name': 'Westlands',
            'code': 'WST-02',
            'location': 'Sarit Centre, Westlands, Nairobi',
            'manager': 'James Otieno',
            'phone': '0723456789',
            'working_hours': '08:00 - 21:00',
            'status': 'active',
            'monthly_rent': 60000,
            'debt': 0
        },
        {
            'name': 'Mombasa Town',
            'code': 'MBA-03',
            'location': 'Nyali Centre, Mombasa',
            'manager': 'Aisha Hassan',
            'phone': '0734567890',
            'working_hours': '08:00 - 20:00',
            'status': 'active',
            'monthly_rent': 35000,
            'debt': 0
        },
        {
            'name': 'Kisumu City',
            'code': 'KSM-04',
            'location': 'Mega Plaza, Oginga Odinga St, Kisumu',
            'manager': 'Brian Kiprotich',
            'phone': '0745678901',
            'working_hours': '09:00 - 19:00',
            'status': 'maintenance',
            'monthly_rent': 28000,
            'debt': 0
        }
    ]
    for item in default_branches:
        Branch.objects.create(tenant=tenant, **item)

