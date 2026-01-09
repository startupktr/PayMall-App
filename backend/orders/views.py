from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import get_object_or_404
import uuid
from django.db.models import F
from cart.models import Cart

from products.models import Product
from .models import Order, OrderItem
from .serializers import (
    OrderSerializer, 
    OrderDetailSerializer
)

from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4


class OrderListView(generics.ListAPIView):
    """View to list all orders for a user"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

class OrderDetailView(generics.RetrieveAPIView):
    """View to get details of a specific order"""
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        
        cart = (
            Cart.objects
            .select_for_update()
            .filter(user=request.user, status="ACTIVE")
            .first()
        )
        
        if not cart or not cart.items.exists():
            return Response({"error": "Cart is empty"}, status=400)

        # 🔒 Prevent duplicate order
        existing = Order.objects.filter(
            user=request.user,
            status="PAYMENT_PENDING"
        ).first()

        if existing:
            return Response(
                OrderDetailSerializer(existing).data,
                status=status.HTTP_200_OK
            )
        
        order = Order.objects.create(
            user=request.user,
            mall=cart.mall,
            order_number=f"ORD-{uuid.uuid4().hex[:10].upper()}",
            status="PAYMENT_PENDING",
            payment_status="PENDING",
            subtotal=cart.subtotal,
            tax=cart.tax_amount,
            total=cart.total_amount,
        )

        for item in cart.items.select_related("product"):
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                product_price=item.product.price,
                product_barcode=item.product.barcode,
                quantity=item.quantity,
                total_price=item.total_price,
            )

        # 🔒 Lock cart
        cart.status = "CONVERTED"
        cart.save()

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )


class OrderInvoiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="invoice_{order.order_number}.pdf"'

        pdf = canvas.Canvas(response, pagesize=A4)
        width, height = A4

        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(40, height - 40, "PayMall Invoice")

        pdf.setFont("Helvetica", 10)
        pdf.drawString(40, height - 80, f"Order Number: {order.order_number}")
        pdf.drawString(40, height - 100, f"Date: {order.created_at.strftime('%d %b %Y')}")
        pdf.drawString(40, height - 120, f"Payment Method: {order.payment_method}")

        y = height - 160
        pdf.drawString(40, y, "Items:")
        y -= 20

        for item in order.items.all():
            pdf.drawString(40, y, f"{item.quantity} x {item.product_name}")
            pdf.drawRightString(width - 40, y, f"₹{item.total_price}")
            y -= 15

        y -= 20
        pdf.drawString(40, y, f"Total: ₹{order.total}")

        pdf.showPage()
        pdf.save()

        return response
    
class OrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user, status="PAYMENT_PENDING")

        order.status = "CANCELLED"
        order.save()

        return Response({"success": True})
