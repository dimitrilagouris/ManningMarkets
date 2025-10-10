from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from ..orderbooks import Orderbooks  # if your Orderbooks class is in the same app
from django.contrib.auth.models import User
from ..models import Events, Profiles  # or whatever your Event model is actually called


@csrf_exempt
def create_order(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        try:
            user = User.objects.get(id=data['user_id'])
            profile = Profiles.objects.get(user=user)
            event = Events.objects.get(id=data['event_id'])
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

        orderbooks = Orderbooks()
        result = orderbooks.submit_order(
            user=profile,
            event=event,
            order_type=data['order_type'],
            share_type=data['share_type'],
            quantity=data['quantity'],
            price=data['price'],
        )

        return JsonResponse(result)

    return JsonResponse({"error": "Use POST"}, status=405)
