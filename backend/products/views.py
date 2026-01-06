from products.models import Product
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import ProductSerializer, ProductDetailSerializer
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from malls.models import Mall

from rest_framework.generics import ListAPIView
from rest_framework.exceptions import ValidationError
from django.db.models import Q, Count
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

class MallCategoryListView(ListAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        mall_id = self.request.query_params.get("mall")

        if not mall_id:
            raise ValidationError({"mall": "mall_id is required"})

        return (
            Category.objects
            .filter(
                products__mall_id=mall_id,
                products__is_available=True,
                products__stock_quantity__gt=0
            )
            .annotate(product_count=Count("products"))
            .distinct()
            .order_by("name")
        )

class ProductListView(ListAPIView):
    """
    List products for a given mall with optional:
    - category
    - search
    - sorting
    """
    serializer_class = ProductSerializer

    def get_queryset(self):
        params = self.request.query_params

        mall_id = params.get("mall")
        if not mall_id:
            raise ValidationError({"mall": "mall_id is required"})

        queryset = Product.objects.filter(
            is_available=True,
            mall_id=mall_id
        )

        # 🔹 Category filter
        category = params.get("category")
        if category and category.lower() != "all":
            queryset = queryset.filter(
                category__name__iexact=category
            )

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
            queryset = queryset.order_by("-created_at")  # or popularity field

        return queryset

    
class ProductDetailView(RetrieveAPIView):
    """View to retrieve a specific product"""
    queryset = Product.objects.all()
    serializer_class = ProductDetailSerializer

class ProductBarcodeView(APIView):
    """View to retrieve a product by barcode"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        barcode = request.data.get("barcode")
        mall_id = request.data.get("mall_id")

        if not barcode or not mall_id:
            return Response(
                {"error": "Barcode and mall_id required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            mall = Mall.objects.get(id=mall_id, is_active=True)
        except Mall.DoesNotExist:
            return Response(
                {"error": "Invalid mall"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            product = Product.objects.get(
                barcode=barcode,
                mall=mall,
                is_available=True
            )
            serializer = ProductDetailSerializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product with this barcode not found or not available"}, 
                status=status.HTTP_404_NOT_FOUND
            )

