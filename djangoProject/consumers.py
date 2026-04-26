from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import json

class OrderbookConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.event_id = self.scope['url_route']['kwargs']['event_id']
            self.group_name = f"orderbook_{self.event_id}"

            print(f"[WS CONNECT] Accepting connection for event {self.event_id}")
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            
            # Send initial orderbook snapshot immediately after connection
            await self.send_initial_orderbook()
        except Exception as e:
            print(f"[WS CONNECT ERROR] {e}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            print(f"[WS DISCONNECT] Event {getattr(self, 'event_id', 'unknown')}, code: {close_code}")
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception as e:
            print(f"[WS DISCONNECT ERROR] {e}")

    async def receive(self, text_data=None, bytes_data=None):
        try:
            if text_data:
                data = json.loads(text_data)
                print(f"[WS RECEIVE] Event {self.event_id}: {data}")
                # Optional: broadcast back to group
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'orderbook.message',
                        'message': data
                    }
                )
        except Exception as e:
            print(f"[WS RECEIVE ERROR] {e}")

    async def orderbook_message(self, event):
        message = event['message']
        try:
            await self.send(text_data=json.dumps(message))
        except Exception as e:
            print(f"[WS SEND ERROR] {e}")

    async def send_orderbook_snapshot(self, event):
        """Handle orderbook snapshot broadcasts"""
        orderbook_data = event['orderbook']
        try:
            await self.send(text_data=json.dumps(orderbook_data))
        except Exception as e:
            print(f"[WS SEND ORDERBOOK ERROR] {e}")

    async def send_initial_orderbook(self):
        """Send initial orderbook snapshot when clientApi connects"""
        try:
            # Import here to avoid circular imports at module level
            from .models import Events
            from .orderbooks import Orderbooks
            
            # Get the event (async)
            event = await sync_to_async(Events.objects.get)(id=self.event_id)
            
            # Create orderbooks instance and get current orderbook (async)
            orderbooks = Orderbooks()
            await sync_to_async(orderbooks.broadcast_full_orderbook)(event)
            
            print(f"[WS INITIAL] Sent initial orderbook for event {self.event_id}")
        except Exception as e:
            print(f"[WS INITIAL ERROR] {e}")
