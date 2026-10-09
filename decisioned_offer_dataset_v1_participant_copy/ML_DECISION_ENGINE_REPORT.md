# Decisioned Offer System: ML Decision Engine & Profit Optimization Report

## 1. Executive Summary & Architecture Overview

The **Decisioned Offer System** transforms static discount coupons into a real-time, context-aware predictive decision engine. Instead of blindly sending generic offers or giving away excessive margin, the system predicts customer acceptance probability using machine learning and optimizes for **expected merchant profit** under operational and commercial constraints.

```mermaid
flowchart TD
    subgraph S1["1. Data Ingestion & Feature Engineering"]
        A[Customer Profiles] --> FE[Feature Extractor]
        B[Merchant Catalog] --> FE
        C[Weather Feed & Events] --> FE
        FE --> FVec[Unified 55-D Feature Vector\nGeospatial + Behavioral + Contextual]
    end

    subgraph S2["2. Data Collection & Simulator"]
        FVec --> Policy[Epsilon-Greedy Exploration Policy]
        Policy --> Sim[Hidden User Response Simulator\nRandom Utility Choice Model]
        Sim --> Logs[(10,000 Interaction Logs\nAccept / Decline + Context)]
    end

    subgraph S3["3. Predictive Decision Engine"]
        Logs --> Train[Gradient Boosted Classifier\nXGBoost + 3-Fold Isotonic Calibration]
        Train --> Model[Calibrated ML Model\nROC-AUC: 0.9655 | r: 0.9534]
    end

    subgraph S4["4. Profit Optimization Logic"]
        TargetCtx[Live Scenario: User + Moment] --> Filter[Hard Guardrails Filter\nConsent, Open Hours, Distance, Wallet]
        Filter --> DiscSearch[Discount Depth Search: 0%, 5%, 10%, 15%, 20%]
        DiscSearch --> MarginCheck[Margin Floor Guard\nMin Margin & Max Discount]
        MarginCheck --> Model
        Model --> PAcc[Predicted P(Accept)]
        PAcc --> ExpProf["E[Profit] = P(Accept) * Unit Margin"]
        ExpProf --> BestOffer[ArgMax Profit Selection]
    end

    subgraph S5["Output Layer"]
        BestOffer --> Card[Localized Grounded Notification Card\nTitle, Body, CTA, Distance, Weather, Profit INR]
    end
```

---

## 2. Step 1: Data Ingestion & Feature Engineering

### 2.1 Unified Data Ingestion (`decision_engine/data_loader.py`)
The system unifies 5 disparate data feeds by aligning timestamps, geolocation coordinates, and business constraints:
- **`customers.csv` (350 profiles)**: Geolocation (`current_lat`, `current_lng`), available wallet (`wallet_inr`), `marketing_consent`, `price_sensitivity`, `churn_risk`, historical `avg_spend`, `declared_preferences`, and `observed_signals`.
- **`merchants.csv` (100 merchants)**: Coordinates, operational hours (`open_hour`, `close_hour`), promo windows (`promo_start_hour`, `promo_end_hour`, `weekdays_only`), capacity, occupancy rate, `max_discount_pct`, `min_margin_pct`, `base_price_inr`, `unit_cost_inr`, and `inventory_signal`.
- **`catalog_items.csv` (266 items)**: Menu items, prices, preparation times, vegetarian flags, stock units, and tags.
- **`weather_hourly.csv` (168 hours)**: Hourly temperature (`temp_c`), condition, rainfall (`rain_mm`), humidity, wind speed.
- **`festivals.csv` (8 event windows)**: Diwali, Holi, IPL, monsoon, etc., with category affinity boosts.

### 2.2 Engineered Feature Families (`decision_engine/features.py`)
A canonical 55-dimensional feature vector is generated per candidate offer:

| Feature Family | Key Engineered Features | Mathematical / Logical Definition |
| :--- | :--- | :--- |
| **Geospatial** | `distance_m`, `distance_km`, `walk_minutes`, `is_walkable_1km`, `distance_to_time_ratio` | Haversine great-circle formula: $2R \arcsin(\sqrt{\sin^2(\Delta \phi/2) + \cos\phi_1\cos\phi_2\sin^2(\Delta \lambda/2)})$. Walking speed: 80 m/min. |
| **Behavioral (User)** | `user_wallet_inr`, `price_sensitivity`, `churn_risk`, `user_category_preference_match`, `category_novelty_affinity` | Price elasticity parameter $\in [0, 1]$; category fatigue bonus when user visited the same category repeatedly (e.g., dosa fatigue). |
| **Behavioral (Merchant)** | `merchant_occupancy_pct`, `merchant_idle_seats`, `merchant_idle_ratio`, `inventory_signal_code` | Idle capacity: $\text{capacity} \times (1 - \text{occupancy}/100)$. Inventory signal: low (0), healthy (1), surplus (2). |
| **Pricing & Economics** | `offer_discount_pct`, `effective_price_inr`, `unit_cost_inr`, `post_discount_margin_inr`, `wallet_affordability_ratio` | Effective price: $P \times (1 - d)$. Post-discount margin: $P(1 - d) - C$. Cost ratio: $C_{\text{base}} / P_{\text{base}}$. |
| **Contextual (Time & Weather)** | `hour_of_day`, `day_of_week`, `is_weekday`, `is_lunch_window`, `is_hot`, `is_rainy`, `weather_category_affinity`, `time_budget_stress` | Weather affinity: $+1.5$ for hot weather ($\ge 30^\circ\text{C}$) + afternoon lunch + cafe iced drinks. Time stress: $(2 \times \text{walk\_mins} + \text{prep\_mins}) / \text{minutes\_available}$. |

---

## 3. Step 2: Data Collection (Interacting with the Simulator)

### 3.1 Hidden User Response Simulator (`decision_engine/simulator.py`)
To replicate real-world consumer choice, the simulator implements a **Random Utility Model (RUM)**:
$$U = \beta_0 + U_{\text{discount}} - U_{\text{distance}} - U_{\text{stress}} + U_{\text{weather}} + U_{\text{affinity}} + U_{\text{capacity}} + U_{\text{promo}}$$
- **Hard Guardrails**: Sets $P(\text{accept}) = 0.0$ if marketing consent is False, effective price exceeds wallet, trip time exceeds break, or merchant is closed.
- **Discount Elasticity**: $U_{\text{discount}} = 1.6 \times \left(\frac{d}{15}\right) \times (0.6 + 0.8 \times \text{price\_sensitivity})$.
- **Distance Decay**: $U_{\text{distance}} = 0.55 \times \left(\frac{\text{dist\_m}}{350}\right)^{1.35}$ (steep drop past 500m).
- **Stochastic Response**: $\text{accepted} \sim \text{Bernoulli}(\sigma(U))$.

### 3.2 Exploratory Data Collection (`decision_engine/data_collector.py`)
Using an $\epsilon$-greedy exploratory policy ($\epsilon = 0.25$ exploration vs $0.75$ heuristic exploitation), 10,000 interactions were generated across the 350 customers, 100 merchants, and 168 weather hours:

```
Exploration Complete! Generated 10,000 interaction logs.
Overall Acceptance Rate: 6.22%

Acceptance Rate by Discount Depth:
  Discount  0.0%:  2.79% (1,971 samples)
  Discount  5.0%:  3.56% (1,995 samples)
  Discount 10.0%:  5.61% (1,960 samples)
  Discount 15.0%:  8.54% (1,990 samples)
  Discount 20.0%:  9.46% (1,363 samples)
  Discount 25.0%: 12.07% (  721 samples)

Acceptance Rate by Walkable Distance:
  <= 400m:     24.04%
  400m - 1km:  12.36%
  1km - 2km:    1.66%
  > 2km:        0.03%
```

---

## 4. Step 3: Predictive Decision Engine

### 4.1 Model Architecture & Calibration (`decision_engine/model.py`)
- **Base Estimator**: XGBoost Classifier (`n_estimators=300`, `learning_rate=0.04`, `max_depth=5`, `subsample=0.85`, `colsample_bytree=0.85`, `eval_metric='logloss'`).
- **Probability Calibration**: 3-fold cross-validated **Isotonic Regression** (`CalibratedClassifierCV`) mapping raw tree margins into true posterior probabilities $P(\text{accept}) \in [0, 1]$.

### 4.2 Model Performance Metrics
Evaluated on a held-out test split (2,000 unseen interactions):

| Metric | Score | Interpretation |
| :--- | :--- | :--- |
| **ROC-AUC** | **0.9655** | Near-perfect discrimination between accepting and declining contexts |
| **Log Loss** | **0.1046** | Extremely well-calibrated cross-entropy loss |
| **Brier Score** | **0.0345** | Minimal mean squared error of predicted probabilities |
| **Latent Probability Correlation** | **0.9534** | 95.3% Pearson correlation with ground-truth latent user willingness |
| **Accuracy** | **94.85%** | Correct classification on discrete decisions |

### 4.3 Feature Importances
Top features driving predictions:
1. `is_evening` (0.2055)
2. `merchant_is_open` (0.1595)
3. `distance_to_time_ratio` (0.0793)
4. `offer_discount_pct` (0.0416)
5. `time_budget_stress` (0.0360)
6. `distance_km` / `distance_m` (0.0561)
7. `fits_user_wallet` (0.0253)
8. `user_category_preference_match` (0.0202)

---

## 5. Step 4: Profit Optimization Logic

### 5.1 Formulation (`decision_engine/optimizer.py`)
$$\max_{m \in \mathcal{M}_{\text{eligible}},\, i \in \mathcal{I}_m,\, d \in \mathcal{D}_m} \mathbb{E}[\text{Profit}(m, i, d)] = \hat{P}(\text{accept} \mid \mathbf{x}) \times \left( \text{Price}_i \times (1 - d) - \text{Cost}_i \right)$$

### 5.2 Strict Hard Constraints & Margin Guards
1. **Consent Block**: If `marketing_consent == False` $\implies$ return `skip` immediately.
2. **Operational Window**: Merchant must be open at timestamp hour.
3. **Distance & Time Sanity**: Total trip time $(2 \times \text{walk\_mins} + \text{prep\_mins}) \le \text{minutes\_available}$ and distance $\le 1.5$ km.
4. **Wallet Cap**: Discounted price $\le \text{wallet\_inr}$.
5. **Inventory**: Stock units $> 0$ and inventory signal $\neq \text{'sold\_out'}$.
6. **Margin Floor**: For any $d > 0$, post-discount margin must satisfy:
   $$\text{Price} \times (1 - d) \ge \text{Cost} \times (1 + \text{min\_margin\_pct} / 100)$$

---

## 6. Walkthrough: Priya's Tuesday

### 6.1 Context
- **Customer**: Priya (`c_001`), Age 26, Koramangala. Available break: 20 minutes. Wallet: ₹400.
- **Context**: Tuesday, 1:15 PM, 33°C Sunny. Observed signal: visited the same dosa place 3 times this week (restaurant fatigue).
- **Merchant**: Little Fern Café (`m_001`), Koramangala. Distance: **136.6 meters (2 min walk)**. Occupancy: 18% (empty seats). Rule: "Fill seats between 1–3 PM on weekdays; max 20% discount".
- **Item**: *"Iced coffee & lunch bowl"* (`i_001_1`), Base Price: ₹150.00, Unit Cost: ₹32.29.

### 6.2 ML Optimization Curve Across Discount Depths

```
------------------------------------------------------------------------------------------
Discount %  Disc Amt (₹)  Final Price   Margin (₹)  P(Accept)     E[Profit] (₹)   Note
------------------------------------------------------------------------------------------
     0.0%    ₹    0.00      ₹  150.00      ₹  117.71      44.47%      ₹   52.35        
     5.0%    ₹    7.50      ₹  142.50      ₹  110.21      44.82%      ₹   49.40        
    10.0%    ₹   15.00      ₹  135.00      ₹  102.71      68.38%      ₹   70.24   ★ OPTIMAL
    15.0%    ₹   22.50      ₹  127.50      ₹   95.21      73.38%      ₹   69.87        
    20.0%    ₹   30.00      ₹  120.00      ₹   87.71      75.08%      ₹   65.85        
------------------------------------------------------------------------------------------
```

### 6.3 Policy Comparison
- **Policy 1 (Zero Discount)**: $P(\text{accept}) = 44.47\% \implies \mathbb{E}[\text{Profit}] = ₹52.35$
- **Policy 2 (Naive Max 20% Discount)**: $P(\text{accept}) = 75.08\% \implies \mathbb{E}[\text{Profit}] = ₹65.85$ (High clicks, but erodes margin!)
- **Policy 3 (ML Profit Optimizer at 10%)**: $P(\text{accept}) = 68.38\% \implies \mathbb{E}[\text{Profit}] = \mathbf{₹70.24}$
- **Outcome**: **+34.2% higher expected merchant profit** than zero discount, and **+6.7% higher profit** than giving away the maximum 20% discount.

### 6.4 Generated Grounded Notification Card
```json
{
  "scenario_id": "cur_001",
  "action": "send",
  "reason": "Context and commercial rules allow a grounded offer. Optimal profit at 10% discount.",
  "offer": {
    "merchant_id": "m_001",
    "discount_pct": 10.0,
    "item_id": "i_001_2",
    "final_price_inr": 135.0,
    "valid_minutes": 20
  },
  "notification": {
    "title": "Little Fern Café par 10% off",
    "body": "Little Fern Café par Cold brew coffee ke saath lunch enjoy karein at ₹135. Sirf 2 min walk door!",
    "language": "hi-en",
    "cta": "Abhi grab karein"
  },
  "ui_hints": {
    "distance_m": 137,
    "walk_minutes": 2,
    "weather_note": "33°C sunny"
  },
  "profit_estimate_inr": 71.04
}
```

---

## 7. Official Benchmark & Holdout Scoring

Running `eval/evaluator.py` across all test scenarios yielded:
- **Groundedness Score**: **1.000 (100.0%)** (No hallucinations of prices, items, or merchants)
- **Constraint Respect**: **1.000 (100.0%)** (Zero consent violations, zero margin breaches, zero closed merchant sends)
- **Decision Match**: **0.879 (87.9%)**
- **Overall Holdout Score**: **0.872 (87.2%)**
- Generated submission file: `eval/submission_holdout_blind.jsonl` (56 holdout scenarios).
