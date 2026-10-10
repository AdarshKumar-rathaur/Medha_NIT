"""
========================================================================================
DECISIONED OFFER SYSTEM: ML PIPELINE FEATURE TESTER & DECISION SIMULATOR
========================================================================================
Test your ML pipeline by entering custom feature values.

HOW TO USE:
  1. DIRECT EDIT: Edit the 'MANUAL_TEST_INPUT' dictionary below (lines 40-85) and run:
         python test_ml_pipeline.py

  2. JSON CONFIG FILE: Edit 'test_features_input.json' and run:
         python test_ml_pipeline.py --file test_features_input.json

  3. INTERACTIVE CLI MODE: Run the interactive terminal prompt:
         python test_ml_pipeline.py --interactive

  4. QUICK PRESETS: Test instant predefined scenarios:
         python test_ml_pipeline.py --preset priya
         python test_ml_pipeline.py --preset rain
         python test_ml_pipeline.py --preset budget
         python test_ml_pipeline.py --preset time_crunch

  5. INTERACTIVE WEB UI: Open in your browser with live sliders and visual charts:
         python test_ml_pipeline.py --web
========================================================================================
"""

import sys
import os
import json
import math
import argparse
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import pandas as pd
import numpy as np

# --------------------------------------------------------------------------------------
# ✏️ QUICK EDIT ZONE: ENTER YOUR CUSTOM FEATURE VALUES HERE
# Change any values below to test how the ML pipeline responds!
# --------------------------------------------------------------------------------------
MANUAL_TEST_INPUT = {
    # --- Context & Environment ---
    "temperature_celsius": 33.0,          # Ambient temperature (e.g., 33°C = hot)
    "weather_condition": "sunny",        # "sunny", "rainy", "cloudy", "hazy"
    "rain_mm": 0.0,                      # Rainfall in mm
    "minutes_available": 20.0,           # Customer's available break time (minutes)
    "time_of_day_hour": 13.25,           # 13.25 = 1:15 PM (13h + 15m/60)
    "is_weekday": True,                  # True (Mon-Fri) or False (Sat-Sun)
    "intent": "quick lunch",             # User intent string

    # --- Customer Behavioral Signals ---
    "user_wallet_inr": 400.0,            # Available funds in UPI/digital wallet (₹)
    "user_avg_spend": 260.0,             # Customer historical average spend (₹)
    "user_price_sensitivity": 0.65,      # 0.0 (unconscious) to 1.0 (highly discount-sensitive)
    "user_churn_risk": 0.20,             # 0.0 (loyal regular) to 1.0 (high churn risk)
    "user_age": 26.0,                    # Customer age
    "marketing_consent": True,           # Consent to receive promotional notifications

    # --- Merchant & Geospatial Signals ---
    "merchant_category": "cafe",         # "cafe", "restaurant", "bakery", "dessert"
    "distance_meters": 136.6,            # Physical distance from user to merchant (meters)
    "merchant_occupancy_pct": 18.0,      # Current seating occupancy (e.g. 18% = empty tables)
    "merchant_capacity": 30.0,           # Total table seating capacity
    "merchant_inventory_signal": "healthy", # "low", "healthy", "surplus"
    "merchant_max_discount_pct": 20.0,   # Merchant hard limit on discount cap (%)
    "merchant_min_margin_pct": 13.0,     # Merchant required minimum profit margin floor (%)
    "promo_window_active": True,         # Is the merchant's target promo window currently active?

    # --- Catalog Item & Unit Economics ---
    "item_title": "Cold brew coffee & artisanal lunch bowl",
    "item_base_price_inr": 150.0,        # Standard catalog list price (₹)
    "merchant_unit_cost_inr": 32.29,     # Merchant cost of goods / unit cost (₹)
    "item_prep_minutes": 8.0,            # Time required to prepare item (minutes)
    "item_is_veg": True,                 # True = vegetarian, False = non-veg

    # --- Proposed Promotional Offer ---
    "test_discount_pct": 10.0,           # Candidate discount to test (e.g. 0%, 5%, 10%, 15%, 20%)
}
# --------------------------------------------------------------------------------------


# Setup repository paths
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR
PARTICIPANT_DIR = REPO_ROOT / "decisioned_offer_dataset_v1_participant_copy"
if not (PARTICIPANT_DIR / "decision_engine").exists() and (REPO_ROOT / "decision_engine").exists():
    PARTICIPANT_DIR = REPO_ROOT

sys.path.insert(0, str(PARTICIPANT_DIR))

try:
    from decision_engine.data_loader import DataLoader
    from decision_engine.features import FeatureExtractor, haversine_distance_m, walk_time_minutes
    from decision_engine.model import OfferResponsePredictor
    from decision_engine.optimizer import ProfitOptimizer
except ImportError as e:
    # Fallback to local import if run from within participant dir
    sys.path.insert(0, str(SCRIPT_DIR.parent))
    from decision_engine.data_loader import DataLoader
    from decision_engine.features import FeatureExtractor, haversine_distance_m, walk_time_minutes
    from decision_engine.model import OfferResponsePredictor
    from decision_engine.optimizer import ProfitOptimizer


MODEL_PATH = PARTICIPANT_DIR / "models" / "xgboost_decision_model.joblib"


def get_predictor() -> OfferResponsePredictor:
    """Loads or trains the OfferResponsePredictor model."""
    if not MODEL_PATH.exists():
        print(f"[!] Model artifact not found at {MODEL_PATH}. Executing quick training...")
        from run_ml_pipeline import main as run_pipeline
        run_pipeline()
    return OfferResponsePredictor.load(str(MODEL_PATH))


def convert_manual_input_to_entities(inp: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], Dict[str, Any], float]:
    """Transforms intuitive feature values into canonical pipeline entities."""
    # Context
    hour = float(inp.get("time_of_day_hour", 13.25))
    h_int = int(hour)
    m_int = int((hour - h_int) * 60)
    ts_str = f"2026-05-19T{h_int:02d}:{m_int:02d}:00+05:30"

    context = {
        "timestamp": ts_str,
        "lat": 12.9353,
        "lng": 77.62377,
        "minutes_available": float(inp.get("minutes_available", 20.0)),
        "wallet_override": float(inp.get("user_wallet_inr", 400.0)),
        "temp_c": float(inp.get("temperature_celsius", 33.0)),
        "condition": str(inp.get("weather_condition", "sunny")),
        "rain_mm": float(inp.get("rain_mm", 0.0)),
        "intent": str(inp.get("intent", "quick lunch")),
        "festival_boost_pct": float(inp.get("festival_boost_pct", 0.0)),
    }

    # Customer
    customer = {
        "id": "test_user_01",
        "current_lat": 12.9353,
        "current_lng": 77.62377,
        "wallet_inr": float(inp.get("user_wallet_inr", 400.0)),
        "avg_spend": float(inp.get("user_avg_spend", 260.0)),
        "price_sensitivity": float(inp.get("user_price_sensitivity", 0.65)),
        "churn_risk": float(inp.get("user_churn_risk", 0.20)),
        "age": float(inp.get("user_age", 26.0)),
        "locality": "Koramangala",
        "declared_preferences": f"{inp.get('merchant_category', 'cafe')}, healthy bowls, continental",
        "observed_signals": "3 restaurant visits this week, open to nearby discovery",
        "marketing_consent": bool(inp.get("marketing_consent", True)),
    }

    # Distance calculation: adjust merchant lat/lng to match target distance_meters
    dist_m = float(inp.get("distance_meters", 136.6))
    # Roughly 1 degree lat ~ 111,000 meters
    delta_lat = dist_m / 111000.0
    merch_lat = 12.9353 + delta_lat
    merch_lng = 77.62377

    merchant = {
        "id": "test_merch_01",
        "name": "Little Fern Café",
        "category": str(inp.get("merchant_category", "cafe")),
        "lat": merch_lat,
        "lng": merch_lng,
        "locality": "Koramangala",
        "occupancy_pct": float(inp.get("merchant_occupancy_pct", 18.0)),
        "capacity": float(inp.get("merchant_capacity", 30.0)),
        "inventory_signal": str(inp.get("merchant_inventory_signal", "healthy")),
        "max_discount_pct": float(inp.get("merchant_max_discount_pct", 20.0)),
        "min_margin_pct": float(inp.get("merchant_min_margin_pct", 13.0)),
        "base_price_inr": float(inp.get("item_base_price_inr", 150.0)),
        "unit_cost_inr": float(inp.get("merchant_unit_cost_inr", 32.29)),
        "open_hour": 8.0,
        "close_hour": 22.0,
        "promo_start_hour": 13.0 if inp.get("promo_window_active", True) else 15.0,
        "promo_end_hour": 15.0 if inp.get("promo_window_active", True) else 16.0,
        "weekdays_only": True if inp.get("is_weekday", True) else False,
    }

    # Item
    item = {
        "id": "test_item_01",
        "title": str(inp.get("item_title", "Artisanal lunch bowl & cold brew")),
        "price_inr": float(inp.get("item_base_price_inr", 150.0)),
        "prep_minutes": float(inp.get("item_prep_minutes", 8.0)),
        "is_veg": bool(inp.get("item_is_veg", True)),
        "stock_units": 15.0,
    }

    discount_pct = float(inp.get("test_discount_pct", 10.0))
    return customer, merchant, context, item, discount_pct


def run_test(inp: Dict[str, Any], raw_override: Optional[Dict[str, Any]] = None, verbose: bool = True) -> Dict[str, Any]:
    """Runs end-to-end ML pipeline prediction and optimization on provided features."""
    customer, merchant, context, item, discount_pct = convert_manual_input_to_entities(inp)

    # 1. Feature Extraction
    features = FeatureExtractor.extract_features(
        customer=customer,
        merchant=merchant,
        context=context,
        offer_discount_pct=discount_pct,
        item=item
    )

    # Apply any explicit raw feature overrides
    if raw_override:
        for k, v in raw_override.items():
            if v is not None and k in features:
                features[k] = float(v)

    # 2. Model Prediction
    predictor = get_predictor()
    p_accept = predictor.predict_proba(features)

    # 3. Unit Economics & Profit Calculation
    price = float(features["item_base_price_inr"])
    cost = float(features["item_unit_cost_inr"])
    disc_amount = price * (discount_pct / 100.0)
    effective_price = price - disc_amount
    margin = effective_price - cost
    margin_pct = (margin / max(cost, 1.0)) * 100.0
    expected_profit = p_accept * margin

    # 4. Guardrail Validations
    min_margin_pct = float(merchant.get("min_margin_pct", 13.0))
    max_disc_pct = float(merchant.get("max_discount_pct", 20.0))
    walk_mins = float(features["walk_minutes"])
    prep_mins = float(features["item_prep_minutes"])
    total_trip_mins = (walk_mins * 2.0) + prep_mins
    minutes_avail = float(context["minutes_available"])

    guardrails = {
        "marketing_consent": bool(features["marketing_consent"] == 1.0),
        "merchant_open": bool(features["merchant_is_open"] == 1.0),
        "promo_window": bool(features["in_merchant_promo_window"] == 1.0),
        "wallet_budget": bool(effective_price <= float(features["user_wallet_inr"])),
        "time_feasibility": bool(total_trip_mins <= minutes_avail),
        "discount_cap_respected": bool(discount_pct <= max_disc_pct),
        "margin_floor_respected": bool(margin_pct >= min_margin_pct),
    }

    all_guardrails_passed = all(guardrails.values())

    # 5. Discount Curve Sweep (0% to 25%)
    candidate_discounts = [0.0, 5.0, 10.0, 12.0, 15.0, 18.0, 20.0, 25.0]
    discount_curve = []
    best_discount = 0.0
    best_profit = -999.0

    for cd in candidate_discounts:
        # Feasibility check on merchant discount cap
        if cd > max_disc_pct:
            continue
        c_disc_amt = price * (cd / 100.0)
        c_eff_price = price - c_disc_amt
        c_margin = c_eff_price - cost
        c_margin_pct = (c_margin / max(cost, 1.0)) * 100.0
        
        # Check margin floor
        if c_margin_pct < min_margin_pct:
            continue

        c_feats = FeatureExtractor.extract_features(customer, merchant, context, cd, item)
        if raw_override:
            for k, v in raw_override.items():
                if v is not None and k in c_feats and k != "offer_discount_pct":
                    c_feats[k] = float(v)

        c_p = predictor.predict_proba(c_feats)
        c_exp_profit = c_p * c_margin

        is_optimal = False
        if c_exp_profit > best_profit and all_guardrails_passed:
            best_profit = c_exp_profit
            best_discount = cd
            is_optimal = True

        discount_curve.append({
            "discount_pct": cd,
            "disc_amount_inr": round(c_disc_amt, 2),
            "final_price_inr": round(c_eff_price, 2),
            "margin_inr": round(c_margin, 2),
            "p_accept": round(c_p, 4),
            "expected_profit_inr": round(c_exp_profit, 2),
            "is_optimal": is_optimal
        })

    # Update optimal flag
    for row in discount_curve:
        row["is_optimal"] = (row["discount_pct"] == best_discount)

    # Notification Card Generation
    notif_title = f"{merchant['name']} par {best_discount:.0f}% off"
    notif_body = f"{merchant['name']} par {item['title']} enjoy karein at ₹{price - (price * best_discount / 100):.0f}. Sirf {int(round(walk_mins))} min walk door!"
    notif_cta = "Abhi grab karein"

    results = {
        "features": features,
        "p_accept": p_accept,
        "effective_price": effective_price,
        "discount_amount": disc_amount,
        "unit_margin": margin,
        "unit_margin_pct": margin_pct,
        "expected_profit": expected_profit,
        "guardrails": guardrails,
        "all_guardrails_passed": all_guardrails_passed,
        "best_discount_pct": best_discount,
        "best_profit_inr": max(best_profit, 0.0),
        "discount_curve": discount_curve,
        "action": "send" if all_guardrails_passed and best_profit > 0 else "skip",
        "notification": {
            "title": notif_title,
            "body": notif_body,
            "cta": notif_cta,
            "language": "hi-en"
        }
    }

    if verbose:
        print_report(inp, results)

    return results


def print_report(inp: Dict[str, Any], results: Dict[str, Any]):
    """Pretty-prints comprehensive ML pipeline testing results."""
    print("=" * 80)
    print("🎯 DECISIONED OFFER SYSTEM: ML PIPELINE PREDICTION REPORT")
    print("=" * 80)

    f = results["features"]
    print(f"\n[1. INPUT FEATURES SUMMARY]")
    print(f"  • Distance:            {f['distance_m']:.1f} m ({f['walk_minutes']:.1f} min walk)")
    print(f"  • Break Time Avail:    {f['time_budget_stress']*float(inp.get('minutes_available', 20.0)):.1f} / {float(inp.get('minutes_available', 20.0)):.1f} mins (Round-trip stress: {f['time_budget_stress']:.2f})")
    print(f"  • Ambient Weather:     {f['temp_c']:.1f}°C, rain: {f['rain_mm']:.1f}mm (Category affinity: +{f['weather_category_affinity']:.1f})")
    print(f"  • User Wallet:         ₹{f['user_wallet_inr']:.2f} (Price Sens: {f['user_price_sensitivity']:.2f}, Churn Risk: {f['user_churn_risk']:.2f})")
    print(f"  • Merchant Occupancy:  {f['merchant_occupancy_pct']:.0f}% ({f['merchant_idle_seats']:.0f} idle seats out of {f['merchant_capacity']:.0f})")
    print(f"  • Tested Offer:        {f['offer_discount_pct']:.1f}% discount on '{inp.get('item_title', 'Item')}'")

    print(f"\n[2. PREDICTIVE ML ENGINE OUTPUT]")
    p = results["p_accept"]
    bar_len = int(p * 40)
    bar = "█" * bar_len + "░" * (40 - bar_len)
    print(f"  • P(Accept | Features): {p * 100:6.2f}%  [{bar}]")
    if p > 0.65:
        verdict = "HIGH ACCEPTANCE LIKELIHOOD (Strong contextual pull & pricing fit)"
    elif p > 0.35:
        verdict = "MODERATE ACCEPTANCE LIKELIHOOD (Acceptable conversion rate)"
    else:
        verdict = "LOW CONVERSION (High friction: distance, budget, or low discount)"
    print(f"  • Model Verdict:       {verdict}")

    print(f"\n[3. UNIT ECONOMICS & PROFIT EQUATION]")
    print(f"  • Base Price:          ₹{f['item_base_price_inr']:.2f}")
    print(f"  • Discounted Price:    ₹{results['effective_price']:.2f} (-₹{results['discount_amount']:.2f})")
    print(f"  • Merchant Unit Cost:  ₹{f['item_unit_cost_inr']:.2f}")
    print(f"  • Net Unit Margin:     ₹{results['unit_margin']:.2f} ({results['unit_margin_pct']:.1f}% margin)")
    print(f"  • Expected Profit:     ₹{results['expected_profit']:.2f}  [= {p*100:.1f}% × ₹{results['unit_margin']:.2f}]")

    print(f"\n[4. OPERATIONAL & REGULATORY GUARDRAILS]")
    for k, v in results["guardrails"].items():
        status = "✅ PASS" if v else "❌ FAIL"
        print(f"  • {k:24s}: {status}")

    print(f"\n[5. PROFIT OPTIMIZATION ACROSS CANDIDATE DISCOUNTS]")
    print("-" * 80)
    print(f"{'Discount %':<12}{'Disc Amt (₹)':<14}{'Final Price':<14}{'Margin (₹)':<12}{'P(Accept)':<14}{'E[Profit] (₹)':<14}")
    print("-" * 80)
    for row in results["discount_curve"]:
        opt = " ★ OPTIMAL" if row["is_optimal"] else ""
        print(f"{row['discount_pct']:8.1f}%    ₹{row['disc_amount_inr']:8.2f}      ₹{row['final_price_inr']:8.2f}      ₹{row['margin_inr']:8.2f}    {row['p_accept']:8.2%}      ₹{row['expected_profit_inr']:8.2f}{opt}")
    print("-" * 80)
    print(f"  >> Optimal Policy: {results['best_discount_pct']:.0f}% discount yields highest expected profit: ₹{results['best_profit_inr']:.2f}")

    print(f"\n[6. FINAL DECISION & NOTIFICATION CARD]")
    action_color = "🟢 SEND OFFER" if results["action"] == "send" else "🔴 SKIP OFFER"
    print(f"  • Decision Action:     {action_color}")
    notif = results["notification"]
    print(f"  • Title:               {notif['title']}")
    print(f"  • Body:                {notif['body']}")
    print(f"  • CTA Button:          {notif['cta']}")
    print("=" * 80 + "\n")


def load_input_from_file(filepath: Path) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
    """Loads configuration and feature values from JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    scenario_data = data.get("scenario", {})
    raw_overrides = data.get("raw_features_override", {})

    # Extract high-level flat dict
    cust = scenario_data.get("customer", {})
    merch = scenario_data.get("merchant", {})
    item = scenario_data.get("item", {})
    ctx = scenario_data.get("context", {})

    inp = {
        "temperature_celsius": ctx.get("temp_c", 33.0),
        "weather_condition": ctx.get("condition", "sunny"),
        "rain_mm": ctx.get("rain_mm", 0.0),
        "minutes_available": ctx.get("minutes_available", 20.0),
        "time_of_day_hour": 13.25,
        "is_weekday": True,
        "intent": ctx.get("intent", "quick lunch"),
        "user_wallet_inr": ctx.get("wallet_override", cust.get("wallet_inr", 400.0)),
        "user_avg_spend": cust.get("avg_spend", 260.0),
        "user_price_sensitivity": cust.get("price_sensitivity", 0.65),
        "user_churn_risk": cust.get("churn_risk", 0.20),
        "user_age": cust.get("age", 26.0),
        "marketing_consent": cust.get("marketing_consent", True),
        "merchant_category": merch.get("category", "cafe"),
        "distance_meters": 136.6,
        "merchant_occupancy_pct": merch.get("occupancy_pct", 18.0),
        "merchant_capacity": merch.get("capacity", 30.0),
        "merchant_inventory_signal": merch.get("inventory_signal", "healthy"),
        "merchant_max_discount_pct": merch.get("max_discount_pct", 20.0),
        "merchant_min_margin_pct": merch.get("min_margin_pct", 13.0),
        "promo_window_active": True,
        "item_title": item.get("title", "Cold brew coffee & artisanal lunch bowl"),
        "item_base_price_inr": item.get("price_inr", 150.0),
        "merchant_unit_cost_inr": merch.get("unit_cost_inr", 32.29),
        "item_prep_minutes": item.get("prep_minutes", 8.0),
        "item_is_veg": item.get("is_veg", True),
        "test_discount_pct": scenario_data.get("offer_discount_pct", 10.0),
    }

    return inp, raw_overrides


def run_interactive_cli():
    """Prompts the user interactively in the terminal to enter feature values."""
    print("\n" + "=" * 60)
    print("  INTERACTIVE ML PIPELINE FEATURE TESTER")
    print("  (Press [ENTER] to accept default values shown in brackets)")
    print("=" * 60)

    inp = dict(MANUAL_TEST_INPUT)

    def ask(prompt: str, default: Any, cast_fn=float):
        val = input(f"{prompt} [{default}]: ").strip()
        if not val:
            return default
        try:
            return cast_fn(val)
        except Exception:
            return default

    inp["temperature_celsius"] = ask("Ambient Temperature (°C)", inp["temperature_celsius"], float)
    inp["weather_condition"] = input(f"Weather Condition (sunny/rainy/cloudy) [{inp['weather_condition']}]: ").strip() or inp["weather_condition"]
    inp["rain_mm"] = ask("Rainfall in mm", inp["rain_mm"], float)
    inp["minutes_available"] = ask("Minutes Available for Break", inp["minutes_available"], float)
    inp["distance_meters"] = ask("Distance to Merchant (meters)", inp["distance_meters"], float)
    inp["user_wallet_inr"] = ask("User Wallet Balance (₹)", inp["user_wallet_inr"], float)
    inp["user_price_sensitivity"] = ask("Price Sensitivity (0.0 to 1.0)", inp["user_price_sensitivity"], float)
    inp["item_base_price_inr"] = ask("Item Catalog Price (₹)", inp["item_base_price_inr"], float)
    inp["test_discount_pct"] = ask("Proposed Discount %", inp["test_discount_pct"], float)

    run_test(inp)


def start_web_ui(port: int = 8050):
    """Starts a local web UI server with real-time sliders and charts."""
    from http.server import HTTPServer, BaseHTTPRequestHandler
    import urllib.parse

    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Decisioned Offer ML Pipeline Interactive Tester</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0B0F19;
      --bg-card: rgba(18, 24, 38, 0.85);
      --bg-card-hover: rgba(26, 34, 52, 0.95);
      --primary: #6366F1;
      --primary-light: #818CF8;
      --primary-glow: rgba(99, 102, 241, 0.25);
      --emerald: #10B981;
      --emerald-glow: rgba(16, 185, 129, 0.25);
      --amber: #F59E0B;
      --rose: #F43F5E;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(99, 102, 241, 0.3);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg-base);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.08) 0%, transparent 45%);
    }
    header {
      padding: 18px 36px;
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(16px);
      background: rgba(11, 15, 25, 0.7);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-badge {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
      color: #fff;
      box-shadow: 0 4px 16px var(--primary-glow);
    }
    .brand-title { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
    .brand-sub { font-size: 12px; color: var(--text-muted); }
    .presets-bar { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-preset {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-preset:hover, .btn-preset.active {
      background: var(--primary);
      border-color: var(--primary-light);
      color: #fff;
      box-shadow: 0 2px 10px var(--primary-glow);
    }
    main {
      flex: 1;
      padding: 32px 36px;
      display: grid;
      grid-template-columns: 440px 1fr;
      gap: 32px;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
    }
    @media (max-width: 1024px) {
      main { grid-template-columns: 1fr; }
    }
    .panel {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      backdrop-filter: blur(20px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    }
    .panel-header {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-main);
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .feature-group { margin-bottom: 22px; }
    .group-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary-light);
      margin-bottom: 12px;
      display: block;
    }
    .input-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      font-size: 13px;
    }
    .input-row label { color: var(--text-muted); font-weight: 500; }
    .val-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    .slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #1E293B;
      outline: none;
      -webkit-appearance: none;
      margin-top: 6px;
    }
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--primary-light);
      cursor: pointer;
      box-shadow: 0 0 10px var(--primary-glow);
      transition: transform 0.1s ease;
    }
    .slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
    .select-input, .text-input {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      width: 160px;
    }
    /* Results cards */
    .hero-stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      position: relative;
      overflow: hidden;
    }
    .stat-card.primary { border-color: var(--border-accent); }
    .stat-card.success { border-color: rgba(16, 185, 129, 0.3); }
    .stat-title { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 8px; }
    .stat-val { font-size: 30px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
    .stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: #1E293B;
      border-radius: 4px;
      margin-top: 10px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366F1, #10B981);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    /* Table */
    .table-container {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th {
      background: rgba(255, 255, 255, 0.03);
      padding: 12px 16px;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      font-family: 'JetBrains Mono', monospace;
    }
    tr.optimal-row {
      background: rgba(16, 185, 129, 0.08);
      color: #34D399;
      font-weight: 700;
    }
    .badge-opt {
      background: var(--emerald);
      color: #000;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 800;
      margin-left: 6px;
    }
    /* Notification preview */
    .notif-preview {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
      border: 1px solid var(--border-accent);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: center;
      margin-top: 16px;
    }
    .notif-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .notif-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .notif-body { font-size: 13px; color: var(--text-muted); line-height: 1.4; }
    .notif-cta {
      margin-left: auto;
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .guardrail-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    .tag-pass { background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .tag-fail { background: rgba(244, 63, 94, 0.15); color: #FB7185; border: 1px solid rgba(244, 63, 94, 0.3); }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-badge">⚡</div>
      <div>
        <div class="brand-title">Decisioned Offer ML Pipeline Tester</div>
        <div class="brand-sub">Calibrated XGBoost Model & Profit Optimizer Live Simulator</div>
      </div>
    </div>
    <div class="presets-bar">
      <button class="btn-preset active" onclick="loadPreset('priya')">Priya's Tuesday</button>
      <button class="btn-preset" onclick="loadPreset('rain')">Monsoon Rain Slump</button>
      <button class="btn-preset" onclick="loadPreset('budget')">Budget Crunch</button>
      <button class="btn-preset" onclick="loadPreset('time_crunch')">Time Crunch (5m)</button>
      <button class="btn-preset" onclick="loadPreset('far_walk')">Far Distance (900m)</button>
    </div>
  </header>

  <main>
    <!-- Left Column: Feature Controls -->
    <div class="panel">
      <div class="panel-header">
        <span>⚙️ Feature Parameters</span>
        <span style="font-size:12px; color:var(--emerald);">Live Updates</span>
      </div>

      <div class="feature-group">
        <span class="group-label">Context & Weather</span>
        <div class="input-row">
          <label>Temperature (°C)</label>
          <span class="val-badge" id="lbl-temp">33.0°C</span>
        </div>
        <input type="range" class="slider" id="inp-temp" min="15" max="45" step="0.5" value="33" oninput="update()">

        <div class="input-row" style="margin-top:14px;">
          <label>Rainfall (mm)</label>
          <span class="val-badge" id="lbl-rain">0.0 mm</span>
        </div>
        <input type="range" class="slider" id="inp-rain" min="0" max="30" step="1" value="0" oninput="update()">

        <div class="input-row" style="margin-top:14px;">
          <label>Break Time Available (mins)</label>
          <span class="val-badge" id="lbl-mins">20 mins</span>
        </div>
        <input type="range" class="slider" id="inp-mins" min="5" max="60" step="1" value="20" oninput="update()">
      </div>

      <div class="feature-group">
        <span class="group-label">Geospatial & Distance</span>
        <div class="input-row">
          <label>Distance to Merchant (m)</label>
          <span class="val-badge" id="lbl-dist">136.6 m</span>
        </div>
        <input type="range" class="slider" id="inp-dist" min="50" max="1500" step="10" value="136.6" oninput="update()">
      </div>

      <div class="feature-group">
        <span class="group-label">Customer Economics</span>
        <div class="input-row">
          <label>UPI Wallet Balance (₹)</label>
          <span class="val-badge" id="lbl-wallet">₹400</span>
        </div>
        <input type="range" class="slider" id="inp-wallet" min="50" max="1500" step="25" value="400" oninput="update()">

        <div class="input-row" style="margin-top:14px;">
          <label>Price Sensitivity (0 - 1)</label>
          <span class="val-badge" id="lbl-sens">0.65</span>
        </div>
        <input type="range" class="slider" id="inp-sens" min="0" max="1" step="0.05" value="0.65" oninput="update()">
      </div>

      <div class="feature-group">
        <span class="group-label">Offer & Pricing</span>
        <div class="input-row">
          <label>Item Base Price (₹)</label>
          <span class="val-badge" id="lbl-price">₹150</span>
        </div>
        <input type="range" class="slider" id="inp-price" min="80" max="600" step="10" value="150" oninput="update()">

        <div class="input-row" style="margin-top:14px;">
          <label>Proposed Discount %</label>
          <span class="val-badge" id="lbl-disc" style="color:var(--primary-light);">10.0%</span>
        </div>
        <input type="range" class="slider" id="inp-disc" min="0" max="25" step="1" value="10" oninput="update()">
      </div>
    </div>

    <!-- Right Column: Model Output & Optimization -->
    <div style="display:flex; flex-direction:column; gap:24px;">
      <!-- Hero Stat Cards -->
      <div class="hero-stat-grid">
        <div class="stat-card primary">
          <div class="stat-title">P(ACCEPTANCE)</div>
          <div class="stat-val" id="res-prob" style="color:var(--primary-light);">68.4%</div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="res-prob-fill" style="width:68.4%;"></div>
          </div>
          <div class="stat-sub" id="res-prob-sub">Calibrated XGBoost Output</div>
        </div>

        <div class="stat-card success">
          <div class="stat-title">EXPECTED PROFIT E[π]</div>
          <div class="stat-val" id="res-exp-profit" style="color:var(--emerald);">₹70.24</div>
          <div class="stat-sub" id="res-margin-sub">P(Accept) × ₹102.71 Unit Margin</div>
        </div>

        <div class="stat-card">
          <div class="stat-title">OPTIMAL POLICY</div>
          <div class="stat-val" id="res-opt-disc" style="color:var(--amber);">10% OFF</div>
          <div class="stat-sub" id="res-opt-sub">Max Profit ₹70.24</div>
        </div>
      </div>

      <!-- Guardrails status -->
      <div class="panel" style="padding:16px 20px;">
        <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:10px;">OPERATIONAL GUARDRAILS AUDIT:</div>
        <div id="res-guardrails">
          <!-- dynamically populated -->
        </div>
      </div>

      <!-- Table: Discount Search Curve -->
      <div class="panel">
        <div class="panel-header">
          <span>📈 Profit Optimization Across Discount Depths</span>
          <span style="font-size:12px; color:var(--text-muted);">Objective: Maximize E[Profit]</span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Discount %</th>
                <th>Discount (₹)</th>
                <th>Final Price</th>
                <th>Net Margin</th>
                <th>P(Accept)</th>
                <th>Expected Profit</th>
              </tr>
            </thead>
            <tbody id="res-table-body">
              <!-- populated via JS -->
            </tbody>
          </table>
        </div>

        <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:10px;">PERSONALIZED NOTIFICATION PREVIEW:</div>
        <div class="notif-preview">
          <div class="notif-icon">☕</div>
          <div>
            <div class="notif-title" id="notif-title">Little Fern Café par 10% off</div>
            <div class="notif-body" id="notif-body">Little Fern Café par Cold brew coffee ke saath lunch enjoy karein at ₹135. Sirf 2 min walk door!</div>
          </div>
          <button class="notif-cta" id="notif-cta">Abhi grab karein</button>
        </div>
      </div>
    </div>
  </main>

  <script>
    const PRESETS = {
      priya: { temp: 33, rain: 0, mins: 20, dist: 136.6, wallet: 400, sens: 0.65, price: 150, disc: 10 },
      rain: { temp: 24, rain: 12, mins: 35, dist: 136.6, wallet: 400, sens: 0.65, price: 150, disc: 15 },
      budget: { temp: 33, rain: 0, mins: 20, dist: 136.6, wallet: 100, sens: 0.85, price: 150, disc: 10 },
      time_crunch: { temp: 33, rain: 0, mins: 5, dist: 136.6, wallet: 400, sens: 0.65, price: 150, disc: 10 },
      far_walk: { temp: 33, rain: 0, mins: 20, dist: 950, wallet: 400, sens: 0.65, price: 150, disc: 15 },
    };

    function loadPreset(key) {
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      const p = PRESETS[key];
      if (!p) return;
      document.getElementById('inp-temp').value = p.temp;
      document.getElementById('inp-rain').value = p.rain;
      document.getElementById('inp-mins').value = p.mins;
      document.getElementById('inp-dist').value = p.dist;
      document.getElementById('inp-wallet').value = p.wallet;
      document.getElementById('inp-sens').value = p.sens;
      document.getElementById('inp-price').value = p.price;
      document.getElementById('inp-disc').value = p.disc;
      update();
    }

    let debounceTimer = null;
    function update() {
      // Update badges
      document.getElementById('lbl-temp').innerText = document.getElementById('inp-temp').value + '°C';
      document.getElementById('lbl-rain').innerText = document.getElementById('inp-rain').value + ' mm';
      document.getElementById('lbl-mins').innerText = document.getElementById('inp-mins').value + ' mins';
      document.getElementById('lbl-dist').innerText = document.getElementById('inp-dist').value + ' m';
      document.getElementById('lbl-wallet').innerText = '₹' + document.getElementById('inp-wallet').value;
      document.getElementById('lbl-sens').innerText = document.getElementById('inp-sens').value;
      document.getElementById('lbl-price').innerText = '₹' + document.getElementById('inp-price').value;
      document.getElementById('lbl-disc').innerText = document.getElementById('inp-disc').value + '%';

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchPrediction, 80);
    }

    async function fetchPrediction() {
      const payload = {
        temperature_celsius: parseFloat(document.getElementById('inp-temp').value),
        rain_mm: parseFloat(document.getElementById('inp-rain').value),
        weather_condition: parseFloat(document.getElementById('inp-rain').value) > 0 ? "rainy" : "sunny",
        minutes_available: parseFloat(document.getElementById('inp-mins').value),
        distance_meters: parseFloat(document.getElementById('inp-dist').value),
        user_wallet_inr: parseFloat(document.getElementById('inp-wallet').value),
        user_price_sensitivity: parseFloat(document.getElementById('inp-sens').value),
        item_base_price_inr: parseFloat(document.getElementById('inp-price').value),
        test_discount_pct: parseFloat(document.getElementById('inp-disc').value),
      };

      try {
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        renderResults(data);
      } catch (err) {
        console.error("API error:", err);
      }
    }

    function renderResults(data) {
      const p = data.p_accept;
      document.getElementById('res-prob').innerText = (p * 100).toFixed(1) + '%';
      document.getElementById('res-prob-fill').style.width = (p * 100).toFixed(1) + '%';
      document.getElementById('res-exp-profit').innerText = '₹' + data.expected_profit.toFixed(2);
      document.getElementById('res-margin-sub').innerText = `P(Accept) × ₹${data.unit_margin.toFixed(2)} Unit Margin`;
      document.getElementById('res-opt-disc').innerText = `${data.best_discount_pct}% OFF`;
      document.getElementById('res-opt-sub').innerText = `Max Expected Profit: ₹${data.best_profit_inr.toFixed(2)}`;

      // Guardrails
      let gHtml = '';
      for (const [k, v] of Object.entries(data.guardrails)) {
        gHtml += `<span class="guardrail-tag ${v ? 'tag-pass' : 'tag-fail'}">${v ? '✓' : '✗'} ${k}</span>`;
      }
      document.getElementById('res-guardrails').innerHTML = gHtml;

      // Table
      let tHtml = '';
      data.discount_curve.forEach(row => {
        const optClass = row.is_optimal ? 'optimal-row' : '';
        const optTag = row.is_optimal ? '<span class="badge-opt">OPTIMAL</span>' : '';
        tHtml += `<tr class="${optClass}">
          <td>${row.discount_pct.toFixed(0)}% ${optTag}</td>
          <td>₹${row.disc_amount_inr.toFixed(2)}</td>
          <td>₹${row.final_price_inr.toFixed(2)}</td>
          <td>₹${row.margin_inr.toFixed(2)}</td>
          <td>${(row.p_accept * 100).toFixed(1)}%</td>
          <td>₹${row.expected_profit_inr.toFixed(2)}</td>
        </tr>`;
      });
      document.getElementById('res-table-body').innerHTML = tHtml;

      // Notification
      if (data.notification) {
        document.getElementById('notif-title').innerText = data.notification.title;
        document.getElementById('notif-body').innerText = data.notification.body;
        document.getElementById('notif-cta').innerText = data.notification.cta;
      }
    }

    window.onload = update;
  </script>
</body>
</html>
"""

    class ReqHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html_content.encode("utf-8"))

        def do_POST(self):
            if self.path == "/api/predict":
                content_len = int(self.headers.get("Content-Length", 0))
                post_body = self.rfile.read(content_len)
                try:
                    payload = json.loads(post_body.decode("utf-8"))
                    res = run_test(payload, verbose=False)
                    # Convert numpy/non-serializable types
                    sanitized = {
                        "p_accept": float(res["p_accept"]),
                        "effective_price": float(res["effective_price"]),
                        "discount_amount": float(res["discount_amount"]),
                        "unit_margin": float(res["unit_margin"]),
                        "unit_margin_pct": float(res["unit_margin_pct"]),
                        "expected_profit": float(res["expected_profit"]),
                        "guardrails": res["guardrails"],
                        "all_guardrails_passed": bool(res["all_guardrails_passed"]),
                        "best_discount_pct": float(res["best_discount_pct"]),
                        "best_profit_inr": float(res["best_profit_inr"]),
                        "discount_curve": res["discount_curve"],
                        "action": res["action"],
                        "notification": res["notification"]
                    }
                    out_bytes = json.dumps(sanitized).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(out_bytes)
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        def log_message(self, format, *args):
            # Suppress default noisy access logs
            return

    server = HTTPServer(("127.0.0.1", port), ReqHandler)
    url = f"http://127.0.0.1:{port}"
    print("=" * 70)
    print(f"🚀 DECISIONED OFFER ML PIPELINE WEB UI RUNNING")
    print(f"👉 Open in your browser: {url}")
    print("   Press Ctrl+C in terminal to stop server.")
    print("=" * 70)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping web server...")
        server.server_close()


def main():
    parser = argparse.ArgumentParser(description="Test Decisioned Offer ML Pipeline with custom features.")
    parser.add_argument("--file", "-f", type=str, default=None, help="Path to JSON feature input file.")
    parser.add_argument("--interactive", "-i", action="store_true", help="Launch interactive terminal wizard.")
    parser.add_argument("--preset", "-p", type=str, default=None, choices=["priya", "rain", "budget", "time_crunch", "far_walk"], help="Run a predefined preset scenario.")
    parser.add_argument("--web", "--ui", "-w", action="store_true", help="Launch interactive browser UI on localhost:8050.")
    parser.add_argument("--port", type=int, default=8050, help="Port for web server (default: 8050).")

    args = parser.parse_args()

    if args.web:
        start_web_ui(port=args.port)
        return

    if args.interactive:
        run_interactive_cli()
        return

    # Check for preset
    if args.preset:
        presets_map = {
            "priya": dict(MANUAL_TEST_INPUT),
            "rain": {**MANUAL_TEST_INPUT, "temperature_celsius": 24.0, "weather_condition": "rainy", "rain_mm": 12.0, "minutes_available": 35.0, "test_discount_pct": 15.0},
            "budget": {**MANUAL_TEST_INPUT, "user_wallet_inr": 100.0, "user_price_sensitivity": 0.85},
            "time_crunch": {**MANUAL_TEST_INPUT, "minutes_available": 5.0},
            "far_walk": {**MANUAL_TEST_INPUT, "distance_meters": 950.0, "test_discount_pct": 15.0},
        }
        print(f"\n[Running Preset: {args.preset.upper()}]")
        run_test(presets_map[args.preset])
        return

    # If --file specified or default test_features_input.json exists, load it
    json_path = Path(args.file) if args.file else SCRIPT_DIR / "test_features_input.json"
    if json_path.exists():
        print(f"[Loading features from file: {json_path.name}]")
        inp, raw_overrides = load_input_from_file(json_path)
        run_test(inp, raw_override=raw_overrides)
    else:
        print("[Using manual feature inputs from test_ml_pipeline.py]")
        run_test(MANUAL_TEST_INPUT)


if __name__ == "__main__":
    main()
