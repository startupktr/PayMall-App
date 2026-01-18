from decimal import Decimal, ROUND_HALF_UP
import hashlib
from django.utils import timezone


def money(x: Decimal) -> Decimal:
    return Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def split_gst_inclusive(inclusive_amount: Decimal, gst_rate: Decimal):
    """
    inclusive_amount includes GST already (MRP style)
    gst_rate = 0/5/12/18/28

    Returns: taxable_value, gst_amount, cgst, sgst
    """
    inclusive_amount = Decimal(inclusive_amount)
    gst_rate = Decimal(gst_rate or 0)

    if gst_rate <= 0:
        return money(inclusive_amount), money(0), money(0), money(0)

    divisor = Decimal("1.00") + (gst_rate / Decimal("100.00"))
    taxable_value = inclusive_amount / divisor
    gst_amount = inclusive_amount - taxable_value

    cgst = gst_amount / Decimal("2.00")
    sgst = gst_amount / Decimal("2.00")

    return money(taxable_value), money(gst_amount), money(cgst), money(sgst)


def make_cart_hash(cart_items_queryset):
    """
    cart_items_queryset: CartItem queryset
    """
    parts = []
    for it in cart_items_queryset.order_by("product_id"):
        parts.append(f"{it.product_id}:{it.quantity}")
    raw = "|".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()


def is_expired(order):
    if not order.expires_at:
        return False
    return order.expires_at <= timezone.now()