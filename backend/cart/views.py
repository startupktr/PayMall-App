from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from common.responses import success_response, error_response
from .models import CartItem, Cart, SavedCart, SavedCartItem
from .serializers import CartSerializer, SavedCartSerializer
from .utils import get_active_cart
from products.models import Product
from django.shortcuts import get_object_or_404
from django.db import transaction


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        cart = (
            Cart.objects.filter(
                user=request.user,
                status="ACTIVE",
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

        items = request.data.get("items", [])
        force = request.data.get("force", False)

        if not isinstance(items, list):
            return error_response(message="items must be a list", status=400)

        if not items:
            return success_response(
                message="No guest items",
                data={"merged": False},
                status=200,
            )

        # 🔹 Determine guest mall from first product
        first_product = Product.objects.filter(
            id=items[0].get("product_id"),
            is_available=True,
        ).select_related("mall").first()

        if not first_product:
            return error_response(message="Invalid product", status=400)

        guest_mall = first_product.mall

        # 🔹 Get or create active cart
        cart = get_active_cart(request.user)

        if not cart:
            cart = Cart.objects.create(
                user=request.user,
                mall=guest_mall,
                status="ACTIVE",
            )

        # 🔹 Conflict detection BEFORE modifying anything
        if (
            cart.items.exists()
            and cart.mall != guest_mall
            and not force
        ):
            return success_response(
                message="Conflict",
                data={
                    "conflict": True,
                    "existing_mall": {
                        "id": str(cart.mall.id),
                        "name": cart.mall.name,
                        "logo": request.build_absolute_uri(cart.mall.image.url)
                        if cart.mall.image else None,
                    },
                    "new_mall": {
                        "id": str(guest_mall.id),
                        "name": guest_mall.name,
                        "logo": request.build_absolute_uri(guest_mall.image.url)
                        if guest_mall.image else None,
                    },
                    "guest_items": items,
                },
                status=200,
            )

        # 🔹 If force OR cart empty → reset mall safely
        if cart.mall != guest_mall:
            cart.items.all().delete()
            cart.mall = guest_mall
            cart.save()

        # 🔹 Merge items
        for i in items:
            product_id = i.get("product_id")
            quantity = int(i.get("quantity", 0))

            if not product_id or quantity <= 0:
                continue

            product = Product.objects.filter(
                id=product_id,
                is_available=True,
            ).first()

            if not product:
                continue

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
            )

            new_qty = quantity if created else cart_item.quantity + quantity

            if new_qty > product.stock_quantity:
                new_qty = product.stock_quantity

            cart_item.quantity = new_qty
            cart_item.save()

        cart.refresh_from_db()

        return success_response(
            message="Guest cart merged",
            data={
                "merged": True,
                "cart": CartSerializer(cart, context={"request": request}).data,
            },
            status=200,
        )

class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):

        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        product = get_object_or_404(
            Product,
            id=product_id,
            is_available=True,
        )

        cart = get_active_cart(request.user)

        # 🔥 No cart exists → create new cart WITH mall
        if not cart:
            cart = Cart.objects.create(
                user=request.user,
                mall=product.mall,
                status="ACTIVE",
            )

        # 🔥 Conflict detection
        elif cart.mall != product.mall:
            return success_response(
                message="Cart conflict",
                data={
                    "conflict": True,
                    "existing_mall": {
                        "id": str(cart.mall.id),
                        "name": cart.mall.name,
                        "logo": request.build_absolute_uri(cart.mall.image.url)
                        if cart.mall.image else None,
                    },
                    "new_mall": {
                        "id": str(product.mall.id),
                        "name": product.mall.name,
                        "logo": request.build_absolute_uri(product.mall.image.url)
                        if product.mall.image else None,
                    },
                },
                status=200,
            )

        # Add or update item
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
        )

        new_quantity = quantity if created else item.quantity + quantity

        if new_quantity > product.stock_quantity:
            return error_response(
                message="Stock limit exceeded",
                status=400,
            )

        item.quantity = new_quantity
        item.save()

        cart.refresh_from_db()

        return success_response(
            message="Item added",
            data=CartSerializer(cart, context={"request": request}).data,
            status=200,
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
        cart = (
            Cart.objects.filter(
                user=request.user,
                status="ACTIVE",
            )
            .first()
        )

        if cart:
            cart.items.all().delete()

        return success_response(
            message="Cart cleared",
            data=None,
            status=status.HTTP_200_OK,
        )

class ReplaceCartView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        product = get_object_or_404(Product, id=product_id)

        cart = get_active_cart(request.user)

        cart.items.all().delete()
        cart.mall = product.mall
        cart.save()

        CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity,
        )

        cart.refresh_from_db()

        return success_response(
            message="Cart replaced",
            data=CartSerializer(cart, context={"request": request}).data,
        )


class SaveCartView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        product = get_object_or_404(Product, id=product_id)

        cart = get_active_cart(request.user)

        if not cart.items.exists():
            return error_response(message="Cart is empty", status=400)

        saved_cart = SavedCart.objects.create(
            user=request.user,
            mall=cart.mall,
        )

        for item in cart.items.all():
            SavedCartItem.objects.create(
                saved_cart=saved_cart,
                product=item.product,
                quantity=item.quantity,
            )

        cart.items.all().delete()

        cart.mall = product.mall
        cart.save()

        CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity,
        )

        cart.refresh_from_db()

        return success_response(
            message="Cart saved and new cart started",
            data=CartSerializer(cart, context={"request": request}).data,
        )

class SavedCartListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved = (
            SavedCart.objects
            .filter(user=request.user)
            .select_related("mall")
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

        return success_response(
            message="Saved carts fetched",
            data=SavedCartSerializer(saved, many=True, context={"request": request}).data,
        )

class RestoreSavedCartView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        saved_cart_id = request.data.get("saved_cart_id")
        force = request.data.get("force", False)

        saved_cart = get_object_or_404(
            SavedCart,
            id=saved_cart_id,
            user=request.user,
        )

        active_cart = get_active_cart(request.user)

        # 🟡 Conflict only if force is NOT requested
        if (
            active_cart.items.exists()
            and active_cart.mall != saved_cart.mall
            and not force
        ):
            return success_response(
                message="Conflict",
                data={
                    "conflict": True,
                    "existing_mall": {
                        "id": str(active_cart.mall.id),
                        "name": active_cart.mall.name,
                        "logo": request.build_absolute_uri(active_cart.mall.image.url)
                        if active_cart.mall.image else None,
                    },
                    "new_mall": {
                        "id": str(saved_cart.mall.id),
                        "name": saved_cart.mall.name,
                        "logo": request.build_absolute_uri(saved_cart.mall.image.url)
                        if saved_cart.mall.image else None,
                    },
                },
                status=200,
            )

        # 🔴 If force = True and different mall → clear existing cart
        if active_cart.items.exists() and active_cart.mall != saved_cart.mall:
            active_cart.items.all().delete()

        # ✅ Update mall to saved cart mall
        active_cart.mall = saved_cart.mall
        active_cart.save()

        # Remove any existing items (safety)
        active_cart.items.all().delete()

        # 🟢 Copy items from saved cart
        for item in saved_cart.items.all():
            CartItem.objects.create(
                cart=active_cart,
                product=item.product,
                quantity=item.quantity,
            )

        # Delete saved cart after restore
        saved_cart.delete()

        active_cart.refresh_from_db()

        return success_response(
            message="Saved cart restored",
            data=CartSerializer(
                active_cart,
                context={"request": request},
            ).data,
        )
