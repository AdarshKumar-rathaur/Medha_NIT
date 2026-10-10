"""
Hidden User Response Simulator (Ground-Truth Consumer Choice Model).
Simulates realistic human decision-making: distance decay, price sensitivity,
wallet feasibility, timing, and contextual weather affinity.
"""

import math
import random
from typing import Dict, Any, Tuple


class HiddenUserResponseSimulator:
    """
    Simulates the unobserved real-world user response to personalized offers.
    Operates as the environment in an exploration / Contextual Bandit setting.
    """

    def __init__(self, random_seed: int = 42):
        self.rng = random.Random(random_seed)

    def evaluate_offer(
        self,
        features: Dict[str, Any],
        add_noise: bool = True
    ) -> Dict[str, Any]:
        """
        Evaluates an offer presented to a user in a specific context.
        
        Returns:
            dict containing:
                - accepted: int (0 or 1)
                - true_prob: float (latent probability in [0, 1])
                - utility: float (latent utility score)
                - reason: str (explanation for outcome, e.g. for inspection)
        """
        # -------------------------------------------------------------
        # Hard Guardrail Blocks (Latent Probability = 0.0)
        # -------------------------------------------------------------
        # 1. Marketing consent withdrawn
        if features.get("marketing_consent", 1.0) == 0.0:
            return {
                "accepted": 0,
                "true_prob": 0.0,
                "utility": -999.0,
                "reason": "Consent blocked: User has not opted into marketing.",
            }

        # 2. Budget constraint (Wallet cannot cover effective price)
        if features.get("fits_user_wallet", 1.0) == 0.0:
            return {
                "accepted": 0,
                "true_prob": 0.0,
                "utility": -999.0,
                "reason": f"Budget constraint: Price ₹{features.get('effective_price_inr', 0):.1f} exceeds wallet ₹{features.get('user_wallet_inr', 0):.1f}.",
            }

        # 3. Merchant closed
        if features.get("merchant_is_open", 1.0) == 0.0:
            return {
                "accepted": 0,
                "true_prob": 0.0,
                "utility": -999.0,
                "reason": "Operational constraint: Merchant is currently closed.",
            }

        # 4. Physical time impossibility (trip time exceeds break time)
        dist_m = float(features.get("distance_m", 0.0))
        walk_mins = float(features.get("walk_minutes", 0.0))
        time_stress = float(features.get("time_budget_stress", 0.5))
        if dist_m > 2500.0 or time_stress > 1.25:
            return {
                "accepted": 0,
                "true_prob": 0.0,
                "utility": -999.0,
                "reason": f"Distance/Time infeasible: Distance is {dist_m:.0f}m ({walk_mins:.1f} min walk).",
            }

        # 5. Inventory check
        if float(features.get("item_stock_units", 10.0)) <= 0:
            return {
                "accepted": 0,
                "true_prob": 0.0,
                "utility": -999.0,
                "reason": "Inventory constraint: Item is sold out.",
            }

        # -------------------------------------------------------------
        # Latent Utility Model (Discrete Choice / Random Utility)
        # -------------------------------------------------------------
        # Base willingness to consider an offer
        base_utility = -1.20

        # 1. Discount utility: boosted by price sensitivity
        disc_pct = float(features.get("offer_discount_pct", 0.0))
        price_sens = float(features.get("user_price_sensitivity", 0.5))
        # Diminishing returns above 20% discount
        disc_norm = min(disc_pct, 25.0) / 15.0
        disc_utility = 1.60 * disc_norm * (0.6 + 0.8 * price_sens)

        # 2. Distance penalty: sharp decay past 500m, prohibitive past 1.2km
        dist_ref = 350.0  # ~4.5 min walk reference
        dist_ratio = dist_m / dist_ref
        dist_penalty = 0.55 * (dist_ratio ** 1.35)

        # 3. Time stress penalty: when break is tight (< 20 mins)
        stress_penalty = 1.10 * max(0.0, time_stress - 0.6)

        # 4. Contextual Weather & Category Match
        # (e.g. 33°C heat + afternoon lunch break + cafe iced beverages)
        weather_affinity = float(features.get("weather_category_affinity", 0.0))
        weather_utility = 0.95 * weather_affinity

        # 5. User Preference / Discovery / Fatigue Affinity
        combined_affinity = float(features.get("combined_affinity", 0.3))
        affinity_utility = 1.15 * combined_affinity

        # 6. Merchant capacity & idle seat relief
        # Less crowded places (high idle seats) offer faster service during lunch
        idle_ratio = float(features.get("merchant_idle_ratio", 0.5))
        capacity_utility = 0.35 * idle_ratio

        # 7. Promo window alignment
        in_promo = float(features.get("in_merchant_promo_window", 1.0))
        promo_utility = 0.25 * in_promo

        # Aggregate deterministic utility
        deterministic_utility = (
            base_utility
            + disc_utility
            - dist_penalty
            - stress_penalty
            + weather_utility
            + affinity_utility
            + capacity_utility
            + promo_utility
        )

        # Latent probability via logistic sigmoid link
        true_prob = 1.0 / (1.0 + math.exp(-deterministic_utility))
        # Bound probability strictly within [0.01, 0.98] to represent realistic human behavior
        true_prob = max(0.01, min(0.98, true_prob))

        # Sample actual binary acceptance
        if add_noise:
            # Gumbel / Logistic unobserved shock
            u_rand = self.rng.random()
            accepted = 1 if u_rand < true_prob else 0
        else:
            accepted = 1 if true_prob >= 0.5 else 0

        reason = f"U={deterministic_utility:.2f}, P={true_prob:.3f} (disc={disc_pct}%, dist={dist_m:.0f}m, weather_aff={weather_affinity:.1f})"

        return {
            "accepted": accepted,
            "true_prob": true_prob,
            "utility": deterministic_utility,
            "reason": reason,
        }
