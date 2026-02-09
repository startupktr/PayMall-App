from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from common.responses import success_response, error_response
from .models import CartItem, Cart
from .serializers import CartSerializer
from .utils import get_active_cart
from products.models import Product
from django.shortcuts import get_object_or_404
from django.db import transaction


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mall_id = request.query_params.get("mall_id")

        if not mall_id:
            return error_response(
                message="mall_id is required",
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = (
            Cart.objects.filter(
                user=request.user,
                status="ACTIVE",
                mall_id=mall_id,
            )
            .select_related("mall")
            .prefetch_related("items__product")
            .first()
        )

        if not cart:
            return success_response(
                message="Cart is empty",
                data=None,
                status=status.HTTP_200_OK,
            )

        return success_response(
            message="Cart fetched successfully",
            data=CartSerializer(cart, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class MergeGuestCartView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        
        mall_id = request.data.get("mall_id")
        items = request.data.get("items", [])

        if not mall_id:
            return error_response(message="mall_id is required", status=400)

        if not isinstance(items, list):
            return error_response(message="items must be a list", status=400)

        cart = get_active_cart(request.user, mall_id)

        had_existing_items = cart.items.exists()
        merged_count = 0

        for i in items:
            product_id = i.get("product_id")
            quantity = int(i.get("quantity", 0))

            if not product_id or quantity <= 0:
                continue

            product = Product.objects.filter(
                id=product_id,
                mall_id=mall_id,
                is_available=True,
            ).first()

            if not product:
                continue

            item_obj, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
            )

            new_qty = quantity if created else (item_obj.quantity + quantity)

            # ✅ prevent stock overflow
            if new_qty > product.stock_quantity:
                new_qty = product.stock_quantity

            item_obj.quantity = new_qty
            item_obj.save()

            merged_count += 1

        cart.refresh_from_db()

        return success_response(
            message="Guest cart merged",
            data={
                "cart": CartSerializer(cart, context={"request": request}).data,
                "had_existing_items": had_existing_items,
                "merged_count": merged_count,
            },
            status=status.HTTP_200_OK,
        )


class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        if not product_id:
            return error_response(
                message="product_id is required",
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity <= 0:
            return error_response(
                message="Quantity must be greater than zero",
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = get_object_or_404(
            Product,
            id=product_id,
            is_available=True,
        )

        if product.stock_quantity < quantity:
            return error_response(
                message="Insufficient stock",
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = get_active_cart(request.user, product.mall_id)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
        )

        new_quantity = quantity if created else item.quantity + quantity

        if new_quantity > product.stock_quantity:
            return error_response(
                message="Stock limit exceeded",
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = new_quantity
        item.save()

        cart.refresh_from_db()

        return success_response(
            message="Item added to cart",
            data=CartSerializer(cart, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class CartItemUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        item_id = request.data.get("cart_item_id")
        quantity = int(request.data.get("quantity", 0))

        if not item_id:
            return error_response(
                message="cart_item_id is required",
                status=status.HTTP_400_BAD_REQUEST,
            )

        item = get_object_or_404(
            CartItem,
            id=item_id,
            cart__user=request.user,
            cart__status="ACTIVE",
        )

        cart = item.cart

        if quantity <= 0:
            item.delete()
            cart.refresh_from_db()

            if not cart.items.exists():
                return success_response(
                    message="Cart is empty",
                    data=None,
                    status=status.HTTP_200_OK,
                )

            return success_response(
                message="Item removed from cart",
                data=CartSerializer(cart, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )

        if quantity > item.product.stock_quantity:
            return error_response(
                message="Insufficient stock",
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save()

        cart.refresh_from_db()

        return success_response(
            message="Cart item updated",
            data=CartSerializer(cart, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class RemoveCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        item_id = request.data.get("cart_item_id")

        if not item_id:
            return error_response(
                message="cart_item_id is required",
                status=status.HTTP_400_BAD_REQUEST,
            )

        item = (
            CartItem.objects.filter(
                id=item_id,
                cart__user=request.user,
                cart__status="ACTIVE",
            )
            .select_related("cart")
            .first()
        )

        if not item:
            return success_response(
                message="Item already removed",
                data=None,
                status=status.HTTP_200_OK,
            )

        cart = item.cart
        item.delete()

        cart.refresh_from_db()

        if not cart.items.exists():
            return success_response(
                message="Cart is empty",
                data=None,
                status=status.HTTP_200_OK,
            )

        return success_response(
            message="Item removed",
            data=CartSerializer(cart, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class ClearCartView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        mall_id = request.query_params.get("mall_id")

        if not mall_id:
            return error_response(
                message="mall_id is required",
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = (
            Cart.objects.filter(
                user=request.user,
                status="ACTIVE",
                mall_id=mall_id,
            )
            .prefetch_related("items")
            .first()
        )

        if cart:
            cart.items.all().delete()

        return success_response(
            message="Cart cleared",
            data=None,
            status=status.HTTP_200_OK,
        )
