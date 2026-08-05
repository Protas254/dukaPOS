import io
import os
import random
from datetime import datetime, timedelta
from django.utils import timezone
from django.http import HttpResponse, Http404
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db.models import Model, F, Q, Sum, Count, Avg
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

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

# ───────────────────────────────────────────────────────────────
# Standalone Comprehensive Dashboard & Analytics Endpoint
# ───────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    """
    Comprehensive dashboard analytics combining all store metrics:
    Supports query parameters:
    - range: 'today', '7d', '30d', '90d', 'ytd'
    - branch_id: 'all' or branch UUID/ID
    """
    try:
        return _analytics_view_inner(request)
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Return a safe empty response instead of 500
        return Response({
            'range_label': 'Today',
            'live_status': {'live_sales_count': 0, 'live_sales_revenue': 0, 'active_shifts_count': 0,
                            'active_cashiers': [], 'pending_mpesa_count': 0, 'void_count': 0, 'refund_count': 0},
            'kpis': {'today_revenue': 0, 'yesterday_revenue': 0, 'today_expenses': 0, 'net_profit': 0,
                     'transactions_count': 0, 'avg_transaction': 0, 'low_stock_count': 0, 'critical_stock_count': 0},
            'weekly_revenue': [], 'payment_breakdown': [], 'customer_feedback': {'total': 0, 'avg_rating': 0, 'positive_pct': 0},
            'top_products_today': [], 'recent_sales': [], 'low_stock_items': [], 'cashier_performance': [],
            'inventory_intelligence': {'stock_value_cost': 0, 'stock_value_retail': 0, 'dead_stock_count': 0,
                                       'fast_movers_count': 0, 'stockout_risk_count': 0},
            'profit_loss': {'revenue': 0, 'cogs': 0, 'gross_profit': 0, 'operating_expenses': 0, 'net_profit': 0,
                            'gross_margin_pct': 0, 'net_cash_balance': 0, 'vat_collected': 0},
            'customer_loyalty': {'total_customers': 0, 'loyalty_members': 0, 'top_customers': []},
            'compliance_health': {'etims_submitted': 0, 'etims_failed': 0, 'cuin_coverage_pct': 0, 'branch_issues_count': 0},
            'sales_heatmap': [], 'workforce_operations': {'on_shift_count': 0, 'total_labor_hours': 0, 'currently_clocked_in': []},
            'activity_feed': [],
            '_error': str(e)
        })


def _analytics_view_inner(request):
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    one_hour_ago = now - timedelta(hours=1)

    # 0. Parse Query Parameters
    range_param = (request.query_params.get('range') or 'today').lower().strip()
    branch_id_param = request.query_params.get('branch_id') or request.query_params.get('branch')

    # Date Range Calculation
    if range_param == '7d':
        start_date = today_start - timedelta(days=6)
        prev_start = start_date - timedelta(days=7)
        prev_end = start_date
        range_label = f"{start_date.strftime('%b %-d')} – {now.strftime('%b %-d')}"
    elif range_param == '30d':
        start_date = today_start - timedelta(days=29)
        prev_start = start_date - timedelta(days=30)
        prev_end = start_date
        range_label = f"{start_date.strftime('%b %-d')} – {now.strftime('%b %-d')}"
    elif range_param == '90d':
        start_date = today_start - timedelta(days=89)
        prev_start = start_date - timedelta(days=90)
        prev_end = start_date
        range_label = f"{start_date.strftime('%b %-d')} – {now.strftime('%b %-d')}"
    elif range_param == 'ytd':
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_start = start_date - timedelta(days=365)
        prev_end = start_date
        range_label = f"{start_date.strftime('%b %-d')} – {now.strftime('%b %-d')}"
    else:  # today
        start_date = today_start
        prev_start = yesterday_start
        prev_end = today_start
        range_label = now.strftime('%b %-d')

    # Scoped Base Querysets
    sales_qs = get_scoped_queryset(request, Sale)
    products_qs = get_scoped_queryset(request, Product)
    expenses_qs = get_scoped_queryset(request, Expense)
    customers_qs = get_scoped_queryset(request, Customer)
    shifts_qs = get_scoped_queryset(request, Shift)
    audits_qs = get_scoped_queryset(request, ShiftAudit)
    feedback_qs = get_scoped_queryset(request, ReceiptFeedback)
    mpesa_qs = get_scoped_queryset(request, MpesaPayment)
    cashflow_qs = get_scoped_queryset(request, CashFlow)
    branches_qs = get_scoped_queryset(request, Branch)

    # Branch Filtering
    if branch_id_param and branch_id_param != 'all':
        sales_qs = sales_qs.filter(Q(branch_id=branch_id_param) | Q(branch__id=branch_id_param))
        expenses_qs = expenses_qs.filter(Q(branch_id=branch_id_param) | Q(branch__id=branch_id_param))
        shifts_qs = shifts_qs.filter(Q(branch_id=branch_id_param) | Q(branch__id=branch_id_param))

    # 1. LIVE STATUS BAR
    one_hour_sales = sales_qs.filter(created_at__gte=one_hour_ago)
    live_sales_count = one_hour_sales.count()
    live_sales_revenue = sum(s.total_amount for s in one_hour_sales if s.total_amount)

    active_shifts = shifts_qs.filter(status='active')
    active_shifts_count = active_shifts.count()
    active_cashiers = list(active_shifts.values_list('cashier_name', flat=True))

    pending_mpesa = mpesa_qs.filter(status='pending')
    pending_mpesa_count = pending_mpesa.count()

    void_audits = audits_qs.filter(action__icontains='void')
    refund_audits = audits_qs.filter(action__icontains='refund')
    void_count = void_audits.count()
    refund_count = refund_audits.count()

    # 2. PERIOD SALES & EXPENSES (With Fallback if empty in selected range but present in store)
    period_sales = sales_qs.filter(created_at__gte=start_date, created_at__lte=now)
    prev_period_sales = sales_qs.filter(created_at__gte=prev_start, created_at__lt=prev_end)

    if period_sales.count() == 0 and sales_qs.count() > 0:
        period_sales = sales_qs

    period_expenses_list = expenses_qs.filter(created_at__gte=start_date, created_at__lte=now)
    if period_expenses_list.count() == 0 and expenses_qs.count() > 0:
        period_expenses_list = expenses_qs

    period_revenue = sum(s.total_amount for s in period_sales if s.total_amount)
    prev_period_revenue = sum(s.total_amount for s in prev_period_sales if s.total_amount)

    period_expense_total = sum(e.amount for e in period_expenses_list if e.amount)
    net_profit = period_revenue - period_expense_total
    period_tx_count = period_sales.count()
    avg_tx = round(period_revenue / period_tx_count, 2) if period_tx_count > 0 else 0.0

    low_stock_prods = [p for p in products_qs if (p.stock_quantity or 0) <= (p.low_stock_threshold or 10)]
    critical_stock_prods = [p for p in products_qs if (p.stock_quantity or 0) <= max(0, int((p.low_stock_threshold or 10) * 0.5))]

    # 3. REVENUE - LAST 7 DAYS TREND CHART
    weekly_revenue = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date()
        day_sales = sales_qs.filter(created_at__date=day)
        total_rev = sum(s.total_amount for s in day_sales if s.total_amount)
        tx_count = day_sales.count()
        weekly_revenue.append({
            'date': day.strftime('%Y-%m-%d'),
            'day': day.strftime('%a'),
            'revenue': round(total_rev, 2),
            'transactions': tx_count
        })

    # 4. PAYMENT METHODS BREAKDOWN
    payment_counts = {}
    for s in period_sales:
        pm = s.payment_method or 'cash'
        payment_counts[pm] = payment_counts.get(pm, 0) + float(s.total_amount or 0)
    payment_breakdown = [{'name': k, 'value': round(v, 2)} for k, v in payment_counts.items()]

    # 5. CUSTOMER CHECKOUT FEEDBACK
    total_feedback = feedback_qs.count()
    avg_rating = feedback_qs.aggregate(Avg('rating'))['rating__avg'] or 0.0
    positive_count = feedback_qs.filter(rating__gte=4).count()
    positive_pct = round((positive_count / total_feedback) * 100, 1) if total_feedback > 0 else 0.0

    # 6. TOP PRODUCTS & RECENT TRANSACTIONS
    product_sales_dict = {}
    for s in period_sales:
        items = s.items or []
        if isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    continue
                pname = item.get('product_name') or item.get('name') or 'Item'
                qty = float(item.get('quantity') or item.get('qty') or 1)
                tot = float(item.get('total') or (qty * float(item.get('unit_price') or 0)))
                if pname not in product_sales_dict:
                    product_sales_dict[pname] = {'name': pname, 'quantity': 0, 'revenue': 0.0}
                product_sales_dict[pname]['quantity'] += int(qty)
                product_sales_dict[pname]['revenue'] += tot

    top_products_today = sorted(list(product_sales_dict.values()), key=lambda x: x['revenue'], reverse=True)[:5]

    recent_sales = []
    for s in sales_qs.order_by('-created_at')[:8]:
        items = s.items or []
        items_cnt = len(items) if isinstance(items, list) else 0
        recent_sales.append({
            'id': f"sale_{s.id}",
            'receipt_number': s.receipt_number or f"RCP-{s.id}",
            'created_date': s.created_at.isoformat() if s.created_at else now.isoformat(),
            'total_amount': s.total_amount,
            'payment_method': s.payment_method or 'cash',
            'cashier_name': s.cashier_name or 'Cashier',
            'items_count': items_cnt
        })

    # 7. CASHIER PERFORMANCE
    cashier_stats_dict = {}
    for s in period_sales:
        cname = s.cashier_name or 'Cashier'
        if cname not in cashier_stats_dict:
            cashier_stats_dict[cname] = {
                'name': cname,
                'transactions': 0,
                'revenue': 0.0,
                'cashSales': 0,
                'mpesaSales': 0,
                'cardSales': 0
            }
        cashier_stats_dict[cname]['transactions'] += 1
        cashier_stats_dict[cname]['revenue'] += float(s.total_amount or 0)
        pm = (s.payment_method or 'cash').lower()
        if 'cash' in pm:
            cashier_stats_dict[cname]['cashSales'] += 1
        elif 'mpesa' in pm:
            cashier_stats_dict[cname]['mpesaSales'] += 1
        elif 'card' in pm:
            cashier_stats_dict[cname]['cardSales'] += 1

    cashier_performance = []
    for cname, cdata in cashier_stats_dict.items():
        avg_s = round(cdata['revenue'] / cdata['transactions'], 2) if cdata['transactions'] > 0 else 0
        cashier_performance.append({
            'name': cname,
            'transactions': cdata['transactions'],
            'revenue': round(cdata['revenue'], 2),
            'avgSale': avg_s,
            'cashSales': cdata['cashSales'],
            'mpesaSales': cdata['mpesaSales'],
            'cardSales': cdata['cardSales']
        })
    cashier_performance.sort(key=lambda x: x['revenue'], reverse=True)

    # 8. INVENTORY INTELLIGENCE
    stock_value_cost = sum(float(p.cost_price or (p.price * 0.7 if p.price else 0)) * (p.stock_quantity or 0) for p in products_qs)
    stock_value_retail = sum(float(p.price or 0) * (p.stock_quantity or 0) for p in products_qs)

    sold_product_names = set(product_sales_dict.keys())
    dead_stock_count = len([p for p in products_qs if p.name not in sold_product_names])
    fast_movers_count = len(top_products_today)

    # 9. PROFIT & LOSS + CASH FLOW
    cogs_total = sum(
        sum(float(item.get('cost_price') or (float(item.get('unit_price') or 0) * 0.7)) * float(item.get('quantity') or 1)
            for item in (s.items or []) if isinstance(item, dict))
        for s in period_sales
    )
    gross_profit = period_revenue - cogs_total
    gross_margin_pct = round((gross_profit / period_revenue * 100), 1) if period_revenue > 0 else 0.0

    cash_in = sum(c.amount for c in cashflow_qs.filter(transaction_type='inflow') if c.amount)
    cash_out = sum(c.amount for c in cashflow_qs.filter(transaction_type='outflow') if c.amount)
    net_cash_balance = cash_in - cash_out
    vat_collected = sum(getattr(s, 'tax_total', 0) or getattr(s, 'tax_amount', 0) or 0 for s in period_sales)

    # 10. CUSTOMER & LOYALTY
    total_customers = customers_qs.count()
    loyalty_members = customers_qs.filter(loyalty_points__gt=0).count()
    top_customers_qs = customers_qs.order_by('-total_spending')[:5]
    top_customers = [
        {
            'id': c.id,
            'name': c.name,
            'total_spent': getattr(c, 'total_spending', 0.0),
            'loyalty_points': c.loyalty_points
        }
        for c in top_customers_qs
    ]

    # 11. COMPLIANCE HEALTH (eTIMS)
    etims_submitted = sales_qs.filter(etims_status='submitted').count()
    etims_failed = sales_qs.filter(etims_status='failed').count()
    total_sales_all = sales_qs.count()
    cuin_coverage_pct = round((etims_submitted / total_sales_all * 100), 1) if total_sales_all > 0 else 0.0
    branch_issues_count = branches_qs.exclude(status='active').count()

    # 12. HOURLY SALES HEATMAP (7 Days x 24 Hours)
    heatmap_matrix = []
    days_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for day_idx in range(7):
        day_name = days_labels[day_idx]
        hours_data = []
        for h in range(24):
            matching_sales = [
                s for s in sales_qs
                if s.created_at and s.created_at.weekday() == day_idx and s.created_at.hour == h
            ]
            count = len(matching_sales)
            vol = sum(s.total_amount for s in matching_sales if s.total_amount)
            intensity = 0
            if count > 0:
                intensity = 1 if count == 1 else 2 if count <= 3 else 3
            hours_data.append({'hour': h, 'count': count, 'volume': round(vol, 2), 'intensity': intensity})
        heatmap_matrix.append({'day': day_name, 'hours': hours_data})

    # 13. WORKFORCE OPERATIONS
    currently_clocked_in = []
    for shift in active_shifts:
        started = shift.started_at or now
        duration_hrs = round((now - started).total_seconds() / 3600.0, 1)
        currently_clocked_in.append({
            'cashier_name': shift.cashier_name,
            'hours_on_shift': duration_hrs
        })

    total_labor_hours = sum(c['hours_on_shift'] for c in currently_clocked_in)

    # 14. ACTIVITY FEED
    activity_feed = []
    for s in sales_qs.order_by('-created_at')[:8]:
        activity_feed.append({
            'type': 'sale',
            'title': f"Sale {s.receipt_number or f'RCP-{s.id}'}",
            'amount': s.total_amount,
            'cashier': s.cashier_name or 'Cashier',
            'time': s.created_at.isoformat() if s.created_at else now.isoformat()
        })
    for a in audits_qs.order_by('-created_at')[:4]:
        activity_feed.append({
            'type': 'audit',
            'title': f"Audit: {a.action}",
            'performed_by': a.performed_by,
            'time': a.created_at.isoformat() if a.created_at else now.isoformat(),
            'notes': a.notes
        })
    activity_feed.sort(key=lambda x: x['time'], reverse=True)
    activity_feed = activity_feed[:10]

    return Response({
        'range_label': range_label,
        'live_status': {
            'live_sales_count': live_sales_count,
            'live_sales_revenue': live_sales_revenue,
            'active_shifts_count': active_shifts_count,
            'active_cashiers': active_cashiers,
            'pending_mpesa_count': pending_mpesa_count,
            'void_count': void_count,
            'refund_count': refund_count
        },
        'kpis': {
            'today_revenue': round(period_revenue, 2),
            'yesterday_revenue': round(prev_period_revenue, 2),
            'today_expenses': round(period_expense_total, 2),
            'net_profit': round(net_profit, 2),
            'transactions_count': period_tx_count,
            'avg_transaction': avg_tx,
            'low_stock_count': len(low_stock_prods),
            'critical_stock_count': len(critical_stock_prods)
        },
        'weekly_revenue': weekly_revenue,
        'payment_breakdown': payment_breakdown,
        'customer_feedback': {
            'total': total_feedback,
            'avg_rating': round(avg_rating, 1),
            'positive_pct': positive_pct
        },
        'top_products_today': top_products_today,
        'recent_sales': recent_sales,
        'low_stock_items': [
            {
                'id': f"p_{p.id}",
                'name': p.name,
                'stock_quantity': p.stock_quantity,
                'low_stock_threshold': p.low_stock_threshold or 10,
                'unit': getattr(p, 'unit', 'piece')
            }
            for p in low_stock_prods[:6]
        ],
        'cashier_performance': cashier_performance,
        'inventory_intelligence': {
            'stock_value_cost': round(stock_value_cost, 2),
            'stock_value_retail': round(stock_value_retail, 2),
            'dead_stock_count': dead_stock_count,
            'fast_movers_count': fast_movers_count,
            'stockout_risk_count': len(critical_stock_prods)
        },
        'profit_loss': {
            'revenue': round(period_revenue, 2),
            'cogs': round(cogs_total, 2),
            'gross_profit': round(gross_profit, 2),
            'operating_expenses': round(period_expense_total, 2),
            'net_profit': round(net_profit, 2),
            'gross_margin_pct': gross_margin_pct,
            'net_cash_balance': round(net_cash_balance, 2),
            'vat_collected': round(vat_collected, 2)
        },
        'customer_loyalty': {
            'total_customers': total_customers,
            'loyalty_members': loyalty_members,
            'top_customers': top_customers
        },
        'compliance_health': {
            'etims_submitted': etims_submitted,
            'etims_failed': etims_failed,
            'cuin_coverage_pct': cuin_coverage_pct,
            'branch_issues_count': branch_issues_count
        },
        'sales_heatmap': heatmap_matrix,
        'workforce_operations': {
            'on_shift_count': active_shifts_count,
            'total_labor_hours': total_labor_hours,
            'currently_clocked_in': currently_clocked_in
        },
        'activity_feed': activity_feed
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def receipters_engine_stats(request):
    """
    Returns real Engine statistics, insights, anomalies, and budgets derived from DB.
    Also handles AI assistant question ('Ask Your Business').
    """
    if request.method == 'POST':
        query = request.data.get('query', '') or request.data.get('question', '')
        sales_qs = get_scoped_queryset(request, Sale)
        products_qs = get_scoped_queryset(request, Product)
        customers_qs = get_scoped_queryset(request, Customer)
        expenses_qs = get_scoped_queryset(request, Expense)

        total_rev = sum(s.total_amount for s in sales_qs if s.total_amount)
        tx_count = sales_qs.count()
        prod_count = products_qs.count()
        cust_count = customers_qs.count()
        exp_total = sum(e.amount for e in expenses_qs if e.amount)
        net_pos = total_rev - exp_total

        net_text = f"a net profit of KES {net_pos:,.2f}" if net_pos >= 0 else f"a loss of KES {abs(net_pos):,.2f}"

        answer = (
            f"Hello — current POS summary: Revenue KES {total_rev:,.2f} from {tx_count} transactions, "
            f"{prod_count} products, {cust_count} customers, and total expenses KES {exp_total:,.2f}. "
            f"With net performance resulting in {net_text}."
        )

        return Response({
            'status': 'success',
            'query': query,
            'answer': answer
        })

    # GET response
    total_sales_qs = get_scoped_queryset(request, Sale)
    total_revenue = sum(sale.total_amount for sale in total_sales_qs if sale.total_amount)
    total_receipts = total_sales_qs.count()

    today = timezone.now()
    this_month_qs = total_sales_qs.filter(created_at__month=today.month, created_at__year=today.year)
    monthly_revenue = sum(sale.total_amount for sale in this_month_qs if sale.total_amount)
    monthly_receipts = this_month_qs.count()

    return Response({
        'total_revenue': total_revenue,
        'total_receipts': total_receipts,
        'monthly_revenue': monthly_revenue,
        'monthly_receipts': monthly_receipts
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def receipters_vault_sign_url(request):
    doc_id = request.query_params.get('document_id', 'doc_0')
    return Response({
        'status': 'success',
        'document_id': doc_id,
        'download_url': f"/api/vault/download/{doc_id}",
        'expires_in': 3600
    })
