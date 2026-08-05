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

# --- Generic CRUD Views ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def entity_list_create(request, entity_name):
    seed_database_if_empty()
    tenant = get_tenant_for_user(request)
    if entity_name in ('Branch', 'branches') and tenant:
        seed_branches_if_empty(tenant)

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
        
        queryset = get_scoped_queryset(request, ModelClass)

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
        user_tenant = get_tenant_for_user(request)

        model_field_names = [f.name for f in ModelClass._meta.get_fields()]
        if 'tenant' in model_field_names and user_tenant and 'tenant' not in data and 'tenant_id' not in data:
            data['tenant'] = user_tenant.id

        if 'id' in data and isinstance(data['id'], str):
            pk_val = get_pk_from_prefixed_id(data['id'], prefix)
            if pk_val:
                data['id'] = pk_val
            else:
                data.pop('id', None)

        if entity_name in ('Expense', 'expenses'):
            if not data.get('shift_id'):
                active_shift = Shift.objects.filter(tenant=user_tenant, cashier_id=str(user.id), status='active').first()
                if active_shift:
                    data['shift_id'] = f"shift_{active_shift.id}"

        if entity_name in ('Sale', 'sales'):
            # 1. Shift Validation: Cashiers must have an active shift open
            cashier_id = user.id
            active_shift = Shift.objects.filter(tenant=user_tenant, cashier_id=str(cashier_id), status='active').first()
            if not active_shift and data.get('shift_id'):
                shift_pk = get_pk_from_prefixed_id(str(data.get('shift_id')), 'shift_')
                if shift_pk:
                    active_shift = Shift.objects.filter(tenant=user_tenant, pk=shift_pk, status='active').first()

            if not active_shift and not is_admin_user(user):
                return Response(
                    {'error': 'Active shift required to process sales. Please start a shift first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Cart & Tax Math: Server-side recalculation to prevent price tampering
            raw_items = data.get('items', [])
            if isinstance(raw_items, list) and len(raw_items) > 0:
                biz_settings = BusinessSettings.objects.filter(tenant=user_tenant).first() if user_tenant else BusinessSettings.objects.first()
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
                            product = Product.objects.filter(tenant=user_tenant, pk=pk_val).first()
                    
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
                # Tax-inclusive: extract VAT from the price, do not add it on top
                calculated_tax_total = taxable_amount * (default_tax_rate / (100.0 + default_tax_rate))
                calculated_total = round(taxable_amount, 2)
                
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
                    tenant=user_tenant,
                    transaction_type='inflow',
                    amount=instance.total_amount,
                    category='Sales Revenue',
                    description=f"Sale Receipt #{instance.receipt_number} ({instance.payment_method})"
                )
                VaultDocument.objects.create(
                    tenant=user_tenant,
                    title=f"Receipt {instance.receipt_number}",
                    document_type="receipt",
                    source="DukaPOS - POS Sales",
                    category="Sales",
                    amount=instance.total_amount,
                    reference_number=instance.receipt_number,
                    receipt_data=SerializerClass(instance).data,
                    is_locked=True,
                    stored_by_name=instance.cashier_name
                )
            elif entity_name in ('PurchaseOrder', 'purchase_orders'):
                process_purchase_order_stock_increase(instance)
            elif entity_name in ('Expense', 'expenses'):
                CashFlow.objects.create(
                    tenant=user_tenant,
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

    queryset = get_scoped_queryset(request, ModelClass).filter(**filter_kwargs)
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
    scoped_qs = get_scoped_queryset(request, ModelClass)
    pk_val = get_pk_from_prefixed_id(pk, prefix)
    if pk_val is None:
        if ModelClass == BusinessSettings:
            # Special case for 'bs_default'
            instance = scoped_qs.first()
            if not instance:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': f"Invalid ID format: {pk}"}, status=status.HTTP_404_NOT_FOUND)
    else:
        instance = get_object_or_404(scoped_qs, pk=pk_val)

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


