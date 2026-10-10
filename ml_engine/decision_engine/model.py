"""
Predictive Decision Engine: Gradient Boosted Model (XGBoost / LightGBM)
Predicts Probability of Acceptance given User, Merchant, Weather, Time, and Discount Depth.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score,
    log_loss,
    brier_score_loss,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split
import xgboost as xgb
import lightgbm as lgb


class OfferResponsePredictor:
    """
    Trained Gradient Boosting model for predicting acceptance probability P(accept | features).
    """

    FEATURE_COLUMNS = [
        # Geospatial
        "distance_m",
        "distance_km",
        "walk_minutes",
        "is_walkable_1km",
        "is_walkable_500m",
        "distance_to_time_ratio",
        "is_same_locality",
        # Behavioral (User)
        "user_wallet_inr",
        "user_avg_spend",
        "user_price_sensitivity",
        "user_churn_risk",
        "user_age",
        "user_category_preference_match",
        "user_signal_match",
        "intent_category_match",
        "category_novelty_affinity",
        "combined_affinity",
        # Behavioral (Merchant & Inventory)
        "merchant_occupancy_pct",
        "merchant_capacity",
        "merchant_idle_seats",
        "merchant_idle_ratio",
        "merchant_inventory_signal",
        "merchant_max_discount_pct",
        "merchant_min_margin_pct",
        "item_base_price_inr",
        "item_unit_cost_inr",
        "item_prep_minutes",
        "item_is_veg",
        "item_stock_units",
        # Offer & Pricing
        "offer_discount_pct",
        "offer_discount_amount_inr",
        "effective_price_inr",
        "post_discount_margin_inr",
        "post_discount_margin_pct",
        "wallet_affordability_ratio",
        "fits_user_wallet",
        "spend_to_avg_ratio",
        # Contextual (Time & Weather)
        "hour_of_day",
        "day_of_week",
        "is_weekday",
        "is_lunch_window",
        "is_afternoon_slump",
        "is_evening",
        "temp_c",
        "rain_mm",
        "is_hot",
        "is_rainy",
        "weather_category_affinity",
        "festival_boost",
        "total_trip_minutes",
        "time_budget_stress",
        "fits_time_window",
        "merchant_is_open",
        "in_merchant_promo_window",
        "marketing_consent",
    ]

    def __init__(self, model_type: str = "xgboost", random_state: int = 42):
        self.model_type = model_type.lower()
        self.random_state = random_state
        self.model = None
        self.calibrated_model = None
        self.feature_names = list(self.FEATURE_COLUMNS)

    def train(
        self,
        df: pd.DataFrame,
        test_size: float = 0.2,
        calibrate: bool = True
    ) -> Dict[str, Any]:
        """
        Trains the Gradient Boosting Classifier on interaction logs.
        """
        X = df[self.feature_names].fillna(0.0)
        y = df["target_accepted"].astype(int)

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state, stratify=y
        )

        print(f"\nTraining {self.model_type.upper()} model on {len(X_train)} samples, validating on {len(X_val)} samples...")

        if self.model_type == "xgboost":
            base_clf = xgb.XGBClassifier(
                n_estimators=180,
                learning_rate=0.03,
                max_depth=4,
                reg_lambda=5.0,
                min_child_weight=3,
                subsample=0.80,
                colsample_bytree=0.80,
                random_state=self.random_state,
                eval_metric="logloss"
            )
            base_clf.fit(
                X_train,
                y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
            self.model = base_clf

        elif self.model_type == "lightgbm":
            base_clf = lgb.LGBMClassifier(
                n_estimators=180,
                learning_rate=0.03,
                max_depth=4,
                reg_lambda=5.0,
                subsample=0.80,
                colsample_bytree=0.80,
                random_state=self.random_state,
                verbose=-1
            )
            base_clf.fit(X_train, y_train)
            self.model = base_clf
        else:
            raise ValueError(f"Unknown model_type: {self.model_type}")

        # Probability calibration
        if calibrate:
            print("Calibrating probability outputs (isotonic regression with 3-fold CV)...")
            calib_clf = xgb.XGBClassifier(
                n_estimators=180,
                learning_rate=0.03,
                max_depth=4,
                reg_lambda=5.0,
                min_child_weight=3,
                subsample=0.80,
                colsample_bytree=0.80,
                random_state=self.random_state,
                eval_metric="logloss"
            ) if self.model_type == "xgboost" else lgb.LGBMClassifier(
                n_estimators=180,
                learning_rate=0.03,
                max_depth=4,
                reg_lambda=5.0,
                subsample=0.80,
                colsample_bytree=0.80,
                random_state=self.random_state,
                verbose=-1
            )
            self.calibrated_model = CalibratedClassifierCV(
                estimator=calib_clf,
                method="isotonic",
                cv=3
            )
            self.calibrated_model.fit(X_train, y_train)
            active_model = self.calibrated_model
        else:
            active_model = self.model

        # Validation Metrics
        val_probs = active_model.predict_proba(X_val)[:, 1]
        val_preds = (val_probs >= 0.5).astype(int)

        metrics = {
            "roc_auc": float(roc_auc_score(y_val, val_probs)),
            "log_loss": float(log_loss(y_val, val_probs)),
            "brier_score": float(brier_score_loss(y_val, val_probs)),
            "accuracy": float(accuracy_score(y_val, val_preds)),
            "precision": float(precision_score(y_val, val_preds, zero_division=0)),
            "recall": float(recall_score(y_val, val_preds, zero_division=0)),
            "f1": float(f1_score(y_val, val_preds, zero_division=0)),
        }

        # True latent probability correlation if present
        if "true_prob" in df.columns:
            val_indices = X_val.index
            true_p = df.loc[val_indices, "true_prob"].values
            corr = float(np.corrcoef(val_probs, true_p)[0, 1])
            metrics["latent_prob_correlation"] = corr

        print("\n=== Predictive Model Evaluation Metrics ===")
        for k, v in metrics.items():
            print(f"  {k:24s}: {v:.4f}")

        # Feature Importance
        importance_df = self.get_feature_importances()
        print("\n=== Top 10 Most Predictive Features ===")
        print(importance_df.head(10).to_string(index=False))

        return metrics

    def get_feature_importances(self) -> pd.DataFrame:
        """Extracts normalized feature importances from the tree model."""
        if self.model is None:
            return pd.DataFrame()

        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
        else:
            importances = np.ones(len(self.feature_names)) / len(self.feature_names)

        df_imp = pd.DataFrame({
            "feature": self.feature_names,
            "importance": importances
        }).sort_values(by="importance", ascending=False)
        return df_imp

    def predict_proba(self, features: Dict[str, Any]) -> float:
        """
        Predicts acceptance probability P(accept) for a single feature dictionary.
        """
        active_model = self.calibrated_model if self.calibrated_model is not None else self.model
        if active_model is None:
            raise RuntimeError("Model has not been trained or loaded yet!")

        # Enforce hard zero if consent is missing or budget fails
        if features.get("marketing_consent", 1.0) == 0.0:
            return 0.0
        if features.get("fits_user_wallet", 1.0) == 0.0:
            return 0.0
        if features.get("merchant_is_open", 1.0) == 0.0:
            return 0.0
        if features.get("fits_time_window", 1.0) == 0.0 and features.get("time_budget_stress", 0.0) > 1.2:
            return 0.0

        row = [features.get(col, 0.0) for col in self.feature_names]
        X = pd.DataFrame([row], columns=self.feature_names).fillna(0.0)
        prob = float(active_model.predict_proba(X)[0, 1])
        return max(0.0, min(1.0, prob))

    def predict_proba_batch(self, features_list: List[Dict[str, Any]]) -> np.ndarray:
        """Predicts acceptance probabilities for a batch of feature dicts."""
        active_model = self.calibrated_model if self.calibrated_model is not None else self.model
        if active_model is None:
            raise RuntimeError("Model has not been trained or loaded yet!")

        rows = []
        hard_zero_mask = []
        for f in features_list:
            if (f.get("marketing_consent", 1.0) == 0.0 or 
                f.get("fits_user_wallet", 1.0) == 0.0 or
                f.get("merchant_is_open", 1.0) == 0.0 or
                (f.get("fits_time_window", 1.0) == 0.0 and f.get("time_budget_stress", 0.0) > 1.2)):
                hard_zero_mask.append(True)
            else:
                hard_zero_mask.append(False)
            rows.append([f.get(col, 0.0) for col in self.feature_names])

        X = pd.DataFrame(rows, columns=self.feature_names).fillna(0.0)
        probs = active_model.predict_proba(X)[:, 1]
        probs[hard_zero_mask] = 0.0
        return probs

    def save(self, filepath: str):
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "calibrated_model": self.calibrated_model,
            "feature_names": self.feature_names,
            "model_type": self.model_type,
        }, filepath)
        print(f"Model saved to {filepath}")

    @classmethod
    def load(cls, filepath: str) -> "OfferResponsePredictor":
        data = joblib.load(filepath)
        if isinstance(data, dict):
            predictor = cls(model_type=data.get("model_type", "xgboost"))
            predictor.model = data.get("model")
            predictor.calibrated_model = data.get("calibrated_model")
            predictor.feature_names = data.get("feature_names", list(cls.FEATURE_COLUMNS))
        else:
            predictor = cls(model_type="xgboost")
            predictor.calibrated_model = data
            predictor.model = getattr(data, "estimator", getattr(data, "base_estimator", None))
            if hasattr(data, "feature_names_in_"):
                predictor.feature_names = list(data.feature_names_in_)
            else:
                predictor.feature_names = list(cls.FEATURE_COLUMNS)
        return predictor

