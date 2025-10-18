import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class OrderbookConsumer(AsyncWebsocketConsumer):


    # websocket consumer for the orderbook updates
    # handles connections to specific event orderbooks and broadcasts
    # these snapshots anytime an order is placed


    async def connect(self):
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.group_name = f'orderbook_{self.event_id}'
        
        # Verify the event exists
        event_exists = await self.event_exists(self.event_id)
        if not event_exists:
            await self.close()
            return
        
        # Join the group for this event's orderbook
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial orderbook snapshot
        await self.send_initial_orderbook()
    
    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            

            # ping-pong messages to maintain connection
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))

            else:
                # Echo back unknown message types for debugging
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
    
    async def send_orderbook_snapshot(self, event):

        orderbook_data = event['orderbook']
        
        # Add connection metadata
        orderbook_data['connection_info'] = {
            'event_id': self.event_id,
            'group_name': self.group_name
        }
        
        await self.send(text_data=json.dumps(orderbook_data))
    
    async def send_initial_orderbook(self):

        try:
            # Import here to avoid circular imports
            from .orderbooks import Orderbooks
            
            # Get the current orderbook state
            orderbooks = Orderbooks()
            event = await self.get_event(self.event_id)
            
            if event:
                # Trigger a broadcast to get current state
                orderbooks.broadcast_full_orderbook(event)
                # The broadcast will trigger send_orderbook_snapshot
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Event {self.event_id} not found'
                }))
                
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to load initial orderbook: {str(e)}'
            }))
    
    @database_sync_to_async
    def event_exists(self, event_id):
        try:
            from .models import Events
            return Events.objects.filter(id=event_id, open=True).exists()
        except Exception:
            return False
    
    @database_sync_to_async
    def get_event(self, event_id):
        try:
            from .models import Events
            return Events.objects.get(id=event_id, open=True)
        except Exception:
            return None
