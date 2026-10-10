import type {
  CustomerProfile,
  MerchantProfile,
  CatalogItem,
  PersonalizedOffer,
  MerchantOfferRecommendation,
  MerchantAnalytics,
  RedemptionRecord,
  CustomerInsights,
  NotificationPreferences,
  User,
  SupportedLanguage,
} from '@/types'
import {
  mockCustomers,
  mockMerchants,
  mockCatalogItems,
  mockPersonalizedOffers,
  mockLittleFernRecommendations,
  mockRedemptionRecords,
  mockMerchantAnalytics,
  mockNotificationPreferences,
} from './mockData'

const STORAGE_KEYS = {
  CUSTOMERS: 'dos_customers',
  MERCHANTS: 'dos_merchants',
  CATALOG: 'dos_catalog',
  OFFERS: 'dos_offers',
  RECOMMENDATIONS: 'dos_recommendations',
  REDEMPTIONS: 'dos_redemptions',
  NOTIFICATIONS: 'dos_notifications',
  AUTH_USER: 'dos_auth_user',
}

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error(`Error saving to localStorage [${key}]:`, err)
  }
}

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export class MockApiAdapter {
  // -------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------
  static async login(email: string, role: 'customer' | 'merchant'): Promise<User> {
    await delay(300)
    let user: User
    if (role === 'customer') {
      const customers = this.getCustomers()
      const cust = customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) || customers[0]
      user = {
        id: cust.id,
        name: cust.name,
        email: cust.email,
        role: 'customer',
        locality: cust.locality,
      }
    } else {
      const merchants = this.getMerchants()
      const m = merchants.find((item) => item.contact_email.toLowerCase() === email.toLowerCase()) || merchants[0]
      user = {
        id: m.id,
        name: m.name,
        email: m.contact_email,
        role: 'merchant',
        locality: m.locality,
      }
    }
    setStored(STORAGE_KEYS.AUTH_USER, user)
    return user
  }

  static async getStoredUser(): Promise<User | null> {
    await delay(100)
    const user = getStored<User | null>(STORAGE_KEYS.AUTH_USER, null)
    if (user) return user
    // Default demo user: Priya Sharma (Customer)
    const defaultUser: User = {
      id: 'c_001',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      role: 'customer',
      locality: 'Koramangala',
    }
    setStored(STORAGE_KEYS.AUTH_USER, defaultUser)
    return defaultUser
  }

  static async logout(): Promise<void> {
    await delay(100)
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
  }

  // -------------------------------------------------------------
  // CUSTOMER APIS
  // -------------------------------------------------------------
  private static getCustomers(): CustomerProfile[] {
    return getStored<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, mockCustomers)
  }

  static async getCustomerProfile(id: string): Promise<CustomerProfile> {
    await delay(200)
    const customers = this.getCustomers()
    const found = customers.find((c) => c.id === id)
    if (!found) {
      throw new Error(`Customer with ID ${id} not found.`)
    }
    return found
  }

  static async updateCustomerProfile(id: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile> {
    await delay(350)
    const customers = this.getCustomers()
    const idx = customers.findIndex((c) => c.id === id)
    if (idx === -1) {
      throw new Error(`Customer with ID ${id} not found.`)
    }
    const updated: CustomerProfile = { ...customers[idx], ...updates }
    customers[idx] = updated
    setStored(STORAGE_KEYS.CUSTOMERS, customers)
    return updated
  }

  static async getPersonalizedOffers(params?: {
    customerId?: string
    locality?: string
    category?: string
    sortBy?: 'best_match' | 'highest_savings' | 'nearby' | 'expiring_soon'
  }): Promise<PersonalizedOffer[]> {
    await delay(300)
    let offers = getStored<PersonalizedOffer[]>(STORAGE_KEYS.OFFERS, mockPersonalizedOffers)

    if (params?.customerId) {
      offers = offers.filter((o) => o.customer_id === params.customerId)
    }

    if (params?.category && params.category !== 'all') {
      offers = offers.filter((o) => o.merchant_category.toLowerCase() === params.category!.toLowerCase())
    }

    // Never rank solely by discount percent when backend optimizes expected profit
    if (params?.sortBy === 'highest_savings') {
      offers.sort((a, b) => b.discount_amount_inr - a.discount_amount_inr)
    } else if (params?.sortBy === 'nearby') {
      offers.sort((a, b) => a.distance_m - b.distance_m)
    } else if (params?.sortBy === 'expiring_soon') {
      offers.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())
    } else {
      // Default: Best match / Expected profit ranking
      offers.sort((a, b) => b.expected_profit_inr - a.expected_profit_inr)
    }

    return offers
  }

  static async getOfferById(id: string): Promise<PersonalizedOffer> {
    await delay(200)
    const offers = getStored<PersonalizedOffer[]>(STORAGE_KEYS.OFFERS, mockPersonalizedOffers)
    const found = offers.find((o) => o.id === id)
    if (!found) {
      throw new Error(`Offer with ID ${id} not found.`)
    }
    return found
  }

  static async saveOffer(offerId: string): Promise<PersonalizedOffer> {
    await delay(200)
    const offers = getStored<PersonalizedOffer[]>(STORAGE_KEYS.OFFERS, mockPersonalizedOffers)
    const idx = offers.findIndex((o) => o.id === offerId)
    if (idx === -1) throw new Error('Offer not found')
    offers[idx].status = offers[idx].status === 'saved' ? 'available' : 'saved'
    setStored(STORAGE_KEYS.OFFERS, offers)
    return offers[idx]
  }

  static async dismissOffer(offerId: string): Promise<void> {
    await delay(200)
    const offers = getStored<PersonalizedOffer[]>(STORAGE_KEYS.OFFERS, mockPersonalizedOffers)
    const idx = offers.findIndex((o) => o.id === offerId)
    if (idx !== -1) {
      offers[idx].status = 'dismissed'
      setStored(STORAGE_KEYS.OFFERS, offers)
    }
  }

  static async redeemOffer(offerId: string, customerId: string): Promise<{
    offer: PersonalizedOffer
    redemption: RedemptionRecord
  }> {
    await delay(500)
    const offers = getStored<PersonalizedOffer[]>(STORAGE_KEYS.OFFERS, mockPersonalizedOffers)
    const offerIndex = offers.findIndex((o) => o.id === offerId)
    if (offerIndex === -1) {
      throw new Error('Offer not found')
    }

    const offer = offers[offerIndex]
    if (offer.status === 'redeemed') {
      throw new Error('Offer has already been redeemed.')
    }
    if (offer.status === 'expired' || new Date(offer.expires_at).getTime() < Date.now()) {
      throw new Error('Offer has expired and can no longer be redeemed.')
    }

    const verificationCode = `DOS-${Math.floor(1000 + Math.random() * 9000)}`
    const nowIso = new Date().toISOString()

    // Update offer
    offer.status = 'redeemed'
    offer.redemption_code = verificationCode
    offer.redeemed_at = nowIso
    offers[offerIndex] = offer
    setStored(STORAGE_KEYS.OFFERS, offers)

    // Create redemption record
    const customer = (await this.getCustomerProfile(customerId)) || mockCustomers[0]
    const redemptions = getStored<RedemptionRecord[]>(STORAGE_KEYS.REDEMPTIONS, mockRedemptionRecords)
    const newRedemption: RedemptionRecord = {
      id: `red_${Date.now()}`,
      offer_id: offer.id,
      scenario_id: offer.scenario_id,
      customer_id: customer.id,
      customer_name: customer.name,
      merchant_id: offer.merchant_id,
      merchant_name: offer.merchant_name,
      item_title: offer.item_title,
      original_price_inr: offer.original_price_inr,
      discount_pct: offer.discount_pct,
      final_price_inr: offer.final_price_inr,
      unit_cost_inr: offer.unit_cost_inr,
      realized_margin_inr: offer.post_discount_margin_inr,
      realized_savings_inr: offer.discount_amount_inr,
      predicted_p_accept: offer.predicted_p_accept,
      predicted_expected_profit_inr: offer.expected_profit_inr,
      redeemed_at: nowIso,
      verification_code: verificationCode,
    }
    redemptions.unshift(newRedemption)
    setStored(STORAGE_KEYS.REDEMPTIONS, redemptions)

    return { offer, redemption: newRedemption }
  }

  static async getCustomerHistory(customerId: string): Promise<RedemptionRecord[]> {
    await delay(250)
    const redemptions = getStored<RedemptionRecord[]>(STORAGE_KEYS.REDEMPTIONS, mockRedemptionRecords)
    return redemptions.filter((r) => r.customer_id === customerId)
  }

  static async getCustomerInsights(customerId: string): Promise<CustomerInsights> {
    await delay(200)
    const offers = getStored<PersonalizedOffer[]>(STORAGE_KEYS.OFFERS, mockPersonalizedOffers).filter(
      (o) => o.customer_id === customerId
    )
    const redemptions = getStored<RedemptionRecord[]>(STORAGE_KEYS.REDEMPTIONS, mockRedemptionRecords).filter(
      (r) => r.customer_id === customerId
    )

    const activeCount = offers.filter((o) => o.status === 'available').length
    const savedCount = offers.filter((o) => o.status === 'saved').length
    const redeemedCount = redemptions.length
    const realizedSavings = redemptions.reduce((acc, curr) => acc + curr.realized_savings_inr, 0)
    const potentialSavings = offers
      .filter((o) => o.status === 'available' || o.status === 'saved')
      .reduce((acc, curr) => acc + curr.discount_amount_inr, 0)

    return {
      active_offers_count: activeCount,
      saved_offers_count: savedCount,
      redeemed_offers_count: redeemedCount,
      realized_savings_inr: Math.round(realizedSavings * 100) / 100,
      potential_available_savings_inr: Math.round(potentialSavings * 100) / 100,
    }
  }

  // -------------------------------------------------------------
  // MERCHANT APIS
  // -------------------------------------------------------------
  private static getMerchants(): MerchantProfile[] {
    return getStored<MerchantProfile[]>(STORAGE_KEYS.MERCHANTS, mockMerchants)
  }

  static async getMerchantProfile(id: string): Promise<MerchantProfile> {
    await delay(200)
    const merchants = this.getMerchants()
    const found = merchants.find((m) => m.id === id)
    if (!found) throw new Error(`Merchant with ID ${id} not found.`)
    return found
  }

  static async updateMerchantProfile(id: string, updates: Partial<MerchantProfile>): Promise<MerchantProfile> {
    await delay(350)
    const merchants = this.getMerchants()
    const idx = merchants.findIndex((m) => m.id === id)
    if (idx === -1) throw new Error(`Merchant with ID ${id} not found.`)
    const updated = { ...merchants[idx], ...updates }
    merchants[idx] = updated
    setStored(STORAGE_KEYS.MERCHANTS, merchants)
    return updated
  }

  static async getCatalog(merchantId: string): Promise<CatalogItem[]> {
    await delay(250)
    const catalog = getStored<CatalogItem[]>(STORAGE_KEYS.CATALOG, mockCatalogItems)
    return catalog.filter((item) => item.merchant_id === merchantId)
  }

  static async addCatalogItem(merchantId: string, itemData: Omit<CatalogItem, 'id' | 'merchant_id'>): Promise<CatalogItem> {
    await delay(300)
    const catalog = getStored<CatalogItem[]>(STORAGE_KEYS.CATALOG, mockCatalogItems)
    const newItem: CatalogItem = {
      ...itemData,
      id: `i_${merchantId.replace('m_', '')}_${Date.now()}`,
      merchant_id: merchantId,
    }
    catalog.unshift(newItem)
    setStored(STORAGE_KEYS.CATALOG, catalog)
    return newItem
  }

  static async updateCatalogItem(merchantId: string, itemId: string, updates: Partial<CatalogItem>): Promise<CatalogItem> {
    await delay(300)
    const catalog = getStored<CatalogItem[]>(STORAGE_KEYS.CATALOG, mockCatalogItems)
    const idx = catalog.findIndex((i) => i.id === itemId && i.merchant_id === merchantId)
    if (idx === -1) throw new Error('Catalog item not found')
    catalog[idx] = { ...catalog[idx], ...updates }
    setStored(STORAGE_KEYS.CATALOG, catalog)
    return catalog[idx]
  }

  static async deleteCatalogItem(merchantId: string, itemId: string): Promise<void> {
    await delay(250)
    let catalog = getStored<CatalogItem[]>(STORAGE_KEYS.CATALOG, mockCatalogItems)
    catalog = catalog.filter((i) => !(i.id === itemId && i.merchant_id === merchantId))
    setStored(STORAGE_KEYS.CATALOG, catalog)
  }

  static async getMerchantRecommendations(merchantId: string): Promise<MerchantOfferRecommendation[]> {
    await delay(300)
    const recs = getStored<MerchantOfferRecommendation[]>(STORAGE_KEYS.RECOMMENDATIONS, mockLittleFernRecommendations)
    return recs.filter((r) => r.merchant_id === merchantId)
  }

  static async updateRecommendationStatus(
    recId: string,
    status: 'approved' | 'rejected' | 'paused'
  ): Promise<MerchantOfferRecommendation> {
    await delay(300)
    const recs = getStored<MerchantOfferRecommendation[]>(STORAGE_KEYS.RECOMMENDATIONS, mockLittleFernRecommendations)
    const idx = recs.findIndex((r) => r.id === recId)
    if (idx === -1) throw new Error('Recommendation not found')
    recs[idx].recommendation_status = status
    setStored(STORAGE_KEYS.RECOMMENDATIONS, recs)
    return recs[idx]
  }

  static async getMerchantAnalytics(merchantId: string): Promise<MerchantAnalytics> {
    await delay(300)
    // Synchronize realized profit from recorded redemptions
    const redemptions = getStored<RedemptionRecord[]>(STORAGE_KEYS.REDEMPTIONS, mockRedemptionRecords).filter(
      (r) => r.merchant_id === merchantId
    )
    const realizedMarginTotal = redemptions.reduce((acc, r) => acc + r.realized_margin_inr, 0)

    const baseAnalytics = { ...mockMerchantAnalytics }
    baseAnalytics.offers_redeemed_count = redemptions.length
    baseAnalytics.realized_contribution_profit_inr = Math.round(realizedMarginTotal * 100) / 100

    return baseAnalytics
  }

  // -------------------------------------------------------------
  // NOTIFICATION & SETTINGS
  // -------------------------------------------------------------
  static async getNotificationPreferences(_userId: string): Promise<NotificationPreferences> {
    await delay(150)
    return getStored<NotificationPreferences>(STORAGE_KEYS.NOTIFICATIONS, mockNotificationPreferences)
  }

  static async updateNotificationPreferences(
    _userId: string,
    prefs: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    await delay(250)
    const current = getStored<NotificationPreferences>(STORAGE_KEYS.NOTIFICATIONS, mockNotificationPreferences)
    const updated = { ...current, ...prefs }
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated)
    return updated
  }

  // -------------------------------------------------------------
  // EMAIL CAMPAIGN / LOCALIZED COPY GENERATOR
  // -------------------------------------------------------------
  static getLocalizedNotificationCopy(
    merchantName: string,
    itemTitle: string,
    discountPct: number,
    finalPrice: number,
    walkMins: number,
    language: SupportedLanguage
  ): { title: string; body: string; cta: string } {
    const discText = discountPct > 0 ? `${Math.round(discountPct)}% off` : 'Special Offer'
    const walkText = `${Math.max(1, Math.round(walkMins))} min walk`

    switch (language) {
      case 'hi-en':
        return {
          title: `${merchantName} par ${discText}`,
          body: `${merchantName} par ${itemTitle} ke saath lunch enjoy karein at ₹${finalPrice.toFixed(0)}. Sirf ${walkText} door!`,
          cta: 'Abhi grab karein',
        }
      case 'kn-en':
        return {
          title: `${merchantName} alli ${discText}`,
          body: `${merchantName} nalli ${itemTitle} matthu bisi break at ₹${finalPrice.toFixed(0)}. Kevala ${walkText} dooradalli.`,
          cta: 'Ivara labha padeyiri',
        }
      case 'te-en':
        return {
          title: `${merchantName} lo ${discText}`,
          body: `${merchantName} lo ${itemTitle} ₹${finalPrice.toFixed(0)} ke pondandi. Kevalam ${walkText} dooram.`,
          cta: 'Ipude pondandi',
        }
      case 'ta-en':
        return {
          title: `${merchantName} il ${discText}`,
          body: `${merchantName} il ${itemTitle} ₹${finalPrice.toFixed(0)} mattrum nalla break. Verum ${walkText} thoorathil.`,
          cta: 'Udanadiyaga perunga',
        }
      case 'hi':
        return {
          title: `${merchantName} पर ${discText}`,
          body: `${merchantName} पर ${itemTitle} का आनंद लें केवल ₹${finalPrice.toFixed(0)} में। मात्र ${walkText} की दूरी पर!`,
          cta: 'अभी प्राप्त करें',
        }
      case 'en':
      default:
        return {
          title: `${merchantName}: ${discText} on ${itemTitle}`,
          body: `Enjoy ${itemTitle} at ${merchantName} for ₹${finalPrice.toFixed(0)}. Just a ${walkText} away.`,
          cta: 'View My Offer',
        }
    }
  }
}
