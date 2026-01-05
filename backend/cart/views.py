from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import CartItem, Cart
from .serializers import CartSerializer
from .utils import get_or_create_cart
from products.models import Product
from malls.models import Mall

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = Cart.objects.filter(user=request.user).first()

        if not cart:
            return Response(
                {"message": "Cart is empty"},
                status=status.HTTP_200_OK
            )

        return Response(CartSerializer(cart).data)


class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if product.stock < quantity:
            return Response(
                {"error": "Insufficient stock"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = get_or_create_cart(user, product.mall)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product
        )

        if not created:
            if cart_item.quantity + quantity > product.stock:
                return Response(
                    {"error": "Stock limit exceeded"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity

        cart_item.save()

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK
        )

class CartItemUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        cart_item_id = request.data.get("cart_item_id")
        quantity = int(request.data.get("quantity"))

        try:
            item = CartItem.objects.get(
                id=cart_item_id,
                cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if quantity <= 0:
            item.delete()
            return Response({"message": "Item removed"})

        if quantity > item.product.stock:
            return Response(
                {"error": "Insufficient stock"},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.quantity = quantity
        item.save()

        return Response({"message": "Quantity updated"})

class RemoveCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        cart_item_id = request.data.get("cart_item_id")

        CartItem.objects.filter(
            id=cart_item_id,
            cart__user=request.user
        ).delete()

        return Response({"message": "Item removed"})

class ClearCartView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        Cart.objects.filter(user=request.user).delete()
        return Response({"message": "Cart cleared"})
