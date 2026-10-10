const API_BASE = '/api';

export const api = {
  // Health & System Info
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  // Authentication (User ID & Password)
  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Login failed: ${res.statusText}`);
    }
    return res.json();
  },

  async register(payload) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Registration failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getMe(id, role = 'customer') {
    const res = await fetch(`${API_BASE}/auth/me?id=${encodeURIComponent(id)}&role=${role}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch session`);
    }
    return res.json();
  },

  // Portal Authentication & Personas
  async getLiveTelemetry(lat, lng) {
    const query = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
    const res = await fetch(`${API_BASE}/portal/telemetry${query}`);
    if (!res.ok) throw new Error('Failed to fetch live telemetry');
    return res.json();
  },

  async getPersonas() {
    const res = await fetch(`${API_BASE}/portal/personas`);
    if (!res.ok) throw new Error(`Failed to load personas: ${res.statusText}`);
    return res.json();
  },

  async registerCustomer(payload) {
    const res = await fetch(`${API_BASE}/portal/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Registration failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getCustomerProfile(id) {
    const res = await fetch(`${API_BASE}/portal/customer/${id}`);
    if (!res.ok) throw new Error(`Failed to load customer profile: ${res.statusText}`);
    return res.json();
  },

  async updateCustomerPreferences(id, payload) {
    const res = await fetch(`${API_BASE}/portal/customer/${id}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update preferences: ${res.statusText}`);
    }
    return res.json();
  },

  async evaluateOffers(customerId, contextOverrides = {}) {
    const res = await fetch(`${API_BASE}/portal/customer/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, contextOverrides }),
    });
    if (!res.ok) throw new Error(`Failed to evaluate offers: ${res.statusText}`);
    return res.json();
  },

  // Merchant Portal
  async getMerchantDashboard(id) {
    const res = await fetch(`${API_BASE}/portal/merchant/${id}`);
    if (!res.ok) throw new Error(`Failed to load merchant dashboard: ${res.statusText}`);
    return res.json();
  },

  async updateMerchantSettings(id, payload) {
    const res = await fetch(`${API_BASE}/portal/merchant/${id}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update merchant settings: ${res.statusText}`);
    return res.json();
  },

  async recordCustomerVisit(payload) {
    const res = await fetch(`${API_BASE}/portal/merchant/record-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to record customer visit: ${res.statusText}`);
    }
    return res.json();
  },

  // Email API
  async getEmailHistory() {
    const res = await fetch(`${API_BASE}/email/history`);
    if (!res.ok) throw new Error(`Failed to get email history: ${res.statusText}`);
    return res.json();
  },
};
