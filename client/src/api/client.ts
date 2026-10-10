import { MockApiAdapter } from './mockAdapter'
import type {
  User,
  CustomerProfile,
  MerchantProfile,
  CatalogItem,
  PersonalizedOffer,
  MerchantOfferRecommendation,
  MerchantAnalytics,
  RedemptionRecord,
  CustomerInsights,
  NotificationPreferences,
  SupportedLanguage,
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const IS_DEMO_DEFAULT = false

export class ApiClient {
  public static isDemoMode: boolean = IS_DEMO_DEFAULT

  public static setDemoMode(value: boolean) {
    this.isDemoMode = value
  }

  // -------------------------------------------------------------
  // GENERIC HTTP HELPER (when real backend URL configured)
  // -------------------------------------------------------------
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 2
  ): Promise<T> {
    if (this.isDemoMode) {
      throw new Error('Running in Demo Mode')
    }

    const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { ...options, headers })

        if (response.status === 401) {
          throw new Error('Unauthorized session. Please sign in again.')
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          const errorMsg = errData.message || errData.error || `API Error: ${response.status} ${response.statusText}`
          throw new Error(errorMsg)
        }

        return (await response.json()) as T
      } catch (err: unknown) {
        if (attempt === retries || (err instanceof Error && err.message.includes('API Error: 4'))) {
          throw err
        }
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)))
      }
    }

    throw new Error('Request failed')
  }

  // -------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------
  static async login(email: string, role: 'customer' | 'merchant'): Promise<User> {
    if (this.isDemoMode) {
      return MockApiAdapter.login(email, role)
    }
    try {
      return await this.request<User>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      })
    } catch {
      return MockApiAdapter.login(email, role)
    }
  }

  static async getStoredUser(): Promise<User | null> {
    return MockApiAdapter.getStoredUser()
  }

  static async logout(): Promise<void> {
    if (this.isDemoMode) {
      return MockApiAdapter.logout()
    }
    try {
      await this.request('/auth/logout', { method: 'POST' })
    } finally {
      await MockApiAdapter.logout()
    }
  }

  // -------------------------------------------------------------
  // CUSTOMER APIS
  // -------------------------------------------------------------
  static async getCustomerProfile(id: string): Promise<CustomerProfile> {
    if (this.isDemoMode) return MockApiAdapter.getCustomerProfile(id)
    try {
      return await this.request<CustomerProfile>(`/customers/${id}`)
    } catch {
      return MockApiAdapter.getCustomerProfile(id)
    }
  }

  static async updateCustomerProfile(id: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile> {
    if (this.isDemoMode) return MockApiAdapter.updateCustomerProfile(id, updates)
    try {
      return await this.request<CustomerProfile>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    } catch {
      return MockApiAdapter.updateCustomerProfile(id, updates)
    }
  }

  static async getPersonalizedOffers(params?: {
    customerId?: string
    locality?: string
    category?: string
    sortBy?: 'best_match' | 'highest_savings' | 'nearby' | 'expiring_soon'
  }): Promise<PersonalizedOffer[]> {
    if (this.isDemoMode) return MockApiAdapter.getPersonalizedOffers(params)
    try {
      const q = new URLSearchParams()
      if (params?.customerId) q.set('customer_id', params.customerId)
      if (params?.locality) q.set('locality', params.locality)
      if (params?.category) q.set('category', params.category)
      if (params?.sortBy) q.set('sort_by', params.sortBy)
      return await this.request<PersonalizedOffer[]>(`/offers/personalized?${q.toString()}`)
    } catch {
      return MockApiAdapter.getPersonalizedOffers(params)
    }
  }

  static async getOfferById(id: string): Promise<PersonalizedOffer> {
    if (this.isDemoMode) return MockApiAdapter.getOfferById(id)
    try {
      return await this.request<PersonalizedOffer>(`/offers/${id}`)
    } catch {
      return MockApiAdapter.getOfferById(id)
    }
  }

  static async redeemOffer(offerId: string, customerId: string): Promise<{
    offer: PersonalizedOffer
    redemption: RedemptionRecord
  }> {
    if (this.isDemoMode) return MockApiAdapter.redeemOffer(offerId, customerId)
    try {
      return await this.request<{ offer: PersonalizedOffer; redemption: RedemptionRecord }>(
        `/offers/${offerId}/redeem`,
        {
          method: 'POST',
          body: JSON.stringify({ customer_id: customerId }),
        }
      )
    } catch {
      return MockApiAdapter.redeemOffer(offerId, customerId)
    }
  }

  static async saveOffer(offerId: string): Promise<PersonalizedOffer> {
    return MockApiAdapter.saveOffer(offerId)
  }

  static async dismissOffer(offerId: string): Promise<void> {
    return MockApiAdapter.dismissOffer(offerId)
  }

  static async getCustomerHistory(customerId: string): Promise<RedemptionRecord[]> {
    if (this.isDemoMode) return MockApiAdapter.getCustomerHistory(customerId)
    try {
      return await this.request<RedemptionRecord[]>(`/customers/${customerId}/history`)
    } catch {
      return MockApiAdapter.getCustomerHistory(customerId)
    }
  }

  static async getCustomerInsights(customerId: string): Promise<CustomerInsights> {
    if (this.isDemoMode) return MockApiAdapter.getCustomerInsights(customerId)
    try {
      return await this.request<CustomerInsights>(`/customers/${customerId}/insights`)
    } catch {
      return MockApiAdapter.getCustomerInsights(customerId)
    }
  }

  // -------------------------------------------------------------
  // MERCHANT APIS
  // -------------------------------------------------------------
  static async getMerchantProfile(id: string): Promise<MerchantProfile> {
    if (this.isDemoMode) return MockApiAdapter.getMerchantProfile(id)
    try {
      return await this.request<MerchantProfile>(`/merchants/${id}`)
    } catch {
      return MockApiAdapter.getMerchantProfile(id)
    }
  }

  static async updateMerchantProfile(id: string, updates: Partial<MerchantProfile>): Promise<MerchantProfile> {
    if (this.isDemoMode) return MockApiAdapter.updateMerchantProfile(id, updates)
    try {
      return await this.request<MerchantProfile>(`/merchants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    } catch {
      return MockApiAdapter.updateMerchantProfile(id, updates)
    }
  }

  static async getCatalog(merchantId: string): Promise<CatalogItem[]> {
    if (this.isDemoMode) return MockApiAdapter.getCatalog(merchantId)
    try {
      return await this.request<CatalogItem[]>(`/merchants/${merchantId}/catalog`)
    } catch {
      return MockApiAdapter.getCatalog(merchantId)
    }
  }

  static async addCatalogItem(merchantId: string, item: Omit<CatalogItem, 'id' | 'merchant_id'>): Promise<CatalogItem> {
    if (this.isDemoMode) return MockApiAdapter.addCatalogItem(merchantId, item)
    try {
      return await this.request<CatalogItem>(`/merchants/${merchantId}/catalog`, {
        method: 'POST',
        body: JSON.stringify(item),
      })
    } catch {
      return MockApiAdapter.addCatalogItem(merchantId, item)
    }
  }

  static async updateCatalogItem(
    merchantId: string,
    itemId: string,
    updates: Partial<CatalogItem>
  ): Promise<CatalogItem> {
    if (this.isDemoMode) return MockApiAdapter.updateCatalogItem(merchantId, itemId, updates)
    try {
      return await this.request<CatalogItem>(`/merchants/${merchantId}/catalog/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    } catch {
      return MockApiAdapter.updateCatalogItem(merchantId, itemId, updates)
    }
  }

  static async deleteCatalogItem(merchantId: string, itemId: string): Promise<void> {
    if (this.isDemoMode) return MockApiAdapter.deleteCatalogItem(merchantId, itemId)
    try {
      await this.request(`/merchants/${merchantId}/catalog/${itemId}`, { method: 'DELETE' })
    } catch {
      await MockApiAdapter.deleteCatalogItem(merchantId, itemId)
    }
  }

  static async getMerchantRecommendations(merchantId: string): Promise<MerchantOfferRecommendation[]> {
    if (this.isDemoMode) return MockApiAdapter.getMerchantRecommendations(merchantId)
    try {
      return await this.request<MerchantOfferRecommendation[]>(`/merchants/${merchantId}/recommendations`)
    } catch {
      return MockApiAdapter.getMerchantRecommendations(merchantId)
    }
  }

  static async updateRecommendationStatus(
    recId: string,
    status: 'approved' | 'rejected' | 'paused'
  ): Promise<MerchantOfferRecommendation> {
    if (this.isDemoMode) return MockApiAdapter.updateRecommendationStatus(recId, status)
    try {
      return await this.request<MerchantOfferRecommendation>(`/recommendations/${recId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    } catch {
      return MockApiAdapter.updateRecommendationStatus(recId, status)
    }
  }

  static async getMerchantAnalytics(merchantId: string): Promise<MerchantAnalytics> {
    if (this.isDemoMode) return MockApiAdapter.getMerchantAnalytics(merchantId)
    try {
      return await this.request<MerchantAnalytics>(`/merchants/${merchantId}/analytics`)
    } catch {
      return MockApiAdapter.getMerchantAnalytics(merchantId)
    }
  }

  // -------------------------------------------------------------
  // NOTIFICATION & SETTINGS
  // -------------------------------------------------------------
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    if (this.isDemoMode) return MockApiAdapter.getNotificationPreferences(userId)
    try {
      return await this.request<NotificationPreferences>(`/settings/notifications/${userId}`)
    } catch {
      return MockApiAdapter.getNotificationPreferences(userId)
    }
  }

  static async updateNotificationPreferences(
    userId: string,
    prefs: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    if (this.isDemoMode) return MockApiAdapter.updateNotificationPreferences(userId, prefs)
    try {
      return await this.request<NotificationPreferences>(`/settings/notifications/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(prefs),
      })
    } catch {
      return MockApiAdapter.updateNotificationPreferences(userId, prefs)
    }
  }

  static getLocalizedNotificationCopy(
    merchantName: string,
    itemTitle: string,
    discountPct: number,
    finalPrice: number,
    walkMins: number,
    language: SupportedLanguage
  ) {
    return MockApiAdapter.getLocalizedNotificationCopy(
      merchantName,
      itemTitle,
      discountPct,
      finalPrice,
      walkMins,
      language
    )
  }

  // -------------------------------------------------------------
  // LIVE SYSTEM, ML INFERENCE & EMAIL SERVICES
  // -------------------------------------------------------------
  static async getHealth() {
    try {
      return await this.request<any>('/health')
    } catch {
      return { status: 'offline', services: { ai: { configured: false } } }
    }
  }

  static async getLiveTelemetry(lat?: number, lng?: number) {
    try {
      const q = lat && lng ? `?lat=${lat}&lng=${lng}` : ''
      const res = await this.request<{ success: boolean; data: any }>(`/portal/telemetry${q}`)
      return res.data
    } catch {
      return {
        temp_c: 33,
        condition: 'sunny',
        rain_mm: 0,
        time_formatted: '1:15 PM',
        window_label: 'Weekday Lunch Break',
        locality: 'Koramangala, Bengaluru',
      }
    }
  }

  static async evaluateOffers(customerId: string, contextOverrides = {}) {
    try {
      return await this.request<{ success: boolean; decision: any }>('/portal/customer/evaluate', {
        method: 'POST',
        body: JSON.stringify({ customerId, contextOverrides }),
      })
    } catch (e: any) {
      console.warn('[ApiClient] evaluateOffers notice:', e.message)
      return { success: false, decision: null }
    }
  }

  static async getEmailHistory() {
    try {
      const res = await this.request<{ success: boolean; data: any[] }>('/email/history')
      return res.data || []
    } catch {
      return []
    }
  }

  static async sendLiveEmail(payload: { to: string; subject: string; htmlBody: string }) {
    return await this.request<{ success: boolean; data: any }>('/email/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  static async generateAiDraft(payload: any) {
    return await this.request<{ success: boolean; data: any }>('/ai/generate-draft', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}
