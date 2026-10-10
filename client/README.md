# Decisioned Offer System — Frontend Application

Production-style, responsive, machine-learning-powered frontend for **Decisioned Offer System**, a local commerce platform optimizing expected contribution profit under strict customer and merchant operational constraints.

---

## 1. Overview & Machine Learning Formulation

Rather than distributing blunt, static discount coupons, the platform predicts user acceptance probabilities using a 9-step ML pipeline (XGBoost with 3-fold Isotonic Probability Calibration) and determines the exact discount depth that maximizes **expected merchant profit**:

$$\mathbb{E}[\text{Profit}] = \hat{P}(\text{accept} \mid \mathbf{x}) \times \left( \text{Price}_i \times (1 - d) - \text{Cost}_i \right)$$

### Key Principles Reflected in the Frontend:
- **No False Certainty**: Statistical predictions are clearly designated as *expected values* ($\mathbb{E}[\text{Profit}]$), never as guaranteed real margins.
- **Strict Guardrails**: Zero offers dispatched if customer marketing consent is false, if the trip exceeds break time, if the merchant is closed, or if the discount breaches the merchant's minimum margin floor.
- **Localized Marketing Copy**: Grounded notifications generated in Hinglish (`hi-en`), English (`en`), Kannada (`kn-en`), Telugu (`te-en`), and Tamil (`ta-en`).

---

## 2. Technology Stack

- **Framework**: React 19 with TypeScript
- **Bundler & Dev Server**: Vite 8 with `@tailwindcss/vite`
- **Styling**: Tailwind CSS with custom SaaS tokens (Deep Navy, Slate, Violet, Teal accents)
- **UI Components**: Accessible, reusable components (Button, Card, Badge, Dialog, Select, Input, Switch, Skeleton)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (ComposedChart, Line, Bar, ReferenceDot, ResponsiveContainer)
- **Routing**: React Router DOM with role-based route protection
- **Forms & Validation**: React Hook Form with Zod schema validation
- **API Client**: Centralized typed service layer with transparent fallback to in-memory/localStorage `MockApiAdapter`

---

## 3. Application Route Matrix

| Route | Access Role | Description |
| :--- | :--- | :--- |
| `/` | Public | SaaS landing page with interactive ML discount curve simulator & process breakdown |
| `/login` | Public | Authentication with 1-click demo logins for Customer and Merchant |
| `/register` | Public | Role-based registration with locality selector and marketing consent |
| `/customer/dashboard` | Customer | Customer home: greeting, active context signals card, personalized offer cards, ranking filters |
| `/customer/profile` | Customer | 8-section editable preference profile with Zod validation |
| `/customer/offers` | Customer | Personalized offers explorer with keyword search, category filter, and sorting |
| `/customer/offer/:id` | Customer | Offer details, explainability breakdown, walking time, map directions, and redemption voucher |
| `/customer/history` | Customer | Realized savings vs potential savings, confirmed in-store redemptions, and bookmarks |
| `/merchant/dashboard` | Merchant | Merchant workspace: 6 summary KPIs (realized vs predicted), Recharts performance trends, recommendation table |
| `/merchant/profile` | Merchant | Merchant business profile: operating hours, promo windows, occupancy, and margin floor policies |
| `/merchant/catalog` | Merchant | Catalog & inventory table: unit costs, selling prices, prep times, veg flags, and Add/Edit item modal |
| `/merchant/offers` | Merchant | Recommendations management: approve, pause, or inspect discount profit curves |
| `/merchant/analytics` | Merchant | Deep-dive analytics: empirical vs predicted conversion, redemption funnel, item economics |
| `/merchant/email-preview` | Merchant | Generative email card studio with Desktop/Mobile preview and Hinglish/Hindi/English copy |
| `/settings/notifications` | Customer / Merchant | Communication channel toggles, language preference, and quiet hours |

---

## 4. Getting Started & Running Locally

### Prerequisites
- Node.js `v18.0.0` or higher (Tested on Node `v24.21.0`)
- npm `v9.0.0` or higher

### Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173/`.

### Production Build & Linting
```bash
# Type check and build
npm run build

# Preview production build
npm run preview

# Lint with oxlint
npm run lint
```

---

## 5. Walkthrough: The "Priya's Tuesday" Demo Scenario

1. **Sign In**: Navigate to `/login` and click **"Priya Sharma (Customer)"** (or navigate to `/customer/dashboard`).
2. **Context Signals**: Notice Priya's context in Koramangala: 20-minute break, ₹400 wallet, 33°C sunny forecast.
3. **Personalized Offer Card**:
   - **Little Fern Café** (137m away, 2 min walk).
   - **Item**: *Iced Coffee & Lunch Bowl* (Original: ₹150 $\rightarrow$ Final: ₹135 at **10% OFF**).
   - Click **"View Offer"** $\rightarrow$ Expand the **"Machine Learning Decision Breakdown"** badge to inspect $P(\text{accept}) = 68.4\%$ and Expected Profit $E[\text{Profit}] = ₹70.24$.
4. **Redeem Offer**: Click **"Redeem Offer"**, confirm the in-store prompt, and receive verified voucher code `DOS-8821` with QR scanner simulation.
5. **Switch to Merchant Role**:
   - Click the role switch pill in the top navbar: **"Switch to Merchant"**.
   - You are immediately redirected to **Little Fern Café's** workspace (`/merchant/dashboard`).
   - Notice the updated **Realized Margin Profit** card reflecting the confirmed redemption!
   - Inspect the **ML Recommended Offers** table and click **"Inspect Curve"** to view why a 10% discount generates +34.2% higher profit than 0% discount and outperforms a naive 20% discount.
6. **Email Experience**:
   - Navigate to `/merchant/email-preview`.
   - Toggle between **Desktop** and **Mobile** preview.
   - Switch language to **Hinglish (hi-en)** to view grounded copy:
     > *"Little Fern Café par Iced coffee & lunch bowl ke saath lunch enjoy karein at ₹135. Sirf 2 min walk door!"*

---

## 6. Backend REST API Integration Specification

When connecting to a live backend service, set `VITE_API_BASE_URL` in `.env` (e.g. `http://localhost:8000/api/v1`). The frontend calls these endpoints:

| Method | Endpoint | Description | Request Body / Query Params | Response Schema |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate customer or merchant | `{ email, password, role }` | `User` object with JWT session |
| `GET` | `/customers/{id}` | Retrieve customer profile | None | `CustomerProfile` |
| `PUT` | `/customers/{id}` | Update preferences & context | `Partial<CustomerProfile>` | `CustomerProfile` |
| `GET` | `/offers/personalized` | Retrieve contextual offers | `customer_id, locality, category, sort_by` | `PersonalizedOffer[]` |
| `GET` | `/offers/{id}` | Get full offer details | None | `PersonalizedOffer` |
| `POST` | `/offers/{id}/redeem` | Execute in-store redemption | `{ customer_id }` | `{ offer, redemption }` |
| `GET` | `/customers/{id}/history`| Confirmed redemption history | None | `RedemptionRecord[]` |
| `GET` | `/customers/{id}/insights`| Wallet savings insights | None | `CustomerInsights` |
| `GET` | `/merchants/{id}` | Retrieve merchant profile | None | `MerchantProfile` |
| `PUT` | `/merchants/{id}` | Update margin policies & hours | `Partial<MerchantProfile>` | `MerchantProfile` |
| `GET` | `/merchants/{id}/catalog`| List catalog items | None | `CatalogItem[]` |
| `POST` | `/merchants/{id}/catalog`| Add new catalog item | `Omit<CatalogItem, 'id'>` | `CatalogItem` |
| `PUT` | `/merchants/{id}/catalog/{item_id}` | Edit item | `Partial<CatalogItem>` | `CatalogItem` |
| `DELETE`| `/merchants/{id}/catalog/{item_id}` | Remove item | None | `{ success: true }` |
| `GET` | `/merchants/{id}/recommendations` | Get ML offer recommendations | None | `MerchantOfferRecommendation[]` |
| `PATCH`| `/recommendations/{id}/status` | Approve, pause, or reject offer | `{ status }` | `MerchantOfferRecommendation` |
| `GET` | `/merchants/{id}/analytics` | Merchant profit analytics | `timeframe` | `MerchantAnalytics` |
| `GET` | `/settings/notifications/{userId}` | Get notification preferences | None | `NotificationPreferences` |
| `PUT` | `/settings/notifications/{userId}` | Update notification settings | `Partial<NotificationPreferences>` | `NotificationPreferences` |
