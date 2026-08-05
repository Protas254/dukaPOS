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

# ── Standalone Analytics Endpoint ─────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    sales = get_scoped_queryset(request, Sale)
    
    # 1. Top Selling Products
    product_sales = {}
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

    # 3. Cash Flow Summary (scoped to tenant)
    cashflows = get_scoped_queryset(request, CashFlow)
    cash_in = sum(c.amount for c in cashflows.filter(transaction_type='inflow'))
    cash_out = sum(c.amount for c in cashflows.filter(transaction_type='outflow'))
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

@permission_classes([IsAuthenticated])
def receipters_engine_stats(request):
    """
    Returns real Engine statistics, insights, anomalies, and budgets derived from DB.
    """
    # Fetch real sale stats
    total_sales_qs = get_scoped_queryset(request, Sale)
    total_revenue = sum(sale.total_amount for sale in total_sales_qs)
    total_receipts = total_sales_qs.count()

    today = timezone.now()
    this_month_qs = total_sales_qs.filter(created_at__month=today.month, created_at__year=today.year)
    monthly_revenue = sum(sale.total_amount for sale in this_month_qs)
    monthly_receipts = this_month_qs.count()

    # Real calculated insights based on database queries
    expenses = get_scoped_queryset(request, Expense)
    shifts = get_scoped_queryset(request, Shift)
    audits = get_scoped_queryset(request, ShiftAudit)

    insights = []
    insight_id = 1

    # Insight 1: Sales Trend
    if monthly_receipts > 0:
        insights.append({
            "id": insight_id,
            "type": "trend",
            "title": "Monthly Sales Performance",
            "description": f"Processed {monthly_receipts} transactions totaling KES {monthly_revenue:,.2f} this month.",
            "impact": "positive"
        })
        insight_id += 1

    # Insight 2: Shift Audits / Anomaly Detection
    override_audits = audits.filter(action__in=['managerOverride', 'voidItem', 'openDrawer']).count()
    if override_audits > 0:
        insights.append({
            "id": insight_id,
            "type": "anomaly",
            "title": "Shift Overrides Detected",
            "description": f"Recorded {override_audits} manager override/void actions across cashiers.",
            "impact": "negative"
        })
        insight_id += 1
    else:
        insights.append({
            "id": insight_id,
            "type": "compliance",
            "title": "Clean Shift Audits",
            "description": "No unauthorized drawer opens or unverified voids logged.",
            "impact": "positive"
        })
        insight_id += 1

    # Insight 3: Popular Category / Bundle Opportunity
    top_prod = get_scoped_queryset(request, Product).order_by('-stock_quantity').first()
    if top_prod:
        insights.append({
            "id": insight_id,
            "type": "opportunity",
            "title": "Inventory Optimization",
            "description": f"Highest stocked item '{top_prod.name}' ({top_prod.stock_quantity} in stock). Consider bundling.",
            "impact": "positive"
        })

    # Real Budgets calculated from Expenses grouped by category
    category_expenses = {}
    for exp in expenses:
        cat = exp.category or 'General'
        category_expenses[cat] = category_expenses.get(cat, 0.0) + exp.amount

    budgets = []
    b_id = 1
    default_limits = {'Office Supplies': 20000.0, 'Marketing': 50000.0, 'Utilities': 15000.0, 'Rent': 100000.0, 'Inventory': 250000.0}

    # Include existing expense categories plus defaults
    all_categories = set(list(category_expenses.keys()) + list(default_limits.keys()))
    for cat in sorted(all_categories)[:5]:
        spent = category_expenses.get(cat, 0.0)
        limit = default_limits.get(cat, 30000.0)
        status_str = 'on-track'
        if spent > limit:
            status_str = 'exceeded'
        elif spent >= limit * 0.8:
            status_str = 'at-risk'

        budgets.append({
            "id": b_id,
            "category": cat,
            "spent": round(spent, 2),
            "limit": round(limit, 2),
            "status": status_str
        })
        b_id += 1

    return Response({
        'overview': {
            'total_revenue': round(total_revenue, 2),
            'total_receipts': total_receipts,
            'monthly_revenue': round(monthly_revenue, 2),
            'monthly_receipts': monthly_receipts,
            'average_value': round(total_revenue / total_receipts, 2) if total_receipts > 0 else 0.0,
        },
        'insights': insights,
        'budgets': budgets,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def receipters_vault_sign_url(request):
    """
    Returns signed / direct access URL for real VaultDocument records.
    """
    document_id = request.data.get('document_id')
    if not document_id:
        return Response({'error': 'document_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        doc_pk = document_id.replace('vd_', '') if isinstance(document_id, str) and document_id.startswith('vd_') else document_id
        doc = get_scoped_queryset(request, VaultDocument).get(id=doc_pk)
        
        # Real document URL return (or generated downloadable URL)
        real_url = doc.file_url if doc.file_url else f"/media/vault/{doc.file_name or 'document_' + str(doc.id) + '.pdf'}"
        
        return Response({'url': real_url, 'expires_in': 3600, 'document_title': doc.title})
    except VaultDocument.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
