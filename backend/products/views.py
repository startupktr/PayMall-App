from products.models import Product
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import ProductSerializer, ProductDetailSerializer
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from malls.models import Mall

class ProductListView(ListAPIView):
    """View to list all products with optional filtering"""
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        queryset = Product.objects.filter(is_available=True)
        
        # Filter by category if provided
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by mall if provided
        mall_id = self.request.query_params.get('mall')
        if mall_id:
            queryset = queryset.filter(mall_id=mall_id)
        
        # Search by name or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(description__icontains=search)
        
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

