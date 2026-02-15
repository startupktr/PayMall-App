from rest_framework import generics, permissions, status
from decimal import Decimal
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import get_object_or_404
import uuid
from .utils import make_cart_hash, is_expired
from common.responses import success_response, error_response
from cart.models import Cart
from .utils import split_gst_inclusive, money
from .models import Order, OrderItem
from .serializers import (
    OrderListSerializer, 
    OrderDetailSerializer
)
from django.utils import timezone
from datetime import timedelta

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.graphics.barcode import code128
from django.http import HttpResponse
from django.conf import settings
import os

class OrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return success_response(
            message="Orders fetched successfully",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(
            Order,
            id=pk,
            user=request.user,
        )

        return success_response(
            message="Order details fetched",
            data=OrderDetailSerializer(order).data,
            status=status.HTTP_200_OK,
        )


class OrderCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        cart = (
            Cart.objects.select_for_update()
            .filter(user=request.user, status="ACTIVE")
            .select_related("mall")
            .prefetch_related("items__product")
            .first()
        )

        if not cart or not cart.items.exists():
            return error_response("Cart is empty", status=status.HTTP_400_BAD_REQUEST)

        cart_hash = make_cart_hash(cart.items.all())

        # ✅ Expire ALL expired pending orders (no cron needed)
        Order.objects.filter(
            user=request.user,
            mall=cart.mall,
            status="PAYMENT_PENDING",
            expires_at__lte=timezone.now(),
        ).update(status="EXPIRED")

        # ✅ Reuse pending order ONLY if same cart_hash and not expired
        latest_pending = (
            Order.objects.filter(
                user=request.user,
                mall=cart.mall,
                status="PAYMENT_PENDING",
                cart_hash=cart_hash,
                expires_at__gt=timezone.now(),
            )
            .order_by("-created_at")
            .first()
        )

        if latest_pending:
            return success_response(
                message="Continuing existing pending order",
                data=OrderDetailSerializer(latest_pending).data,
                status=status.HTTP_200_OK,
            )

        # ✅ Create fresh order snapshot
        order = Order.objects.create(
            user=request.user,
            mall=cart.mall,
            order_number=f"ORD-{uuid.uuid4().hex[:12].upper()}",
            status="PAYMENT_PENDING",
            cart_hash=cart_hash,
            expires_at=timezone.now() + timedelta(minutes=15),
            subtotal=Decimal("0.00"),
            tax=Decimal("0.00"),
            total=Decimal("0.00"),
            cgst=Decimal("0.00"),
            sgst=Decimal("0.00"),
            igst=Decimal("0.00"),
        )

        taxable_total = Decimal("0.00")
        gst_total = Decimal("0.00")
        cgst_total = Decimal("0.00")
        sgst_total = Decimal("0.00")
        payable_total = Decimal("0.00")

        for item in cart.items.select_related("product").all():
            p = item.product
            qty = Decimal(item.quantity)

            unit_price_inclusive = Decimal(p.price)
            line_total_inclusive = unit_price_inclusive * qty

            gst_rate = Decimal(getattr(p, "gst_rate", Decimal("0.00")))

            unit_taxable, unit_gst, unit_cgst, unit_sgst = split_gst_inclusive(
                inclusive_amount=unit_price_inclusive,
                gst_rate=gst_rate,
            )

            line_taxable = unit_taxable * qty
            line_gst = unit_gst * qty
            line_cgst = unit_cgst * qty
            line_sgst = unit_sgst * qty

            taxable_total += line_taxable
            gst_total += line_gst
            cgst_total += line_cgst
            sgst_total += line_sgst
            payable_total += line_total_inclusive

            OrderItem.objects.create(
                order=order,
                product=p,
                product_name=p.name,
                product_price=money(unit_price_inclusive),
                product_barcode=p.barcode,
                quantity=item.quantity,
                gst_rate=money(gst_rate),
                taxable_value=money(line_taxable),
                tax_amount=money(line_gst),
                cgst_amount=money(line_cgst),
                sgst_amount=money(line_sgst),
                total_price=money(line_total_inclusive),
            )

        order.subtotal = money(taxable_total)
        order.tax = money(gst_total)
        order.cgst = money(cgst_total)
        order.sgst = money(sgst_total)
        order.total = money(payable_total)
        order.save()

        return success_response(
            message="Order created",
            data=OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )
    
class OrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(
            Order,
            id=pk,
            user=request.user,
            status="PAYMENT_PENDING",
        )

        order.status = "CANCELLED"
        order.payment_status = "FAILED"
        order.save(update_fields=["status", "payment_status"])

        return success_response(
            message="Order cancelled successfully",
            status=status.HTTP_200_OK,
        )



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle


def safe_str(x, fallback=""):
    """Helper function to safely convert to string"""
    return str(x) if x is not None else fallback


class OrderInvoiceDataView(APIView):
    """
    API endpoint to get order data as JSON for mobile app
    GET /api/orders/{pk}/invoice-data/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(
            Order.objects.select_related("mall", "user").prefetch_related("items__product"),
            pk=pk,
            user=request.user
        )
        
        # Serialize mall data
        mall_data = None
        if order.mall:
            mall_data = {
                "name": safe_str(getattr(order.mall, "name", "")),
                "address": safe_str(getattr(order.mall, "address", "")),
                "gstin": safe_str(getattr(order.mall, "gstin", "")),
                "fssai": safe_str(getattr(order.mall, "fssai", "")),
                "state_code": safe_str(getattr(order.mall, "state_code", "")),
                "state_name": safe_str(getattr(order.mall, "state_name", "")),
            }
        
        # Serialize user data
        user_data = {
            "full_name": safe_str(getattr(order.user, "full_name", "")),
            "email": safe_str(getattr(order.user, "email", "")),
            "phone_number": safe_str(getattr(order.user, "phone_number", "")),
        }
        
        # Serialize items
        items_data = []
        for item in order.items.all():
            product = getattr(item, "product", None)
            hsn_code = ""
            if product and hasattr(product, "hsn_code"):
                hsn_code = safe_str(product.hsn_code, "")
            elif hasattr(item, "hsn_code"):
                hsn_code = safe_str(item.hsn_code, "")
            
            items_data.append({
                "product_name": safe_str(item.product_name, ""),
                "quantity": item.quantity,
                "product_price": safe_str(getattr(item, "product_price", "0.00")),
                "cgst_amount": safe_str(getattr(item, "cgst_amount", "0.00")),
                "sgst_amount": safe_str(getattr(item, "sgst_amount", "0.00")),
                "total_price": safe_str(getattr(item, "total_price", "0.00")),
                "hsn_code": hsn_code,
                "product": {
                    "hsn_code": hsn_code
                } if product else None
            })
        
        # Build response
        response_data = {
            "id": order.id,
            "order_number": order.order_number,
            "created_at": order.created_at.isoformat(),
            "mall": mall_data,
            "user": user_data,
            "items": items_data,
            "subtotal": safe_str(getattr(order, "subtotal", "0.00")),
            "cgst": safe_str(getattr(order, "cgst", "0.00")),
            "sgst": safe_str(getattr(order, "sgst", "0.00")),
            "total": safe_str(getattr(order, "total", "0.00")),
            "payment_method": safe_str(getattr(order, "payment_method", "UPI")),
            "gateway_payment_id": safe_str(getattr(order, "gateway_payment_id", "")),
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class OrderInvoiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(
            Order.objects.select_related("mall", "user")
            .prefetch_related("items__product", "payments"),
            pk=pk,
            user=request.user,
        )

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="invoice_{order.order_number}.pdf"'
        )

        width, height = A4
        pdf = canvas.Canvas(response, pagesize=A4)

        # -----------------------------------
        # REGISTER FONT (₹ support)
        # -----------------------------------
        fonts_dir = os.path.join(settings.BASE_DIR, "static", "fonts")

        # Define the fallback-safe variables
        FONT_NORMAL = "Helvetica"
        FONT_BOLD = "Helvetica-Bold"

        # Try to register Normal Font
        try:
            normal_font_path = os.path.join(fonts_dir, "DejaVuSans.ttf")
            pdfmetrics.registerFont(TTFont("DejaVu", normal_font_path))
            FONT_NORMAL = "DejaVu"
        except Exception as e:
            print(f"Error loading DejaVuSans: {e}")

        # Try to register Bold Font
        try:
            bold_font_path = os.path.join(fonts_dir, "DejaVuSans-Bold.ttf")
            pdfmetrics.registerFont(TTFont("DejaVu-Bold", bold_font_path))
            FONT_BOLD = "DejaVu-Bold"
        except Exception as e:
            print(f"Error loading DejaVuSans-Bold: {e}")

        pdf.setFont(FONT_NORMAL, 10)

        mall = order.mall

        # -----------------------------------
        # HEADER LEFT
        # -----------------------------------
        y = height - 50

        pdf.setFont(FONT_BOLD, 14)
        pdf.drawString(40, y, mall.name)

        pdf.setFont(FONT_NORMAL, 10)
        pdf.drawString(40, y - 18, mall.address or "")

        pdf.drawString(40, y - 36, f"GSTIN: {getattr(mall, 'gstin', '')}")
        pdf.drawString(40, y - 52, f"FSSAI: {getattr(mall, 'fssai', '')}")

        # -----------------------------------
        # LOGO RIGHT (Proper Placement)
        # -----------------------------------
        logo_path = os.path.join(settings.BASE_DIR, "static/images/logo.png")
        if os.path.exists(logo_path):
            pdf.drawImage(
                logo_path,
                width - 170,
                height - 80,
                width=130,
                height=45,
                preserveAspectRatio=True,
                mask="auto",
            )

        # LINE
        pdf.setStrokeColor(colors.grey)
        pdf.line(40, height - 110, width - 40, height - 110)

        # -----------------------------------
        # TITLE
        # -----------------------------------
        pdf.setFont(FONT_BOLD, 12)
        
        pdf.drawCentredString(width / 2, height - 130, "TAX INVOICE (IN-STORE PURCHASE)")
        pdf.line(40, height - 140, width - 40, height - 140)

        # -----------------------------------
        # META
        # -----------------------------------
        pdf.setFont(FONT_NORMAL, 12)

        invoice_no = f"PM-{order.created_at.strftime('%Y%m%d')}{order.id}"
        invoice_date = order.created_at.strftime("%d-%b-%Y")

        meta_y = height - 160
        pdf.drawString(40, meta_y, f"Invoice No: {invoice_no}")
        pdf.drawString(40, meta_y - 18, f"Order ID: {order.order_number}")
        pdf.drawString(40, meta_y - 36, f"Invoice Date: {invoice_date}")
        pdf.drawString(
            40,
            meta_y - 54,
            f"Place of Supply: {getattr(mall, 'state_name', '')} ({getattr(mall, 'state_code', '')})",
        )

        pdf.line(40, meta_y - 70, width - 40, meta_y - 70)

        # -----------------------------------
        # BILL TO
        # -----------------------------------
        bill_y = meta_y - 100

        pdf.setFillColor(colors.HexColor("#1E3A8A"))
        pdf.drawString(40, bill_y, "BILL TO")
        pdf.setFillColor(colors.black)

        pdf.drawString(
            40,
            bill_y - 20,
            f"Customer Name: {order.user.email}",
        )

        if getattr(order.user, "phone_number", None):
            pdf.drawString(
                40,
                bill_y - 38,
                f"Mobile: +91 {order.user.phone_number}",
            )

        # -----------------------------------
        # ITEMS TABLE
        # -----------------------------------
        table_y = bill_y - 70

        data = [["#", "Item", "HSN", "Qty", "Rate", "CGST", "SGST", "Total"]]

        for i, item in enumerate(order.items.all(), start=1):
            data.append([
                str(i),
                item.product_name,
                getattr(item.product, "hsn_code", ""),
                str(item.quantity),
                f"{item.product_price:.2f}",
                f"{item.cgst_amount:.2f}",
                f"{item.sgst_amount:.2f}",
                f"{item.total_price:.2f}",
            ])

        table = Table(data, colWidths=[25, 170, 50, 35, 55, 55, 55, 60])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
        ]))

        table.wrapOn(pdf, width, height)
        table_height = 18 * len(data)
        table.drawOn(pdf, 40, table_y - table_height)

        # -----------------------------------
        # TOTALS RIGHT SIDE
        # -----------------------------------
        summary_y = table_y - table_height - 30

        pdf.setFont(FONT_NORMAL, 10)

        pdf.drawRightString(width - 40, summary_y, f"Item Total: ₹{order.subtotal:.2f}")
        pdf.drawRightString(width - 40, summary_y - 18, f"CGST: ₹{order.cgst:.2f}")
        pdf.line(width - 200, summary_y - 22, width - 40, summary_y - 22)

        pdf.drawRightString(width - 40, summary_y - 36, f"SGST: ₹{order.sgst:.2f}")
        pdf.line(width - 200, summary_y - 40, width - 40, summary_y - 40)

        pdf.setFont(FONT_NORMAL, 11)
        pdf.drawRightString(width - 40, summary_y - 60, f"Invoice Value: ₹{order.total:.2f}")

        pdf.line(40, summary_y - 80, width - 40, summary_y - 80)

        # -----------------------------------
        # PAYMENT (FROM Payment MODEL)
        # -----------------------------------
        payment = order.payments.filter(status="PAID").first()

        pay_y = summary_y - 100

        pdf.setFillColor(colors.HexColor("#1E3A8A"))
        pdf.drawString(40, pay_y, f"Payment Mode: {payment.provider if payment else 'Cash'}")
        pdf.setFillColor(colors.black)

        if payment and payment.gateway_payment_id:
            pdf.setFillColor(colors.HexColor("#1E3A8A"))
            pdf.drawString(40, pay_y - 18, f"Transaction ID: {payment.gateway_payment_id}")
            pdf.setFillColor(colors.black)

        pdf.line(40, pay_y - 35, width - 40, pay_y - 35)

        # -----------------------------------
        # BARCODE
        # -----------------------------------
        barcode = code128.Code128(order.order_number, barHeight=40, barWidth=1)
        barcode.drawOn(pdf, 40, pay_y - 90)

        # -----------------------------------
        # FOOTER
        # -----------------------------------
        pdf.drawString(40, pay_y - 120, "This is a system-generated invoice for an in-store purchase.")

        pdf.setFont(FONT_NORMAL, 10)
        pdf.drawString(40, pay_y - 150, "Seller")
        pdf.drawString(40, pay_y - 165, mall.name)
        pdf.drawString(40, pay_y - 180, mall.address or "")

        pdf.drawString(40, pay_y - 210, "Platform:")
        pdf.drawString(40, pay_y - 225, "PayMall Technologies Pvt. Ltd.")
        pdf.drawString(40, pay_y - 240, "Made in India 🇮🇳")

        pdf.showPage()
        pdf.save()

        return response
