from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from django.http import JsonResponse, HttpResponseBadRequest, Http404


# Data model imports
from ..models import Markets, Events, Profiles

@api_view(['GET'])
@permission_classes([AllowAny])
def fetch_markets(request):
    # AJAX Request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # accept query param 'q' for searching market_name
        q = request.GET.get('q', '').strip()

        # base queryset
        qs = Markets.objects.filter(open=True)

        if q:
            qs = qs.filter(market_name__icontains=q)

        qs = qs.prefetch_related('events').order_by('market_name')

        market_data = []
        for market in qs:
            market_data.append({
                'id': market.id,
                'name': market.market_name,
                'market_volume': market.volume,
                'events': [
                    {
                        'id': event.id,
                        'name': event.event_name,
                        'price': event.price,
                        'volume': event.volume
                    }
                    for event in market.events.all()
                ]
            })
        return JsonResponse({'markets': market_data})

    return HttpResponseBadRequest("Invalid Request Type")

@api_view(['GET'])
@permission_classes([AllowAny])
def fetch_market(request, market_id):
    # AJAX Request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            # get specific market and associated events
            market = Markets.objects.filter(id=market_id, open=True).prefetch_related('events').first()
            
            if not market:
                return JsonResponse({'error': 'Market not found'}, status=404)
            
            market_data = {
                'id': market.id,
                'name': market.market_name,
                'market_volume': market.volume,
                'events': [{'id': event.id, 'name': event.event_name, 'price': event.price, 'volume': event.volume, 'expiration_date': event.expiration_date} for event in market.events.all()]
            }
            return JsonResponse({'market': market_data})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return HttpResponseBadRequest("Invalid Request Type")

@api_view(['GET'])
@permission_classes([AllowAny])
def fetch_leaderboard(request):
    # AJAX Request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # get all users and wallets
        users = Profiles.objects.filter(is_active=True).select_related('wallet').order_by('-wallet__points_balance')

        leaderboard_data = []
        for user in users:
            leaderboard_data.append({
                'username': user.username,
                'balance': float(user.wallet.points_balance if hasattr(user, "wallet") else 0.0),
            })

        return JsonResponse({'markets': leaderboard_data})

    return HttpResponseBadRequest("Invalid Request Type")

