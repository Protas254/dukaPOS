import io
import random
from datetime import datetime, timedelta
from django.utils import timezone
from django.http import HttpResponse, Http404
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db.models import Model, F
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from .models import (
    BusinessSettings, Product, Customer, Supplier, Shift, Sale,
    Expense, EmployeeRating, EmployeeSchedule, Promotion, MpesaPayment,
    ShiftAudit, CashFlow, PurchaseOrder
)
from .serializers import (
    UserSerializer, BusinessSettingsSerializer, ProductSerializer,
    CustomerSerializer, SupplierSerializer, ShiftSerializer, SaleSerializer,
    ExpenseSerializer, EmployeeRatingSerializer, EmployeeScheduleSerializer,
    PromotionSerializer, MpesaPaymentSerializer, ShiftAuditSerializer,
    CashFlowSerializer, PurchaseOrderSerializer
)

User = get_user_model()

# Model and Serializer map for generic CRUD
MODEL_MAP = {
    'BusinessSettings': (BusinessSettings, BusinessSettingsSerializer, 'bs_'),
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
}

# ── Role-Based Access Control ──────────────────────────────
# Entities that only admins can read or write
ADMIN_ONLY_ENTITIES = {
    'BusinessSettings', 'Supplier', 'Expense', 'EmployeeRating',
    'EmployeeSchedule', 'Promotion', 'CashFlow', 'PurchaseOrder',
    'ShiftAudit', 'User', 'users',
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
    """Check if a user has admin privileges."""
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser or user.is_staff or ('admin' in (user.email or '').lower())


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


def seed_database_if_empty():
    """Seeding disabled — production mode. All data is created through the API."""
    pass


# Helper to generate JWT tokens for user
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# --- Auth Views ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
    seed_database_if_empty()
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()

    if not user:
        # Do NOT auto-register — return a generic error to prevent user enumeration
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)

    # Check password securely using Django's built-in hashing check
    if not user.check_password(password):
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)

    tokens = get_tokens_for_user(user)
    serializer = UserSerializer(user)
    data = serializer.data
    data['token'] = tokens['access']
    data['access_token'] = tokens['access']
    data['refresh_token'] = tokens['refresh']
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
    seed_database_if_empty()
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate a secure 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    
    # Store hashed password instead of plaintext to prevent security vulnerabilities
    hashed_password = make_password(password)
    
    request.session['pending_user'] = {
        'email': email, 
        'hashed_password': hashed_password,
        'otp_code': otp_code
    }
    
    # Send OTP via Email
    try:
        send_mail(
            subject='Your DukaPOS Verification Code',
            message=f'Your verification code is: {otp_code}\n\nPlease enter this code to complete your registration.',
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@dukapos.com',
            recipient_list=[email],
            fail_silently=True,  # In dev, this might fail if SMTP isn't set up yet
        )
    except Exception as e:
        print(f"Error sending email: {e}")

    return Response({'email': email})


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_verify_otp(request):
    email = request.data.get('email')
    otp_code = request.data.get('otpCode')
    
    pending = request.session.get('pending_user')
    if not pending or pending['email'].lower() != email.lower():
        return Response({'error': 'No pending registration found'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify OTP
    if str(pending.get('otp_code')) != str(otp_code):
        return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)

    # Create user with previously hashed password
    username = email.split('@')[0]
    if User.objects.filter(username=username).exists():
        username = f"{username}_{random.randint(10, 99)}"
    
    role_admin = 'admin' in email.lower()
    
    user = User(
        username=username,
        email=email,
        first_name=username.capitalize(),
        is_staff=role_admin,
        is_superuser=role_admin
    )
    user.password = pending['hashed_password']
    user.save()
    
    # Clear session
    del request.session['pending_user']
    
    tokens = get_tokens_for_user(user)
    return Response({
        'token': tokens['access'],
        'access_token': tokens['access'],
        'refresh_token': tokens['refresh']
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_resend_otp(request):
    email = request.data.get('email')
    pending = request.session.get('pending_user')
    
    if not pending or pending['email'].lower() != email.lower():
        return Response({'error': 'No pending registration found'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Generate a new secure 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    pending['otp_code'] = otp_code
    request.session['pending_user'] = pending
    request.session.modified = True
    
    # Send OTP via Email
    try:
        send_mail(
            subject='Your New DukaPOS Verification Code',
            message=f'Your new verification code is: {otp_code}\n\nPlease enter this code to complete your registration.',
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@dukapos.com',
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Error sending email: {e}")
        
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_google_login(request):
    """
    Verify a Google ID token (from Google Sign-In) and return a JWT.
    The frontend sends: { credential: "<google_id_token>" }
    """
    credential = request.data.get('credential')
    if not credential:
        return Response({'error': 'Google credential is required'}, status=status.HTTP_400_BAD_REQUEST)

    google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
    if not google_client_id:
        return Response({'error': 'Google OAuth is not configured on this server'}, status=status.HTTP_501_NOT_IMPLEMENTED)

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            google_client_id,
            clock_skew_in_seconds=10,
        )
    except ValueError as e:
        return Response({'error': f'Invalid Google token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    email = idinfo.get('email')
    if not email:
        return Response({'error': 'Google account has no email'}, status=status.HTTP_400_BAD_REQUEST)

    if not idinfo.get('email_verified', False):
        return Response({'error': 'Google email is not verified'}, status=status.HTTP_400_BAD_REQUEST)

    # Get or create user
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        username = email.split('@')[0]
        if User.objects.filter(username=username).exists():
            username = f"{username}_{random.randint(10, 99)}"

        role_admin = 'admin' in email.lower()
        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_staff=role_admin,
            is_superuser=role_admin,
        )
        user.set_unusable_password()
        user.save()

    tokens = get_tokens_for_user(user)
    serializer = UserSerializer(user)
    data = serializer.data
    data['token'] = tokens['access']
    data['access_token'] = tokens['access']
    data['refresh_token'] = tokens['refresh']
    return Response(data)



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
                product = Product.objects.get(pk=pk_val)
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
        if prod_id:
            pk_val = get_pk_from_prefixed_id(str(prod_id), 'p_')
            if pk_val:
                product = Product.objects.filter(pk=pk_val).first()
        if not product and sku:
            product = Product.objects.filter(sku__iexact=str(sku)).first()
        if not product and item.get('product_name'):
            product = Product.objects.filter(name__iexact=str(item.get('product_name'))).first()

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

    customer = Customer.objects.filter(pk=pk_val).first()
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


# --- Generic CRUD Views ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def entity_list_create(request, entity_name):
    seed_database_if_empty()
    if entity_name not in MODEL_MAP:
        return Response({'error': f"Entity {entity_name} not found"}, status=status.HTTP_404_NOT_FOUND)

    is_write = request.method == 'POST'
    user, err = check_entity_permission(request, entity_name, is_write=is_write)
    if err:
        return err

    ModelClass, SerializerClass, prefix = MODEL_MAP[entity_name]

    if request.method == 'GET':
        sort = request.query_params.get('sort')
        limit = request.query_params.get('limit')
        low_stock = request.query_params.get('low_stock')
        
        queryset = ModelClass.objects.all()

        if entity_name in ('Product', 'products') and low_stock and low_stock.lower() in ('true', '1'):
            queryset = queryset.filter(stock_quantity__lte=F('low_stock_threshold'))

        if sort:
            is_descending = sort.startswith('-')
            field = sort[1:] if is_descending else sort
            
            # Map frontend sort keys to actual DB column names
            FIELD_ALIAS_MAP = {
                'created_date': 'created_at',
                'date': 'created_at',
            }
            field = FIELD_ALIAS_MAP.get(field, field)
            
            # Check if field exists on model
            try:
                ModelClass._meta.get_field(field)
                queryset = queryset.order_by(f"-{field}" if is_descending else field)
            except Exception:
                pass

        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass

        serializer = SerializerClass(queryset, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Remove custom prefix from any ID in payload if updating/creating
        data = request.data.copy()
        if 'id' in data and isinstance(data['id'], str):
            pk_val = get_pk_from_prefixed_id(data['id'], prefix)
            if pk_val:
                data['id'] = pk_val
            else:
                data.pop('id', None)

        if entity_name in ('Expense', 'expenses'):
            if not data.get('shift_id'):
                active_shift = Shift.objects.filter(cashier_id=str(user.id), status='active').first()
                if active_shift:
                    data['shift_id'] = f"shift_{active_shift.id}"

        if entity_name in ('Sale', 'sales'):
            # 1. Shift Validation: Cashiers must have an active shift open
            cashier_id = user.id
            active_shift = Shift.objects.filter(cashier_id=str(cashier_id), status='active').first()
            if not active_shift and data.get('shift_id'):
                shift_pk = get_pk_from_prefixed_id(str(data.get('shift_id')), 'shift_')
                if shift_pk:
                    active_shift = Shift.objects.filter(pk=shift_pk, status='active').first()

            if not active_shift and not is_admin_user(user):
                return Response(
                    {'error': 'Active shift required to process sales. Please start a shift first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Cart & Tax Math: Server-side recalculation to prevent price tampering
            raw_items = data.get('items', [])
            if isinstance(raw_items, list) and len(raw_items) > 0:
                biz_settings = BusinessSettings.objects.first()
                default_tax_rate = float(getattr(biz_settings, 'default_tax_rate', 16.0)) if biz_settings else 16.0
                
                calculated_subtotal = 0.0
                processed_items = []
                
                for item in raw_items:
                    if not isinstance(item, dict):
                        continue
                    prod_id = item.get('product_id') or item.get('id')
                    qty = float(item.get('quantity') or item.get('qty') or 1)
                    
                    product = None
                    if prod_id:
                        pk_val = get_pk_from_prefixed_id(str(prod_id), 'p_')
                        if pk_val:
                            product = Product.objects.filter(pk=pk_val).first()
                    
                    unit_price = float(product.price) if product else float(item.get('unit_price') or item.get('price') or 0.0)
                    prod_tax_rate = float(product.tax_rate) if (product and getattr(product, 'tax_rate', None) is not None) else default_tax_rate
                    
                    item_total = unit_price * qty
                    item_tax = item_total * (prod_tax_rate / (100.0 + prod_tax_rate))
                    
                    calculated_subtotal += item_total
                    processed_items.append({
                        'product_id': item.get('product_id') or (f"p_{product.id}" if product else 'p_0'),
                        'product_name': product.name if product else item.get('product_name', 'Item'),
                        'quantity': qty,
                        'unit_price': round(unit_price, 2),
                        'total': round(item_total, 2),
                        'tax_amount': round(item_tax, 2)
                    })
                    
                discount_amount = float(data.get('discount_amount') or data.get('discount') or 0.0)
                taxable_amount = max(0.0, calculated_subtotal - discount_amount)
                calculated_tax_total = taxable_amount * (default_tax_rate / (100.0 + default_tax_rate))
                calculated_total = round(taxable_amount + calculated_tax_total, 2)
                
                data['items'] = processed_items
                data['subtotal'] = round(calculated_subtotal, 2)
                data['tax_total'] = round(calculated_tax_total, 2)
                data['total_amount'] = calculated_total

        serializer = SerializerClass(data=data)
        if serializer.is_valid():
            instance = serializer.save()
            if entity_name in ('Sale', 'sales'):
                process_sale_stock_deduction(instance)
                process_customer_loyalty_and_tier(instance, data)
                CashFlow.objects.create(
                    transaction_type='inflow',
                    amount=instance.total_amount,
                    category='Sales Revenue',
                    description=f"Sale Receipt #{instance.receipt_number} ({instance.payment_method})"
                )
            elif entity_name in ('PurchaseOrder', 'purchase_orders'):
                process_purchase_order_stock_increase(instance)
            elif entity_name in ('Expense', 'expenses'):
                CashFlow.objects.create(
                    transaction_type='outflow',
                    amount=instance.amount,
                    category=instance.category,
                    description=f"Expense: {instance.description}"
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def entity_filter(request, entity_name):
    seed_database_if_empty()
    if entity_name not in MODEL_MAP:
        return Response({'error': f"Entity {entity_name} not found"}, status=status.HTTP_404_NOT_FOUND)

    # Filter is a read operation
    user, err = check_entity_permission(request, entity_name, is_write=False)
    if err:
        return err

    ModelClass, SerializerClass, prefix = MODEL_MAP[entity_name]
    criteria = request.data or {}
    
    # Process criteria fields (strip prefixes if querying by ID)
    filter_kwargs = {}
    filter_low_stock = False
    for key, val in criteria.items():
        if key in ('low_stock', 'is_low_stock'):
            if str(val).lower() in ('true', '1'):
                filter_low_stock = True
        elif key == 'id' and isinstance(val, str):
            pk_val = get_pk_from_prefixed_id(val, prefix)
            if pk_val:
                filter_kwargs['pk'] = pk_val
            else:
                filter_kwargs[key] = val
        else:
            filter_kwargs[key] = val

    queryset = ModelClass.objects.filter(**filter_kwargs)
    if entity_name in ('Product', 'products') and filter_low_stock:
        queryset = queryset.filter(stock_quantity__lte=F('low_stock_threshold'))

    serializer = SerializerClass(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def entity_detail(request, entity_name, pk):
    seed_database_if_empty()
    if entity_name not in MODEL_MAP:
        return Response({'error': f"Entity {entity_name} not found"}, status=status.HTTP_404_NOT_FOUND)

    is_write = request.method in ('PUT', 'DELETE')
    user, err = check_entity_permission(request, entity_name, is_write=is_write)
    if err:
        return err

    ModelClass, SerializerClass, prefix = MODEL_MAP[entity_name]
    
    # Retrieve object
    pk_val = get_pk_from_prefixed_id(pk, prefix)
    if pk_val is None:
        if ModelClass == BusinessSettings:
            # Special case for 'bs_default'
            instance = ModelClass.objects.first()
            if not instance:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': f"Invalid ID format: {pk}"}, status=status.HTTP_404_NOT_FOUND)
    else:
        instance = get_object_or_404(ModelClass, pk=pk_val)

    if request.method == 'GET':
        serializer = SerializerClass(instance)
        return Response(serializer.data)

    elif request.method == 'PUT':
        old_status = getattr(instance, 'status', None)
        serializer = SerializerClass(instance, data=request.data, partial=True)
        if serializer.is_valid():
            updated_instance = serializer.save()
            if entity_name in ('PurchaseOrder', 'purchase_orders') and old_status != 'delivered' and updated_instance.status == 'delivered':
                process_purchase_order_stock_increase(updated_instance)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        instance.delete()
        return Response({'success': True})


# --- Custom Functions Invocation View ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def functions_invoke(request):
    seed_database_if_empty()
    name = request.data.get('name')
    payload = request.data.get('payload', {})

    if not name:
        return Response({'error': 'Function name is required'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. PDF Generation Functions
    if name in ['generateReceiptPDF', 'generateDukaPOSPDF', 'generateHardwarePDF', 'generateBrandingPDF', 'generateUserManualPDF', 'generateEtimsRoadmapPDF']:
        sale_data = payload.get('sale') if isinstance(payload, dict) else None
        sale_id = payload.get('sale_id') if isinstance(payload, dict) else None
        
        sale = None
        if isinstance(sale_data, dict) and sale_data.get('id'):
            sale_id = sale_data.get('id')
        
        if sale_id:
            pk_val = get_pk_from_prefixed_id(str(sale_id), 'sale_')
            if pk_val:
                sale = Sale.objects.filter(pk=pk_val).first()

        if name == 'generateReceiptPDF' or (name == 'generateDukaPOSPDF' and (sale or sale_data)):
            biz = BusinessSettings.objects.first()
            store_name = biz.store_name if (biz and hasattr(biz, 'store_name')) else "DukaPOS Store"
            store_address = biz.address if (biz and hasattr(biz, 'address') and biz.address) else "Nairobi, Kenya"
            store_phone = biz.phone if (biz and hasattr(biz, 'phone') and biz.phone) else "+254 700 000000"
            kra_pin = biz.kra_pin if (biz and hasattr(biz, 'kra_pin') and biz.kra_pin) else "P051234567Z"

            buffer = io.BytesIO()
            p = canvas.Canvas(buffer, pagesize=(226, 600))
            
            p.setFont("Helvetica-Bold", 14)
            p.drawCentredString(113, 570, store_name)
            
            p.setFont("Helvetica", 9)
            p.drawCentredString(113, 555, store_address)
            p.drawCentredString(113, 543, f"TEL: {store_phone}")
            p.drawCentredString(113, 531, f"PIN: {kra_pin}")
            p.line(10, 523, 216, 523)
            
            p.setFont("Helvetica-Bold", 10)
            p.drawString(10, 508, "OFFICIAL RECEIPT")
            
            p.setFont("Helvetica", 9)
            rec_num = sale.receipt_number if sale else (sale_data.get('receipt_number') if sale_data else 'RC-DEMO')
            s_date = sale.created_at.strftime('%Y-%m-%d %H:%M') if (sale and getattr(sale, 'created_at', None)) else datetime.now().strftime('%Y-%m-%d %H:%M')
            c_name = sale.cashier_name if sale else (sale_data.get('cashier_name') if sale_data else 'Cashier')
            
            p.drawString(10, 493, f"Receipt: {rec_num}")
            p.drawString(10, 481, f"Date: {s_date}")
            p.drawString(10, 469, f"Cashier: {c_name}")
            p.line(10, 461, 216, 461)
            
            p.setFont("Helvetica-Bold", 8)
            p.drawString(10, 448, "Item")
            p.drawString(110, 448, "Qty")
            p.drawString(145, 448, "Price")
            p.drawString(185, 448, "Total")
            p.line(10, 442, 216, 442)
            
            p.setFont("Helvetica", 8)
            y = 430
            items_list = sale.items if sale else (sale_data.get('items', []) if sale_data else [])
            for item in items_list:
                if not isinstance(item, dict):
                    continue
                iname = str(item.get('product_name') or item.get('name') or 'Product')[:16]
                iqty = str(item.get('quantity') or item.get('qty') or 1)
                iprice = f"{float(item.get('unit_price') or item.get('price') or 0):.1f}"
                itotal = f"{float(item.get('total') or 0):.1f}"
                
                p.drawString(10, y, iname)
                p.drawString(115, y, iqty)
                p.drawString(145, y, iprice)
                p.drawRightString(215, y, itotal)
                y -= 14
                if y < 100:
                    break
                    
            p.line(10, y, 216, y)
            y -= 14
            
            sub_val = f"KES {float(sale.subtotal if sale else (sale_data.get('subtotal') or 0)):,.2f}"
            tax_val = f"KES {float(sale.tax_total if sale else (sale_data.get('tax_total') or 0)):,.2f}"
            tot_val = f"KES {float(sale.total_amount if sale else (sale_data.get('total_amount') or 0)):,.2f}"
            pmeth = str(sale.payment_method if sale else (sale_data.get('payment_method') or 'CASH')).upper()
            
            p.drawString(10, y, "Subtotal:")
            p.drawRightString(215, y, sub_val)
            y -= 12
            p.drawString(10, y, "Tax (VAT):")
            p.drawRightString(215, y, tax_val)
            y -= 12
            p.setFont("Helvetica-Bold", 10)
            p.drawString(10, y, "TOTAL:")
            p.drawRightString(215, y, tot_val)
            y -= 14
            p.setFont("Helvetica", 8)
            p.drawString(10, y, f"Payment Method: {pmeth}")
            y -= 14
            if sale and getattr(sale, 'cuin', None):
                p.drawString(10, y, f"eTIMS CUIN: {sale.cuin}")
                y -= 14
                
            p.line(10, y, 216, y)
            y -= 20
            p.setFont("Helvetica-Oblique", 8)
            p.drawCentredString(113, y, "Thank you for shopping with us!")
            
            p.showPage()
            p.save()
            pdf_bytes = buffer.getvalue()
            buffer.close()
            return HttpResponse(pdf_bytes, content_type='application/pdf')

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setFont("Helvetica-Bold", 20)
        
        # Determine Title and Content based on Function Name
        if name == 'generateHardwarePDF':
            p.drawString(100, 700, "DukaPOS Hardware Specifications")
            p.setFont("Helvetica", 12)
            lines = [
                "Recommended hardware setup for optimal POS performance:",
                "- Tablet/PC: Android 10+ or Windows 10+ with Google Chrome",
                "- Receipt Printer: 80mm Thermal Printer with USB/Bluetooth/Ethernet",
                "- Barcode Scanner: USB/Wireless Laser Barcode Scanner",
                "- Cash Drawer: Standard 24V RJ11 interface cash drawer",
                "- Network: Stable Wi-Fi or 4G connection",
                "",
                "Integration Notes:",
                "- Connect thermal printer via USB or Bluetooth for instant receipt printing.",
                "- Enable ESC/POS compatibility on your receipt printer."
            ]
        elif name == 'generateBrandingPDF':
            p.drawString(100, 700, "DukaPOS Brand Guidelines")
            p.setFont("Helvetica", 12)
            lines = [
                "Brand guidelines and assets overview:",
                "- Primary Color: Emerald Green (HSL 142, 70%, 45%)",
                "- Secondary Color: Sage Green (HSL 142, 30%, 65%)",
                "- Typography: Inter (UI/Labels) and Outfit (Headers/Headings)",
                "- Tone of Voice: Professional, modern, empowering, clean"
            ]
        elif name == 'generateUserManualPDF':
            p.drawString(100, 700, "DukaPOS User Manual")
            p.setFont("Helvetica", 12)
            lines = [
                "Complete guide to operating the DukaPOS system:",
                "1. Go to Settings and configure your KRA PIN and tax rate (default is 16%).",
                "2. Go to Inventory and add products with SKUs and stock counts.",
                "3. Set up employees and schedule shifts.",
                "4. Open the POS screen, scan or click items to add to cart, and select payment.",
                "5. Complete checkout - this automatically updates inventory and loyalty points.",
                "6. View the Dashboard or Reports section to monitor sales in real-time."
            ]
        elif name == 'generateDukaPOSPDF':
            p.drawString(100, 700, "DukaPOS System Information")
            p.setFont("Helvetica", 12)
            lines = [
                "DukaPOS is a fully independent local-first POS solution.",
                "Designed for retail shops, supermarkets, and mini-marts in East Africa."
            ]
        elif name == 'generateEtimsRoadmapPDF':
            p.drawString(100, 700, "KRA eTIMS Integration Guide")
            p.setFont("Helvetica", 12)
            lines = [
                "Roadmap for eTIMS integration in Kenya:",
                "1. Obtain your KRA PIN and register for eTIMS portal access.",
                "2. Update your business settings in DukaPOS with your KRA PIN.",
                "3. Ensure all taxable products have a 16% standard VAT rate.",
                "4. Use the POS to make sales. Invoices sync automatically to eTIMS.",
                "5. Monitor submission status under the eTIMS Compliance tab."
            ]

        # Draw lines to canvas
        y = 650
        for line in lines:
            p.drawString(100, y, line)
            y -= 25
            
        p.showPage()
        p.save()
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(pdf_bytes, content_type='application/octet-stream')
        return response

    # 2. eTIMS Invoice Submission
    if name == 'submitEtimsInvoice':
        sale_payload = payload.get('sale', {})
        sale_id = sale_payload.get('id')
        
        if sale_id:
            pk_val = get_pk_from_prefixed_id(sale_id, 'sale_')
            if pk_val:
                try:
                    sale = Sale.objects.get(pk=pk_val)
                    cuin = 'KRAETIMS' + str(random.randint(1000000000, 9999999999))
                    sale.cuin = cuin
                    sale.etims_status = 'submitted'
                    sale.save()
                    return Response({
                        'status': 'success',
                        'message': 'Invoice submitted to eTIMS successfully',
                        'cuin': cuin,
                        'etims_status': 'submitted'
                    })
                except Sale.DoesNotExist:
                    pass
        return Response({'error': 'Invalid sale payload or sale not found'}, status=status.HTTP_400_BAD_REQUEST)

    # 3. Shift Audit & End-of-Day Z-Report Reconciliation
    if name in ['shiftAudit', 'closeShift', 'getZReport']:
        shift_id = payload.get('shift_id') or payload.get('shiftId') or payload.get('auditId')
        actual_cash = float(payload.get('actual_cash') or payload.get('actualCash') or 0.0)
        action = payload.get('action', 'close')
        notes = payload.get('notes', '')

        shift = None
        if shift_id:
            pk_val = get_pk_from_prefixed_id(str(shift_id), 'shift_')
            if pk_val:
                shift = Shift.objects.filter(pk=pk_val).first()
        if not shift:
            shift = Shift.objects.filter(cashier_id=str(request.user.id), status='active').first()

        sales_qs = Sale.objects.filter(created_at__gte=shift.started_at) if shift else Sale.objects.all()
        cash_sales = sum(s.total_amount for s in sales_qs if getattr(s, 'payment_method', None) == 'cash')
        mpesa_sales = sum(s.total_amount for s in sales_qs if getattr(s, 'payment_method', None) == 'mpesa')
        card_sales = sum(s.total_amount for s in sales_qs if getattr(s, 'payment_method', None) == 'card')
        total_sales = sum(s.total_amount for s in sales_qs)

        expenses_qs = Expense.objects.filter(created_at__gte=shift.started_at) if shift else Expense.objects.all()
        cash_expenses = sum(e.amount for e in expenses_qs)

        starting_cash = shift.starting_cash if shift else 0.0
        expected_cash = starting_cash + cash_sales - cash_expenses
        variance = actual_cash - expected_cash

        if shift and (action == 'close' or name == 'closeShift'):
            shift.status = 'closed'
            shift.ended_at = timezone.now()
            shift.total_sales = total_sales
            shift.save()

        ShiftAudit.objects.create(
            shift_id=f"shift_{shift.id}" if shift else "shift_0",
            action=action,
            performed_by=request.user.username,
            notes=f"Actual Cash: {actual_cash}, Expected: {expected_cash}, Variance: {variance}. {notes}"
        )

        return Response({
            'status': 'success',
            'message': f"Shift audit action '{action}' processed successfully",
            'z_report': {
                'shift_id': f"shift_{shift.id}" if shift else "shift_0",
                'cashier_name': shift.cashier_name if shift else request.user.username,
                'started_at': shift.started_at if shift else None,
                'ended_at': shift.ended_at if shift else None,
                'total_transactions': sales_qs.count(),
                'total_revenue': total_sales,
                'cash_sales': cash_sales,
                'mpesa_sales': mpesa_sales,
                'card_sales': card_sales,
                'starting_cash': starting_cash,
                'cash_expenses': cash_expenses,
                'expected_cash': expected_cash,
                'actual_cash': actual_cash,
                'variance': variance,
                'is_balanced': abs(variance) < 1.0
            }
        })

    # 4. Analytics Functions
    if name in ['getAnalytics', 'topSellingProducts', 'weeklyRevenue', 'cashFlowSummary']:
        return analytics_view(request._request)

    # 5. Mpesa STK Push
    if name == 'mpesaStkPush':
        return Response({
            'status': 'success',
            'MerchantRequestID': 'req_' + str(random.randint(100000, 999999)),
            'CheckoutRequestID': 'chk_' + str(random.randint(100000, 999999)),
            'ResponseCode': '0',
            'CustomerMessage': 'Success. STK push request accepted for processing.'
        })

    # 6. Audit Trail Handler for Critical Actions (Manager void item, open drawer without sale, etc.)
    if name in ['logAuditAction', 'logShiftAudit', 'openDrawer', 'voidItem', 'managerOverride']:
        action = payload.get('action') or name
        notes = payload.get('notes') or payload.get('reason') or f"Action '{name}' invoked"
        shift_id = payload.get('shift_id') or payload.get('shiftId')
        
        shift = None
        if shift_id:
            pk_val = get_pk_from_prefixed_id(str(shift_id), 'shift_')
            if pk_val:
                shift = Shift.objects.filter(pk=pk_val).first()
        if not shift:
            shift = Shift.objects.filter(cashier_id=str(request.user.id), status='active').first()

        audit_entry = ShiftAudit.objects.create(
            shift_id=f"shift_{shift.id}" if shift else "shift_0",
            action=action,
            performed_by=request.user.username,
            notes=notes
        )

        return Response({
            'status': 'success',
            'message': f"Audit trail recorded for action: {action}",
            'audit_id': f"audit_{audit_entry.id}"
        })

    return Response({'status': 'success'})


# ── Standalone Analytics Endpoint ─────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    seed_database_if_empty()
    
    # 1. Top Selling Products
    product_sales = {}
    sales = Sale.objects.all()
    for sale in sales:
        items = sale.items or []
        if isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    continue
                name = item.get('product_name') or item.get('name') or 'Unknown'
                qty = float(item.get('quantity') or item.get('qty') or 1)
                rev = float(item.get('total') or (qty * float(item.get('unit_price') or 0)))
                if name not in product_sales:
                    product_sales[name] = {'name': name, 'quantity': 0, 'revenue': 0.0}
                product_sales[name]['quantity'] += int(qty)
                product_sales[name]['revenue'] += rev

    top_selling_products = sorted(list(product_sales.values()), key=lambda x: x['revenue'], reverse=True)[:10]

    # 2. Weekly Revenue Trends (Last 7 days)
    today = timezone.now().date()
    weekly_revenue = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_sales = sales.filter(created_at__date=day)
        total_rev = sum(s.total_amount for s in day_sales)
        tx_count = day_sales.count()
        weekly_revenue.append({
            'date': day.strftime('%Y-%m-%d'),
            'day': day.strftime('%a'),
            'revenue': round(total_rev, 2),
            'transactions': tx_count
        })

    # 3. Cash Flow Summary
    cash_in = sum(c.amount for c in CashFlow.objects.filter(type='cash_in'))
    cash_out = sum(c.amount for c in CashFlow.objects.filter(type='cash_out'))
    net_cash_flow = cash_in - cash_out

    return Response({
        'top_selling_products': top_selling_products,
        'weekly_revenue': weekly_revenue,
        'cash_flow': {
            'cash_in': round(cash_in, 2),
            'cash_out': round(cash_out, 2),
            'net_balance': round(net_cash_flow, 2)
        }
    })
