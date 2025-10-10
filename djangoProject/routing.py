from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/orderbook/(?P<event_id>\d+)/$", consumers.OrderbookConsumer.as_asgi()),
]
