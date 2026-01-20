from rest_framework import permissions, status
from .models import Mall, Offer
from .serializers import MallSerializer, MallDetailSerializer, OfferSerializer
import math
from django.utils.timezone import now
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from common.responses import success_response, error_response
import os


max_distance = os.getenv('MAX_DISTANCE')  # meters

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

class NearbyMallView(APIView):
    permission_classes = [permissions.AllowAny]  # public for mobile

    def get(self, request):
        try:
            lat = float(request.query_params.get("latitude"))
            lng = float(request.query_params.get("longitude"))
        except (TypeError, ValueError):
            return error_response(
                message="Invalid latitude or longitude",
                status=status.HTTP_400_BAD_REQUEST,
            )

        malls = []
        for mall in Mall.objects.filter(is_active=True):
            dist = haversine(lat, lng, mall.latitude, mall.longitude)
            
            if dist <= max_distance:
                mall.distance = round(dist, 2)
                malls.append(mall)

        malls.sort(key=lambda m: m.distance)
        serializer = MallSerializer(malls, many=True, context={"request": request})

        return success_response(
            message="Nearby malls fetched successfully",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )

    
class MallOffersView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        current_time = now()

        offers = (
            Offer.objects.filter(
                # is_active=True,
                # valid_from__lte=current_time,
                # valid_to__gte=current_time,
            )
            .select_related("mall")
            .order_by("mall_id")
        )

        # seen_malls = set()
        # unique_offers = []

        # for offer in offers:
        #     if offer.mall_id not in seen_malls:
        #         seen_malls.add(offer.mall_id)
        #         unique_offers.append(offer)

        serializer = OfferSerializer(offers, many=True, context={"request": request})

        return success_response(
            message="Active mall offers fetched",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )


class MallView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, mall_id):
        mall = get_object_or_404(Mall, id=mall_id, is_active=True)
        serializer = MallDetailSerializer(mall, context={"request": request})

        return success_response(
            message="Mall details fetched",
            data=serializer.data,
            status=status.HTTP_200_OK,
        )
