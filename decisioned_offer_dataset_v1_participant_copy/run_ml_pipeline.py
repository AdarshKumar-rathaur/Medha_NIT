"""
End-to-End ML Pipeline Runner:
1. Data Ingestion & Feature Engineering
2. Data Collection (Interacting with Simulator via Epsilon-Greedy policy)
3. Model Training (XGBoost / LightGBM Classifier with probability calibration)
4. Profit Optimization Logic Execution
5. Official Evaluation via evaluator.py
"""

import sys
import subprocess
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import pandas as pd

# Ensure package is importable
repo_root = Path(__file__).resolve().parent
sys.path.insert(0, str(repo_root))

from decision_engine.data_loader import DataLoader
from decision_engine.features import FeatureExtractor
from decision_engine.data_collector import DataCollector
from decision_engine.model import OfferResponsePredictor
from decision_engine.optimizer import ProfitOptimizer
from decision_engine.evaluator_bridge import EvaluatorBridge


def main():
    print("=" * 70)
    print("DECISIONED OFFER SYSTEM: ML PIPELINE & PROFIT OPTIMIZATION ENGINE")
    print("=" * 70)

    # -------------------------------------------------------------
    # Step 1: Data Ingestion & Feature Engineering
    # -------------------------------------------------------------
    print("\n[Step 1] Ingesting Datasets & Initializing Feature Engineering...")
    loader = DataLoader(base_dir=repo_root)
    print(f"  Loaded {len(loader.customers_by_id)} customers")
    print(f"  Loaded {len(loader.merchants_by_id)} merchants")
    print(f"  Loaded {len(loader.catalog_items_df)} catalog items")
    print(f"  Loaded {len(loader.weather_hourly_df)} hourly weather records")
    print(f"  Loaded {len(loader.festivals_df)} seasonal festival events")

    feature_cols = FeatureExtractor.get_feature_names()
    print(f"  Engineered {len(feature_cols)} feature signals (Geospatial, Behavioral, Contextual)")

    # -------------------------------------------------------------
    # Step 2: Data Collection (Interacting with the Simulator)
    # -------------------------------------------------------------
    print("\n[Step 2] Collecting Training Data from Hidden User Response Simulator...")
    collector = DataCollector(data_loader=loader, random_seed=42)
    training_csv_path = repo_root / "data" / "training_interactions.csv"
    
    # Load or generate 10,000 simulated interactions using exploratory policy
    if training_csv_path.exists():
        print(f"  Found existing training interaction data at {training_csv_path}, loading...")
        interactions_df = pd.read_csv(training_csv_path)
        print(f"  Loaded {len(interactions_df)} interactions (Acceptance Rate: {interactions_df['target_accepted'].mean()*100:.2f}%)")
    else:
        interactions_df = collector.generate_training_data(
            num_episodes=10000,
            epsilon=0.25,
            output_csv=str(training_csv_path)
        )

    # -------------------------------------------------------------
    # Step 3: Predictive Decision Engine Training
    # -------------------------------------------------------------
    print("\n[Step 3] Training Predictive Decision Engine (XGBoost with Probability Calibration)...")
    predictor = OfferResponsePredictor(model_type="xgboost", random_state=42)
    eval_metrics = predictor.train(interactions_df, test_size=0.2, calibrate=True)

    model_path = repo_root / "models" / "xgboost_decision_model.joblib"
    predictor.save(str(model_path))

    # -------------------------------------------------------------
    # Step 4: Profit Optimization Logic
    # -------------------------------------------------------------
    print("\n[Step 4] Initializing Profit Optimization Engine...")
    optimizer = ProfitOptimizer(data_loader=loader, predictor=predictor)
    bridge = EvaluatorBridge(data_loader=loader, optimizer=optimizer)

    # Run on public scenarios
    pub_scenarios_df = loader.scenarios_public_df
    public_sub_path = repo_root / "eval" / "public_predictions.jsonl"
    print(f"\nEvaluating on {len(pub_scenarios_df)} public scenarios...")
    public_preds = bridge.generate_predictions_jsonl(pub_scenarios_df, str(public_sub_path))

    # Run official evaluator.py on public scenarios (using expected actions in scenarios_public)
    report_path = repo_root / "eval" / "public_evaluation_report.json"
    eval_cmd = [
        sys.executable,
        str(repo_root / "eval" / "evaluator.py"),
        "--submission", str(public_sub_path),
        "--scenarios", str(repo_root / "data" / "scenarios_public.csv"),
        "--merchants", str(repo_root / "data" / "merchants.csv"),
        "--customers", str(repo_root / "data" / "customers.csv"),
        "--out", str(report_path)
    ]
    print("\nRunning official evaluation protocol...")
    res = subprocess.run(eval_cmd, capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print("Evaluator stderr:", res.stderr)

    # Also generate predictions on holdout blind scenarios
    if not loader.scenarios_holdout_blind_df.empty:
        holdout_sub_path = repo_root / "eval" / "submission_holdout_blind.jsonl"
        print(f"\nGenerating predictions for {len(loader.scenarios_holdout_blind_df)} blind holdout scenarios...")
        bridge.generate_predictions_jsonl(loader.scenarios_holdout_blind_df, str(holdout_sub_path))

    print("\nML Pipeline successfully executed!")


if __name__ == "__main__":
    main()
