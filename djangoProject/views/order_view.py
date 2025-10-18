from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
import json
from ..orderbooks import Orderbooks  # if your Orderbooks class is in the same app
from ..models import Events, Profiles  # or whatever your Event model is actually called


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    data = request.data
    try:
        # Get the authenticated user from the request (secure!)
        user = request.user
        event = Events.objects.get(id=data['event_id'])
    except Events.DoesNotExist:
        return Response({"error": "Event not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

    orderbooks = Orderbooks()
    result = orderbooks.submit_order(
        user=user,  # Use authenticated user, not from request data
        event=event,
        order_type=data['order_type'],
        share_type=data['share_type'],
        quantity=data['quantity'],
        price=data['price'],
    )

    return Response(result)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_orderbook(request, event_id):

    try:
        # Verify the event exists
        event = Events.objects.get(id=event_id, open=True)
    except Events.DoesNotExist:
        return JsonResponse({"error": "Event not found or closed"}, status=404)
    
    try:
        # Use the shared orderbook logic from Orderbooks class
        orderbooks = Orderbooks()
        orderbook_data = orderbooks.get_orderbook_snapshot(event)
        return JsonResponse(orderbook_data)
        
    except Exception as e:
        return JsonResponse({"error": f"Failed to fetch orderbook: {str(e)}"}, status=500)
