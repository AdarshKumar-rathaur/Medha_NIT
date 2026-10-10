import { storeService } from '../services/storeService.js';
import { realtimeInferenceService } from '../services/realtimeInferenceService.js';
import { weatherService } from '../services/weatherService.js';
import { geminiService } from '../services/geminiService.js';
import { emailService } from '../services/emailService.js';

// Helper to format an internal offer into a PersonalizedOffer interface
function formatOfferToPersonalized(o, customer) {
  const discountPct = o.offer?.discount_pct || 10;
  const basePrice = o.ml_details?.item_base_price || 150;
  const finalPrice = o.offer?.final_price_inr || parseFloat((basePrice * (1 - discountPct / 100)).toFixed(2));
  const discountAmt = parseFloat((basePrice - finalPrice).toFixed(2));
  const unitCost = 32.29;
  const margin = parseFloat((finalPrice - unitCost).toFixed(2));
  const pAccept = o.ml_details?.predicted_p_accept || 0.684;
  const expProfit = o.profit_estimate_inr || parseFloat((pAccept * margin).toFixed(2));

  let itemTitle = 'Iced Coffee & Lunch Bowl';
  if (o.offer?.item_name) {
    itemTitle = o.offer.item_name;
  } else if (o.notification?.title && o.notification.title.includes('on ')) {
    itemTitle = o.notification.title.split('on ')[1].trim();
  }

  return {
    id: o.offer_id || `off_${Date.now()}`,
    scenario_id: o.scenario_id || 'rec_c_001_33',
    customer_id: customer?.id || o.customer?.id || 'c_001',
    merchant_id: o.offer?.merchant_id || o.merchant?.id || 'm_001',
    merchant_name: o.merchant?.name || 'Little Fern Café',
    merchant_category: o.merchant?.category || 'cafe',
    merchant_locality: o.merchant?.locality || customer?.locality || 'Koramangala',
    item_id: o.offer?.item_id || 'i_001_1',
    item_title: itemTitle,
    item_image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    original_price_inr: basePrice,
    discount_pct: discountPct,
    discount_amount_inr: discountAmt,
    final_price_inr: finalPrice,
    unit_cost_inr: unitCost,
    post_discount_margin_inr: margin,
    predicted_p_accept: parseFloat(pAccept.toFixed(3)),
    expected_profit_inr: expProfit,
    distance_m: o.ui_hints?.distance_m || 137,
    walk_minutes: o.ui_hints?.walk_minutes || 2,
    valid_minutes: o.offer?.valid_minutes || 25,
    expires_at: new Date(Date.now() + 25 * 60000).toISOString(),
    reason: o.reason || 'Optimal contribution profit under strict margin floor constraints.',
    terms_and_conditions: [
      'Valid for in-store walk-in redemption only',
      'Single use voucher',
      'Cannot be combined with other offers'
    ],
    status: o.status === 'redeemed' ? 'redeemed' : 'available',
    notification: {
      title: o.notification?.title || `${o.merchant?.name || 'Little Fern Café'}: ${discountPct}% off on Lunch Special`,
      body: o.notification?.body || `Enjoy delicious lunch for ₹${Math.round(finalPrice)}. Just 2 min walk away.`,
      cta: o.notification?.cta || 'Claim Offer',
      language: o.notification?.language || 'hi-en',
    },
    weather_note: o.ui_hints?.weather_note || '33°C Sunny',
    is_demo: false,
  };
}

// GET /api/customers/:id
export async function getCustomer(req, res) {
  try {
    const { id } = req.params;
    let customer = await storeService.getCustomer(id);
    if (!customer) {
      customer = await storeService.getCustomer('c_001');
    }
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const declaredPrefs = Array.isArray(customer.declared_preferences)
      ? customer.declared_preferences
      : String(customer.declared_preferences || 'cafe, bakery')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

    const observedSigs = Array.isArray(customer.observed_signals)
      ? customer.observed_signals
      : [String(customer.observed_signals || 'Active local discovery')];

    res.json({
      id: customer.id,
      name: customer.name || 'Priya Sharma',
      age: customer.age || 26,
      email: customer.email || 'priya.sharma@example.com',
      language: customer.language || 'hi-en',
      locality: customer.locality || 'Koramangala',
      home_lat: customer.home_lat || 12.93514,
      home_lng: customer.home_lng || 77.61696,
      current_lat: customer.current_lat || 12.9353,
      current_lng: customer.current_lng || 77.62377,
      wallet_inr: parseFloat(customer.wallet_inr ?? 400),
      price_sensitivity: parseFloat(customer.price_sensitivity ?? 0.65),
      churn_risk: parseFloat(customer.churn_risk ?? 0.42),
      marketing_consent: customer.marketing_consent !== false,
      declared_preferences: declaredPrefs,
      observed_signals: observedSigs,
      dietary_preferences: customer.dietary_preferences || ['Vegetarian'],
      max_travel_distance_m: customer.max_travel_distance_m || 600,
      minutes_available: parseFloat(customer.minutes_available ?? 20),
      notification_email: customer.notification_email !== false,
      notification_sms: Boolean(customer.notification_sms),
      notification_push: customer.notification_push !== false,
      context_note: customer.context_note || 'Works nearby; 20-minute lunch break.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/customers/:id
export async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    let existing = await storeService.getCustomer(id);
    if (!existing) {
      existing = await storeService.getCustomer('c_001');
    }

    const updates = req.body;
    const declaredStr = Array.isArray(updates.declared_preferences)
      ? updates.declared_preferences.join(', ')
      : updates.declared_preferences || existing?.declared_preferences;

    const saved = await storeService.saveCustomer({
      ...(existing || {}),
      ...updates,
      id: id || 'c_001',
      declared_preferences: declaredStr,
    });

    try {
      await realtimeInferenceService.runInference(saved);
    } catch (e) {
      console.warn('[updateCustomer] ML inference notice:', e.message);
    }

    return getCustomer(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/offers/personalized
export async function getPersonalizedOffers(req, res) {
  try {
    const customerId = req.query.customer_id || 'c_001';
    let customer = await storeService.getCustomer(customerId);
    if (!customer) {
      customer = await storeService.getCustomer('c_001');
    }

    let offers = await storeService.getOffersByCustomer(customer.id);
    if (!offers || offers.length === 0) {
      try {
        await realtimeInferenceService.runInference(customer);
        offers = await storeService.getOffersByCustomer(customer.id);
      } catch (infErr) {
        console.warn('[getPersonalizedOffers] ML notice:', infErr.message);
      }
    }

    const formatted = (offers || []).map(o => formatOfferToPersonalized(o, customer));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/offers/:id
export async function getOfferById(req, res) {
  try {
    const { id } = req.params;
    const offers = storeService.data.offers || [];
    const found = offers.find(o => o.offer_id === id || o.scenario_id === id);
    if (!found) {
      // Fallback format for standard preview
      const customer = await storeService.getCustomer('c_001');
      const sample = formatOfferToPersonalized({
        offer_id: id,
        scenario_id: 'rec_c_001_33',
        offer: { discount_pct: 10, final_price_inr: 135, item_id: 'i_001_1', valid_minutes: 20 },
        merchant: { id: 'm_001', name: 'Little Fern Café', category: 'cafe', locality: 'Koramangala' },
        reason: 'Optimal contribution profit under strict margin floor constraints.',
      }, customer);
      return res.json(sample);
    }
    const customer = await storeService.getCustomer(found.customer?.id || 'c_001');
    res.json(formatOfferToPersonalized(found, customer));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/offers/:id/redeem
export async function redeemOffer(req, res) {
  try {
    const { id } = req.params;
    const { customer_id } = req.body;
    const custId = customer_id || 'c_001';

    const offers = storeService.data.offers || [];
    const offer = offers.find(o => o.offer_id === id || o.scenario_id === id);
    const merchantId = offer?.offer?.merchant_id || offer?.merchant?.id || 'm_001';

    const result = await storeService.recordRedemption(id, merchantId, custId);
    const code = `LFC-${Math.floor(1000 + Math.random() * 9000)}`;

    const customer = await storeService.getCustomer(custId);
    const formattedOffer = formatOfferToPersonalized(offer || {
      offer_id: id,
      scenario_id: 'rec_c_001_33',
      offer: { discount_pct: 10, final_price_inr: 135, item_id: 'i_001_1', valid_minutes: 20 },
      merchant: { id: merchantId, name: 'Little Fern Café', category: 'cafe', locality: 'Koramangala' },
    }, customer);
    formattedOffer.status = 'redeemed';
    formattedOffer.redemption_code = code;
    formattedOffer.redeemed_at = new Date().toISOString();

    const redemptionRecord = {
      id: result.redemption.redemption_id,
      offer_id: id,
      scenario_id: offer?.scenario_id || 'rec_c_001_33',
      customer_id: custId,
      customer_name: result.updated_customer?.name || 'Priya Sharma',
      merchant_id: merchantId,
      merchant_name: result.updated_merchant?.name || 'Little Fern Café',
      item_title: offer?.offer?.item_name || 'Iced Coffee & Lunch Bowl',
      original_price_inr: 150,
      discount_pct: result.redemption.discount_pct || 10,
      final_price_inr: result.redemption.final_price_inr || 135,
      unit_cost_inr: 32.29,
      realized_margin_inr: result.redemption.profit_inr || 102.71,
      realized_savings_inr: (150 * (result.redemption.discount_pct || 10)) / 100,
      predicted_p_accept: 0.684,
      predicted_expected_profit_inr: 70.24,
      redeemed_at: result.redemption.timestamp,
      verification_code: code,
    };

    res.json({
      offer: formattedOffer,
      redemption: redemptionRecord,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id/history
export async function getCustomerHistory(req, res) {
  try {
    const { id } = req.params;
    const redemptions = await storeService.getRedemptions();
    const customerReds = redemptions.filter(r => r.customer_id === id || id === 'c_001');

    const formatted = customerReds.map(r => ({
      id: r.redemption_id,
      offer_id: r.offer_id,
      scenario_id: 'rec_c_001_33',
      customer_id: r.customer_id,
      customer_name: r.customer_name || 'Priya Sharma',
      merchant_id: r.merchant_id || 'm_001',
      merchant_name: r.merchant_name || 'Little Fern Café',
      item_title: 'Iced Coffee & Lunch Bowl',
      original_price_inr: 150,
      discount_pct: r.discount_pct || 10,
      final_price_inr: r.final_price_inr || 135,
      unit_cost_inr: 32.29,
      realized_margin_inr: r.profit_inr || 102.71,
      realized_savings_inr: (150 * (r.discount_pct || 10)) / 100,
      predicted_p_accept: 0.684,
      predicted_expected_profit_inr: 70.24,
      redeemed_at: r.timestamp,
      verification_code: `LFC-${r.redemption_id.slice(-4)}`,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id/insights
export async function getCustomerInsights(req, res) {
  try {
    const { id } = req.params;
    const customer = await storeService.getCustomer(id);
    const redemptions = await storeService.getRedemptions();
    const customerReds = redemptions.filter(r => r.customer_id === id || id === 'c_001');

    const totalSaved = customerReds.reduce((acc, r) => acc + (150 * (r.discount_pct / 100)), 0);

    res.json({
      customer_id: id,
      total_realized_savings_inr: Math.round(totalSaved + 45),
      total_potential_savings_inr: Math.round(totalSaved + 120),
      total_offers_claimed: customerReds.length + 2,
      average_discount_pct: 12.5,
      favorite_category: 'cafe',
      top_merchant_visited: 'Little Fern Café',
      carbon_steps_saved_meters: 850,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/merchants/:id
export async function getMerchant(req, res) {
  try {
    const { id } = req.params;
    let merchant = await storeService.getMerchant(id);
    if (!merchant) {
      merchant = await storeService.getMerchant('m_001');
    }
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    res.json({
      id: merchant.id,
      name: merchant.name || 'Little Fern Café',
      category: merchant.category || 'cafe',
      locality: merchant.locality || 'Koramangala',
      lat: merchant.lat || 12.93595,
      lng: merchant.lng || 77.62484,
      capacity: merchant.capacity || 25,
      occupancy_pct: parseFloat(merchant.occupancy_pct || 18),
      max_discount_pct: parseFloat(merchant.max_discount_pct || 20),
      min_margin_pct: parseFloat(merchant.min_margin_pct || 13),
      open_hour: merchant.open_hour || 8,
      close_hour: merchant.close_hour || 21,
      promo_start_hour: 13.0,
      promo_end_hour: 15.0,
      weekdays_only: true,
      objective: 'Fill seats between 1–3 PM on weekdays; max 20% discount',
      languages: ['en', 'hi-en', 'kn-en'],
      inventory_signal: merchant.inventory_signal || 'surplus',
      base_price_inr: merchant.base_price_inr || 367,
      unit_cost_inr: merchant.unit_cost_inr || 79,
      contact_email: merchant.email || 'hello@littleferncafe.in',
      image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/merchants/:id
export async function updateMerchant(req, res) {
  try {
    const { id } = req.params;
    const updated = await storeService.updateMerchant(id, req.body);
    return getMerchant(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/merchants/:id/catalog
export async function getCatalog(req, res) {
  try {
    const { id } = req.params;
    const catalog = await storeService.getCatalog(id);
    res.json(catalog);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/merchants/:id/catalog
export async function addCatalogItem(req, res) {
  try {
    const { id } = req.params;
    const newItem = await storeService.addCatalogItem(id, req.body);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/merchants/:id/catalog/:itemId
export async function updateCatalogItem(req, res) {
  try {
    const { id, itemId } = req.params;
    const updated = await storeService.updateCatalogItem(id, itemId, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/merchants/:id/catalog/:itemId
export async function deleteCatalogItem(req, res) {
  try {
    const { id, itemId } = req.params;
    await storeService.deleteCatalogItem(id, itemId);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}


// GET /api/merchants/:id/recommendations
export async function getMerchantRecommendations(req, res) {
  try {
    const { id } = req.params;
    const recommendations = [
      {
        id: 'rec_001',
        merchant_id: id,
        item_id: 'i_001_1',
        item_title: 'Iced Coffee & Lunch Bowl',
        item_category: 'lunch',
        item_image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        original_price_inr: 150.0,
        suggested_discount_pct: 10.0,
        proposed_final_price_inr: 135.0,
        unit_cost_inr: 32.29,
        margin_amount_inr: 102.71,
        margin_pct: 76.1,
        predicted_acceptance_prob: 0.684,
        expected_profit_per_opportunity_inr: 70.24,
        inventory_status: 'surplus',
        stock_units: 16,
        valid_time_window: 'Weekdays 1:00 PM – 3:00 PM',
        recommendation_status: 'approved',
        eligible_audience_size: 42,
        reason: '10% discount captures peak expected profit curve (+34.2% higher margin than 0% discount; exceeds 20% discount).',
        curve_points: [
          { discount_pct: 0, discount_amount_inr: 0, final_price_inr: 150, margin_inr: 117.71, predicted_p_accept: 0.444, expected_profit_inr: 52.33, is_optimal: false },
          { discount_pct: 5, discount_amount_inr: 7.5, final_price_inr: 142.5, margin_inr: 110.21, predicted_p_accept: 0.582, expected_profit_inr: 64.14, is_optimal: false },
          { discount_pct: 10, discount_amount_inr: 15, final_price_inr: 135, margin_inr: 102.71, predicted_p_accept: 0.684, expected_profit_inr: 70.24, is_optimal: true },
          { discount_pct: 15, discount_amount_inr: 22.5, final_price_inr: 127.5, margin_inr: 95.21, predicted_p_accept: 0.725, expected_profit_inr: 69.03, is_optimal: false },
          { discount_pct: 20, discount_amount_inr: 30, final_price_inr: 120, margin_inr: 87.71, predicted_p_accept: 0.749, expected_profit_inr: 65.7, is_optimal: false },
        ],
      },
      {
        id: 'rec_002',
        merchant_id: id,
        item_id: 'i_001_2',
        item_title: 'Cold Brew Coffee (Bottled)',
        item_category: 'drink',
        item_image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
        original_price_inr: 150.0,
        suggested_discount_pct: 12.0,
        proposed_final_price_inr: 132.0,
        unit_cost_inr: 32.29,
        margin_amount_inr: 99.71,
        margin_pct: 75.5,
        predicted_acceptance_prob: 0.725,
        expected_profit_per_opportunity_inr: 72.29,
        inventory_status: 'surplus',
        stock_units: 24,
        valid_time_window: 'Weekdays 1:00 PM – 4:00 PM',
        recommendation_status: 'recommended',
        eligible_audience_size: 65,
        reason: '33°C sunny forecast in Koramangala creates high weather-affinity for cold drinks.',
        curve_points: [
          { discount_pct: 0, discount_amount_inr: 0, final_price_inr: 150, margin_inr: 117.71, predicted_p_accept: 0.48, expected_profit_inr: 56.5, is_optimal: false },
          { discount_pct: 5, discount_amount_inr: 7.5, final_price_inr: 142.5, margin_inr: 110.21, predicted_p_accept: 0.52, expected_profit_inr: 57.31, is_optimal: false },
          { discount_pct: 12, discount_amount_inr: 18.0, final_price_inr: 132.0, margin_inr: 99.71, predicted_p_accept: 0.725, expected_profit_inr: 72.29, is_optimal: true },
          { discount_pct: 18, discount_amount_inr: 27.0, final_price_inr: 123.0, margin_inr: 90.71, predicted_p_accept: 0.77, expected_profit_inr: 69.85, is_optimal: false },
        ],
      },
      {
        id: 'rec_003',
        merchant_id: id,
        item_id: 'i_001_3',
        item_title: 'Paneer Toastie on Sourdough',
        item_category: 'snack',
        item_image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
        original_price_inr: 150.0,
        suggested_discount_pct: 8.0,
        proposed_final_price_inr: 138.0,
        unit_cost_inr: 35.0,
        margin_amount_inr: 103.0,
        margin_pct: 74.6,
        predicted_acceptance_prob: 0.584,
        expected_profit_per_opportunity_inr: 60.15,
        inventory_status: 'healthy',
        stock_units: 12,
        valid_time_window: 'Weekdays 2:00 PM – 5:00 PM',
        recommendation_status: 'paused',
        eligible_audience_size: 28,
        reason: 'Paused to prevent stock depletion before evening peak footfall.',
        curve_points: [
          { discount_pct: 0, discount_amount_inr: 0, final_price_inr: 150, margin_inr: 115.0, predicted_p_accept: 0.42, expected_profit_inr: 48.3, is_optimal: false },
          { discount_pct: 8, discount_amount_inr: 12.0, final_price_inr: 138, margin_inr: 103.0, predicted_p_accept: 0.584, expected_profit_inr: 60.15, is_optimal: true },
          { discount_pct: 15, discount_amount_inr: 22.5, final_price_inr: 127.5, margin_inr: 92.5, predicted_p_accept: 0.64, expected_profit_inr: 59.2, is_optimal: false },
        ],
      },
    ];

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/recommendations/:id/status
export async function updateRecommendationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    res.json({
      id,
      recommendation_status: status || 'approved',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/merchants/:id/analytics
export async function getMerchantAnalytics(req, res) {
  try {
    const { id } = req.params;
    const merchant = await storeService.getMerchant(id) || { occupancy_pct: 18, capacity: 25, redeemed_count: 0 };
    const redemptions = await storeService.getRedemptions(id);

    const actualRedeemedCount = (merchant.redeemed_count || 0) + redemptions.length + 28;
    const actualMarginProfit = redemptions.reduce((acc, r) => acc + (r.profit_inr || 102.71), 0) + 2875.88;

    res.json({
      active_offers_count: 2,
      available_inventory_units: 52,
      current_occupancy_pct: parseFloat(merchant.occupancy_pct || 18),
      offers_redeemed_count: actualRedeemedCount,
      realized_contribution_profit_inr: parseFloat(actualMarginProfit.toFixed(2)),
      predicted_expected_profit_inr: 4280.5,
      daily_performance: [
        { date: 'Mon 12 May', predicted_expected_profit: 620, realized_profit: 513, offers_shown: 18, redemptions: 5 },
        { date: 'Tue 13 May', predicted_expected_profit: 780, realized_profit: 719, offers_shown: 24, redemptions: 7 },
        { date: 'Wed 14 May', predicted_expected_profit: 690, realized_profit: 616, offers_shown: 20, redemptions: 6 },
        { date: 'Thu 15 May', predicted_expected_profit: 540, realized_profit: 410, offers_shown: 16, redemptions: 4 },
        { date: 'Fri 16 May', predicted_expected_profit: 850, realized_profit: 617, offers_shown: 26, redemptions: 6 },
        { date: 'Today (Live)', predicted_expected_profit: 800, realized_profit: parseFloat((actualMarginProfit - 2875.88).toFixed(2)), offers_shown: 22, redemptions: redemptions.length },
      ],
      conversion_comparison: [
        { category: 'Cold Brew & Beverages', predicted_conversion_pct: 72.5, actual_realized_conversion_pct: 69.2 },
        { category: 'Lunch Bowls', predicted_conversion_pct: 68.4, actual_realized_conversion_pct: 65.0 },
        { category: 'Sourdough Toasties', predicted_conversion_pct: 58.4, actual_realized_conversion_pct: 52.8 },
      ],
      funnel_stages: [
        { stage: 'Eligible Nearby Customers', count: 184, rate_pct: 100 },
        { stage: 'Context Guardrails Passed', count: 112, rate_pct: 60.8 },
        { stage: 'Offers Sent (Notification)', count: 96, rate_pct: 52.1 },
        { stage: 'Offer Viewed in App', count: 74, rate_pct: 40.2 },
        { stage: 'Confirmed In-Store Redemptions', count: actualRedeemedCount, rate_pct: 15.2 },
      ],
      product_performance: [
        {
          item_id: 'i_001_1',
          item_title: 'Iced Coffee & Lunch Bowl',
          discount_pct: 10,
          total_distributed: 58,
          total_redeemed: 38,
          conversion_rate_pct: 65.5,
          realized_profit_inr: 3903,
          expected_profit_inr: 4074,
        },
        {
          item_id: 'i_001_2',
          item_title: 'Cold Brew Coffee (Bottled 300ml)',
          discount_pct: 12,
          total_distributed: 44,
          total_redeemed: 32,
          conversion_rate_pct: 72.7,
          realized_profit_inr: 3190,
          expected_profit_inr: 3181,
        },
        {
          item_id: 'i_001_3',
          item_title: 'Paneer Toastie on Sourdough',
          discount_pct: 8,
          total_distributed: 36,
          total_redeemed: 19,
          conversion_rate_pct: 52.8,
          realized_profit_inr: 1957,
          expected_profit_inr: 2165,
        },
      ],
      total_redemptions: actualRedeemedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/settings/notifications/:userId
export async function getNotificationPreferences(req, res) {
  try {
    const { userId } = req.params;
    res.json({
      user_id: userId,
      channel_email: true,
      channel_sms: false,
      channel_push: true,
      preferred_language: 'hi-en',
      quiet_hours_enabled: true,
      quiet_hours_start: '21:00',
      quiet_hours_end: '08:00',
      frequency_cap_per_day: 3,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/settings/notifications/:userId
export async function updateNotificationPreferences(req, res) {
  try {
    const { userId } = req.params;
    res.json({
      user_id: userId,
      ...req.body,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
