from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def broadcast_orderbook_snapshot(event_id, orderbook):

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"orderbook_{event_id}",
        {
            "type": "send_orderbook_snapshot",
            "orderbook": orderbook,
        },
    )
