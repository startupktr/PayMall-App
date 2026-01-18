from products.models import Product
from django.db import transaction
from django.utils import timezone
from products.models import InventoryAlert


@transaction.atomic
def create_or_update_product(*, mall, data, instance=None):
    if instance:
        for field, value in data.items():
            setattr(instance, field, value)
        instance.mall = mall
        instance.save()
        return instance

    return Product.objects.create(mall=mall, **data)



def check_inventory_alert(product):
    product.refresh_from_db()
    
    alert, _ = InventoryAlert.objects.get_or_create(product=product)

    if product.stock_quantity <= alert.threshold and not alert.is_triggered:
        alert.is_triggered = True
        alert.triggered_at = timezone.now()
        alert.save()

        # 🔔 Hook point: notification / email / websocket
        return True

    if product.stock_quantity > alert.threshold and alert.is_triggered:
        alert.is_triggered = False
        alert.save()

    return False
