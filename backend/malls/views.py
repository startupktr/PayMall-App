from rest_framework import status
from rest_framework.response import Response
from .models import Mall, Offer
from .serializers import MallSerializer
import math
from django.utils.timezone import now
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

class NearbyMallView(APIView):

    def post(self, request):
        lat = request.data.get("latitude")
        lng = request.data.get("longitude")
        malls = []
        for mall in Mall.objects.filter(is_active=True):
            dist = haversine(lat, lng, mall.latitude, mall.longitude)
            if dist <= 6000:
                malls.append({
                    "id": mall.id,
                    "name": mall.name,
                    "address": mall.address,
                    "image": mall.image.url if mall.image else None,
                    "description": mall.description,
                    "distance": round(dist, 2)
                })

        return Response(sorted(malls, key=lambda x: x["distance"]))
    
class MallOffersView(APIView):
    def get(self, request):
        current_time = now()

        offers = (
            Offer.objects
            .filter(
                is_active=True,
                valid_from__lte=current_time,
                valid_to__gte=current_time
            )
            .select_related("mall")
            .order_by("mall_id", "-valid_to")  # latest per mall
            # .distinct("mall_id")               # ONE offer per mall (Postgres)
        )

        data = [
            {
                "id": offer.id,
                "title": offer.title,
                "description": offer.description,
                "image": request.build_absolute_uri(offer.image.url),
                "mall_id": offer.mall.id,
                "mall_name": offer.mall.name,
            }
            for offer in offers
        ]

        return Response(data)

class MallView(APIView):
    def get(self, request, mall_id):
        mall = get_object_or_404(Mall, id=mall_id)
        serializer = MallSerializer(mall)
        return Response(serializer.data, status=status.HTTP_200_OK)