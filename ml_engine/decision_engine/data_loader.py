"""
Data Ingestion and Unified Data Structures for Decisioned Offer System.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


class DataLoader:
    def __init__(self, base_dir: Optional[str] = None):
        if base_dir is None:
            # Look relative to current file or dataset root
            self.base_dir = Path(__file__).resolve().parent.parent
        else:
            self.base_dir = Path(base_dir)

        self.data_dir = self.base_dir / "data"
        self.eval_dir = self.base_dir / "eval"

        # Raw DataFrames
        self.customers_df: pd.DataFrame = pd.DataFrame()
        self.merchants_df: pd.DataFrame = pd.DataFrame()
        self.catalog_items_df: pd.DataFrame = pd.DataFrame()
        self.weather_hourly_df: pd.DataFrame = pd.DataFrame()
        self.festivals_df: pd.DataFrame = pd.DataFrame()
        self.scenarios_public_df: pd.DataFrame = pd.DataFrame()
        self.scenarios_holdout_blind_df: pd.DataFrame = pd.DataFrame()
        self.static_offers_df: pd.DataFrame = pd.DataFrame()

        # Indexed caches
        self.customers_by_id: Dict[str, Dict[str, Any]] = {}
        self.merchants_by_id: Dict[str, Dict[str, Any]] = {}
        self.catalog_by_merchant: Dict[str, List[Dict[str, Any]]] = {}
        self.static_offers_by_merchant: Dict[str, List[Dict[str, Any]]] = {}

        self.load_all()

    def load_all(self):
        """Load and parse all dataset CSVs."""
        # 1. Customers
        cust_path = self.data_dir / "customers.csv"
        if cust_path.exists():
            self.customers_df = pd.read_csv(cust_path)
            # Ensure proper typing
            self.customers_df["wallet_inr"] = self.customers_df["wallet_inr"].astype(float)
            self.customers_df["marketing_consent"] = self.customers_df["marketing_consent"].astype(bool)
            self.customers_df["churn_risk"] = self.customers_df["churn_risk"].astype(float)
            self.customers_df["price_sensitivity"] = self.customers_df["price_sensitivity"].astype(float)
            self.customers_df["avg_spend"] = self.customers_df["avg_spend"].fillna(250.0).astype(float)
            for _, row in self.customers_df.iterrows():
                self.customers_by_id[str(row["id"])] = row.to_dict()

        # 2. Merchants
        merch_path = self.data_dir / "merchants.csv"
        if merch_path.exists():
            self.merchants_df = pd.read_csv(merch_path)
            self.merchants_df["max_discount_pct"] = self.merchants_df["max_discount_pct"].astype(float)
            self.merchants_df["min_margin_pct"] = self.merchants_df["min_margin_pct"].astype(float)
            self.merchants_df["base_price_inr"] = self.merchants_df["base_price_inr"].astype(float)
            self.merchants_df["unit_cost_inr"] = self.merchants_df["unit_cost_inr"].astype(float)
            self.merchants_df["occupancy_pct"] = self.merchants_df["occupancy_pct"].astype(float)
            self.merchants_df["capacity"] = self.merchants_df["capacity"].astype(int)
            for _, row in self.merchants_df.iterrows():
                self.merchants_by_id[str(row["id"])] = row.to_dict()

        # 3. Catalog Items
        cat_path = self.data_dir / "catalog_items.csv"
        if cat_path.exists():
            self.catalog_items_df = pd.read_csv(cat_path)
            self.catalog_items_df["price_inr"] = self.catalog_items_df["price_inr"].astype(float)
            self.catalog_items_df["stock_units"] = self.catalog_items_df["stock_units"].astype(int)
            self.catalog_items_df["prep_minutes"] = self.catalog_items_df["prep_minutes"].astype(int)
            self.catalog_items_df["is_veg"] = self.catalog_items_df["is_veg"].astype(bool)
            for _, row in self.catalog_items_df.iterrows():
                mid = str(row["merchant_id"])
                if mid not in self.catalog_by_merchant:
                    self.catalog_by_merchant[mid] = []
                self.catalog_by_merchant[mid].append(row.to_dict())

        # 4. Static Offers
        off_path = self.data_dir / "static_offers.csv"
        if off_path.exists():
            self.static_offers_df = pd.read_csv(off_path)
            for _, row in self.static_offers_df.iterrows():
                mid = str(row["merchant_id"])
                if mid not in self.static_offers_by_merchant:
                    self.static_offers_by_merchant[mid] = []
                self.static_offers_by_merchant[mid].append(row.to_dict())

        # 5. Weather Hourly
        weather_path = self.data_dir / "weather_hourly.csv"
        if weather_path.exists():
            self.weather_hourly_df = pd.read_csv(weather_path)
            self.weather_hourly_df["datetime"] = pd.to_datetime(self.weather_hourly_df["timestamp"])
            self.weather_hourly_df["temp_c"] = self.weather_hourly_df["temp_c"].astype(float)
            self.weather_hourly_df["rain_mm"] = self.weather_hourly_df["rain_mm"].astype(float)

        # 6. Festivals
        fest_path = self.data_dir / "festivals.csv"
        if fest_path.exists():
            self.festivals_df = pd.read_csv(fest_path)
            self.festivals_df["start_date"] = pd.to_datetime(self.festivals_df["start_date"]).dt.date
            self.festivals_df["end_date"] = pd.to_datetime(self.festivals_df["end_date"]).dt.date

        # 7. Scenarios
        sc_pub_path = self.data_dir / "scenarios_public.csv"
        if sc_pub_path.exists():
            self.scenarios_public_df = pd.read_csv(sc_pub_path)

        sc_blind_path = self.eval_dir / "scenarios_holdout_blind.csv"
        if sc_blind_path.exists():
            self.scenarios_holdout_blind_df = pd.read_csv(sc_blind_path)

    def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        return self.customers_by_id.get(customer_id)

    def get_merchant(self, merchant_id: str) -> Optional[Dict[str, Any]]:
        return self.merchants_by_id.get(merchant_id)

    def get_catalog_items(self, merchant_id: str) -> List[Dict[str, Any]]:
        return self.catalog_by_merchant.get(merchant_id, [])

    def get_weather_for_timestamp(self, ts: str, default_temp: float = 30.0) -> Dict[str, Any]:
        """Find the closest hourly weather row for the given ISO timestamp."""
        try:
            target_dt = pd.to_datetime(ts)
            if self.weather_hourly_df.empty:
                return {
                    "temp_c": default_temp,
                    "condition": "sunny",
                    "rain_mm": 0.0,
                    "humidity_pct": 50,
                    "wind_kmh": 10
                }
            # Time difference calculation (matching tz if needed)
            if target_dt.tzinfo is not None:
                # remove tz for naive subtraction if weather is naive or ensure alignment
                weather_dt = self.weather_hourly_df["datetime"]
                if weather_dt.iloc[0].tzinfo is None:
                    target_dt_cmp = target_dt.tz_localize(None)
                else:
                    target_dt_cmp = target_dt
            else:
                target_dt_cmp = target_dt

            time_diffs = (self.weather_hourly_df["datetime"] - target_dt_cmp).abs()
            nearest_idx = time_diffs.idxmin()
            row = self.weather_hourly_df.loc[nearest_idx]
            return {
                "temp_c": float(row["temp_c"]),
                "condition": str(row["condition"]),
                "rain_mm": float(row["rain_mm"]),
                "humidity_pct": int(row.get("humidity_pct", 50)),
                "wind_kmh": int(row.get("wind_kmh", 10))
            }
        except Exception:
            return {
                "temp_c": default_temp,
                "condition": "sunny",
                "rain_mm": 0.0,
                "humidity_pct": 50,
                "wind_kmh": 10
            }

    def get_active_festivals(self, ts: str) -> List[Dict[str, Any]]:
        """Check if date falls within any active festival."""
        try:
            target_date = pd.to_datetime(ts).date()
            active = []
            for _, row in self.festivals_df.iterrows():
                if row["start_date"] <= target_date <= row["end_date"]:
                    active.append({
                        "id": row["id"],
                        "name": row["name"],
                        "event_tag": row["event_tag"],
                        "categories": [c.strip() for c in str(row["categories"]).split(",")],
                        "boost_pct": float(row["boost_pct"])
                    })
            return active
        except Exception:
            return []
