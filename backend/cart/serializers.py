from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductSerializer
from .utils import split_gst_inclusive, money
from decimal import Decimal

class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items"""
    product = ProductSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'quantity', 'total_price')

    def get_total_price(self, obj):
        return money(Decimal(obj.total_price))

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    # ✅ POS totals
    total_amount = serializers.SerializerMethodField()       # payable inclusive
    taxable_subtotal = serializers.SerializerMethodField()   # base amount
    gst_total = serializers.SerializerMethodField()          # total GST inside price
    cgst = serializers.SerializerMethodField()
    sgst = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            "id",
            "mall",
            "items",
            "total_amount",
            "taxable_subtotal",
            "gst_total",
            "cgst",
            "sgst",
        )

    def _calculate_breakup(self, cart: Cart):
        """
        ✅ POS: calculate GST breakup using inclusive product prices
        """
        taxable_total = Decimal("0.00")
        gst_total = Decimal("0.00")
        cgst_total = Decimal("0.00")
        sgst_total = Decimal("0.00")
        payable_total = Decimal("0.00")

        for item in cart.items.select_related("product").all():
            p = item.product
            qty = Decimal(item.quantity)

            unit_price_inclusive = Decimal(p.price)
            gst_rate = Decimal(getattr(p, "gst_rate", Decimal("0.00")))

            unit_taxable, unit_gst, unit_cgst, unit_sgst = split_gst_inclusive(
                inclusive_amount=unit_price_inclusive,
                gst_rate=gst_rate,
            )

            taxable_total += unit_taxable * qty
            gst_total += unit_gst * qty
            cgst_total += unit_cgst * qty
            sgst_total += unit_sgst * qty
            payable_total += unit_price_inclusive * qty

        return {
            "taxable_total": money(taxable_total),
            "gst_total": money(gst_total),
            "cgst_total": money(cgst_total),
            "sgst_total": money(sgst_total),
            "payable_total": money(payable_total),
        }

    def get_total_amount(self, obj):
        return self._calculate_breakup(obj)["payable_total"]

    def get_taxable_subtotal(self, obj):
        return self._calculate_breakup(obj)["taxable_total"]

    def get_gst_total(self, obj):
        return self._calculate_breakup(obj)["gst_total"]

    def get_cgst(self, obj):
        return self._calculate_breakup(obj)["cgst_total"]

    def get_sgst(self, obj):
        return self._calculate_breakup(obj)["sgst_total"]