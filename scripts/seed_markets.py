import os
import django
from typing import List, TypedDict
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djangoProject.settings")
django.setup()

from .models import Markets, Events, Orders, Trades, Positions


class EventData(TypedDict):
    market_name: str
    event_name: str
    price: Decimal
    volume: int
    days_to_expiry: int


def clear_existing_data() -> None:
    """
    Removes existing records to ensure a clean slate.
    Protected dependencies are cleared first to prevent deletion errors.
    """
    Trades.objects.all().delete()
    Orders.objects.all().delete()
    Positions.objects.all().delete()
    Events.objects.all().delete()
    Markets.objects.all().delete()


def get_seed_data() -> List[EventData]:
    """
    Provides a catalogue of USYD and technology-themed prediction markets.
    """
    return [
        {"market_name": "USYD QS Ranking 2027", "event_name": "USYD to rank Top 15 globally", "price": Decimal("0.65"),
         "volume": 1500, "days_to_expiry": 365},
        {"market_name": "USYD Infrastructure", "event_name": "New Computer Science building finished by 2027",
         "price": Decimal("0.40"), "volume": 800, "days_to_expiry": 600},
        {"market_name": "USYD Student Politics", "event_name": "SRC election turnout exceeds 20% in 2026",
         "price": Decimal("0.15"), "volume": 300, "days_to_expiry": 180},
        {"market_name": "USYD Software Systems", "event_name": "USYD switches primary LMS from Canvas by 2028",
         "price": Decimal("0.10"), "volume": 120, "days_to_expiry": 900},
        {"market_name": "Atlassian Acquisitions", "event_name": "Atlassian acquires a new AI startup in 2026",
         "price": Decimal("0.55"), "volume": 4500, "days_to_expiry": 250},
        {"market_name": "Canva IPO", "event_name": "Canva IPOs on NASDAQ before 2027", "price": Decimal("0.80"),
         "volume": 12500, "days_to_expiry": 260},
        {"market_name": "OpenAI Releases", "event_name": "GPT-5 officially announced before July 2026",
         "price": Decimal("0.75"), "volume": 25000, "days_to_expiry": 80},
        {"market_name": "Autonomous Vehicles AU", "event_name": "Waymo launches commercial rides in Sydney by 2027",
         "price": Decimal("0.25"), "volume": 3200, "days_to_expiry": 700},
        {"market_name": "Bitcoin Price Action", "event_name": "Bitcoin surpasses $150k AUD before 2027",
         "price": Decimal("0.60"), "volume": 89000, "days_to_expiry": 260},
        {"market_name": "Apple Hardware", "event_name": "Apple releases a folding iPhone in 2026",
         "price": Decimal("0.30"), "volume": 11000, "days_to_expiry": 300},
        {"market_name": "AGI Timelines", "event_name": "AGI achieved according to Metaculus by 2028",
         "price": Decimal("0.45"), "volume": 18000, "days_to_expiry": 1000},
        {"market_name": "Australian Tech Sector",
         "event_name": "Tech Council of Australia reports 1M tech jobs by 2027", "price": Decimal("0.70"),
         "volume": 2100, "days_to_expiry": 400},
    ]


def seed_database(market_data: List[EventData]) -> None:
    """
    Populates the database with new market and event entities.
    """
    for data in market_data:
        market: Markets = Markets.objects.create(
            market_name=data["market_name"],
            open=True,
            volume=data["volume"]
        )

        expiration: datetime = timezone.now() + timedelta(days=data["days_to_expiry"])

        Events.objects.create(
            market=market,
            event_name=data["event_name"],
            expiration_date=expiration,
            open=True,
            price=data["price"],
            volume=data["volume"]
        )


def main() -> None:
    """
    Coordinates the database reset and seeding workflow.
    """
    clear_existing_data()
    seed_data: List[EventData] = get_seed_data()
    seed_database(seed_data)
    print("Successfully seeded 12 markets and events.")


if __name__ == "__main__":
    main()