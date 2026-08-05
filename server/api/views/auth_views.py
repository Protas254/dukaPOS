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
    requested_role = request.data.get('role') or request.data.get('login_as')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()

    if not user:
        # Do NOT auto-register — return a generic error to prevent user enumeration
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)

    # Check password securely using Django's built-in hashing check
    if not user.check_password(password):
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)

    # Role-based restriction validation
    profile = getattr(user, 'profile', None)
    actual_role = 'admin' if (user.is_superuser or user.is_staff) else 'cashier'
    if profile and profile.role:
        actual_role = profile.role.lower()

    if requested_role:
        requested_role = requested_role.lower()
        if requested_role == 'cashier' and actual_role != 'cashier':
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        elif requested_role == 'admin' and actual_role == 'cashier':
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

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

    hashed_password = make_password(password)

    username = email.split('@')[0]
    if User.objects.filter(username=username).exists():
        username = f"{username}_{random.randint(10, 99)}"

    # Every new signup is a business owner / admin — they will complete onboarding next.
    user = User(
        username=username,
        email=email,
        first_name=username.capitalize(),
        is_staff=True,
        is_superuser=False
    )
    user.password = hashed_password
    user.save()

    # Auto-create a placeholder Tenant so the user has a workspace from the start
    base_slug = slugify(username) or 'store'
    slug = base_slug
    counter = 1
    while Tenant.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    tenant = Tenant.objects.create(
        name=username.capitalize() + "'s Store",
        slug=slug,
        owner_email=email,
        is_onboarded=False
    )

    UserProfile.objects.create(
        user=user,
        tenant=tenant,
        role='admin'
    )

    BusinessSettings.objects.create(
        tenant=tenant,
        business_name=tenant.name,
        business_email=email,
        currency='KES',
        kra_pin='A000000000Z',
        default_tax_rate=16.0,
    )

    tokens = get_tokens_for_user(user)
    return Response({
        'token': tokens['access'],
        'access_token': tokens['access'],
        'refresh_token': tokens['refresh'],
        'needs_onboarding': True
    })


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
    
    # Every new signup is a business owner / admin — they will complete onboarding next.
    user = User(
        username=username,
        email=email,
        first_name=username.capitalize(),
        is_staff=True,
        is_superuser=False
    )
    user.password = pending['hashed_password']
    user.save()

    # Auto-create a placeholder Tenant
    base_slug = slugify(username) or 'store'
    slug = base_slug
    counter = 1
    while Tenant.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    tenant = Tenant.objects.create(
        name=username.capitalize() + "'s Store",
        slug=slug,
        owner_email=email,
        is_onboarded=False
    )
    UserProfile.objects.create(user=user, tenant=tenant, role='admin')
    BusinessSettings.objects.create(
        tenant=tenant, business_name=tenant.name, business_email=email,
        currency='KES', kra_pin='A000000000Z', default_tax_rate=16.0
    )
    
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

    google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', os.environ.get('GOOGLE_CLIENT_ID', ''))
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
    is_new_user = False
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        is_new_user = True
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        username = email.split('@')[0]
        if User.objects.filter(username=username).exists():
            username = f"{username}_{random.randint(10, 99)}"

        role_admin = True
        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_staff=role_admin,
            is_superuser=False,
        )
        user.set_unusable_password()
        user.save()

    # Ensure user profile and tenant exist
    profile = getattr(user, 'profile', None)
    if not profile or not profile.tenant:
        base_slug = slugify(user.username) or 'store'
        slug = base_slug
        counter = 1
        while Tenant.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        tenant = Tenant.objects.create(
            name=f"{user.first_name or user.username}'s Business",
            slug=slug,
            owner_name=f"{user.first_name} {user.last_name}".strip() or user.username,
            owner_email=user.email,
            is_onboarded=False
        )
        if not profile:
            profile = UserProfile.objects.create(user=user, tenant=tenant, role='admin')
        else:
            profile.tenant = tenant
            profile.save()

        BusinessSettings.objects.get_or_create(
            tenant=tenant,
            defaults={
                'business_name': tenant.name,
                'business_email': user.email,
                'currency': 'KES',
                'default_tax_rate': 16.0,
            }
        )

    tokens = get_tokens_for_user(user)
    serializer = UserSerializer(user)
    data = serializer.data
    data['token'] = tokens['access']
    data['access_token'] = tokens['access']
    data['refresh_token'] = tokens['refresh']
    data['is_new_user'] = is_new_user
    return Response(data)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def accept_cashier_invite(request):
    """
    GET  ?token=<uuid>  → validate token, return invite info (email, tenant name, role)
    POST { token, name, password } → create account, mark invite accepted, return JWT
    """
    from django.utils import timezone as tz
    token_str = request.GET.get('token') or request.data.get('token')
    if not token_str:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        import uuid as uuid_mod
        invite = CashierInvite.objects.select_related('tenant').get(token=uuid_mod.UUID(str(token_str)))
    except (CashierInvite.DoesNotExist, ValueError):
        return Response({'error': 'Invalid or expired invitation link.'}, status=status.HTTP_404_NOT_FOUND)

    if not invite.is_valid():
        return Response({'error': 'This invite has already been used or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        return Response({
            'email': invite.email,
            'role': invite.role,
            'tenant_name': invite.tenant.name,
            'expires_at': invite.expires_at,
        })

    # POST — create the account
    name = (request.data.get('name') or '').strip()
    password = request.data.get('password') or ''
    if not name or not password:
        return Response({'error': 'Full name and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=invite.email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    name_parts = name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    username = invite.email.split('@')[0]
    if User.objects.filter(username=username).exists():
        username = f"{username}_{random.randint(10, 99)}"

    new_user = User.objects.create(
        username=username,
        email=invite.email,
        first_name=first_name,
        last_name=last_name,
        is_staff=False,
        is_superuser=False,
    )
    new_user.set_password(password)
    new_user.save()

    UserProfile.objects.create(
        user=new_user,
        tenant=invite.tenant,
        role=invite.role,
    )

    invite.accepted = True
    invite.save()

    # Issue JWT
    refresh = RefreshToken.for_user(new_user)
    return Response({
        'success': True,
        'message': f"Account created! Welcome to {invite.tenant.name}.",
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': new_user.id,
            'email': new_user.email,
            'full_name': f"{first_name} {last_name}".strip(),
            'role': invite.role,
            'tenant_name': invite.tenant.name,
        }
    }, status=status.HTTP_201_CREATED)

