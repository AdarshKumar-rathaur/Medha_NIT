export type UserRole = 'customer' | 'merchant' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  locality?: string
}

export type SupportedLanguage = 'en' | 'hi-en' | 'kn-en' | 'te-en' | 'ta-en' | 'hi'

export interface CustomerProfile {
  id: string
  name: string
  age: number
  email: string
  language: SupportedLanguage
  locality: string
  home_lat: number
  home_lng: number
  current_lat: number
  current_lng: number
  wallet_inr: number
  price_sensitivity: number // 0.0 to 1.0
  churn_risk: number // 0.0 to 1.0
  marketing_consent: boolean
  declared_preferences: string[]
  observed_signals: string[]
  dietary_preferences: string[]
  max_travel_distance_m: number
  minutes_available: number
  notification_email: boolean
  notification_sms: boolean
  notification_push: boolean
  context_note?: string
}

export type MerchantCategory =
  | 'cafe'
  | 'restaurant'
  | 'bakery'
  | 'dessert'
  | 'grocery'
  | 'pharmacy'
  | 'salon'
  | 'gym'
  | 'wellness'
  | 'dentist'

export type InventorySignal = 'low' | 'healthy' | 'surplus' | 'sold_out'

export interface MerchantProfile {
  id: string
  name: string
  category: MerchantCategory
  locality: string
  lat: number
  lng: number
  capacity: number
  occupancy_pct: number
  max_discount_pct: number
  min_margin_pct: number
  open_hour: number
  close_hour: number
  promo_start_hour?: number
  promo_end_hour?: number
  weekdays_only: boolean
  objective: string
  languages: string[]
  inventory_signal: InventorySignal
  base_price_inr: number
  unit_cost_inr: number
  contact_email: string
  image_url?: string
}

export interface CatalogItem {
  id: string
  merchant_id: string
  title: string
  category: string
  price_inr: number
  unit_cost_inr: number
  stock_units: number
  prep_minutes: number
  is_veg: boolean
  tags: string[]
  description?: string
  image_url?: string
  is_active: boolean
}

export type OfferStatus = 'available' | 'saved' | 'redeemed' | 'expired' | 'dismissed'

export interface GroundedNotification {
  title: string
  body: string
  cta: string
  language: SupportedLanguage
}

export interface PersonalizedOffer {
  id: string
  scenario_id: string
  customer_id: string
  merchant_id: string
  merchant_name: string
  merchant_category: string
  merchant_locality: string
  item_id: string
  item_title: string
  item_image?: string
  original_price_inr: number
  discount_pct: number
  discount_amount_inr: number
  final_price_inr: number
  unit_cost_inr: number
  post_discount_margin_inr: number
  predicted_p_accept: number // 0.0 to 1.0
  expected_profit_inr: number // predicted_p_accept * post_discount_margin_inr
  distance_m: number
  walk_minutes: number
  valid_minutes: number
  expires_at: string
  reason: string
  terms_and_conditions: string[]
  status: OfferStatus
  redemption_code?: string
  redeemed_at?: string
  notification: GroundedNotification
  weather_note?: string
  is_demo: boolean
}

export interface DiscountCurvePoint {
  discount_pct: number
  discount_amount_inr: number
  final_price_inr: number
  margin_inr: number
  predicted_p_accept: number
  expected_profit_inr: number
  is_optimal: boolean
}

export type RecommendationStatus = 'recommended' | 'approved' | 'rejected' | 'paused'

export interface MerchantOfferRecommendation {
  id: string
  merchant_id: string
  item_id: string
  item_title: string
  item_category: string
  item_image?: string
  original_price_inr: number
  suggested_discount_pct: number
  proposed_final_price_inr: number
  unit_cost_inr: number
  margin_amount_inr: number
  margin_pct: number
  predicted_acceptance_prob: number // 0.0 to 1.0
  expected_profit_per_opportunity_inr: number // prob * margin
  inventory_status: InventorySignal
  stock_units: number
  valid_time_window: string
  recommendation_status: RecommendationStatus
  eligible_audience_size: number
  reason: string
  curve_points: DiscountCurvePoint[]
}

export interface RedemptionRecord {
  id: string
  offer_id: string
  scenario_id: string
  customer_id: string
  customer_name: string
  merchant_id: string
  merchant_name: string
  item_title: string
  original_price_inr: number
  discount_pct: number
  final_price_inr: number
  unit_cost_inr: number
  realized_margin_inr: number
  realized_savings_inr: number
  predicted_p_accept: number
  predicted_expected_profit_inr: number
  redeemed_at: string
  verification_code: string
}

export interface MerchantAnalytics {
  active_offers_count: number
  available_inventory_units: number
  current_occupancy_pct: number
  offers_redeemed_count: number
  realized_contribution_profit_inr: number // Actual real transactions
  predicted_expected_profit_inr: number // Model predictions across active offers
  daily_performance: Array<{
    date: string
    predicted_expected_profit: number
    realized_profit: number
    offers_shown: number
    redemptions: number
  }>
  conversion_comparison: Array<{
    category: string
    predicted_conversion_pct: number
    actual_realized_conversion_pct: number
  }>
  funnel_stages: Array<{
    stage: string
    count: number
    rate_pct: number
  }>
  product_performance: Array<{
    item_id: string
    item_title: string
    discount_pct: number
    total_distributed: number
    total_redeemed: number
    conversion_rate_pct: number
    realized_profit_inr: number
    expected_profit_inr: number
  }>
}

export interface CustomerInsights {
  active_offers_count: number
  saved_offers_count: number
  redeemed_offers_count: number
  realized_savings_inr: number // Actual money saved on recorded redemptions
  potential_available_savings_inr: number // Hypothetical if all active offers claimed
}

export interface NotificationPreferences {
  email_marketing: boolean
  offer_expiry_alerts: boolean
  daily_digest: boolean
  sms_alerts: boolean
  push_notifications: boolean
  preferred_language: SupportedLanguage
  quiet_hours_start: string
  quiet_hours_end: string
}

export interface ContextSimulationState {
  current_time: string // ISO string
  locality: string
  temperature_c: number
  weather_condition: string
  is_lunch_window: boolean
  is_weekend: boolean
  active_festival?: string
  minutes_available: number
  wallet_override?: number
}
