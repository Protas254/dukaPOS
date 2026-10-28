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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tenant_cashiers(request):
    """
    Dedicated endpoint for managing business cashiers/staff.
    GET: List all cashiers/staff belonging strictly to the active business tenant.
    POST: Create a new cashier user account assigned to the business tenant.
    """
    user = request.user
    tenant = get_tenant_for_user(request)
    if not tenant:
        # For superusers/staff, try to use first available tenant
        if user.is_superuser or user.is_staff:
            from ..models import Tenant as TenantModel
            tenant = TenantModel.objects.first()
        if not tenant:
            return Response({'error': 'No active business tenant found. Please complete business onboarding first.'}, status=status.HTTP_400_BAD_REQUEST)

    # Only admins, managers or supervisors can manage team members
    if not is_admin_user(user):
        profile = getattr(user, 'profile', None)
        if not profile or profile.role not in ('admin', 'manager', 'supervisor'):
            return Response({'error': 'Only business admins and supervisors can manage team members'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        cashier_profiles = UserProfile.objects.filter(tenant=tenant).select_related('user')
        results = []
        for p in cashier_profiles:
            u = p.user
            results.append({
                'id': f"u_{u.id}",
                'raw_id': u.id,
                'username': u.username,
                'email': u.email,
                'full_name': f"{u.first_name} {u.last_name}".strip() or u.username,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'role': p.role,
                'is_active': u.is_active,
                'date_joined': u.date_joined,
            })
        return Response(results)

    elif request.method == 'POST':
        email = request.data.get('email')
        password = request.data.get('password') or request.data.get('pin')
        raw_name = request.data.get('name') or request.data.get('full_name') or 'Cashier'
        name_parts = raw_name.strip().split(' ')
        first_name = request.data.get('first_name') or name_parts[0]
        last_name = request.data.get('last_name') or (' '.join(name_parts[1:]) if len(name_parts) > 1 else '')
        role = request.data.get('role', 'cashier')

        if not email or not password:
            return Response({'error': 'Email and password/PIN are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': f"User with email '{email}' already exists"}, status=status.HTTP_400_BAD_REQUEST)

        username = email.split('@')[0]
        if User.objects.filter(username=username).exists():
            username = f"{username}_{random.randint(10, 99)}"

        is_staff_role = role in ('admin', 'manager', 'supervisor')
        new_user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff_role,
            is_superuser=False
        )
        new_user.set_password(password)
        new_user.save()

        profile = UserProfile.objects.create(
            user=new_user,
            tenant=tenant,
            role=role
        )

        return Response({
            'message': f"Team member '{first_name}' ({role}) created successfully for {tenant.name}!",
            'user': {
                'id': f"u_{new_user.id}",
                'raw_id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'full_name': f"{new_user.first_name} {new_user.last_name}".strip() or new_user.username,
                'role': role,
                'tenant_name': tenant.name
            }
        }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def tenant_cashier_detail(request, cashier_id):
    """
    Update or delete a cashier assigned to the active business tenant.
    """
    user = request.user
    tenant = get_tenant_for_user(request)
    if not tenant:
        return Response({'error': 'No active business tenant found'}, status=status.HTTP_400_BAD_REQUEST)

    pk_val = get_pk_from_prefixed_id(str(cashier_id), 'u_')
    if not pk_val:
        return Response({'error': 'Invalid cashier ID'}, status=status.HTTP_400_BAD_REQUEST)

    target_profile = UserProfile.objects.filter(tenant=tenant, user_id=pk_val).select_related('user').first()
    if not target_profile:
        return Response({'error': 'Cashier not found in this business'}, status=status.HTTP_404_NOT_FOUND)

    target_user = target_profile.user

    if request.method == 'DELETE':
        target_user.delete()
        return Response({'message': 'Cashier removed successfully'})

    elif request.method == 'PUT':
        if 'password' in request.data and request.data['password']:
            target_user.set_password(request.data['password'])
        if 'first_name' in request.data:
            target_user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            target_user.last_name = request.data['last_name']
        if 'email' in request.data:
            target_user.email = request.data['email']
        target_user.save()

        if 'role' in request.data:
            target_profile.role = request.data['role']
            target_profile.save()
            target_user.is_staff = request.data['role'] in ('admin', 'manager', 'supervisor')
            target_user.save()

        return Response({
            'message': 'Cashier updated successfully',
            'user': {
                'id': f"u_{target_user.id}",
                'full_name': f"{target_user.first_name} {target_user.last_name}".strip() or target_user.username,
                'email': target_user.email,
                'role': target_profile.role
            }
        }, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_cashier(request):
    """
    Send an email invite to a new cashier/staff member.
    The invitee receives an email with a link to create their account.
    POST body: { email, role, name (optional) }
    """
    from django.utils import timezone as tz
    user = request.user
    tenant = get_tenant_for_user(request)
    if not tenant:
        return Response({'error': 'No active business tenant found'}, status=status.HTTP_400_BAD_REQUEST)

    if not is_admin_user(user):
        profile = getattr(user, 'profile', None)
        if not profile or profile.role not in ('admin', 'manager', 'supervisor'):
            return Response({'error': 'Only business admins and supervisors can invite team members'}, status=status.HTTP_403_FORBIDDEN)

    email = (request.data.get('email') or '').strip().lower()
    role = request.data.get('role', 'cashier')
    invitee_name = request.data.get('name', '').strip()

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': f"A user with email '{email}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

    # Invalidate any previous pending invites for same email+tenant
    CashierInvite.objects.filter(tenant=tenant, email=email, accepted=False).delete()

    invite = CashierInvite.objects.create(
        tenant=tenant,
        email=email,
        role=role,
        invited_by=user,
        expires_at=tz.now() + timedelta(hours=48),
    )

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    invite_link = f"{frontend_url}/invite/accept?token={invite.token}"

    inviter_name = f"{user.first_name} {user.last_name}".strip() or user.username
    greeting = f"Hi {invitee_name}," if invitee_name else "Hello,"
    role_display = role.replace('_', ' ').title()

    subject = f"You've been invited to join {tenant.name} on DukaPOS"
    message = (
        f"{greeting}\n\n"
        f"{inviter_name} has invited you to join {tenant.name} as a {role_display} on DukaPOS.\n\n"
        f"Click the link below to create your account (link expires in 48 hours):\n\n"
        f"{invite_link}\n\n"
        f"If you did not expect this invitation, you can safely ignore this email.\n\n"
        f"— The DukaPOS Team"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@dukapos.com'),
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        # Delete invite and report error so admin knows email was not sent
        invite.delete()
        return Response({'error': f'Failed to send invite email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'success': True,
        'message': f"Invite sent to {email}. They have 48 hours to accept.",
        'invite_id': str(invite.token),
    }, status=status.HTTP_201_CREATED)

