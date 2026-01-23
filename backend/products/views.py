from django.db.models import Q, Count
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from common.responses import success_response, error_response
from .models import Product, Category
from .serializers import (
    ProductSerializer,
    ProductDetailSerializer,
    CategorySerializer,
)


class MallCategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mall_id = request.query_params.get("mall")
        if not mall_id:
            return error_response(
                message="mall query param is required",
                errors={"mall": ["mall_id is required"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = (
            Category.objects.filter(
                products__mall_id=mall_id,
                products__is_available=True,
                products__stock_quantity__gt=0,
                products__status="ACTIVE",
            )
            .annotate(product_count=Count("products"))
            .distinct()
            .order_by("name")
        )

        return success_response(
            message="Mall categories fetched successfully",
            data=CategorySerializer(qs, many=True, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class ProductListView(APIView):
    """
    List products for a given mall with optional:
    - category
    - search
    - sorting
    """
    permission_classes = [AllowAny]

    def get(self, request):
        params = request.query_params

        mall_id = params.get("mall")
        if not mall_id:
            return error_response(
                message="mall query param is required",
                errors={"mall": ["mall_id is required"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = Product.objects.filter(
            status="ACTIVE",
            is_available=True,
            mall_id=mall_id,
        )

        # 🔹 Category filter
        category = params.get("category")
        if category and category.lower() != "all":
            queryset = queryset.filter(category__name__iexact=category)

        # 🔹 Search (name OR description)
        search = params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        # 🔹 Sorting
        sort = params.get("sort")
        if sort == "price_asc":
            queryset = queryset.order_by("price")
        elif sort == "price_desc":
            queryset = queryset.order_by("-price")
        elif sort == "Popular":
            queryset = queryset.order_by("-created_at")  # replace with real field if available

        serialized = ProductSerializer(queryset, many=True, context={"request": request}).data

        return success_response(
            message="Products fetched successfully",
            data=serialized,
            status=status.HTTP_200_OK,
        )


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        product = Product.objects.filter(pk=pk).first()

        if not product:
            return error_response(
                message="Product not found",
                status=status.HTTP_404_NOT_FOUND,
            )

        return success_response(
            message="Product details fetched successfully",
            data=ProductDetailSerializer(product).data,
            status=status.HTTP_200_OK,
        )


class ProductBarcodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        barcode = request.data.get("barcode")
        mall_id = request.data.get("mall_id")

        if not barcode or not mall_id:
            return error_response(
                message="barcode and mall_id are required",
                errors={"barcode": ["required"], "mall_id": ["required"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = Product.objects.filter(
            status="ACTIVE",
            barcode=barcode,
            mall_id=mall_id,
            is_available=True,
        ).first()

        if not product:
            return error_response(
                message="Product not found or unavailable",
                status=status.HTTP_404_NOT_FOUND,
            )

        return success_response(
            message="Product found",
            data=ProductDetailSerializer(product).data,
            status=status.HTTP_200_OK,
        )
