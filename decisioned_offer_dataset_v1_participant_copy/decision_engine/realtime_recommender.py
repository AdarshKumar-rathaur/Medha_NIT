"""
Real-time Contextual Offer Recommendation Script.
Evaluates a customer against candidate merchants using the trained XGBoost model and ProfitOptimizer.
Outputs JSON decision payload for the backend portal.
"""

import sys
import json
import argparse
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ENGINE_DIR = Path(__file__).resolve().parent
REPO_ROOT = ENGINE_DIR.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from decision_engine.data_loader import DataLoader
from decision_engine.model import OfferResponsePredictor
from decision_engine.optimizer import ProfitOptimizer


def main():
    parser = argparse.ArgumentParser(description="Real-time Offer Recommender")
    parser.add_argument("--input-json", type=str, help="Customer and context payload as JSON string")
    parser.add_argument("--input-file", type=str, help="Path to JSON file containing payload")
    args = parser.parse_args()

    if args.input_file:
        with open(args.input_file, "r", encoding="utf-8") as f:
            payload = json.load(f)
    elif args.input_json:
        payload = json.loads(args.input_json)
    else:
        # Default stdin read
        payload = json.loads(sys.stdin.read())

    customer_data = payload.get("customer", {})
    context_data = payload.get("context", {})
    merchants_override = payload.get("merchants_override", None)

    # Initialize data loader and load trained model
    data_loader = DataLoader(base_dir=REPO_ROOT)

    # If customer has custom data, inject into loader
    cid = customer_data.get("id", "c_custom")
    data_loader.customers_by_id[cid] = customer_data

    # If merchants have updated occupancy/settings, apply override
    if merchants_override and isinstance(merchants_override, list):
        for m in merchants_override:
            mid = m.get("id")
            if mid and mid in data_loader.merchants_by_id:
                data_loader.merchants_by_id[mid].update(m)

    # Load trained model
    model_path = REPO_ROOT / "models" / "xgboost_decision_model.joblib"
    predictor = OfferResponsePredictor.load(str(model_path))

    optimizer = ProfitOptimizer(data_loader=data_loader, predictor=predictor)

    # Synthesize scenario
    scenario = {
        "id": f"rec_{cid}_{int(context_data.get('temp_c', 30))}",
        "scenario_id": f"rec_{cid}",
        "customer_id": cid,
        "timestamp": context_data.get("timestamp", "2026-05-19T13:15:00+05:30"),
        "lat": float(context_data.get("lat", customer_data.get("current_lat", 12.935))),
        "lng": float(context_data.get("lng", customer_data.get("current_lng", 77.624))),
        "temp_c": float(context_data.get("temp_c", 30.0)),
        "condition": context_data.get("condition", "sunny"),
        "rain_mm": float(context_data.get("rain_mm", 0.0)),
        "minutes_available": float(context_data.get("minutes_available", customer_data.get("minutes_available", 30.0))),
        "intent": context_data.get("intent", customer_data.get("intent", "quick lunch")),
        "scenario_type": "realtime_portal",
        "prompt": f"Real-time evaluation for {customer_data.get('name', 'User')}",
        "wallet_override": float(customer_data.get("wallet_inr", 500.0)),
    }

    # If target merchant specified in payload (or search all nearby)
    target_mid = payload.get("target_merchant_id")
    if target_mid:
        scenario["merchant_id"] = target_mid

    decision = optimizer.decide_scenario(scenario)

    # Enrich with merchant name/details if offer was generated
    if decision.get("action") == "send" and "offer" in decision:
        mid = decision["offer"]["merchant_id"]
        merch = data_loader.get_merchant(mid)
        if merch:
            decision["merchant_details"] = {
                "id": mid,
                "name": merch.get("name"),
                "category": merch.get("category"),
                "locality": merch.get("locality"),
                "occupancy_pct": merch.get("occupancy_pct"),
            }

    # Print pure JSON output
    print(json.dumps(decision, ensure_ascii=False))


if __name__ == "__main__":
    main()
