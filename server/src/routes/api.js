import { Router } from 'express';
import { getPredictions, getPredictionById, triggerPipeline } from '../controllers/predictionController.js';
import { generateDraft, batchGenerate, getAiStatus } from '../controllers/aiController.js';
import { sendEmail, queueEmail, processQueue, getQueue, getHistory, getEmailStatus, clearQueue } from '../controllers/emailController.js';
import { 
  getPersonas, 
  registerCustomer, 
  getCustomerProfile, 
  updateCustomerPreferences, 
  evaluateOffers, 
  getMerchantDashboard, 
  updateMerchantSettings, 
  recordCustomerVisit,
  getLiveTelemetry
} from '../controllers/portalController.js';
import { login, register, getMe } from '../controllers/authController.js';
import { geminiService } from '../services/geminiService.js';
import { emailService } from '../services/emailService.js';

import { 
  getCustomer,
  updateCustomer,
  getPersonalizedOffers,
  getOfferById,
  redeemOffer,
  getCustomerHistory,
  getCustomerInsights,
  getMerchant,
  updateMerchant,
  getCatalog,
  getMerchantRecommendations,
  updateRecommendationStatus,
  getMerchantAnalytics,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../controllers/standardizedController.js';

const router = Router();

// Authentication Endpoints (UserID & Password)
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', getMe);

// Health & System Info
router.get('/health', async (req, res) => {
  const emailStatus = await emailService.getStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      predictions: 'ready',
      ai: {
        configured: geminiService.isConfigured(),
        model: geminiService.modelName,
      },
      email: emailStatus,
    }
  });
});

// Production Portals API
router.get('/portal/telemetry', getLiveTelemetry);
router.get('/portal/personas', getPersonas);
router.post('/portal/customer/register', registerCustomer);
router.get('/portal/customer/:id', getCustomerProfile);
router.put('/portal/customer/:id/preferences', updateCustomerPreferences);
router.post('/portal/customer/evaluate', evaluateOffers);
router.get('/portal/merchant/:id', getMerchantDashboard);
router.put('/portal/merchant/:id/settings', updateMerchantSettings);
router.post('/portal/merchant/record-visit', recordCustomerVisit);

// Predictions & Diagnostic APIs (Preserved for Admin/Audits)
router.get('/predictions', getPredictions);
router.get('/predictions/:scenarioId', getPredictionById);
router.post('/predictions/run-pipeline', triggerPipeline);

// AI Gemini API
router.get('/ai/status', getAiStatus);
router.post('/ai/generate-draft', generateDraft);
router.post('/ai/batch-drafts', batchGenerate);

// Email Notification API
router.get('/email/status', getEmailStatus);
router.post('/email/send', sendEmail);
router.post('/email/queue', queueEmail);
router.post('/email/process-queue', processQueue);
router.get('/email/queue', getQueue);
// Standardized REST endpoints for Frontend Application
router.get('/customers/:id', getCustomer);
router.put('/customers/:id', updateCustomer);
router.get('/customers/:id/history', getCustomerHistory);
router.get('/customers/:id/insights', getCustomerInsights);

router.get('/offers/personalized', getPersonalizedOffers);
router.get('/offers/:id', getOfferById);
router.post('/offers/:id/redeem', redeemOffer);

router.get('/merchants/:id', getMerchant);
router.put('/merchants/:id', updateMerchant);
router.get('/merchants/:id/catalog', getCatalog);
router.get('/merchants/:id/recommendations', getMerchantRecommendations);
router.patch('/recommendations/:id/status', updateRecommendationStatus);
router.get('/merchants/:id/analytics', getMerchantAnalytics);

router.get('/settings/notifications/:userId', getNotificationPreferences);
router.put('/settings/notifications/:userId', updateNotificationPreferences);

export default router;
