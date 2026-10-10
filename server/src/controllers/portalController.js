import { storeService } from '../services/storeService.js';
import { realtimeInferenceService } from '../services/realtimeInferenceService.js';
import { weatherService } from '../services/weatherService.js';

// Get Real-Time Weather & Temporal Telemetry
export async function getLiveTelemetry(req, res) {
  try {
    const lat = parseFloat(req.query.lat || '12.9353');
    const lng = parseFloat(req.query.lng || '77.62377');
    const data = await weatherService.getLiveContext(lat, lng);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get Demo Personas for 1-Click Switcher
export async function getPersonas(req, res) {
  try {
    const personas = await storeService.getDemoPersonas();
    res.json({ success: true, data: personas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Customer Onboarding / Registration
export async function registerCustomer(req, res) {
  try {
    const { 
      name, 
      email, 
      locality = 'Koramangala', 
      wallet_inr = 500, 
      declared_preferences = 'cafe, bakery, continental',
      dietary_notes = '',
      minutes_available = 25,
      intent = 'quick lunch',
      marketing_consent = true,
      current_lat = 12.9353,
      current_lng = 77.62377,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    const cid = `c_user_${Date.now()}`;
    const newCustomer = await storeService.saveCustomer({
      id: cid,
      name,
      email,
      locality,
      wallet_inr: parseFloat(wallet_inr),
      avg_spend: 200,
      declared_preferences,
      observed_signals: 'Newly registered customer, exploring nearby venues',
      minutes_available: parseFloat(minutes_available),
      intent,
      dietary_notes,
      marketing_consent: Boolean(marketing_consent),
      current_lat: parseFloat(current_lat),
      current_lng: parseFloat(current_lng),
      visit_history: [],
    });

    // Automatically run initial ML inference for newly registered user!
    let initialDecision = null;
    try {
      initialDecision = await realtimeInferenceService.runInference(newCustomer);
    } catch (infErr) {
      console.warn('[Register] Initial inference notice:', infErr.message);
    }

    res.json({
      success: true,
      message: 'Customer onboarded successfully.',
      customer: newCustomer,
      initial_offer: initialDecision,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get Customer Profile & Offers
export async function getCustomerProfile(req, res) {
  try {
    const { id } = req.params;
    const customer = await storeService.getCustomer(id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    const offers = await storeService.getOffersByCustomer(id);
    res.json({
      success: true,
      customer,
      offers,
      visit_count: (customer.visit_history || []).length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Update Customer Preferences & Re-run ML Decision Engine
export async function updateCustomerPreferences(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await storeService.getCustomer(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    const updatedCustomer = await storeService.saveCustomer({
      ...existing,
      ...updates,
      id,
    });

    // Trigger real-time ML inference with new preferences/context!
    console.log(`[PreferencesUpdate] Triggering ML inference for ${updatedCustomer.name}...`);
    const decision = await realtimeInferenceService.runInference(updatedCustomer, {
      temp_c: updates.temp_c,
      condition: updates.condition,
      intent: updates.intent,
      minutes_available: updates.minutes_available,
    });

    const activeOffers = await storeService.getOffersByCustomer(id);

    res.json({
      success: true,
      message: 'Preferences updated and real-time ML offers evaluated.',
      customer: updatedCustomer,
      new_decision: decision,
      offers: activeOffers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Trigger ML Offer Evaluation on demand
export async function evaluateOffers(req, res) {
  try {
    const { customerId, contextOverrides } = req.body;
    const customer = await storeService.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    const decision = await realtimeInferenceService.runInference(customer, contextOverrides || {});
    res.json({
      success: true,
      decision,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Merchant Dashboard Data
export async function getMerchantDashboard(req, res) {
  try {
    const { id } = req.params;
    const merchant = await storeService.getMerchant(id);
    if (!merchant) {
      return res.status(404).json({ success: false, error: 'Merchant not found.' });
    }

    const allOffers = await storeService.getOffersByMerchant(id);
    const redemptions = await storeService.getRedemptions(id);

    // Active pending vouchers available for walk-in redemption
    const activeVouchers = allOffers.filter(o => o.status === 'active');

    // Recent notified customers
    const notifiedCustomers = allOffers.slice(0, 15).map(o => ({
      offer_id: o.offer_id,
      customer_id: o.customer?.id,
      customer_name: o.customer?.name,
      discount_pct: o.offer?.discount_pct,
      final_price_inr: o.offer?.final_price_inr,
      walk_minutes: o.ui_hints?.walk_minutes,
      distance_m: o.ui_hints?.distance_m,
      status: o.status,
      timestamp: o.created_at,
      email_preview_url: o.email_delivery?.preview_url,
    }));

    res.json({
      success: true,
      merchant,
      stats: {
        totalNotified: merchant.notified_count || allOffers.length,
        totalRedeemed: merchant.redeemed_count || redemptions.length,
        activeVouchersCount: activeVouchers.length,
        occupancy_pct: merchant.occupancy_pct,
        inventory_signal: merchant.inventory_signal,
      },
      notifiedCustomers,
      activeVouchers,
      recentRedemptions: redemptions.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Update Merchant Operational Settings (Occupancy, Margins)
export async function updateMerchantSettings(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await storeService.updateMerchant(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Merchant not found.' });
    }

    res.json({
      success: true,
      message: 'Merchant operational constraints updated.',
      merchant: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Record Customer Visit / Redemption (The Feedback Loop)
export async function recordCustomerVisit(req, res) {
  try {
    const { offerId, merchantId, customerId } = req.body;

    if (!merchantId || !customerId) {
      return res.status(400).json({ success: false, error: 'merchantId and customerId are required.' });
    }

    console.log(`[RecordVisit] Merchant ${merchantId} confirmed visit for customer ${customerId}...`);
    const result = await storeService.recordRedemption(offerId, merchantId, customerId);

    res.json({
      success: true,
      message: 'Customer visit confirmed! Behavioral signals and merchant occupancy updated.',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
