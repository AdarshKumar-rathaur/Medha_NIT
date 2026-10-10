"""
Priya's Tuesday Demo & Walkthrough:
Simulating the exact scenario from the problem statement:
- Priya: 26, Koramangala, 20-min lunch break, ₹400 wallet, 33°C sunny, dosa fatigue (3 visits).
- Little Fern Café: 140m away (2 min walk), empty seats (18% occupancy), weekday 1-3 PM rule, max 20% discount.
- Compares discount depths, predicts P(accept) using ML, and identifies the profit-maximizing offer.
"""

import sys
import json
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import pandas as pd
import numpy as np

repo_root = Path(__file__).resolve().parent
sys.path.insert(0, str(repo_root))

from decision_engine.data_loader import DataLoader
from decision_engine.features import FeatureExtractor, haversine_distance_m, walk_time_minutes
from decision_engine.model import OfferResponsePredictor
from decision_engine.optimizer import ProfitOptimizer


def run_priya_demo():
    print("=" * 80)
    print("PRIYA'S TUESDAY: MACHINE LEARNING & PROFIT OPTIMIZATION DEMO")
    print("=" * 80)
    print("Scenario: Tuesday, 1:15 PM | Koramangala, Bangalore | 33°C Sunny")
    print("User: Priya (Age 26, ₹400 UPI wallet, 20 min break, 3 previous restaurant visits)")
    print("Merchant: Little Fern Café (140m away, 18% occupancy, rule: fill seats 1–3 PM weekdays)")
    print("=" * 80)

    # 1. Load Data
    loader = DataLoader(base_dir=repo_root)
    customer = loader.get_customer("c_001")
    merchant = loader.get_merchant("m_001")
    items = loader.get_catalog_items("m_001")
    best_item = items[0] if items else {
        "id": "i_001_1",
        "title": "Iced coffee & lunch bowl",
        "price_inr": 150.0,
        "prep_minutes": 8,
        "is_veg": True
    }

    # 2. Load trained ML Model
    model_path = repo_root / "models" / "xgboost_decision_model.joblib"
    if not model_path.exists():
        print("Trained model not found at models/xgboost_decision_model.joblib.")
        print("Running quick training first...")
        from run_ml_pipeline import main as run_pipeline
        run_pipeline()

    predictor = OfferResponsePredictor.load(str(model_path))
    optimizer = ProfitOptimizer(data_loader=loader, predictor=predictor)

    # Context setup
    context = {
        "timestamp": "2026-05-19T13:15:00+05:30",
        "lat": 12.9353,
        "lng": 77.62377,
        "minutes_available": 20.0,
        "wallet_override": 400.0,
        "temp_c": 33.0,
        "condition": "sunny",
        "rain_mm": 0.0,
        "intent": "quick lunch",
        "festival_boost_pct": 0.0
    }

    # Distance calculation
    dist_m = haversine_distance_m(context["lat"], context["lng"], float(merchant["lat"]), float(merchant["lng"]))
    walk_mins = walk_time_minutes(dist_m)
    print(f"\n[Geospatial Signal]")
    print(f"  Physical Distance: {dist_m:.1f} meters")
    print(f"  Estimated Walking Time: {walk_mins:.1f} minutes ({int(round(walk_mins))} min walk)")

    # Test candidate discounts
    discounts = [0.0, 5.0, 10.0, 15.0, 20.0]
    results = []

    price = float(best_item["price_inr"])
    # Merchant unit cost scaled or from merchant profile
    unit_cost = float(merchant.get("unit_cost_inr", 79.0))
    # For a 150 INR item, proportion base cost if needed or use item cost:
    item_cost = round(price * (unit_cost / float(merchant.get("base_price_inr", 367.0))), 2)
    # Ensure min margin guard is respected
    if item_cost > price * 0.5:
        item_cost = round(price * 0.45, 2)

    print(f"\n[Unit Economics for '{best_item['title']}']")
    print(f"  Base Catalog Price: ₹{price:.2f}")
    print(f"  Merchant Unit Cost:  ₹{item_cost:.2f}")
    print(f"  Merchant Max Discount Cap: {merchant['max_discount_pct']:.0f}%")
    print(f"  Merchant Min Margin Floor: {merchant['min_margin_pct']:.0f}%")

    print("\n[ML Response Simulation & Profit Curve Across Discount Depths]")
    print("-" * 90)
    print(f"{'Discount %':<12}{'Disc Amt (₹)':<14}{'Final Price':<14}{'Margin (₹)':<12}{'P(Accept)':<14}{'E[Profit] (₹)':<16}{'Note'}")
    print("-" * 90)

    best_d = 0.0
    max_exp_profit = -1.0
    best_row = None

    for d in discounts:
        disc_amt = price * (d / 100.0)
        final_p = price - disc_amt
        margin = final_p - item_cost
        margin_pct = (margin / item_cost) * 100.0

        # Feature vector for ML model
        feats = FeatureExtractor.extract_features(
            customer=customer,
            merchant=merchant,
            context=context,
            offer_discount_pct=d,
            item=best_item
        )

        p_accept = predictor.predict_proba(feats)
        exp_profit = p_accept * margin

        is_best = False
        if exp_profit > max_exp_profit:
            max_exp_profit = exp_profit
            best_d = d
            best_row = (d, disc_amt, final_p, margin, p_accept, exp_profit)
            is_best = True

        note = "★ OPTIMAL" if is_best else ""
        print(f"{d:8.1f}%    ₹{disc_amt:8.2f}      ₹{final_p:8.2f}      ₹{margin:8.2f}    {p_accept:8.2%}      ₹{exp_profit:8.2f}        {note}")

    print("-" * 90)

    # Comparison summary
    zero_disc = [r for r in results if r[0] == 0.0]
    p_0 = predictor.predict_proba(FeatureExtractor.extract_features(customer, merchant, context, 0.0, best_item))
    profit_0 = p_0 * (price - item_cost)

    p_max = predictor.predict_proba(FeatureExtractor.extract_features(customer, merchant, context, 20.0, best_item))
    profit_max = p_max * (price * 0.8 - item_cost)

    print("\n[Policy Comparison]")
    print(f"  1. Zero Discount Policy:     P(Accept) = {p_0:5.2%}, Margin = ₹{price - item_cost:.2f} -> E[Profit] = ₹{profit_0:.2f}")
    print(f"  2. Naive Max Discount (20%): P(Accept) = {p_max:5.2%}, Margin = ₹{price*0.8 - item_cost:.2f} -> E[Profit] = ₹{profit_max:.2f}")
    print(f"  3. ML Profit Optimizer ({best_d:.0f}%):  P(Accept) = {best_row[4]:5.2%}, Margin = ₹{best_row[3]:.2f} -> E[Profit] = ₹{best_row[5]:.2f}")
    
    profit_gain = ((best_row[5] - profit_0) / max(profit_0, 0.01)) * 100
    print(f"\n  >> Optimization Benefit: +{profit_gain:.1f}% expected merchant profit over zero discount!")

    # Full Decision Run with Optimizer
    priya_scenario = {
        "id": "cur_001",
        "customer_id": "c_001",
        "merchant_id": "m_001",
        "timestamp": "2026-05-19T13:15:00+05:30",
        "lat": 12.9353,
        "lng": 77.62377,
        "temp_c": 33.0,
        "condition": "sunny",
        "rain_mm": 0.0,
        "minutes_available": 20,
        "intent": "quick lunch",
        "wallet_override": 400.0
    }

    full_decision = optimizer.decide_scenario(priya_scenario)

    print("\n[Final Decision Output Payload (JSON)]")
    print(json.dumps(full_decision, indent=2, ensure_ascii=False))

    print("\n[Generated Notification Card]")
    notif = full_decision["notification"]
    print(f"  Title: {notif['title']}")
    print(f"  Body:  {notif['body']}")
    print(f"  CTA:   {notif['cta']}")
    print(f"  Lang:  {notif['language']}")
    print("=" * 80)


if __name__ == "__main__":
    run_priya_demo()
