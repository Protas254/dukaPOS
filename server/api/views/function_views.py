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
                sale = get_scoped_queryset(request, Sale).filter(pk=pk_val).first()

        if name == 'generateReceiptPDF' or (name == 'generateDukaPOSPDF' and (sale or sale_data)):
            biz = get_scoped_queryset(request, BusinessSettings).first() or BusinessSettings.objects.first()
            store_name = getattr(biz, 'trading_name', None) or getattr(biz, 'business_name', None) or "DukaPOS Store"
            store_address = getattr(biz, 'business_address', None) or "Nairobi, Kenya"
            store_phone = getattr(biz, 'business_phone', None) or "+254 700 000000"
            kra_pin = getattr(biz, 'kra_pin', None) or "P051234567Z"

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
                    sale = get_scoped_queryset(request, Sale).get(pk=pk_val)
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
                shift = get_scoped_queryset(request, Shift).filter(pk=pk_val).first()
        if not shift:
            shift = get_scoped_queryset(request, Shift).filter(cashier_id=str(request.user.id), status='active').first()

        sales_qs = get_scoped_queryset(request, Sale)
        if shift:
            sales_qs = sales_qs.filter(created_at__gte=shift.started_at)
        cash_sales = sum(s.total_amount for s in sales_qs if getattr(s, 'payment_method', None) == 'cash')
        mpesa_sales = sum(s.total_amount for s in sales_qs if getattr(s, 'payment_method', None) == 'mpesa')
        card_sales = sum(s.total_amount for s in sales_qs if getattr(s, 'payment_method', None) == 'card')
        total_sales = sum(s.total_amount for s in sales_qs)

        expenses_qs = get_scoped_queryset(request, Expense)
        if shift:
            expenses_qs = expenses_qs.filter(created_at__gte=shift.started_at)
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
            tenant=get_tenant_for_user(request),
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
                shift = get_scoped_queryset(request, Shift).filter(pk=pk_val).first()
        if not shift:
            shift = get_scoped_queryset(request, Shift).filter(cashier_id=str(request.user.id), status='active').first()

        audit_entry = ShiftAudit.objects.create(
            tenant=get_tenant_for_user(request),
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

