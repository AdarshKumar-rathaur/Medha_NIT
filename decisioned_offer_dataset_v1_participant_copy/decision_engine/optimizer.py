"""
Profit Optimization Logic and Decision Policy.
Enforces hard merchant constraints, searches candidate discount depths,
predicts acceptance probability with ML, and selects the offer maximizing Expected Profit:
    E[Profit] = P(Accept) * (Base Item Margin - Discount Amount)
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

from .data_loader import DataLoader
from .features import FeatureExtractor, haversine_distance_m, walk_time_minutes
from .model import OfferResponsePredictor


class ProfitOptimizer:
    """
    Decides WHETHER to send an offer, WHAT merchant and item, and at WHAT discount depth
    to maximize merchant profit while strictly honoring all constraints.
    """

    CANDIDATE_DISCOUNTS = [0.0, 5.0, 10.0, 12.0, 15.0, 18.0, 20.0, 25.0]

    def __init__(self, data_loader: DataLoader, predictor: OfferResponsePredictor):
        self.data_loader = data_loader
        self.predictor = predictor

    def decide_scenario(
        self,
        scenario: Dict[str, Any],
        max_search_merchants: int = 20
    ) -> Dict[str, Any]:
        """
        Processes a single scenario (e.g. from scenarios_public or scenarios_holdout_blind)
        and outputs the decision payload matching PARTICIPANT_GUIDE.md & evaluator.py.
        """
        sid = scenario.get("id") or scenario.get("scenario_id")
        cid = str(scenario["customer_id"])
        target_mid = str(scenario.get("merchant_id", ""))
        
        customer = self.data_loader.get_customer(cid)
        if not customer:
            return {
                "scenario_id": sid,
                "action": "skip",
                "reason": f"Customer {cid} not found in database.",
                "profit_estimate_inr": 0.0
            }

        # -------------------------------------------------------------
        # 1. HARD GUARDRAIL: Marketing Consent
        # -------------------------------------------------------------
        if not bool(customer.get("marketing_consent", True)):
            return {
                "scenario_id": sid,
                "action": "skip",
                "reason": "marketing_consent is false; promotional send blocked",
                "profit_estimate_inr": 0.0
            }

        # Build context object from scenario
        ts = str(scenario.get("timestamp", "2026-05-19T13:15:00+05:30"))
        cust_lat = float(scenario.get("lat", customer.get("current_lat", 12.935)))
        cust_lng = float(scenario.get("lng", customer.get("current_lng", 77.624)))
        minutes_avail = float(scenario.get("minutes_available", 30.0))
        wallet_val = float(scenario.get("wallet_override") or customer.get("wallet_inr", 500.0))
        temp_c = float(scenario.get("temp_c", 30.0))
        condition = str(scenario.get("condition", "sunny"))
        rain_mm = float(scenario.get("rain_mm", 0.0))
        intent = str(scenario.get("intent", ""))

        # Check festivals
        active_festivals = self.data_loader.get_active_festivals(ts)
        festival_boost = max([f["boost_pct"] for f in active_festivals], default=0.0)

        context = {
            "timestamp": ts,
            "lat": cust_lat,
            "lng": cust_lng,
            "minutes_available": minutes_avail,
            "wallet_override": wallet_val,
            "temp_c": temp_c,
            "condition": condition,
            "rain_mm": rain_mm,
            "intent": intent,
            "festival_boost_pct": festival_boost
        }

        # Parse time of day
        dt = pd.to_datetime(ts)
        hour = dt.hour + dt.minute / 60.0
        is_weekday = (dt.dayofweek < 5)

        # -------------------------------------------------------------
        # 2. Candidate Merchants Pool
        # -------------------------------------------------------------
        # If scenario specifies a target merchant (like Priya's scenario with m_001), prioritize it;
        # otherwise evaluate eligible nearby merchants.
        candidate_merchants = []
        if target_mid and target_mid in self.data_loader.merchants_by_id:
            candidate_merchants.append(self.data_loader.get_merchant(target_mid))
        else:
            # Rank nearby merchants by distance
            for mid, m in self.data_loader.merchants_by_id.items():
                d = haversine_distance_m(cust_lat, cust_lng, float(m["lat"]), float(m["lng"]))
                if d <= 3000.0:  # Search pool radius
                    candidate_merchants.append((m, d))
            candidate_merchants.sort(key=lambda x: x[1])
            candidate_merchants = [m[0] for m in candidate_merchants[:max_search_merchants]]

        # Evaluate candidate offers across all candidate merchants
        best_candidate = None
        best_expected_profit = -999.0
        skip_reason = None

        for merchant in candidate_merchants:
            mid = merchant["id"]
            m_lat = float(merchant["lat"])
            m_lng = float(merchant["lng"])
            dist_m = haversine_distance_m(cust_lat, cust_lng, m_lat, m_lng)
            walk_mins = walk_time_minutes(dist_m)

            # Check: Merchant Open Hours
            open_h = float(merchant.get("open_hour", 8))
            close_h = float(merchant.get("close_hour", 22))
            if not (open_h <= hour < close_h):
                skip_reason = skip_reason or "Merchant is closed."
                continue

            # Check: Distance feasibility (Walkable within lunch/break time)
            # A walk of > 1.2km or walk_time * 2 > minutes_available is practically infeasible
            if dist_m > 1500.0 or (walk_mins * 2.0 > minutes_avail):
                skip_reason = skip_reason or "Merchant distance exceeds practical walk radius for the intent"
                continue

            # Check: Merchant Promotional Window (if configured)
            p_start = merchant.get("promo_start_hour")
            p_end = merchant.get("promo_end_hour")
            weekdays_only = bool(merchant.get("weekdays_only", False))
            if pd.notna(p_start) and pd.notna(p_end):
                if not (float(p_start) <= hour < float(p_end)):
                    skip_reason = skip_reason or "Outside the merchant's configured time window."
                    continue
                if weekdays_only and not is_weekday:
                    skip_reason = skip_reason or "Merchant rule applies to weekdays only."
                    continue

            # Check: Inventory signal
            inv_sig = str(merchant.get("inventory_signal", "healthy")).lower()
            if inv_sig == "sold_out":
                skip_reason = skip_reason or "Inventory signal low; avoid over-promising"
                continue

            # Retrieve Catalog items
            items = self.data_loader.get_catalog_items(mid)
            if not items:
                # Use merchant base item
                items = [{
                    "id": f"{mid}_base",
                    "merchant_id": mid,
                    "title": f"{merchant['name']} Special",
                    "price_inr": float(merchant.get("base_price_inr", 200.0)),
                    "prep_minutes": 8,
                    "stock_units": 15,
                    "is_veg": True
                }]

            # Max discount & Min margin constraints
            max_disc = float(merchant.get("max_discount_pct", 20.0))
            min_margin_pct = float(merchant.get("min_margin_pct", 12.0))
            m_base_price = float(merchant.get("base_price_inr", 200.0))
            m_base_cost = float(merchant.get("unit_cost_inr", 80.0))
            cost_ratio = min(0.65, max(0.2, m_base_cost / max(m_base_price, 1.0)))

            for item in items:
                stock = int(item.get("stock_units", 10))
                if stock <= 0:
                    continue

                item_price = float(item.get("price_inr", 150.0))
                prep_mins = float(item.get("prep_minutes", 8))
                item_unit_cost = round(item_price * cost_ratio, 2)

                # Check: Time feasibility including prep time
                total_trip_mins = (walk_mins * 2.0) + prep_mins
                if total_trip_mins > minutes_avail:
                    skip_reason = skip_reason or "Not enough time to fulfil the offer."
                    continue

                # Check: Wallet affordability even at max discount
                min_possible_price = item_price * (1.0 - max_disc / 100.0)
                if min_possible_price > wallet_val:
                    skip_reason = skip_reason or "No eligible item fits the available wallet."
                    continue

                # Search across discrete discount depths
                candidate_discounts = [d for d in self.CANDIDATE_DISCOUNTS if d <= max_disc]
                if not candidate_discounts:
                    candidate_discounts = [0.0]

                for disc_pct in candidate_discounts:
                    disc_amount = item_price * (disc_pct / 100.0)
                    final_price = item_price - disc_amount

                    # Wallet constraint
                    if final_price > wallet_val:
                        continue

                    # Margin floor constraint (only when discount is given)
                    if disc_pct > 0:
                        min_allowed_base_price = m_base_cost * (1.0 + min_margin_pct / 100.0)
                        if m_base_price * (1.0 - disc_pct / 100.0) < min_allowed_base_price:
                            continue

                        min_allowed_price = item_unit_cost * (1.0 + min_margin_pct / 100.0)
                        if final_price < min_allowed_price:
                            continue

                    # Calculate Unit Margin
                    unit_margin = final_price - item_unit_cost
                    if unit_margin <= 0:
                        continue

                    # Extract ML feature vector
                    feats = FeatureExtractor.extract_features(
                        customer=customer,
                        merchant=merchant,
                        context=context,
                        offer_discount_pct=disc_pct,
                        item=item
                    )

                    # Predict Acceptance Probability with trained ML model
                    p_accept = self.predictor.predict_proba(feats)

                    # Calculate Expected Profit
                    # E[Profit] = P(Accept) * (Base Margin - Discount Amount) = P(Accept) * Unit Margin
                    expected_profit = p_accept * unit_margin

                    if expected_profit > best_expected_profit:
                        best_expected_profit = expected_profit
                        best_candidate = {
                            "merchant": merchant,
                            "item": item,
                            "discount_pct": disc_pct,
                            "discount_amount": disc_amount,
                            "final_price": final_price,
                            "unit_cost": item_unit_cost,
                            "unit_margin": unit_margin,
                            "p_accept": p_accept,
                            "expected_profit": expected_profit,
                            "distance_m": dist_m,
                            "walk_minutes": walk_mins,
                            "features": feats
                        }

        # -------------------------------------------------------------
        # 3. Decision Formation & Output
        # -------------------------------------------------------------
        # If no valid candidate offer found or expected profit is negligible
        if best_candidate is None or best_candidate["p_accept"] < 0.05 or best_expected_profit <= 0:
            return {
                "scenario_id": sid,
                "action": "skip",
                "reason": skip_reason or "Context or commercial constraints do not yield a viable profit-positive offer.",
                "profit_estimate_inr": 0.0
            }

        # An optimal profit-maximizing offer exists!
        m = best_candidate["merchant"]
        it = best_candidate["item"]
        disc_pct = best_candidate["discount_pct"]
        final_price = best_candidate["final_price"]
        walk_mins = best_candidate["walk_minutes"]
        dist_m = best_candidate["distance_m"]
        exp_profit = best_candidate["expected_profit"]
        lang = str(customer.get("language", "en")).lower()

        # Build grounded notification localized to customer language
        notif = self._build_notification(
            customer_name=customer.get("name", "there"),
            merchant_name=m["name"],
            item_title=it["title"],
            discount_pct=disc_pct,
            final_price=final_price,
            walk_minutes=walk_mins,
            temp_c=temp_c,
            language=lang
        )

        weather_note = f"{temp_c:.0f}°C {condition}"

        return {
            "scenario_id": sid,
            "action": "send",
            "reason": f"Context and commercial rules allow a grounded offer. Optimal profit at {disc_pct:.0f}% discount.",
            "offer": {
                "merchant_id": m["id"],
                "discount_pct": float(disc_pct),
                "item_id": it["id"],
                "final_price_inr": float(round(final_price, 2)),
                "valid_minutes": int(min(minutes_avail, 45))
            },
            "notification": notif,
            "ui_hints": {
                "distance_m": int(round(dist_m)),
                "walk_minutes": int(round(walk_mins)),
                "weather_note": weather_note
            },
            "profit_estimate_inr": float(round(exp_profit, 2)),
            "ml_details": {
                "predicted_p_accept": float(round(best_candidate["p_accept"], 4)),
                "unit_margin_inr": float(round(best_candidate["unit_margin"], 2)),
                "item_base_price": float(it["price_inr"]),
            }
        }

    def _build_notification(
        self,
        customer_name: str,
        merchant_name: str,
        item_title: str,
        discount_pct: float,
        final_price: float,
        walk_minutes: float,
        temp_c: float,
        language: str
    ) -> Dict[str, str]:
        """
        Generates a grounded notification strictly mentioning merchant name and real numbers.
        Localized to language preference (en, hi-en, kn-en, te-en, ta-en).
        """
        disc_text = f"{int(discount_pct)}% off" if discount_pct > 0 else "Special"
        walk_text = f"{int(round(walk_minutes))} min walk"

        if "hi" in language:
            title = f"{merchant_name} par {disc_text}"
            body = f"{merchant_name} par {item_title} ke saath lunch enjoy karein at ₹{final_price:.0f}. Sirf {walk_text} door!"
            cta = "Abhi grab karein"
        elif "kn" in language:
            title = f"{merchant_name} alli {disc_text}"
            body = f"{merchant_name} nalli {item_title} matthu bisi break at ₹{final_price:.0f}. Kevala {walk_text} dooradalli."
            cta = "Ivara labha padeyiri"
        elif "te" in language:
            title = f"{merchant_name} lo {disc_text}"
            body = f"{merchant_name} lo {item_title} ₹{final_price:.0f} ke pondandi. Kevalam {walk_text} dooram."
            cta = "Ipude pondandi"
        elif "ta" in language:
            title = f"{merchant_name} il {disc_text}"
            body = f"{merchant_name} il {item_title} ₹{final_price:.0f} mattrum nalla break. Verum {walk_text} thoorathil."
            cta = "Udanadiyaga perunga"
        else:
            title = f"{merchant_name}: {disc_text} on {item_title}"
            body = f"Enjoy {item_title} at {merchant_name} for ₹{final_price:.0f}. Just a {walk_text} away."
            cta = "Claim offer"

        return {
            "title": title,
            "body": body,
            "language": language,
            "cta": cta
        }
