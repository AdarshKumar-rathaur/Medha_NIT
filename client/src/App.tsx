import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { DemoProvider } from '@/context/DemoContext'
import { ToastProvider } from '@/context/ToastContext'

import { AppLayout } from '@/components/layout/AppLayout'
import { RoleGuard } from '@/components/layout/RoleGuard'

// Public Pages
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

// Customer Pages
import { CustomerDashboard } from '@/pages/customer/CustomerDashboard'
import { CustomerProfile } from '@/pages/customer/CustomerProfile'
import { CustomerOffers } from '@/pages/customer/CustomerOffers'
import { OfferDetailsPage } from '@/pages/customer/OfferDetailsPage'
import { CustomerHistory } from '@/pages/customer/CustomerHistory'

// Merchant Pages
import { MerchantDashboard } from '@/pages/merchant/MerchantDashboard'
import { MerchantProfile } from '@/pages/merchant/MerchantProfile'
import { MerchantCatalog } from '@/pages/merchant/MerchantCatalog'
import { MerchantOffers } from '@/pages/merchant/MerchantOffers'
import { MerchantAnalytics } from '@/pages/merchant/MerchantAnalytics'
import { EmailCampaignPage } from '@/pages/merchant/EmailCampaignPage'

// Settings
import { NotificationSettingsPage } from '@/pages/settings/NotificationSettingsPage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DemoProvider>
          <ToastProvider>
            <Routes>
              <Route element={<AppLayout />}>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Customer Routes (Protected) */}
                <Route
                  path="/customer/dashboard"
                  element={
                    <RoleGuard allowedRoles={['customer']}>
                      <CustomerDashboard />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/customer/profile"
                  element={
                    <RoleGuard allowedRoles={['customer']}>
                      <CustomerProfile />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/customer/offers"
                  element={
                    <RoleGuard allowedRoles={['customer']}>
                      <CustomerOffers />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/customer/offer/:id"
                  element={
                    <RoleGuard allowedRoles={['customer']}>
                      <OfferDetailsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/customer/history"
                  element={
                    <RoleGuard allowedRoles={['customer']}>
                      <CustomerHistory />
                    </RoleGuard>
                  }
                />

                {/* Merchant Routes (Protected) */}
                <Route
                  path="/merchant/dashboard"
                  element={
                    <RoleGuard allowedRoles={['merchant']}>
                      <MerchantDashboard />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/merchant/profile"
                  element={
                    <RoleGuard allowedRoles={['merchant']}>
                      <MerchantProfile />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/merchant/catalog"
                  element={
                    <RoleGuard allowedRoles={['merchant']}>
                      <MerchantCatalog />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/merchant/offers"
                  element={
                    <RoleGuard allowedRoles={['merchant']}>
                      <MerchantOffers />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/merchant/analytics"
                  element={
                    <RoleGuard allowedRoles={['merchant']}>
                      <MerchantAnalytics />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/merchant/email-preview"
                  element={
                    <RoleGuard allowedRoles={['merchant']}>
                      <EmailCampaignPage />
                    </RoleGuard>
                  }
                />

                {/* Common Settings Routes */}
                <Route
                  path="/settings/notifications"
                  element={
                    <RoleGuard allowedRoles={['customer', 'merchant']}>
                      <NotificationSettingsPage />
                    </RoleGuard>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </ToastProvider>
        </DemoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
