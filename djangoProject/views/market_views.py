from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from django.http import JsonResponse, HttpResponseBadRequest


# Data model imports
from ..models import Markets, Events 

@api_view(['GET'])
@permission_classes([AllowAny])
def fetch_markets(request):
    # AJAX Request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # get all markets and associated events
        markets = Markets.objects.filter(open=True).prefetch_related('events')

        market_data = []
        for market in markets: 
            market_data.append({
                'id': market.id,
                'name': market.market_name,
                'market_volume': market.volume,
                'events': [{'id': event.id, 'name': event.event_name, 'price': event.price, 'volume': event.volume} for event in market.events.all()]
            })
        return JsonResponse({'markets': market_data})

    return HttpResponseBadRequest("Invalid Request Type")

def hello_world(request):
    return JsonResponse({"message": "Hello from Django!"})
