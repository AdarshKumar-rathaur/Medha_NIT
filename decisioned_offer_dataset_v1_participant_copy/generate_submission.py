"""
========================================================================================
DECISIONED OFFER SYSTEM: ML PREDICTION & JSONL SUBMISSION GENERATOR
========================================================================================
Generates .jsonl submission file by running the trained ML Decision & Profit Optimization
pipeline over any scenario dataset (blind holdout, public scenarios, or custom CSV).

Usage:
  # 1. Generate default submission on blind holdout (eval/scenarios_holdout_blind.csv):
  python generate_submission.py

  # 2. Generate and evaluate on public scenarios:
  python generate_submission.py --scenarios decisioned_offer_dataset_v1_participant_copy/data/scenarios_public.csv --eval

  # 3. Custom output path:
  python generate_submission.py --output final_submission.jsonl
========================================================================================
"""

import sys
import os
import json
import argparse
import subprocess
from pathlib import Path
from typing import Dict, Any, List

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import pandas as pd

# Resolve repository paths
ROOT_DIR = Path(__file__).resolve().parent
PARTICIPANT_DIR = ROOT_DIR / "decisioned_offer_dataset_v1_participant_copy"
if not PARTICIPANT_DIR.exists():
    PARTICIPANT_DIR = ROOT_DIR.parent / "decisioned_offer_dataset_v1_participant_copy"
if not PARTICIPANT_DIR.exists():
    PARTICIPANT_DIR = ROOT_DIR

sys.path.insert(0, str(ROOT_DIR))
if str(PARTICIPANT_DIR) != str(ROOT_DIR):
    sys.path.insert(0, str(PARTICIPANT_DIR))

from decision_engine.data_loader import DataLoader
from decision_engine.model import OfferResponsePredictor
from decision_engine.optimizer import ProfitOptimizer
from decision_engine.evaluator_bridge import EvaluatorBridge


def generate_submission(
    scenarios_csv: str,
    output_jsonl: str,
    model_path: str = None,
    run_eval: bool = False
):
    scenarios_path = Path(scenarios_csv)
    if not scenarios_path.is_absolute():
        if scenarios_path.exists():
            scenarios_path = scenarios_path.resolve()
        elif (ROOT_DIR / scenarios_path).exists():
            scenarios_path = (ROOT_DIR / scenarios_path).resolve()
        elif (PARTICIPANT_DIR / scenarios_path).exists():
            scenarios_path = (PARTICIPANT_DIR / scenarios_path).resolve()
        else:
            scenarios_path = (ROOT_DIR / scenarios_path).resolve()

    if not scenarios_path.exists():
        raise FileNotFoundError(f"Scenarios file not found: {scenarios_path}")

    out_path = Path(output_jsonl)
    if not out_path.is_absolute():
        out_path = Path(output_jsonl).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print("=" * 75)
    print("DECISIONED OFFER SYSTEM - SUBMISSION GENERATOR")
    print("=" * 75)
    data_dir = ROOT_DIR if (ROOT_DIR / "data" / "merchants.csv").exists() else PARTICIPANT_DIR
    print(f"Loading data from: {data_dir}")
    loader = DataLoader(base_dir=data_dir)

    # Resolve model artifact
    if model_path is None:
        candidates = [
            ROOT_DIR / "models" / "xgboost_decision_model.joblib",
            PARTICIPANT_DIR / "models" / "xgboost_decision_model.joblib",
        ]
        for c in candidates:
            if c.exists():
                model_path = c
                break
        if model_path is None:
            model_path = candidates[0]
    else:
        model_path = Path(model_path)
        if not model_path.is_absolute():
            if model_path.exists():
                model_path = model_path.resolve()
            else:
                model_path = (ROOT_DIR / model_path).resolve()

    if not model_path.exists():
        print(f"[!] Model artifact not found at {model_path}. Training new model...")
        from run_ml_pipeline import main as run_pipeline
        run_pipeline()

    print(f"Loading calibrated ML model from: {model_path}")
    predictor = OfferResponsePredictor.load(str(model_path))

    optimizer = ProfitOptimizer(data_loader=loader, predictor=predictor)
    bridge = EvaluatorBridge(data_loader=loader, optimizer=optimizer)

    print(f"Reading scenarios from: {scenarios_path}")
    scenarios_df = pd.read_csv(scenarios_path)
    print(f"Total scenarios to process: {len(scenarios_df)}")

    # Generate predictions
    print(f"\nPredicting decisions and generating grounded offers...")
    predictions = bridge.generate_predictions_jsonl(scenarios_df, str(out_path))

    # Also keep participant copy eval submission in sync if generating blind holdout
    if "holdout" in str(scenarios_path).lower():
        import shutil
        sync_targets = [
            ROOT_DIR / "eval" / "submission_holdout_blind.jsonl",
            PARTICIPANT_DIR / "eval" / "submission_holdout_blind.jsonl"
        ]
        for st in set(sync_targets):
            if out_path.resolve() != st.resolve():
                st.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(str(out_path), str(st))
                print(f"Synced copy to: {st}")

    # Summary statistics
    sends = [p for p in predictions if p["action"] == "send"]
    skips = [p for p in predictions if p["action"] == "skip"]
    profits = [p.get("profit_estimate_inr", 0.0) for p in sends]
    discounts = [p.get("offer", {}).get("discount_pct", 0.0) for p in sends]

    print("\n" + "-" * 75)
    print("PREDICTION SUMMARY")
    print("-" * 75)
    print(f"  Total Scenarios Processed: {len(predictions)}")
    print(f"  Action 'SEND' Offers:      {len(sends):3d} ({len(sends)/len(predictions)*100:.1f}%)")
    print(f"  Action 'SKIP' Guarded:     {len(skips):3d} ({len(skips)/len(predictions)*100:.1f}%)")
    if sends:
        print(f"  Average Discount Depth:    {sum(discounts)/len(discounts):.1f}%")
        print(f"  Average Expected Profit:   ₹{sum(profits)/len(profits):.2f}")
        print(f"  Total Estimated Profit:    ₹{sum(profits):.2f}")
    print(f"  Output File:               {out_path}")
    print(f"  File Size:                 {out_path.stat().st_size:,} bytes")
    print("-" * 75)

    # Optional Evaluation run if expected labels exist
    if run_eval or "expected_action" in scenarios_df.columns:
        print("\nRunning official evaluator protocol...")
        evaluator_script = ROOT_DIR / "eval" / "evaluator.py"
        if not evaluator_script.exists():
            evaluator_script = PARTICIPANT_DIR / "eval" / "evaluator.py"
        merchants_csv = ROOT_DIR / "data" / "merchants.csv"
        if not merchants_csv.exists():
            merchants_csv = PARTICIPANT_DIR / "data" / "merchants.csv"
        customers_csv = ROOT_DIR / "data" / "customers.csv"
        if not customers_csv.exists():
            customers_csv = PARTICIPANT_DIR / "data" / "customers.csv"

        report_path = out_path.parent / f"eval_report_{out_path.stem}.json"
        eval_cmd = [
            sys.executable,
            str(evaluator_script),
            "--submission", str(out_path),
            "--scenarios", str(scenarios_path),
            "--merchants", str(merchants_csv),
            "--customers", str(customers_csv),
            "--out", str(report_path)
        ]
        res = subprocess.run(eval_cmd, capture_output=True, text=True)
        if res.stdout:
            print(res.stdout)
        if res.stderr:
            print("Evaluator warnings/errors:\n", res.stderr)
        if report_path.exists():
            print(f"Detailed evaluation report saved to: {report_path}")

    print("\n[OK] Submission file ready for submission!")
    return str(out_path)


def main():
    parser = argparse.ArgumentParser(description="Generate ML-predicted .jsonl submission file")
    default_scenarios = PARTICIPANT_DIR / "eval" / "scenarios_holdout_blind.csv"
    default_output = ROOT_DIR / "submission_holdout_blind.jsonl"

    parser.add_argument(
        "--scenarios",
        default=str(default_scenarios),
        help=f"Path to input scenarios CSV (default: {default_scenarios})"
    )
    parser.add_argument(
        "--output",
        default=str(default_output),
        help=f"Path to output .jsonl submission file (default: {default_output})"
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Path to trained model .joblib file"
    )
    parser.add_argument(
        "--eval",
        action="store_true",
        help="Run evaluator.py if scenarios file contains labels"
    )

    args = parser.parse_args()
    generate_submission(
        scenarios_csv=args.scenarios,
        output_jsonl=args.output,
        model_path=args.model,
        run_eval=args.eval
    )


if __name__ == "__main__":
    main()
