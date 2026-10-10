"""
Geospatial, Behavioral, and Contextual Feature Engineering.
"""

import math
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def walk_time_minutes(distance_m: float, speed_m_per_min: float = 80.0) -> float:
    """Estimate walking time in minutes based on distance in meters (default 80 m/min ~ 4.8 km/h)."""
    return distance_m / speed_m_per_min


class FeatureExtractor:
    """
    Combines User Profiles, Merchant Catalog, Context (Weather & Time),
    and Offer parameters into a unified feature vector for ML modeling.
    """

    INVENTORY_MAP = {
        "low": 0.0,
        "healthy": 1.0,
        "surplus": 2.0,
    }

    @staticmethod
    def extract_features(
        customer: Dict[str, Any],
        merchant: Dict[str, Any],
        context: Dict[str, Any],
        offer_discount_pct: float,
        item: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Extracts a flat dictionary of engineered features.
        
        Args:
            customer: dict containing customer signals and location.
            merchant: dict containing merchant operational constraints.
            context: dict containing timestamp, weather (temp, rain), minutes_available, intent.
            offer_discount_pct: candidate discount percentage (e.g., 0, 5, 10, 15, 20).
            item: optional specific catalog item.
        """
        feats = {}

        # ---------------------------------------------------------
        # 1. Geospatial Features
        # ---------------------------------------------------------
        cust_lat = float(context.get("lat", customer.get("current_lat", customer.get("home_lat", 12.97))))
        cust_lng = float(context.get("lng", customer.get("current_lng", customer.get("home_lng", 77.59))))
        merch_lat = float(merchant.get("lat", 12.97))
        merch_lng = float(merchant.get("lng", 77.59))

        dist_m = haversine_distance_m(cust_lat, cust_lng, merch_lat, merch_lng)
        walk_mins = walk_time_minutes(dist_m)
        minutes_avail = float(context.get("minutes_available", 30.0))

        feats["distance_m"] = dist_m
        feats["distance_km"] = dist_m / 1000.0
        feats["walk_minutes"] = walk_mins
        feats["is_walkable_1km"] = 1.0 if dist_m <= 1000.0 else 0.0
        feats["is_walkable_500m"] = 1.0 if dist_m <= 500.0 else 0.0
        feats["distance_to_time_ratio"] = walk_mins / max(minutes_avail, 1.0)
        feats["is_same_locality"] = 1.0 if str(customer.get("locality", "")).lower() == str(merchant.get("locality", "")).lower() else 0.0

        # ---------------------------------------------------------
        # 2. Behavioral Features (User & Merchant)
        # ---------------------------------------------------------
        # User Spend & Economics
        wo = context.get("wallet_override")
        if pd.notna(wo) and wo is not None:
            wallet = float(wo)
        else:
            wallet = float(customer.get("wallet_inr", 500.0))
        avg_spend = float(customer.get("avg_spend", 250.0))
        price_sens = float(customer.get("price_sensitivity", 0.5))
        churn_risk = float(customer.get("churn_risk", 0.5))
        age = float(customer.get("age", 30.0))

        feats["user_wallet_inr"] = wallet
        feats["user_avg_spend"] = avg_spend
        feats["user_price_sensitivity"] = price_sens
        feats["user_churn_risk"] = churn_risk
        feats["user_age"] = age

        # User Affinity & Visit History
        cust_prefs = str(customer.get("declared_preferences", "")).lower()
        observed_signals = str(customer.get("observed_signals", "")).lower()
        context_intent = str(context.get("intent", "")).lower()
        merch_cat = str(merchant.get("category", "")).lower()
        merch_name = str(merchant.get("name", "")).lower()

        # Affinity scoring
        cat_match = 1.0 if merch_cat in cust_prefs else 0.0
        signal_match = 1.0 if merch_cat in observed_signals else 0.0
        intent_match = 1.0 if (merch_cat in context_intent or context_intent in merch_cat) else 0.0
        
        # Category fatigue / cold start discovery openness
        # e.g., If user has high restaurant visits and seeks discovery or lunch, cafe is a prime alternative
        has_fatigue = 1.0 if ("3 restaurant visits" in observed_signals or "open to nearby discovery" in observed_signals) else 0.0
        novelty_affinity = 0.8 if (has_fatigue and merch_cat in ["cafe", "bakery", "dessert"]) else 0.0

        feats["user_category_preference_match"] = cat_match
        feats["user_signal_match"] = signal_match
        feats["intent_category_match"] = intent_match
        feats["category_novelty_affinity"] = novelty_affinity
        feats["combined_affinity"] = max(cat_match * 1.0, signal_match * 0.7, intent_match * 0.8, novelty_affinity)

        # Merchant Inventory & Operational Signals
        occupancy = float(merchant.get("occupancy_pct", 50.0))
        capacity = float(merchant.get("capacity", 30.0))
        idle_seats = capacity * max(0.0, 1.0 - (occupancy / 100.0))
        inv_sig_str = str(merchant.get("inventory_signal", "healthy")).lower()
        inv_sig_code = FeatureExtractor.INVENTORY_MAP.get(inv_sig_str, 1.0)

        feats["merchant_occupancy_pct"] = occupancy
        feats["merchant_capacity"] = capacity
        feats["merchant_idle_seats"] = idle_seats
        feats["merchant_idle_ratio"] = max(0.0, 1.0 - (occupancy / 100.0))
        feats["merchant_inventory_signal"] = inv_sig_code
        feats["merchant_max_discount_pct"] = float(merchant.get("max_discount_pct", 20.0))
        feats["merchant_min_margin_pct"] = float(merchant.get("min_margin_pct", 15.0))

        # Item & Price Economics
        if item is not None:
            base_price = float(item.get("price_inr", merchant.get("base_price_inr", 200.0)))
            prep_minutes = float(item.get("prep_minutes", 10.0))
            is_veg = 1.0 if item.get("is_veg", True) else 0.0
            stock_units = float(item.get("stock_units", 10.0))
        else:
            base_price = float(merchant.get("base_price_inr", 200.0))
            prep_minutes = 10.0
            is_veg = 1.0
            stock_units = 15.0

        unit_cost = float(merchant.get("unit_cost_inr", base_price * 0.4))
        disc_pct = float(offer_discount_pct)
        disc_amount = base_price * (disc_pct / 100.0)
        effective_price = base_price - disc_amount
        post_discount_margin = effective_price - unit_cost
        post_discount_margin_pct = (post_discount_margin / max(unit_cost, 1.0)) * 100.0

        feats["item_base_price_inr"] = base_price
        feats["item_unit_cost_inr"] = unit_cost
        feats["item_prep_minutes"] = prep_minutes
        feats["item_is_veg"] = is_veg
        feats["item_stock_units"] = stock_units
        feats["offer_discount_pct"] = disc_pct
        feats["offer_discount_amount_inr"] = disc_amount
        feats["effective_price_inr"] = effective_price
        feats["post_discount_margin_inr"] = post_discount_margin
        feats["post_discount_margin_pct"] = post_discount_margin_pct

        # Affordability & Budget fit
        feats["wallet_affordability_ratio"] = effective_price / max(wallet, 1.0)
        feats["fits_user_wallet"] = 1.0 if effective_price <= wallet else 0.0
        feats["spend_to_avg_ratio"] = effective_price / max(avg_spend, 1.0)

        # ---------------------------------------------------------
        # 3. Contextual Features (Time & Weather)
        # ---------------------------------------------------------
        ts = context.get("timestamp", "2026-05-19T13:15:00+05:30")
        try:
            dt = pd.to_datetime(ts)
            hour = dt.hour + dt.minute / 60.0
            day_of_week = dt.dayofweek
            is_weekday = 1.0 if day_of_week < 5 else 0.0
        except Exception:
            hour = 13.25
            day_of_week = 1
            is_weekday = 1.0

        feats["hour_of_day"] = hour
        feats["day_of_week"] = float(day_of_week)
        feats["is_weekday"] = is_weekday
        feats["is_lunch_window"] = 1.0 if 12.0 <= hour <= 14.5 else 0.0
        feats["is_afternoon_slump"] = 1.0 if 13.0 <= hour <= 16.0 else 0.0
        feats["is_evening"] = 1.0 if 17.0 <= hour <= 21.0 else 0.0

        # Weather mapping
        temp_c = float(context.get("temp_c", 30.0))
        rain_mm = float(context.get("rain_mm", 0.0))
        condition = str(context.get("condition", "sunny")).lower()

        feats["temp_c"] = temp_c
        feats["rain_mm"] = rain_mm
        feats["is_hot"] = 1.0 if temp_c >= 30.0 else 0.0
        feats["is_rainy"] = 1.0 if (rain_mm > 0.0 or "rain" in condition) else 0.0

        # Weather-to-Category Affinity
        # Hot weather (>= 30°C) + Afternoon -> High affinity for cafe iced beverages & desserts
        weather_cat_affinity = 0.0
        if temp_c >= 30.0 and (12.0 <= hour <= 16.5) and merch_cat in ["cafe", "dessert"]:
            weather_cat_affinity = 1.5
        elif (rain_mm > 0.0 or "rain" in condition) and merch_cat in ["cafe", "bakery"]:
            weather_cat_affinity = 1.2
        elif (rain_mm > 0.0 or "rain" in condition) and merch_cat in ["gym", "salon"]:
            weather_cat_affinity = -0.5
        elif temp_c >= 32.0 and merch_cat in ["restaurant"]:
            weather_cat_affinity = 0.5

        # Festival boost
        festival_boost = float(context.get("festival_boost_pct", 0.0)) / 100.0

        feats["weather_category_affinity"] = weather_cat_affinity
        feats["festival_boost"] = festival_boost

        # Time stress & operational feasibility
        total_trip_minutes = (walk_mins * 2.0) + prep_minutes
        feats["total_trip_minutes"] = total_trip_minutes
        feats["time_budget_stress"] = total_trip_minutes / max(minutes_avail, 1.0)
        feats["fits_time_window"] = 1.0 if total_trip_minutes <= minutes_avail else 0.0

        # Merchant Open Hours & Promotional Window Fit
        open_h = float(merchant.get("open_hour", 8))
        close_h = float(merchant.get("close_hour", 22))
        is_open = 1.0 if open_h <= hour < close_h else 0.0
        feats["merchant_is_open"] = is_open

        # Promo rule alignment (e.g. Little Fern Café 1-3 PM weekdays)
        p_start = merchant.get("promo_start_hour")
        p_end = merchant.get("promo_end_hour")
        weekdays_only = bool(merchant.get("weekdays_only", False))
        
        in_promo_window = 1.0
        if pd.notna(p_start) and pd.notna(p_end):
            in_hour_range = (float(p_start) <= hour < float(p_end))
            if weekdays_only:
                in_promo_window = 1.0 if (in_hour_range and is_weekday == 1.0) else 0.0
            else:
                in_promo_window = 1.0 if in_hour_range else 0.0
        feats["in_merchant_promo_window"] = in_promo_window

        # Marketing consent
        consent = bool(customer.get("marketing_consent", True))
        feats["marketing_consent"] = 1.0 if consent else 0.0

        return feats

    @staticmethod
    def get_feature_names() -> list:
        """Returns the list of canonical feature keys used for ML models."""
        dummy_c = {"current_lat": 12.935, "current_lng": 77.624, "wallet_inr": 400, "avg_spend": 260}
        dummy_m = {"lat": 12.936, "lng": 77.625, "category": "cafe"}
        dummy_ctx = {"timestamp": "2026-05-19T13:15:00+05:30", "temp_c": 33.0, "condition": "sunny"}
        sample = FeatureExtractor.extract_features(dummy_c, dummy_m, dummy_ctx, 15.0)
        return list(sample.keys())
