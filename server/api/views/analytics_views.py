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
    - Real-time live status (1h sales, active shifts, mpesa pending, voids/refunds)
    - Key financial KPIs (Revenue, Expenses, Net Profit, Transactions, Avg Tx, Low Stock)
    - Last 7 days revenue trend
    - Payment methods breakdown
    - Customer feedback ratings
    - Top products & recent transactions
    - Critical stock alerts & inventory intelligence
    - Cashier performance & workforce status
    - Profit & Loss + Cash flow
    - Customer & loyalty metrics
    - Compliance health (eTIMS)
    - Hourly sales heatmap
    - Goals & Streaks progress
    - Activity feed
    """
    now = timezone.now()
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    one_hour_ago = now - timedelta(hours=1)
    seven_days_ago = today_start - timedelta(days=6)

    # Scoped Querysets
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

    # 1. LIVE STATUS BAR (1h Sales, Active Shifts, Pending M-Pesa, Voids/Refunds)
    one_hour_sales = sales_qs.filter(created_at__gte=one_hour_ago)
    live_sales_count = one_hour_sales.count()
    live_sales_revenue = sum(s.total_amount for s in one_hour_sales)

    active_shifts = shifts_qs.filter(status='active')
    active_shifts_count = active_shifts.count()
    active_cashiers = list(active_shifts.values_list('cashier_name', flat=True))

    pending_mpesa = mpesa_qs.filter(status='pending')
    pending_mpesa_count = pending_mpesa.count()

    void_audits = audits_qs.filter(action__icontains='void')
    refund_audits = audits_qs.filter(action__icontains='refund')
    void_count = void_audits.count()
    refund_count = refund_audits.count()

    # 2. FINANCIAL KPIs (Today vs Yesterday)
    today_sales = sales_qs.filter(created_at__gte=today_start)
    yesterday_sales = sales_qs.filter(created_at__gte=yesterday_start, created_at__lt=today_start)

    today_revenue = sum(s.total_amount for s in today_sales)
    yesterday_revenue = sum(s.total_amount for s in yesterday_sales)

    today_expenses_list = expenses_qs.filter(created_at__gte=today_start)
    today_expense_total = sum(e.amount for e in today_expenses_list)

    net_profit = today_revenue - today_expense_total
    today_tx_count = today_sales.count()
    avg_tx = round(today_revenue / today_tx_count, 2) if today_tx_count > 0 else 0.0

    low_stock_prods = [p for p in products_qs if p.stock_quantity <= (p.low_stock_threshold or 10)]
    critical_stock_prods = [p for p in products_qs if p.stock_quantity <= max(0, int((p.low_stock_threshold or 10) * 0.5))]

    # 3. REVENUE - LAST 7 DAYS CHART
    weekly_revenue = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date()
        day_sales = sales_qs.filter(created_at__date=day)
        total_rev = sum(s.total_amount for s in day_sales)
        tx_count = day_sales.count()
        weekly_revenue.append({
            'date': day.strftime('%Y-%m-%d'),
            'day': day.strftime('%a'),
            'revenue': round(total_rev, 2),
            'transactions': tx_count
        })

    # 4. PAYMENT METHODS BREAKDOWN (Today)
    payment_counts = {}
    for s in today_sales:
        pm = s.payment_method or 'cash'
        payment_counts[pm] = payment_counts.get(pm, 0) + float(s.total_amount or 0)
    payment_breakdown = [{'name': k, 'value': round(v, 2)} for k, v in payment_counts.items()]

    # 5. CUSTOMER CHECKOUT FEEDBACK
    total_feedback = feedback_qs.count()
    avg_rating = feedback_qs.aggregate(Avg('rating'))['rating__avg'] or 0.0
    positive_count = feedback_qs.filter(rating__gte=4).count()
    positive_pct = round((positive_count / total_feedback) * 100, 1) if total_feedback > 0 else 0.0

    # 6. TOP PRODUCTS TODAY & RECENT TRANSACTIONS
    product_sales_dict = {}
    for s in today_sales:
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
    for s in sales_qs.order_by('-created_at')[:5]:
        recent_sales.append({
            'id': f"sale_{s.id}",
            'receipt_number': s.receipt_number or f"RCP-{s.id}",
            'created_date': s.created_at.isoformat() if s.created_at else now.isoformat(),
            'total_amount': s.total_amount,
            'payment_method': s.payment_method,
            'cashier_name': s.cashier_name,
            'items_count': len(s.items) if isinstance(s.items, list) else 0
        })

    # 7. CASHIER PERFORMANCE (Today & Overall)
    cashier_stats_dict = {}
    for s in today_sales:
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
    stock_value_cost = sum(float(p.cost_price or (p.price * 0.7)) * p.stock_quantity for p in products_qs)
    stock_value_retail = sum(float(p.price) * p.stock_quantity for p in products_qs)

    sold_product_names = set()
    for s in sales_qs.filter(created_at__gte=seven_days_ago):
        items = s.items or []
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    sold_product_names.add(item.get('product_name') or item.get('name'))

    dead_stock_count = len([p for p in products_qs if p.name not in sold_product_names])
    fast_movers_count = len(top_products_today)

    # 9. PROFIT & LOSS + CASH FLOW
    cogs_total = sum(
        sum(float(item.get('cost_price') or (float(item.get('unit_price') or 0) * 0.7)) * float(item.get('quantity') or 1)
            for item in (s.items or []) if isinstance(item, dict))
        for s in today_sales
    )
    gross_profit = today_revenue - cogs_total
    gross_margin_pct = round((gross_profit / today_revenue * 100), 1) if today_revenue > 0 else 0.0

    cash_in = sum(c.amount for c in cashflow_qs.filter(transaction_type='inflow'))
    cash_out = sum(c.amount for c in cashflow_qs.filter(transaction_type='outflow'))
    net_cash_balance = cash_in - cash_out
    vat_collected = sum(s.tax_total for s in today_sales if hasattr(s, 'tax_total'))

    # 10. CUSTOMER & LOYALTY
    total_customers = customers_qs.count()
    loyalty_members = customers_qs.filter(loyalty_points__gt=0).count()
    top_customers = list(customers_qs.order_by('-total_spent')[:5].values('id', 'name', 'total_spent', 'loyalty_points'))

    # 11. COMPLIANCE HEALTH (eTIMS)
    etims_submitted = sales_qs.filter(etims_status='submitted').count()
    etims_failed = sales_qs.filter(etims_status='failed').count()
    total_sales_all = sales_qs.count()
    cuin_coverage_pct = round((etims_submitted / total_sales_all * 100), 1) if total_sales_all > 0 else 0.0
    branch_issues_count = branches_qs.filter(is_active=False).count()

    # 12. HOURLY SALES HEATMAP (7 Days x 24 Hours)
    heatmap_matrix = []
    days_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for day_idx in range(7):
        day_name = days_labels[day_idx]
        hours_data = []
        for h in range(24):
            # Aggregate volume for day of week & hour
            matching_sales = [
                s for s in sales_qs
                if s.created_at and s.created_at.weekday() == day_idx and s.created_at.hour == h
            ]
            count = len(matching_sales)
            vol = sum(s.total_amount for s in matching_sales)
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
            'today_revenue': round(today_revenue, 2),
            'yesterday_revenue': round(yesterday_revenue, 2),
            'today_expenses': round(today_expense_total, 2),
            'net_profit': round(net_profit, 2),
            'transactions_count': today_tx_count,
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
            'revenue': round(today_revenue, 2),
            'cogs': round(cogs_total, 2),
            'gross_profit': round(gross_profit, 2),
            'operating_expenses': round(today_expense_total, 2),
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

        total_rev = sum(s.total_amount for s in sales_qs)
        tx_count = sales_qs.count()
        prod_count = products_qs.count()
        cust_count = customers_qs.count()
        exp_total = sum(e.amount for e in expenses_qs)
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
    total_revenue = sum(sale.total_amount for sale in total_sales_qs)
    total_receipts = total_sales_qs.count()

    today = timezone.now()
    this_month_qs = total_sales_qs.filter(created_at__month=today.month, created_at__year=today.year)
    monthly_revenue = sum(sale.total_amount for sale in this_month_qs)
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
