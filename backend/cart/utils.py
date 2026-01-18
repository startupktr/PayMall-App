from django.db import transaction
from decimal import Decimal, ROUND_HALF_UP
from django.shortcuts import get_object_or_404
from malls.models import Mall
from .models import Cart


@transaction.atomic
def get_active_cart(user, mall_or_id):

    if isinstance(mall_or_id, Mall):
        mall = mall_or_id
    else:
        mall = get_object_or_404(Mall, id=mall_or_id)

    cart, _ = Cart.objects.select_for_update().get_or_create(
        user=user,
        mall=mall,
        status="ACTIVE",
    )
    return cart


def money(x: Decimal) -> Decimal:
    return Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def split_gst_inclusive(inclusive_amount: Decimal, gst_rate: Decimal):
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
