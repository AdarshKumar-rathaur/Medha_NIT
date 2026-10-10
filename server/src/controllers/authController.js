import { storeService } from '../services/storeService.js';
import { realtimeInferenceService } from '../services/realtimeInferenceService.js';

export async function login(req, res) {
  try {
    const { userId, password, role = 'customer' } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        error: 'User ID / Email and Password are required.',
      });
    }

    let user;
    if (role === 'merchant') {
      user = await storeService.authenticateMerchant(userId, password);
    } else {
      user = await storeService.authenticateCustomer(userId, password);
    }

    res.json({
      success: true,
      message: `Logged in successfully as ${role}.`,
      role,
      user,
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: err.message || 'Authentication failed.',
    });
  }
}

export async function register(req, res) {
  try {
    const { role = 'customer', userId, password, name, email, ...extra } = req.body;

    if (!userId || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'User ID, Password, and Name are required.',
      });
    }

    if (role === 'merchant') {
      const merchantId = userId.startsWith('m_') ? userId : `m_${userId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const merchant = await storeService.saveMerchant({
        id: merchantId,
        userId: merchantId,
        name,
        email: email || `${userId.toLowerCase()}@merchant-portal.in`,
        password,
        category: extra.category || 'cafe',
        locality: extra.locality || 'Koramangala',
        capacity: parseInt(extra.capacity || '30', 10),
        occupancy_pct: parseFloat(extra.occupancy_pct || '25.0'),
        inventory_signal: extra.inventory_signal || 'healthy',
        max_discount_pct: parseFloat(extra.max_discount_pct || '20.0'),
        min_margin_pct: parseFloat(extra.min_margin_pct || '15.0'),
        base_price_inr: parseFloat(extra.base_price_inr || '250.0'),
        unit_cost_inr: parseFloat(extra.unit_cost_inr || '80.0'),
        notified_count: 0,
        redeemed_count: 0,
      });

      return res.json({
        success: true,
        message: 'Merchant account created successfully.',
        role: 'merchant',
        user: merchant,
      });
    } else {
      const customerId = userId.startsWith('c_') ? userId : `c_${userId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const customer = await storeService.saveCustomer({
        id: customerId,
        userId: customerId,
        name,
        email: email || `${userId.toLowerCase()}@priority-member.in`,
        password,
        locality: extra.locality || 'Koramangala',
        current_lat: parseFloat(extra.current_lat || '12.9353'),
        current_lng: parseFloat(extra.current_lng || '77.62377'),
        wallet_inr: parseFloat(extra.wallet_inr || '500'),
        avg_spend: 200,
        declared_preferences: extra.declared_preferences || 'cafe, bakery, continental',
        observed_signals: 'Newly registered customer, exploring nearby venues',
        minutes_available: parseFloat(extra.minutes_available || '25'),
        intent: extra.intent || 'quick lunch',
        marketing_consent: extra.marketing_consent !== false,
        visit_history: [],
      });

      // Immediately run real-time inference on new user profile
      let initialOffer = null;
      try {
        initialOffer = await realtimeInferenceService.runInference(customer);
      } catch (e) {
        console.warn('[Register] Initial inference notice:', e.message);
      }

      return res.json({
        success: true,
        message: 'Customer account created successfully.',
        role: 'customer',
        user: customer,
        initial_offer: initialOffer,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Registration failed.',
    });
  }
}

export async function getMe(req, res) {
  try {
    const { id, role = 'customer' } = req.query;
    if (!id) return res.status(400).json({ success: false, error: 'User ID is required.' });

    let user;
    if (role === 'merchant') {
      user = await storeService.getMerchant(id);
    } else {
      user = await storeService.getCustomer(id);
    }

    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    res.json({ success: true, user, role });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
