"""
Evaluator Bridge: Runs batch decisions on scenarios and invokes evaluator.py.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd

from .data_loader import DataLoader
from .optimizer import ProfitOptimizer


class EvaluatorBridge:
    def __init__(self, data_loader: DataLoader, optimizer: ProfitOptimizer):
        self.data_loader = data_loader
        self.optimizer = optimizer

    def generate_predictions_jsonl(
        self,
        scenarios_df: pd.DataFrame,
        output_jsonl_path: str
    ) -> List[Dict[str, Any]]:
        """
        Runs decisions on all scenarios in dataframe and writes JSONL file.
        """
        predictions = []
        out_file = Path(output_jsonl_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)

        with open(out_file, "w", encoding="utf-8") as f:
            for _, row in scenarios_df.iterrows():
                pred = self.optimizer.decide_scenario(row.to_dict())
                # Clean up internal debug fields for clean submission
                clean_pred = {
                    "scenario_id": pred["scenario_id"],
                    "action": pred["action"],
                    "reason": pred["reason"]
                }
                if pred["action"] == "send":
                    clean_pred["offer"] = pred["offer"]
                    clean_pred["notification"] = pred["notification"]
                    clean_pred["ui_hints"] = pred["ui_hints"]
                    clean_pred["profit_estimate_inr"] = pred["profit_estimate_inr"]

                predictions.append(clean_pred)
                f.write(json.dumps(clean_pred) + "\n")

        print(f"Generated {len(predictions)} predictions written to {output_jsonl_path}")
        return predictions
