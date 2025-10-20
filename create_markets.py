#!/usr/bin/env python3
"""
Market Creator Script for Manning Markets (Polymarket Clone)

This script provides an easy interface for creating markets and events.
Usage: python create_markets.py

Example:
    Market Name: NBA Championships
    Add event: Celtics to win the NBA championship
    Add event: Nuggets to win the NBA championship
    ...
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
import re

# Add the Django project directory to the Python path
# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoProject.settings')
django.setup()

# Now we can import Django models
from djangoProject.models import Markets, Events


def parse_date_input(date_str):
    """
    Parse DD-MM-YYYY date format and return timezone-aware datetime
    """
    if not date_str.strip():
        return None
    
    date_str = date_str.strip()
    
    try:
        naive_datetime = datetime.strptime(date_str, '%d-%m-%Y')
        return timezone.make_aware(naive_datetime)
    except ValueError:
        raise ValueError(f"Invalid date format. Use DD-MM-YYYY (e.g., 04-06-2026)")


class MarketCreator:
    """Easy interface for creating markets and events"""
    
    def __init__(self):
        self.current_market = None
        self.events = []
    
    def create_market(self, market_name, initial_volume=0):
        """Create a new market"""
        try:
            if Markets.objects.filter(market_name=market_name).exists():
                print(f"ERROR: Market '{market_name}' already exists!")
                return False
            
            market = Markets.objects.create(
                market_name=market_name,
                open=True,
                volume=initial_volume
            )
            
            self.current_market = market
            self.events = []
            print(f"Created market: '{market_name}' (ID: {market.id})")
            return True
            
        except Exception as e:
            print(f"ERROR creating market: {e}")
            return False
    
    def add_event(self, event_name, initial_price=0.50, initial_volume=0, expiration_date=None):
        """Add an event to the current market"""
        if not self.current_market:
            print("ERROR: No current market. Create a market first!")
            return False
        
        try:
            event = Events.objects.create(
                market=self.current_market,
                event_name=event_name,
                price=Decimal(str(initial_price)),
                volume=initial_volume,
                open=True,
                expiration_date=expiration_date
            )
            
            self.events.append(event)
            expiration_info = f" (Expires: {expiration_date.strftime('%Y-%m-%d')})" if expiration_date else ""
            print(f"  Added event: '{event_name}' (Price: ${initial_price}, ID: {event.id}){expiration_info}")
            return True
            
        except Exception as e:
            print(f"ERROR adding event: {e}")
            return False
    
    def finish_market(self):
        """Finish creating the current market and show summary"""
        if not self.current_market:
            print("ERROR: No current market to finish!")
            return
        
        print(f"\nMarket '{self.current_market.market_name}' created successfully!")
        print(f"   Market ID: {self.current_market.id}")
        print(f"   Events created: {len(self.events)}")
        
        for i, event in enumerate(self.events, 1):
            print(f"   {i}. {event.event_name} (Price: ${event.price})")
        
        self.current_market = None
        self.events = []
        print()
    
    def create_market_with_events(self, market_name, events_data, initial_volume=0):
        """
        Create a market with multiple events in one go
        
        Args:
            market_name (str): Name of the market
            events_data (list): List of dicts with event info
                Example: [
                    {"name": "Celtics to win", "price": 0.35, "expiration": "04-06-2026"},
                    {"name": "Nuggets to win", "price": 0.25}
                ]
            initial_volume (int): Initial market volume
        """
        if not self.create_market(market_name, initial_volume):
            return False
        
        for event_data in events_data:
            event_name = event_data.get("name", "")
            price = event_data.get("price", 0.50)
            volume = event_data.get("volume", 0)
            expiration = event_data.get("expiration")
            
            expiration_date = None
            if expiration:
                try:
                    expiration_date = parse_date_input(expiration)
                except ValueError as e:
                    print(f"  ERROR: Invalid expiration date '{expiration}': {e}")
                    print("  Creating event without expiration date")
            
            self.add_event(event_name, price, volume, expiration_date)
        
        self.finish_market()
        return True


def interactive_mode():
    """Interactive command-line interface for creating markets"""
    creator = MarketCreator()
    
    print("Manning Markets - Market Creator")
    print("=" * 50)
    print("Create prediction markets easily!")
    print("Type 'quit' to exit\n")
    
    while True:
        try:
            market_name = input("Market Name (or 'quit' to exit): ").strip()
            
            if market_name.lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break
            
            if not market_name:
                print("ERROR: Market name cannot be empty!")
                continue
            
            if not creator.create_market(market_name):
                continue
            
            print(f"\nAdding events to '{market_name}':")
            print("(Press Enter with empty event name to finish)")
            
            while True:
                event_name = input("  Event name: ").strip()
                
                if not event_name:
                    break
                
                try:
                    price_input = input("  Initial price (default 0.50): ").strip()
                    initial_price = float(price_input) if price_input else 0.50
                    
                    volume_input = input("  Initial volume (default 0): ").strip()
                    initial_volume = int(volume_input) if volume_input else 0
                    
                    exp_input = input("  Expiration date (optional, format: DD-MM-YYYY, e.g., 04-06-2026): ").strip()
                    expiration_date = None
                    if exp_input:
                        try:
                            expiration_date = parse_date_input(exp_input)
                        except ValueError as e:
                            print(f"  ERROR: Invalid date format: {e}")
                            print("  Using no expiration date")
                    
                except ValueError:
                    print("  ERROR: Invalid input, using defaults")
                    initial_price = 0.50
                    initial_volume = 0
                    expiration_date = None
                
                creator.add_event(event_name, initial_price, initial_volume, expiration_date)
            
            creator.finish_market()
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"ERROR: Unexpected error: {e}")


def show_help():
    """Show help information"""
    print("""
Manning Markets - Market Creator Help

COMMANDS:
  python create_markets.py           - Interactive mode
  python create_markets.py examples - Create example markets
  python create_markets.py help     - Show this help

INTERACTIVE MODE:
  1. Enter a market name
  2. Add events one by one
  3. Press Enter with empty event name to finish
  4. Market is automatically saved to database

EXAMPLE USAGE:
  Market Name: NBA Championships
  Add event: Celtics to win the NBA championship
  Add event: Nuggets to win the NBA championship
  Add event: Lakers to win the NBA championship

FEATURES:
  - Automatic market ID generation
  - Default price of $0.50 for events
  - Expiration date format: DD-MM-YYYY (e.g., 04-06-2026)
  - Volume tracking
  - Duplicate market prevention
  - Timezone-aware date handling

ID ASSIGNMENT:
  - Market IDs are auto-incrementing: 1, 2, 3, ...
  - Event IDs are auto-incrementing across ALL events: 1, 2, 3, 4, ...
  - If you create Market 1 with 2 events (Event IDs 1, 2)
  - Then create Market 2 with 2 events (Event IDs 3, 4)
""")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "help":
            show_help()
        else:
            print(f"ERROR: Unknown command: {command}")
            print("Use 'python create_markets.py help' for available commands")
    else:
        interactive_mode()