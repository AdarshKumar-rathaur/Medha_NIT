"""
Data Collector: Runs an exploratory interaction phase with the Hidden User Response Simulator
to collect training data for the predictive decision engine.
"""

import random
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from tqdm import tqdm

from .data_loader import DataLoader
from .features import FeatureExtractor, haversine_distance_m
from .simulator import HiddenUserResponseSimulator


class DataCollector:
    """
    Executes an exploratory data collection campaign (epsilon-greedy / randomized policy)
    across candidate customers, merchants, weather conditions, and discount depths.
    """

    def __init__(self, data_loader: DataLoader, random_seed: int = 42):
        self.data_loader = data_loader
        self.simulator = HiddenUserResponseSimulator(random_seed=random_seed)
        self.rng = random.Random(random_seed)

    def generate_training_data(
        self,
        num_episodes: int = 8000,
        epsilon: float = 0.25,
        output_csv: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Runs the exploratory data generation loop.
        
        Args:
            num_episodes: Number of offer interactions to simulate.
            epsilon: Probability of taking a purely random exploratory action vs heuristic action.
            output_csv: Optional path to save CSV.
            
        Returns:
            DataFrame containing feature vectors and logged Accept/Decline outcomes.
        """
        customers = list(self.data_loader.customers_by_id.values())
        merchants = list(self.data_loader.merchants_by_id.values())
        weather_df = self.data_loader.weather_hourly_df

        if not customers or not merchants:
            raise ValueError("Customers or merchants data is empty!")

        discount_options = [0.0, 5.0, 10.0, 15.0, 20.0, 25.0]
        records = []

        print(f"Starting exploratory data collection ({num_episodes} interactions, epsilon={epsilon})...")

        for i in range(num_episodes):
            customer = self.rng.choice(customers)

            # Pick a realistic timestamp and weather
            if not weather_df.empty:
                w_row = weather_df.sample(n=1, random_state=self.rng.randint(0, 100000)).iloc[0]
                ts = str(w_row["timestamp"])
                temp_c = float(w_row["temp_c"])
                condition = str(w_row["condition"])
                rain_mm = float(w_row["rain_mm"])
            else:
                ts = "2026-05-19T13:15:00+05:30"
                temp_c = 31.0
                condition = "sunny"
                rain_mm = 0.0

            # Available break duration (random realistic between 15 and 60 mins)
            minutes_available = self.rng.choice([15.0, 20.0, 25.0, 30.0, 40.0, 45.0, 60.0])
            
            # Simulated customer intent
            dt = pd.to_datetime(ts)
            hour = dt.hour
            if 12 <= hour <= 14:
                intent = self.rng.choice(["quick lunch", "weekday lunch", "lunch break", "cold drink and short break"])
            elif 15 <= hour <= 17:
                intent = self.rng.choice(["afternoon coffee", "quick snack", "pastry break", "OTC essentials"])
            elif 18 <= hour <= 21:
                intent = self.rng.choice(["dinner", "match night snack", "haircut after work", "grocery pickup"])
            else:
                intent = "local discovery"

            context = {
                "timestamp": ts,
                "lat": customer.get("current_lat", customer.get("home_lat", 12.97)),
                "lng": customer.get("current_lng", customer.get("home_lng", 77.59)),
                "temp_c": temp_c,
                "condition": condition,
                "rain_mm": rain_mm,
                "minutes_available": minutes_available,
                "intent": intent,
                "wallet_override": None,
            }

            # Merchant Selection (Epsilon-greedy)
            # With prob (1 - epsilon), pick among nearby merchants within 2.5km
            # With prob epsilon, pick purely at random (pure exploration)
            if self.rng.random() > epsilon:
                # Filter merchants within walkable/short commute radius
                c_lat, c_lng = context["lat"], context["lng"]
                nearby = []
                for m in merchants:
                    d = haversine_distance_m(c_lat, c_lng, float(m["lat"]), float(m["lng"]))
                    if d <= 2500.0:
                        nearby.append((m, d))
                if nearby:
                    # Sort or pick from nearby
                    nearby.sort(key=lambda x: x[1])
                    # Pick from top 10 nearest
                    top_k = nearby[:min(10, len(nearby))]
                    merchant = self.rng.choice(top_k)[0]
                else:
                    merchant = self.rng.choice(merchants)
            else:
                merchant = self.rng.choice(merchants)

            # Catalog item (if available)
            items = self.data_loader.get_catalog_items(str(merchant["id"]))
            item = self.rng.choice(items) if items else None

            # Discount depth selection
            # Epsilon-greedy: vary discounts across valid range
            max_disc = float(merchant.get("max_discount_pct", 20.0))
            valid_discs = [d for d in discount_options if d <= max_disc + 5.0]
            if not valid_discs:
                valid_discs = [0.0]
            disc_pct = self.rng.choice(valid_discs)

            # Feature extraction
            feats = FeatureExtractor.extract_features(
                customer=customer,
                merchant=merchant,
                context=context,
                offer_discount_pct=disc_pct,
                item=item
            )

            # Pass to Simulator
            sim_result = self.simulator.evaluate_offer(feats, add_noise=True)

            # Build record
            row_record = dict(feats)
            row_record["customer_id"] = customer["id"]
            row_record["merchant_id"] = merchant["id"]
            row_record["item_id"] = item["id"] if item else "base"
            row_record["timestamp"] = ts
            row_record["target_accepted"] = sim_result["accepted"]
            row_record["true_prob"] = sim_result["true_prob"]
            row_record["utility"] = sim_result["utility"]
            row_record["sim_reason"] = sim_result["reason"]

            records.append(row_record)

        df = pd.DataFrame(records)

        # Print exploration statistics
        acc_rate = df["target_accepted"].mean() * 100.0
        print(f"\nExploration Complete! Generated {len(df)} interaction logs.")
        print(f"Overall Acceptance Rate: {acc_rate:.2f}%")
        print("\nAcceptance Rate by Discount Depth:")
        for d, grp in df.groupby("offer_discount_pct"):
            print(f"  Discount {d:4.1f}%: {grp['target_accepted'].mean()*100:5.2f}% ({len(grp)} samples)")

        print("\nAcceptance Rate by Walkable Distance:")
        d1 = df[df["distance_m"] <= 400]["target_accepted"].mean() * 100
        d2 = df[(df["distance_m"] > 400) & (df["distance_m"] <= 1000)]["target_accepted"].mean() * 100
        d3 = df[(df["distance_m"] > 1000) & (df["distance_m"] <= 2000)]["target_accepted"].mean() * 100
        d4 = df[df["distance_m"] > 2000]["target_accepted"].mean() * 100
        print(f"  <= 400m:     {d1:5.2f}%")
        print(f"  400m - 1km:  {d2:5.2f}%")
        print(f"  1km - 2km:   {d3:5.2f}%")
        print(f"  > 2km:       {d4:5.2f}%")

        if output_csv:
            df.to_csv(output_csv, index=False)
            print(f"Saved dataset to {output_csv}")

        return df
