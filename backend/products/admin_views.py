import csv, zipfile, tempfile, os
from io import TextIOWrapper, StringIO
from django.db import transaction
from django.core.files import File
from rest_framework.views import APIView
from rest_framework import status, generics
from django.shortcuts import get_object_or_404
from malls.models import MallStaff
from products.models import Product, Category, InventoryAlert
from products.services import create_or_update_product
from .admin_serializers import AdminProductCreateUpdateSerializer, BulkProductApprovalSerializer, AdminCategorySerializer, ProductApprovalSerializer
from common.responses import success_response, error_response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsMasterAdmin, IsAdminUser
from django.utils import timezone
from accounts.utils import is_master_admin
from rest_framework.exceptions import PermissionDenied
from decimal import Decimal
from django.http import HttpResponse

class AdminProductCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        staff = MallStaff.objects.filter(
            user=request.user,
            role="MALL_ADMIN"
        ).first()

        if not staff:
            return error_response(
                message="Not authorized",
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdminProductCreateUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = create_or_update_product(
            mall=staff.mall,
            data=serializer.validated_data,
        )

        return success_response(
            message="Product created successfully",
            data=AdminProductCreateUpdateSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )

class AdminProductListView(generics.ListAPIView):
    serializer_class = AdminProductCreateUpdateSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        user = self.request.user

        if is_master_admin(user):
            return Product.objects.all()

        staff = MallStaff.objects.filter(user=user).first()
        if not staff:
            raise PermissionDenied("Mall not assigned")

        return Product.objects.filter(mall=staff.mall)

    
class AdminProductUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, product_id):
        staff = MallStaff.objects.filter(user=request.user).first()
        if not staff:
            return error_response(
                message="Not authorized",
                status=status.HTTP_403_FORBIDDEN,
            )

        product = get_object_or_404(
            Product,
            id=product_id,
            mall=staff.mall,
        )

        # 🔒 Store old values BEFORE update
        old_price = product.price
        old_marked_price = product.marked_price

        serializer = AdminProductCreateUpdateSerializer(
            product, data=request.data, partial=True
        )

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = create_or_update_product(
            mall=staff.mall,
            data=serializer.validated_data,
            instance=product,
        )

        # 🔥 FORCE RE-APPROVAL IF PRICE CHANGED
        price_changed = (
            product.price != old_price
            or product.marked_price != old_marked_price
        )

        if price_changed:
            product.status = "PENDING_APPROVAL"
            product.approved_by = None
            product.approved_at = None
            product.rejection_reason = ""
            product.save(
                update_fields=[
                    "status",
                    "approved_by",
                    "approved_at",
                    "rejection_reason",
                ]
            )

            return success_response(
                message="Product updated and sent for re-approval due to price change",
                data=AdminProductCreateUpdateSerializer(product).data,
                status=status.HTTP_200_OK,
            )

        return success_response(
            message="Product updated successfully",
            data=AdminProductCreateUpdateSerializer(product).data,
            status=status.HTTP_200_OK,
        )


class AdminProductToggleAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, product_id):
        staff = MallStaff.objects.filter(user=request.user).first()
        if not staff:
            return error_response(
                message="Not authorized",
                status=status.HTTP_403_FORBIDDEN,
            )

        product = get_object_or_404(Product, id=product_id, mall=staff.mall)

        product.is_available = not product.is_available
        product.save(update_fields=["is_available"])

        return success_response(
            message=f"Product {'activated' if product.is_available else 'deactivated'}",
            data={"is_available": product.is_available},
            status=status.HTTP_200_OK,
        )


class AdminProductBulkUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        staff = MallStaff.objects.filter(user=request.user).first()
        if not staff:
            return error_response(
                "Not authorized",
                status=403
            )

        csv_file = request.FILES.get("csv")
        zip_file = request.FILES.get("zip")
        mode = request.data.get("mode", "increment")  # increment | replace

        if not csv_file:
            return error_response("CSV file is required", status=400)

        # ==========================
        # 1️⃣ ZIP EXTRACTION
        # ==========================
        image_map = {}

        if zip_file:
            temp_dir = tempfile.mkdtemp()

            with zipfile.ZipFile(zip_file) as z:
                z.extractall(temp_dir)

            for root, _, files in os.walk(temp_dir):
                for f in files:
                    image_map[f] = os.path.join(root, f)

        # ==========================
        # 2️⃣ CSV PARSING
        # ==========================
        reader = csv.DictReader(
            TextIOWrapper(csv_file, encoding="utf-8")
        )

        success_count = 0
        failed_rows = []

        # ==========================
        # 3️⃣ PROCESS EACH ROW
        # ==========================
        for idx, row in enumerate(reader, start=1):
            try:
                with transaction.atomic():

                    # ---- SAFE CASTING ----
                    price = Decimal(row["price"])
                    marked_price = Decimal(row["marked_price"])
                    stock_qty = int(row.get("stock_quantity", 0))

                    product, created = Product.objects.get_or_create(
                        mall=staff.mall,
                        barcode=row["barcode"],
                        defaults={
                            "name": row["name"],
                            "price": price,
                            "marked_price": marked_price,
                            "stock_quantity": stock_qty,
                            "status": "PENDING_APPROVAL",
                        },
                    )

                    if not created:
                        product.name = row["name"]
                        product.price = price
                        product.marked_price = marked_price

                        if mode == "increment":
                            product.stock_quantity += stock_qty
                        else:
                            product.stock_quantity = stock_qty

                    # ---- IMAGE MAPPING ----
                    image_name = row.get("image_name")
                    if image_name and image_name in image_map:
                        with open(image_map[image_name], "rb") as img:
                            product.image.save(
                                image_name,
                                File(img),
                                save=False,
                            )

                    product.save()
                    success_count += 1

            except Exception as e:
                failed_rows.append({
                    "row": idx,
                    "barcode": row.get("barcode"),
                    "error": str(e),
                })

        # ==========================
        # 4️⃣ ERROR CSV GENERATION
        # ==========================
        error_csv = None

        if failed_rows:
            buffer = StringIO()
            writer = csv.DictWriter(
                buffer,
                fieldnames=["row", "barcode", "error"]
            )
            writer.writeheader()
            writer.writerows(failed_rows)
            error_csv = buffer.getvalue()

        # ==========================
        # 5️⃣ RESPONSE
        # ==========================
        return success_response(
            message="Bulk upload completed",
            data={
                "success_count": success_count,
                "failure_count": len(failed_rows),
                "failed_rows": failed_rows,
                "error_csv": error_csv,  # 🔥 frontend downloads this
            },
        )



class AdminCategoryCreateView(APIView):
    permission_classes = [IsAuthenticated, IsMasterAdmin]

    def post(self, request):
        serializer = AdminCategorySerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        category = serializer.save()

        return success_response(
            message="Category created successfully",
            data=AdminCategorySerializer(category).data,
            status=status.HTTP_201_CREATED,
        )

class AdminCategoryListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        categories = Category.objects.all().order_by("name")

        serializer = AdminCategorySerializer(categories, many=True)

        return success_response(
            message="Categories fetched successfully",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

class AdminCategoryUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsMasterAdmin]

    def put(self, request, category_id):
        category = get_object_or_404(Category, id=category_id)

        serializer = AdminCategorySerializer(
            category, data=request.data, partial=True
        )

        if not serializer.is_valid():
            return error_response(
                message="Validation failed",
                errors=serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return success_response(
            message="Category updated successfully",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

class AdminCategoryDeactivateView(APIView):
    permission_classes = [IsAuthenticated, IsMasterAdmin]

    def patch(self, request, category_id):
        category = get_object_or_404(Category, id=category_id)

        category.is_active = not category.is_active
        category.save(update_fields=["is_active"])

        return success_response(
            message=f"Category {'activated' if category.is_active else 'deactivated'}",
            data={"is_active": category.is_active},
            status=status.HTTP_200_OK,
        )

class AdminLowStockProductsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        staff = MallStaff.objects.filter(user=request.user).first()
        if not staff:
            return error_response(
                message="Not authorized",
                status=status.HTTP_403_FORBIDDEN,
            )

        alerts = InventoryAlert.objects.filter(
            product__mall=staff.mall,
            is_triggered=True,
        ).select_related("product")

        data = [
            {
                "product_id": alert.product.id,
                "product_name": alert.product.name,
                "stock_quantity": alert.product.stock_quantity,
                "threshold": alert.threshold,
            }
            for alert in alerts
        ]

        return success_response(
            message="Low stock products fetched",
            data=data,
            status=status.HTTP_200_OK,
        )

class SubmitProductForApprovalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        staff = MallStaff.objects.filter(user=request.user).first()
        if not staff:
            return error_response("Not authorized", status=403)

        product = get_object_or_404(
            Product,
            id=product_id,
            mall=staff.mall,
            status="DRAFT",
        )

        product.status = "PENDING_APPROVAL"
        product.rejection_reason = ""
        product.save(update_fields=["status", "rejection_reason"])

        return success_response(
            message="Product submitted for approval",
            status=200,
        )

class ProductApprovalActionView(APIView):
    permission_classes = [IsAuthenticated, IsMasterAdmin]

    def post(self, request, product_id):
        product = get_object_or_404(
            Product,
            id=product_id,
            status="PENDING_APPROVAL",
        )

        serializer = ProductApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]

        if action == "APPROVE":
            product.status = "ACTIVE"
            product.approved_by = request.user
            product.approved_at = timezone.now()
            product.rejection_reason = ""

        else:
            product.status = "REJECTED"
            product.rejection_reason = serializer.validated_data["rejection_reason"]

        product.save()

        return success_response(
            message=f"Product {action.lower()}d successfully",
            status=200,
        )

class BulkProductApprovalView(APIView):
    permission_classes = [IsAuthenticated, IsMasterAdmin]

    def post(self, request):
        serializer = BulkProductApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_ids = serializer.validated_data["product_ids"]
        action = serializer.validated_data["action"]
        rejection_reason = serializer.validated_data.get("rejection_reason", "")

        products = Product.objects.filter(
            id__in=product_ids,
            status="PENDING_APPROVAL"
        )

        success_count = 0
        failed = []

        for product_id in product_ids:
            product = products.filter(id=product_id).first()

            if not product:
                failed.append({
                    "product_id": str(product_id),
                    "reason": "Invalid product or not pending approval"
                })
                continue

            if action == "APPROVE":
                product.status = "ACTIVE"
                product.approved_by = request.user
                product.approved_at = timezone.now()
                product.rejection_reason = ""

            else:  # REJECT
                product.status = "REJECTED"
                product.rejection_reason = rejection_reason
                product.approved_by = None
                product.approved_at = None

            product.save()
            success_count += 1

        return success_response(
            message=f"Bulk {action.lower()} completed",
            data={
                "requested": len(product_ids),
                "approved_or_rejected": success_count,
                "failed": failed,
            },
            status=status.HTTP_200_OK,
        )
