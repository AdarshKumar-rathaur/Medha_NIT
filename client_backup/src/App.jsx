import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import CustomerPortal from './components/CustomerPortal';
import MerchantPortal from './components/MerchantPortal';
import AuthModal from './components/AuthModal';
import EmailHistoryDrawer from './components/EmailHistoryDrawer';
import { api } from './services/api';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  
  // Authentication State
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medha_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authRole, setAuthRole] = useState(() => {
    return localStorage.getItem('medha_auth_role') || 'customer';
  });

  const [isAuthOpen, setIsAuthOpen] = useState(() => !authUser);

  // Portal State
  const [portalMode, setPortalMode] = useState(() => {
    const savedRole = localStorage.getItem('medha_auth_role');
    return savedRole === 'merchant' ? 'merchant' : 'customer';
  });

  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerData, setCustomerData] = useState({ customer: null, offers: [] });

  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [merchantData, setMerchantData] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // 1. Data Loader: Customer Profile & Offers
  const loadCustomerData = useCallback(async (customerId) => {
    if (!customerId) return;
    try {
      const res = await api.getCustomerProfile(customerId);
      if (res.success && res.customer) {
        setCustomerData({
          customer: res.customer,
          offers: res.offers || [],
        });
        setCurrentCustomer(res.customer);
      }
    } catch (e) {
      console.warn('Customer load notice:', e.message);
    }
  }, []);

  // 2. Data Loader: Merchant Dashboard
  const loadMerchantData = useCallback(async (merchantId) => {
    if (!merchantId) return;
    try {
      const res = await api.getMerchantDashboard(merchantId);
      if (res.success && res.merchant) {
        setMerchantData(res);
        setCurrentMerchant(res.merchant);
      }
    } catch (e) {
      console.warn('Merchant load notice:', e.message);
    }
  }, []);

  // 3. Initial App Startup & Session Hydration
  useEffect(() => {
    async function initApp() {
      setIsLoading(true);
      try {
        const [healthRes, historyRes] = await Promise.all([
          api.getHealth().catch(() => ({})),
          api.getEmailHistory().catch(() => ({ data: [] })),
        ]);
        setHealth(healthRes);
        setEmailHistory(historyRes.data || []);

        if (authUser?.id) {
          if (authRole === 'merchant') {
            await loadMerchantData(authUser.id);
            // Also load default customer c_001 so customer view is operable if switched
            loadCustomerData('c_001');
          } else {
            await loadCustomerData(authUser.id);
            // Also load default merchant m_001 so merchant view is operable if switched
            loadMerchantData('m_001');
          }
        } else {
          // No active auth, load defaults for preview behind auth modal
          loadCustomerData('c_001');
          loadMerchantData('m_001');
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initApp();
  }, []);

  // 4. REAL-TIME DYNAMIC AUTO-POLLING HEARTBEAT
  // Guarantees that whenever ML predictions run, vouchers are created, or redemptions occur,
  // both Customer and Merchant portals stay completely synchronized without reloading!
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentCustomer?.id) {
        await loadCustomerData(currentCustomer.id);
      }
      if (currentMerchant?.id) {
        await loadMerchantData(currentMerchant.id);
      }
      // Also silently refresh email history if count changes
      api.getEmailHistory().then(hist => {
        if (hist.data && hist.data.length !== emailHistory.length) {
          setEmailHistory(hist.data);
        }
      }).catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [currentCustomer?.id, currentMerchant?.id, loadCustomerData, loadMerchantData, emailHistory.length]);

  // 5. Authentication Handlers
  const handleLoginSuccess = async (user, role) => {
    setAuthUser(user);
    setAuthRole(role);
    setPortalMode(role);
    setIsAuthOpen(false);

    try {
      localStorage.setItem('medha_auth_user', JSON.stringify(user));
      localStorage.setItem('medha_auth_role', role);
    } catch (e) {
      console.warn('LocalStorage save notice:', e);
    }

    showToast(`Welcome ${user.name}! Signed in as ${role === 'merchant' ? 'Merchant' : 'Customer'}.`);

    if (role === 'merchant') {
      setCurrentMerchant(user);
      await loadMerchantData(user.id);
      loadCustomerData('c_001');
    } else {
      setCurrentCustomer(user);
      await loadCustomerData(user.id);
      loadMerchantData('m_001');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('medha_auth_user');
      localStorage.removeItem('medha_auth_role');
    } catch {}
    setAuthUser(null);
    setIsAuthOpen(true);
    showToast('Signed out of portal. Please log in with your User ID and password.', 'info');
  };

  // 6. Preference Update (Triggered dynamically from Customer Portal form)
  const handleUpdatePreferences = async (updates) => {
    const custId = currentCustomer?.id || authUser?.id || 'c_001';
    setIsEvaluating(true);
    try {
      showToast('Evaluating real-time ML decisions across nearby merchants...', 'info');
      const res = await api.updateCustomerPreferences(custId, updates);
      
      // Immediately reflect updated customer & offers
      setCustomerData({
        customer: res.customer,
        offers: res.offers || [],
      });
      setCurrentCustomer(res.customer);

      if (res.new_decision?.action === 'send') {
        showToast(`🎯 Grounded Offer Found! ${res.new_decision.offer?.discount_pct}% off at ${res.new_decision.merchant?.name}. Email dispatched!`);
        // If merchant was updated, refresh merchant data too
        if (currentMerchant?.id) loadMerchantData(currentMerchant.id);
      } else {
        showToast(`ML Decision: Suppressed (${res.new_decision?.reason || 'No commercial send viable for current context.'})`, 'info');
      }

      // Refresh outbox
      const hist = await api.getEmailHistory();
      if (hist.data) setEmailHistory(hist.data);
    } catch (e) {
      showToast(`Update error: ${e.message}`, 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  // 7. On-Demand ML Offer Evaluation
  const handleEvaluateNow = async () => {
    const custId = currentCustomer?.id || authUser?.id || 'c_001';
    setIsEvaluating(true);
    try {
      showToast('Scanning surrounding merchants with Python XGBoost engine...', 'info');
      const res = await api.evaluateOffers(custId);
      
      // Reload profile & offers
      await loadCustomerData(custId);
      if (currentMerchant?.id) await loadMerchantData(currentMerchant.id);

      if (res.decision?.action === 'send') {
        showToast(`🎯 Grounded Offer Found! Email delivered to ${currentCustomer?.email || 'inbox'}`);
      } else {
        showToast(`ML Decision: Suppressed (${res.decision?.reason || 'Margin constraints exceeded'})`, 'info');
      }

      const hist = await api.getEmailHistory();
      if (hist.data) setEmailHistory(hist.data);
    } catch (e) {
      showToast(`Evaluation error: ${e.message}`, 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  // 8. Merchant Operational Settings Update
  const handleUpdateMerchantSettings = async (updates) => {
    const merchId = currentMerchant?.id || authUser?.id || 'm_001';
    try {
      const res = await api.updateMerchantSettings(merchId, updates);
      showToast('Merchant operational capacity & discount limits updated!');
      await loadMerchantData(merchId);
    } catch (e) {
      showToast(`Failed to update settings: ${e.message}`, 'error');
    }
  };

  // 9. Merchant Confirming Customer Walk-In Visit (THE CLOSED-LOOP FEEDBACK!)
  const handleRecordCustomerVisit = async (payload) => {
    setIsRecording(true);
    try {
      const res = await api.recordCustomerVisit(payload);
      showToast('✓ Walk-in visit confirmed! Merchant occupancy updated and customer signals refreshed!');
      
      // Refresh BOTH sides immediately so changes are visible instantly
      if (payload.merchantId) await loadMerchantData(payload.merchantId);
      if (payload.customerId) await loadCustomerData(payload.customerId);
    } catch (e) {
      showToast(`Failed to confirm visit: ${e.message}`, 'error');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar with Auth Status, Mode Switch, Sign Out (NO DEMO DROPDOWNS!) */}
      <Navbar
        portalMode={portalMode}
        onSelectPortalMode={setPortalMode}
        authUser={authUser}
        authRole={authRole}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={emailHistory.length}
        health={health}
      />

      {/* Floating Dynamic Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 100,
          background: toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'info' ? '#6366f1' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          fontSize: 14,
          animation: 'pulseGlow 0.3s ease',
        }}>
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : toastMessage.type === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Portals Container */}
      <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 24px 60px 24px' }}>
        {portalMode === 'customer' ? (
          <CustomerPortal
            customer={customerData.customer || currentCustomer}
            offers={customerData.offers}
            onUpdatePreferences={handleUpdatePreferences}
            onOpenOnboarding={() => setIsAuthOpen(true)}
            onEvaluateNow={handleEvaluateNow}
            isEvaluating={isEvaluating}
          />
        ) : (
          <MerchantPortal
            merchant={merchantData?.merchant || currentMerchant}
            dashboardData={merchantData}
            onUpdateSettings={handleUpdateMerchantSettings}
            onRecordVisit={handleRecordCustomerVisit}
            onRefresh={() => loadMerchantData(currentMerchant?.id || 'm_001')}
            isRecording={isRecording}
          />
        )}
      </main>

      {/* Authentication & Account Creation Modal (User ID & Password) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        api={api}
        canClose={Boolean(authUser)}
      />

      {/* Nodemailer Outbox Drawer */}
      <EmailHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={emailHistory}
        queue={[]}
        onRefresh={async () => {
          const hist = await api.getEmailHistory();
          if (hist.data) setEmailHistory(hist.data);
        }}
        onProcessQueue={() => {}}
        isProcessingQueue={false}
      />
    </div>
  );
}
