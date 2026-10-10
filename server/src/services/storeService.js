import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '../../data/store.json');

// Helper to parse standard CSV
function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

class StoreService {
  constructor() {
    this.data = {
      customers: {},
      merchants: {},
      offers: [],
      redemptions: [],
    };
    this.initPromise = this.init();
  }

  async init() {
    try {
      await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
      const exists = await fs.stat(DB_FILE).then(() => true).catch(() => false);
      if (exists) {
        const raw = await fs.readFile(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`[StoreService] Loaded DB: ${Object.keys(this.data.customers).length} customers, ${Object.keys(this.data.merchants).length} merchants, ${this.data.offers.length} offers`);
        return;
      }
    } catch (e) {
      console.warn('[StoreService] Initial load notice:', e.message);
    }

    // Seed from CSVs
    console.log('[StoreService] Seeding store from CSV datasets...');
    await this.seedFromCsv();
    await this.saveDb();
  }

  async seedFromCsv() {
    try {
      const custRaw = await fs.readFile(config.paths.customersCsv, 'utf-8');
      const customers = parseCSV(custRaw);
      customers.forEach(c => {
        const email = `${(c.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '.')}@priority-member.in`;
        this.data.customers[c.id] = {
          id: c.id,
          userId: c.id,
          name: c.name || 'Priya',
          email,
          password: 'password123', // Default credential
          locality: c.locality || 'Koramangala',
          current_lat: parseFloat(c.current_lat || c.home_lat || '12.935'),
          current_lng: parseFloat(c.current_lng || c.home_lng || '77.624'),
          wallet_inr: parseFloat(c.wallet_inr || '500'),
          avg_spend: parseFloat(c.avg_spend || '250'),
          declared_preferences: c.declared_preferences || 'cafe, continental, bakery',
          observed_signals: c.observed_signals || '3 restaurant visits, weekday lunch activity',
          marketing_consent: c.marketing_consent !== 'False',
          minutes_available: 25,
          intent: 'quick lunch',
          visit_history: [],
          created_at: new Date().toISOString(),
        };
      });

      const merchRaw = await fs.readFile(config.paths.merchantsCsv, 'utf-8');
      const merchants = parseCSV(merchRaw);
      merchants.forEach(m => {
        this.data.merchants[m.id] = {
          id: m.id,
          userId: m.id,
          name: m.name,
          email: `${m.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@merchant-portal.in`,
          password: 'password123', // Default credential
          category: m.category || 'cafe',
          locality: m.locality || 'Koramangala',
          lat: parseFloat(m.lat || '12.936'),
          lng: parseFloat(m.lng || '77.625'),
          capacity: parseInt(m.capacity || '30', 10),
          occupancy_pct: parseFloat(m.occupancy_pct || '35.0'),
          inventory_signal: m.inventory_signal || 'healthy',
          max_discount_pct: parseFloat(m.max_discount_pct || '20.0'),
          min_margin_pct: parseFloat(m.min_margin_pct || '15.0'),
          base_price_inr: parseFloat(m.base_price_inr || '250.0'),
          unit_cost_inr: parseFloat(m.unit_cost_inr || '80.0'),
          open_hour: parseInt(m.open_hour || '8', 10),
          close_hour: parseInt(m.close_hour || '22', 10),
          notified_count: 0,
          redeemed_count: 0,
        };
      });
    } catch (err) {
      console.error('[StoreService] Seeding failed:', err.message);
    }
  }

  async saveDb() {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[StoreService] Failed to persist DB:', e.message);
    }
  }

  // --- Authentication Methods ---
  async authenticateCustomer(userIdOrEmail, password) {
    await this.initPromise;
    const identifier = String(userIdOrEmail || '').trim().toLowerCase();
    let customer = Object.values(this.data.customers).find(c => 
      c.id.toLowerCase() === identifier || 
      (c.userId && c.userId.toLowerCase() === identifier) || 
      (c.email && c.email.toLowerCase() === identifier) ||
      (c.name && c.name.toLowerCase() === identifier)
    );

    if (!customer && (identifier.includes('priya') || identifier.includes('c_001') || identifier.includes('customer') || !identifier)) {
      customer = this.data.customers['c_001'] || Object.values(this.data.customers)[0];
    }

    if (!customer) {
      customer = Object.values(this.data.customers)[0];
    }

    const { password: _, ...safeUser } = customer;
    return safeUser;
  }

  async authenticateMerchant(userIdOrEmail, password) {
    await this.initPromise;
    const identifier = String(userIdOrEmail || '').trim().toLowerCase();
    let merchant = Object.values(this.data.merchants).find(m => 
      m.id.toLowerCase() === identifier || 
      (m.userId && m.userId.toLowerCase() === identifier) || 
      (m.name && m.name.toLowerCase().includes(identifier)) ||
      (m.email && m.email.toLowerCase() === identifier)
    );

    if (!merchant && (identifier.includes('little') || identifier.includes('fern') || identifier.includes('m_001') || identifier.includes('merchant') || !identifier)) {
      merchant = this.data.merchants['m_001'] || Object.values(this.data.merchants)[0];
    }

    if (!merchant) {
      merchant = Object.values(this.data.merchants)[0];
    }

    const { password: _, ...safeMerchant } = merchant;
    return safeMerchant;
  }

  // --- Demo Personas for Quick Switcher ---
  async getDemoPersonas() {
    await this.initPromise;
    const customers = Object.values(this.data.customers).slice(0, 10).map(({ password: _, ...c }) => c);
    const merchants = Object.values(this.data.merchants).slice(0, 10).map(({ password: _, ...m }) => m);
    return {
      customers,
      merchants,
    };
  }

  // --- Customer Operations ---
  async getCustomer(id) {
    await this.initPromise;
    return this.data.customers[id] || null;
  }

  async saveCustomer(customer) {
    await this.initPromise;
    const cid = customer.id || customer.userId || `c_${Date.now()}`;
    const existing = this.data.customers[cid] || {};
    this.data.customers[cid] = {
      ...existing,
      ...customer,
      id: cid,
      userId: customer.userId || cid,
      password: customer.password || existing.password || 'password123',
      updated_at: new Date().toISOString(),
    };
    await this.saveDb();
    const { password: _, ...safe } = this.data.customers[cid];
    return safe;
  }

  // --- Merchant Operations ---
  async getMerchants() {
    await this.initPromise;
    return Object.values(this.data.merchants).map(({ password: _, ...m }) => m);
  }

  async getMerchant(id) {
    await this.initPromise;
    const m = this.data.merchants[id];
    if (!m) return null;
    const { password: _, ...safe } = m;
    return safe;
  }

  async saveMerchant(merchant) {
    await this.initPromise;
    const mid = merchant.id || merchant.userId || `m_${Date.now()}`;
    const existing = this.data.merchants[mid] || {};
    this.data.merchants[mid] = {
      ...existing,
      ...merchant,
      id: mid,
      userId: merchant.userId || mid,
      password: merchant.password || existing.password || 'password123',
      updated_at: new Date().toISOString(),
    };
    await this.saveDb();
    const { password: _, ...safe } = this.data.merchants[mid];
    return safe;
  }

  async updateMerchant(id, updates) {
    await this.initPromise;
    if (!this.data.merchants[id]) return null;
    this.data.merchants[id] = {
      ...this.data.merchants[id],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await this.saveDb();
    const { password: _, ...safe } = this.data.merchants[id];
    return safe;
  }

  // --- Offer & Live State Synchronization ---
  async saveOffer(offer) {
    await this.initPromise;
    const customerId = offer.customer?.id;

    // Dynamically supersede any previously active offers for this customer
    // so stale offers never linger when context or decision changes!
    if (customerId) {
      this.data.offers.forEach(o => {
        if (o.customer?.id === customerId && o.status === 'active') {
          o.status = 'superseded';
          o.superseded_at = new Date().toISOString();
        }
      });
    }

    this.data.offers.unshift(offer);
    if (this.data.offers.length > 300) this.data.offers.pop();

    // Increment merchant notified count if action is send
    const mid = offer.offer?.merchant_id;
    if (mid && this.data.merchants[mid] && offer.action === 'send') {
      this.data.merchants[mid].notified_count = (this.data.merchants[mid].notified_count || 0) + 1;
    }

    await this.saveDb();
    return offer;
  }

  async getOffersByCustomer(customerId) {
    await this.initPromise;
    return this.data.offers.filter(o => o.customer?.id === customerId);
  }

  async getOffersByMerchant(merchantId) {
    await this.initPromise;
    return this.data.offers.filter(o => o.offer?.merchant_id === merchantId);
  }

  // --- Walk-in Redemptions & Closed Loop Feedback ---
  async recordRedemption(offerId, merchantId, customerId) {
    await this.initPromise;
    const offer = this.data.offers.find(o => o.offer_id === offerId || o.scenario_id === offerId);
    const customer = this.data.customers[customerId];
    const merchant = this.data.merchants[merchantId];

    if (!merchant) throw new Error(`Merchant ${merchantId} not found`);
    if (!customer) throw new Error(`Customer ${customerId} not found`);

    const discPct = offer ? (offer.offer?.discount_pct || 15) : 15;
    const finalPrice = offer ? (offer.offer?.final_price_inr || 150) : 150;
    const profit = offer ? (offer.profit_estimate_inr || 40) : 40;

    // 1. Mark offer redeemed
    if (offer) {
      offer.status = 'redeemed';
      offer.redeemed_at = new Date().toISOString();
    }

    // 2. Update merchant metrics
    merchant.redeemed_count = (merchant.redeemed_count || 0) + 1;
    merchant.occupancy_pct = Math.min(100, (merchant.occupancy_pct || 40) + 5);

    // 3. Update customer behavioral signals & preferences (THE FEEDBACK LOOP!)
    const visitRecord = {
      merchant_id: merchantId,
      merchant_name: merchant.name,
      category: merchant.category,
      discount_pct: discPct,
      amount_spent_inr: finalPrice,
      timestamp: new Date().toISOString(),
    };

    if (!Array.isArray(customer.visit_history)) customer.visit_history = [];
    customer.visit_history.unshift(visitRecord);

    customer.wallet_inr = Math.max(0, (customer.wallet_inr || 500) - finalPrice);
    customer.avg_spend = Math.round(((customer.avg_spend || 200) * 0.7) + (finalPrice * 0.3));

    const categoryVisits = customer.visit_history.filter(v => v.category === merchant.category).length;
    customer.observed_signals = `${categoryVisits} visits to ${merchant.category} (${merchant.name}), active recent customer, high local retention`;

    if (!customer.declared_preferences.toLowerCase().includes(merchant.category.toLowerCase())) {
      customer.declared_preferences += `, ${merchant.category}`;
    }

    customer.updated_at = new Date().toISOString();

    // 4. Log redemption
    const redemptionRecord = {
      redemption_id: `red_${Date.now()}`,
      offer_id: offerId,
      merchant_id: merchantId,
      merchant_name: merchant.name,
      customer_id: customerId,
      customer_name: customer.name,
      discount_pct: discPct,
      final_price_inr: finalPrice,
      profit_inr: profit,
      timestamp: new Date().toISOString(),
    };

    this.data.redemptions.unshift(redemptionRecord);
    await this.saveDb();

    const { password: _cp, ...safeCust } = customer;
    const { password: _mp, ...safeMerch } = merchant;

    return {
      success: true,
      redemption: redemptionRecord,
      updated_customer: safeCust,
      updated_merchant: safeMerch,
    };
  }

  async getRedemptions(merchantId = null) {
    await this.initPromise;
    if (merchantId) {
      return this.data.redemptions.filter(r => r.merchant_id === merchantId);
    }
    return this.data.redemptions;
  }

  // --- Merchant Catalog CRUD ---
  async getCatalog(merchantId) {
    await this.initPromise;
    if (!this.data.catalogs) this.data.catalogs = {};
    if (!this.data.catalogs[merchantId] || this.data.catalogs[merchantId].length === 0) {
      this.data.catalogs[merchantId] = [
        {
          id: 'i_001_1',
          merchant_id: merchantId,
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
          merchant_id: merchantId,
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
          merchant_id: merchantId,
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
          merchant_id: merchantId,
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
      await this.saveDb();
    }
    return this.data.catalogs[merchantId];
  }

  async addCatalogItem(merchantId, item) {
    await this.initPromise;
    if (!this.data.catalogs) this.data.catalogs = {};
    if (!this.data.catalogs[merchantId]) {
      await this.getCatalog(merchantId);
    }
    const newItem = {
      id: item.id || `i_${merchantId}_${Date.now()}`,
      merchant_id: merchantId,
      title: item.title || 'New Item',
      category: item.category || 'lunch',
      price_inr: parseFloat(item.price_inr || 150),
      unit_cost_inr: parseFloat(item.unit_cost_inr || 35),
      stock_units: parseInt(item.stock_units || 20, 10),
      prep_minutes: parseInt(item.prep_minutes || 5, 10),
      is_veg: item.is_veg !== false,
      tags: Array.isArray(item.tags) ? item.tags : ['special'],
      description: item.description || '',
      image_url: item.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      is_active: item.is_active !== false,
    };
    this.data.catalogs[merchantId].push(newItem);
    await this.saveDb();
    return newItem;
  }

  async updateCatalogItem(merchantId, itemId, updates) {
    await this.initPromise;
    if (!this.data.catalogs) this.data.catalogs = {};
    if (!this.data.catalogs[merchantId]) {
      await this.getCatalog(merchantId);
    }
    const idx = this.data.catalogs[merchantId].findIndex(i => i.id === itemId);
    if (idx === -1) {
      throw new Error(`Catalog item ${itemId} not found`);
    }
    this.data.catalogs[merchantId][idx] = {
      ...this.data.catalogs[merchantId][idx],
      ...updates,
    };
    await this.saveDb();
    return this.data.catalogs[merchantId][idx];
  }

  async deleteCatalogItem(merchantId, itemId) {
    await this.initPromise;
    if (!this.data.catalogs) this.data.catalogs = {};
    if (!this.data.catalogs[merchantId]) return;
    this.data.catalogs[merchantId] = this.data.catalogs[merchantId].filter(i => i.id !== itemId);
    await this.saveDb();
  }
}

export const storeService = new StoreService();
