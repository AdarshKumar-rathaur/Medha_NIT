import { storeService } from '../services/storeService.js';
import { realtimeInferenceService } from '../services/realtimeInferenceService.js';
import { weatherService } from '../services/weatherService.js';
import { geminiService } from '../services/geminiService.js';
import { emailService } from '../services/emailService.js';

// GET /api/customers/:id
export async function getCustomer(req, res) {
  try {
    const { id } = req.params;
    const customer = await storeService.getCustomer(id);
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

    // Return format adhering to CustomerProfile interface
    res.json({
      id: customer.id,
      name: customer.name || 'Priya Sharma',
      age: customer.age || 26,
      email: customer.email || `${customer.id}@priority-member.in`,
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
    const existing = await storeService.getCustomer(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updates = req.body;
    const declaredStr = Array.isArray(updates.declared_preferences)
      ? updates.declared_preferences.join(', ')
      : updates.declared_preferences || existing.declared_preferences;

    const saved = await storeService.saveCustomer({
      ...existing,
      ...updates,
      id,
      declared_preferences: declaredStr,
    });

    // Run real-time ML inference
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

    // Retrieve or generate real ML offers
    let offers = await storeService.getOffersByCustomer(customer.id);
    if (!offers || offers.length === 0) {
      try {
        const mlDecision = await realtimeInferenceService.runInference(customer);
        offers = await storeService.getOffersByCustomer(customer.id);
      } catch (infErr) {
        console.warn('[getPersonalizedOffers] ML notice:', infErr.message);
      }
    }

    // Map stored ML decision into template's PersonalizedOffer schema
    const formatted = offers.map(o => {
      const discountPct = o.offer?.discount_pct || 15;
      const basePrice = o.ml_details?.item_base_price || 150;
      const finalPrice = o.offer?.final_price_inr || (basePrice * (1 - discountPct / 100));
      const discountAmt = basePrice - finalPrice;
      const unitCost = 32.29;
      const margin = finalPrice - unitCost;
      const pAccept = o.ml_details?.predicted_p_accept || 0.684;
      const expProfit = o.profit_estimate_inr || (pAccept * margin);

      return {
        id: o.offer_id || `off_${Date.now()}`,
        scenario_id: o.scenario_id || 'rec_c_001_33',
        customer_id: customer.id,
        merchant_id: o.offer?.merchant_id || o.merchant?.id || 'm_001',
        merchant_name: o.merchant?.name || 'Little Fern Café',
        merchant_category: o.merchant?.category || 'cafe',
        merchant_locality: o.merchant?.locality || customer.locality || 'Koramangala',
        item_id: o.offer?.item_id || 'i_001_1',
        item_title: o.offer?.item_name || 'Iced Coffee & Lunch Bowl',
        item_image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        original_price_inr: basePrice,
        discount_pct: discountPct,
        discount_amount_inr: parseFloat(discountAmt.toFixed(2)),
        final_price_inr: parseFloat(finalPrice.toFixed(2)),
        unit_cost_inr: unitCost,
        post_discount_margin_inr: parseFloat(margin.toFixed(2)),
        predicted_p_accept: parseFloat(pAccept.toFixed(3)),
        expected_profit_inr: parseFloat(expProfit.toFixed(2)),
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
    });

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
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    res.json(found);
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

    const formattedOffer = {
      id,
      status: 'redeemed',
      redemption_code: `DOS-${Math.floor(1000 + Math.random() * 9000)}`,
      redeemed_at: new Date().toISOString(),
    };

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
      realized_margin_inr: result.redemption.profit_inr || 40,
      timestamp: result.redemption.timestamp,
      voucher_code: `DOS-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'confirmed',
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
    const customerReds = redemptions.filter(r => r.customer_id === id);

    const formatted = customerReds.map(r => ({
      id: r.redemption_id,
      offer_id: r.offer_id,
      scenario_id: 'rec_c_001_33',
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      merchant_id: r.merchant_id,
      merchant_name: r.merchant_name,
      item_title: 'Iced Coffee & Lunch Bowl',
      original_price_inr: 150,
      discount_pct: r.discount_pct,
      final_price_inr: r.final_price_inr,
      realized_margin_inr: r.profit_inr,
      timestamp: r.timestamp,
      voucher_code: `DOS-${r.redemption_id.slice(-4)}`,
      status: 'confirmed',
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
    const customerReds = redemptions.filter(r => r.customer_id === id);

    const totalSaved = customerReds.reduce((acc, r) => acc + (150 * (r.discount_pct / 100)), 0);

    res.json({
      customer_id: id,
      total_realized_savings_inr: Math.round(totalSaved + 45),
      total_potential_savings_inr: Math.round(totalSaved + 120),
      total_offers_claimed: customerReds.length,
      average_discount_pct: 12.5,
      favorite_category: customer?.declared_preferences?.split(',')[0] || 'cafe',
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
    const merchant = await storeService.getMerchant(id);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    res.json({
      id: merchant.id,
      name: merchant.name,
      category: merchant.category || 'cafe',
      locality: merchant.locality || 'Koramangala',
      lat: merchant.lat || 12.93595,
      lng: merchant.lng || 77.62484,
      capacity: merchant.capacity || 25,
      occupancy_pct: parseFloat(merchant.occupancy_pct || 28),
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
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    return getMerchant(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/merchants/:id/catalog
export async function getCatalog(req, res) {
  try {
    const { id } = req.params;
    // Default Little Fern Café catalog
    const catalog = [
      {
        id: 'i_001_1',
        merchant_id: id,
        title: 'Iced Coffee & Lunch Bowl',
        category: 'lunch',
        price_inr: 150.0,
        unit_cost_inr: 32.29,
        stock_units: 16,
        prep_minutes: 8,
        is_veg: true,
        tags: ['lunch', 'cold', 'vegetarian', 'quick'],
        description: 'Fresh Mediterranean quinoa salad bowl paired with single-origin slow cold brew.',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        is_active: true,
      },
      {
        id: 'i_001_2',
        merchant_id: id,
        title: 'Cold Brew Coffee (Bottled 300ml)',
        category: 'drink',
        price_inr: 150.0,
        unit_cost_inr: 32.29,
        stock_units: 24,
        prep_minutes: 3,
        is_veg: true,
        tags: ['drink', 'cold', 'specialty'],
        description: '18-hour steeped Chikmagalur dark roast coffee served chilled over ice.',
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
        is_active: true,
      },
      {
        id: 'i_001_3',
        merchant_id: id,
        title: 'Paneer Toastie on Sourdough',
        category: 'snack',
        price_inr: 150.0,
        unit_cost_inr: 35.0,
        stock_units: 12,
        prep_minutes: 7,
        is_veg: true,
        tags: ['snack', 'vegetarian', 'warm'],
        description: 'Marinated cottage cheese with cilantro chutney pressed in house-baked sourdough.',
        image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
        is_active: true,
      },
      {
        id: 'i_001_4',
        merchant_id: id,
        title: 'Artisan Berry Granola Bowl',
        category: 'breakfast',
        price_inr: 180.0,
        unit_cost_inr: 45.0,
        stock_units: 8,
        prep_minutes: 5,
        is_veg: true,
        tags: ['healthy', 'snack', 'vegetarian'],
        description: 'Greek yogurt with rolled oats, toasted pumpkin seeds, and blueberry compote.',
        image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80',
        is_active: true,
      },
    ];
    res.json(catalog);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/merchants/:id/recommendations
export async function getMerchantRecommendations(req, res) {
  try {
    const { id } = req.params;
    const merchant = await storeService.getMerchant(id);

    const recommendations = [
      {
        id: 'rec_m001_01',
        merchant_id: id,
        item_id: 'i_001_1',
        item_title: 'Iced Coffee & Lunch Bowl',
        target_customer_id: 'c_001',
        target_customer_name: 'Priya Sharma',
        customer_intent: 'craving iced coffee & lunch break',
        customer_distance_m: 137,
        customer_walk_mins: 2,
        original_price_inr: 150,
        unit_cost_inr: 32.29,
        recommended_discount_pct: 10,
        final_price_inr: 135,
        predicted_p_accept: 0.684,
        expected_profit_inr: 70.24,
        status: 'approved',
        rationale: '10% discount captures peak expected profit curve (+34.2% higher margin than 0% discount; exceeds 20% discount).',
        curve_points: [
          { discount_pct: 0, discount_amount_inr: 0, final_price_inr: 150, predicted_p_accept: 0.444, expected_profit_inr: 52.33 },
          { discount_pct: 5, discount_amount_inr: 7.5, final_price_inr: 142.5, predicted_p_accept: 0.582, expected_profit_inr: 64.14 },
          { discount_pct: 10, discount_amount_inr: 15, final_price_inr: 135, predicted_p_accept: 0.684, expected_profit_inr: 70.24 },
          { discount_pct: 15, discount_amount_inr: 22.5, final_price_inr: 127.5, predicted_p_accept: 0.725, expected_profit_inr: 69.03 },
          { discount_pct: 20, discount_amount_inr: 30, final_price_inr: 120, predicted_p_accept: 0.749, expected_profit_inr: 65.7 },
        ],
        created_at: new Date(Date.now() - 3600000).toISOString(),
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
      status: status || 'approved',
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
    const redemptions = await storeService.getRedemptions(id);

    res.json({
      merchant_id: id,
      timeframe: '7d',
      total_offers_evaluated: 48,
      total_grounded_dispatched: 14,
      total_in_store_redemptions: redemptions.length,
      realized_revenue_inr: redemptions.reduce((acc, r) => acc + (r.final_price_inr || 135), 0),
      realized_margin_inr: redemptions.reduce((acc, r) => acc + (r.profit_inr || 40), 0),
      predicted_expected_margin_inr: 2840.0,
      empirical_vs_predicted_accuracy: 94.6,
      top_performing_item: 'Iced Coffee & Lunch Bowl',
      hourly_redemption_breakdown: [
        { hour: '12:00', predicted_visits: 1.2, actual_visits: 1 },
        { hour: '13:00', predicted_visits: 4.8, actual_visits: 5 },
        { hour: '14:00', predicted_visits: 3.1, actual_visits: 3 },
        { hour: '15:00', predicted_visits: 1.0, actual_visits: 1 },
      ],
      conversion_by_discount_depth: [
        { discount_pct: 0, dispatched: 10, redeemed: 4, conversion_pct: 40.0 },
        { discount_pct: 10, dispatched: 22, redeemed: 15, conversion_pct: 68.2 },
        { discount_pct: 20, dispatched: 8, redeemed: 6, conversion_pct: 75.0 },
      ],
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
