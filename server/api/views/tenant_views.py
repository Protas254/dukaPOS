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


from .helpers import *
from ..emails import send_welcome_email

@api_view(['POST'])
@permission_classes([AllowAny])
def register_tenant(request):
    """
    Registers a new business tenant and creates its primary owner/admin user account.
    """
    business_name = request.data.get('business_name')
    owner_email = request.data.get('email') or request.data.get('owner_email')
    owner_name = request.data.get('owner_name') or request.data.get('name') or 'Admin'
    owner_phone = request.data.get('owner_phone') or request.data.get('phone', '')
    password = request.data.get('password')
    business_type = request.data.get('business_type', 'sme')
    currency = request.data.get('currency', 'KES')
    plan = request.data.get('plan', 'starter')

    if not business_name or not owner_email or not password:
        return Response({'error': 'Business name, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=owner_email).exists():
        return Response({'error': 'An account with this email address already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate unique slug
    base_slug = slugify(business_name) or 'store'
    slug = base_slug
    counter = 1
    while Tenant.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create Tenant
    tenant = Tenant.objects.create(
        name=business_name,
        slug=slug,
        owner_name=owner_name,
        owner_email=owner_email,
        owner_phone=owner_phone,
        business_type=business_type,
        currency=currency,
        plan=plan,
        is_onboarded=False
    )

    # Create User
    username = owner_email.split('@')[0]
    if User.objects.filter(username=username).exists():
        username = f"{username}_{random.randint(100, 999)}"

    user = User.objects.create(
        username=username,
        email=owner_email,
        first_name=owner_name.split()[0] if owner_name else owner_name,
        last_name=' '.join(owner_name.split()[1:]) if len(owner_name.split()) > 1 else '',
        is_staff=True,
        is_superuser=False
    )
    user.set_password(password)
    user.save()

    # Create UserProfile
    UserProfile.objects.create(
        user=user,
        tenant=tenant,
        role='admin'
    )

    # Create default BusinessSettings for Tenant
    BusinessSettings.objects.create(
        tenant=tenant,
        business_name=business_name,
        business_type=business_type,
        business_phone=owner_phone or '+254 700 000000',
        business_email=owner_email,
        currency=currency,
        kra_pin='A000000000Z',
        default_tax_rate=16.0,
        receipt_footer=f"Thank you for shopping at {business_name}!"
    )

    tokens = get_tokens_for_user(user)
    send_welcome_email(owner_email, owner_name or username.capitalize(), business_name)
    user_data = UserSerializer(user).data
    user_data['token'] = tokens['access']
    user_data['access_token'] = tokens['access']
    user_data['refresh_token'] = tokens['refresh']

    return Response({
        'message': 'Business registered successfully!',
        'user': user_data,
        'tenant': TenantSerializer(tenant).data,
        'token': tokens['access'],
        'access_token': tokens['access'],
        'refresh_token': tokens['refresh']
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboard_tenant(request):
    """
    Onboarding wizard step: configures store profile, initial inventory, tax & receipt settings.
    """
    profile = getattr(request.user, 'profile', None)
    if not profile or not profile.tenant:
        return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)

    tenant = profile.tenant

    # Update Tenant meta
    if 'business_name' in request.data and request.data['business_name']:
        tenant.name = request.data['business_name']
    if 'business_type' in request.data:
        tenant.business_type = request.data['business_type']
    if 'plan' in request.data:
        tenant.plan = request.data['plan']
    if 'user_type' in request.data:
        tenant.owner_name = request.data.get('user_type', tenant.owner_name)

    # Update BusinessSettings
    bs, _ = BusinessSettings.objects.get_or_create(tenant=tenant)
    
    field_map = {
        'business_name': 'business_name',
        'trading_name': 'trading_name',
        'business_type': 'business_type',
        'pos_type': 'pos_type',
        'business_phone': 'business_phone',
        'business_email': 'business_email',
        'business_address': 'business_address',
        'business_website': 'business_website',
        'year_established': 'year_established',
        'employee_range': 'employee_range',
        'registration_number': 'registration_number',
        'kra_pin': 'kra_pin',
        'vat_number': 'vat_number',
        'vat_registered': 'vat_registered',
        'etims_enabled': 'etims_enabled',
        'currency': 'currency',
        'receipt_header': 'receipt_header',
        'receipt_footer': 'receipt_footer',
        'return_policy': 'return_policy',
        'exchange_policy': 'exchange_policy',
        'license_no': 'license_no',
        'license_expiry': 'license_expiry',
        'mpesa_paybill': 'mpesa_paybill',
        'mpesa_till': 'mpesa_till',
        'mpesa_account_ref': 'mpesa_account_ref',
        'selected_goods': 'selected_goods',
        'selected_services': 'selected_services',
        'branches': 'branches',
        'contact': 'contact_info',
        'owner_role': 'owner_role',
        'logo_url': 'logo_url',
    }

    for req_key, attr_name in field_map.items():
        if req_key in request.data:
            setattr(bs, attr_name, request.data[req_key])

    if 'default_tax_rate' in request.data:
        try:
            bs.default_tax_rate = float(request.data['default_tax_rate'])
        except (ValueError, TypeError):
            pass

    if 'currency' in request.data:
        tenant.currency = request.data['currency']

    bs.save()

    # Add initial products if supplied
    initial_products = request.data.get('initial_products', [])
    for p_data in initial_products:
        if isinstance(p_data, dict) and p_data.get('name'):
            Product.objects.create(
                tenant=tenant,
                name=p_data.get('name'),
                category=p_data.get('category', 'General'),
                price=float(p_data.get('price', 100)),
                cost_price=float(p_data.get('cost_price', 70)),
                stock_quantity=int(p_data.get('stock_quantity', 20)),
                sku=f"SKU-{random.randint(1000, 9999)}"
            )

    tenant.is_onboarded = True
    tenant.save()

    return Response({
        'message': 'Tenant onboarding completed successfully!',
        'tenant': TenantSerializer(tenant).data,
        'settings': BusinessSettingsSerializer(bs).data
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_user_tenants(request):
    """
    GET: Returns all business tenants associated with the current user.
    POST: Creates a new tenant business for the user.
    """
    if request.method == 'GET':
        # Find all tenants where user is owner or has user profile
        user_email = request.user.email
        tenants = Tenant.objects.filter(
            Q(owner_email__iexact=user_email) | Q(user_profiles__user=request.user)
        ).distinct()

        serializer = TenantSerializer(tenants, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        name = request.data.get('business_name') or request.data.get('name')
        if not name:
            return Response({'error': 'Business name is required'}, status=status.HTTP_400_BAD_REQUEST)

        base_slug = slugify(name) or 'store'
        slug = base_slug
        counter = 1
        while Tenant.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        tenant = Tenant.objects.create(
            name=name,
            slug=slug,
            owner_name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
            owner_email=request.user.email,
            business_type=request.data.get('business_type', 'sme'),
            currency=request.data.get('currency', 'KES'),
            plan=request.data.get('plan', 'starter'),
            is_onboarded=False
        )

        # Set or update active profile
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.tenant = tenant
        profile.role = 'admin'
        profile.save()

        BusinessSettings.objects.create(
            tenant=tenant,
            business_name=name,
            business_email=request.user.email,
            currency=tenant.currency,
        )

        return Response({
            'message': 'Business created successfully!',
            'tenant': TenantSerializer(tenant).data
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def switch_active_tenant(request):
    """
    Switch active tenant workspace for the authenticated user.
    """
    tenant_id = request.data.get('tenant_id')
    if not tenant_id:
        return Response({'error': 'tenant_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    tenant = get_object_or_404(Tenant, pk=tenant_id)
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.tenant = tenant
    profile.save()

    return Response({
        'message': f'Switched active workspace to {tenant.name}',
        'tenant': TenantSerializer(tenant).data
    })
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def superadmin_tenant_stats(request):
    """
    Super Admin endpoint: track performance and stats for each business tenant.
    """
    if not is_admin_user(request.user):
        return Response({'error': 'Super Admin permission required'}, status=status.HTTP_403_FORBIDDEN)

    tenants = Tenant.objects.all().order_by('-created_at')
    tenant_list = []

    for t in tenants:
        t_sales = Sale.objects.filter(tenant=t)
        total_rev = sum(s.total_amount for s in t_sales)
        sales_count = t_sales.count()
        prod_count = Product.objects.filter(tenant=t).count()
        cust_count = Customer.objects.filter(tenant=t).count()
        active_shifts = Shift.objects.filter(tenant=t, status='active').count()

        tenant_list.append({
            'id': t.id,
            'name': t.name,
            'slug': t.slug,
            'owner_name': t.owner_name,
            'owner_email': t.owner_email,
            'business_type': t.business_type,
            'currency': t.currency,
            'plan': t.plan,
            'is_onboarded': t.is_onboarded,
            'is_active': t.is_active,
            'created_at': t.created_at,
            'stats': {
                'total_revenue': round(total_rev, 2),
                'total_sales': sales_count,
                'total_products': prod_count,
                'total_customers': cust_count,
                'active_shifts': active_shifts,
            }
        })

    return Response({
        'total_tenants': tenants.count(),
        'onboarded_tenants': tenants.filter(is_onboarded=True).count(),
        'tenants': tenant_list
    })

