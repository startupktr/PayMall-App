from .models import Cart

def get_or_create_cart(user, mall):
    cart, created = Cart.objects.get_or_create(
        user=user,
        mall=mall
    )
    return cart
