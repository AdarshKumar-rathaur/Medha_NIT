import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { geminiService } from './geminiService.js';
import { emailService } from './emailService.js';
import { storeService } from './storeService.js';
import { weatherService } from './weatherService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RECOMMENDER_SCRIPT = path.resolve(__dirname, '../../../ml_engine/decision_engine/realtime_recommender.py');

class RealtimeInferenceService {
  async runInference(customer, contextOverrides = {}) {
    // Automatically fetch real-time weather and temporal context for customer's location
    const lat = customer.current_lat || 12.9353;
    const lng = customer.current_lng || 77.62377;
    const autoTelemetry = await weatherService.getLiveContext(lat, lng);

    const context = {
      timestamp: autoTelemetry.timestamp,
      lat,
      lng,
      temp_c: contextOverrides.temp_c !== undefined ? parseFloat(contextOverrides.temp_c) : autoTelemetry.temp_c,
      condition: contextOverrides.condition || autoTelemetry.condition,
      rain_mm: contextOverrides.rain_mm !== undefined ? parseFloat(contextOverrides.rain_mm) : autoTelemetry.rain_mm,
      minutes_available: contextOverrides.minutes_available || customer.minutes_available || 25.0,
      intent: contextOverrides.intent || customer.intent || 'quick lunch',
      window_label: autoTelemetry.window_label,
      time_formatted: autoTelemetry.time_formatted,
      day_of_week: autoTelemetry.day_of_week,
    };

    // Grab current merchants list to pass any live occupancy overrides
    const merchants = await storeService.getMerchants();
    const merchantsOverride = merchants.map(m => ({
      id: m.id,
      occupancy_pct: m.occupancy_pct,
      capacity: m.capacity,
      inventory_signal: m.inventory_signal,
    }));

    const payload = {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        locality: customer.locality,
        current_lat: customer.current_lat,
        current_lng: customer.current_lng,
        wallet_inr: customer.wallet_inr,
        avg_spend: customer.avg_spend,
        declared_preferences: customer.declared_preferences,
        observed_signals: customer.observed_signals,
        marketing_consent: customer.marketing_consent !== false,
      },
      context,
      merchants_override: merchantsOverride,
    };

    const pythonOutput = await this.executePythonScript(payload);
    let decision;
    try {
      decision = JSON.parse(pythonOutput);
    } catch (e) {
      throw new Error(`Failed to parse ML recommender output: ${e.message}. Raw: ${pythonOutput}`);
    }

    // Attach full customer & merchant metadata
    const merchantId = decision.offer?.merchant_id;
    const merchant = merchantId ? await storeService.getMerchant(merchantId) : null;

    const enriched = {
      offer_id: `off_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      scenario_id: decision.scenario_id,
      action: decision.action,
      reason: decision.reason,
      offer: decision.offer,
      notification: decision.notification,
      ui_hints: decision.ui_hints,
      profit_estimate_inr: decision.profit_estimate_inr,
      ml_details: decision.ml_details,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        locality: customer.locality,
        wallet_inr: customer.wallet_inr,
      },
      merchant: merchant ? {
        id: merchant.id,
        name: merchant.name,
        category: merchant.category,
        locality: merchant.locality,
        occupancy_pct: merchant.occupancy_pct,
      } : decision.merchant_details || null,
      context,
      status: decision.action === 'send' ? 'active' : 'suppressed',
      created_at: new Date().toISOString(),
    };

    // If decision is SEND, immediately trigger Gemini AI Draft & Nodemailer delivery!
    if (enriched.action === 'send') {
      try {
        console.log(`[RealtimeInference] Generating Gemini email draft for ${customer.name}...`);
        const draft = await geminiService.generateEmailDraft(enriched);
        enriched.gemini_draft = draft;

        console.log(`[RealtimeInference] Dispatching Nodemailer email to ${customer.email}...`);
        const emailResult = await emailService.sendEmail({
          to: customer.email,
          subject: draft.subject,
          html: draft.htmlBody,
          text: draft.plainText,
          scenario_id: enriched.scenario_id,
          metadata: {
            customer_name: customer.name,
            merchant_name: enriched.merchant?.name,
            offer_id: enriched.offer_id,
          }
        });

        enriched.email_delivery = {
          message_id: emailResult.id,
          sent_at: emailResult.sentAt,
          status: emailResult.status,
          preview_url: emailResult.previewUrl,
        };
      } catch (err) {
        console.error('[RealtimeInference] Automated email generation/send error:', err.message);
        enriched.email_delivery = { status: 'FAILED', error: err.message };
      }
    }

    // Always persist latest decision in store (supersedes prior active offers if suppressed or changed!)
    await storeService.saveOffer(enriched);

    return enriched;
  }

  executePythonScript(payload) {
    return new Promise((resolve, reject) => {
      const inputStr = JSON.stringify(payload);
      const py = spawn('python', [RECOMMENDER_SCRIPT, '--input-json', inputStr], {
        cwd: config.paths.mlEngineDir,
      });

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', data => { stdout += data.toString(); });
      py.stderr.on('data', data => { stderr += data.toString(); });

      py.on('close', code => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Python recommender exited with code ${code}: ${stderr || stdout}`));
        }
      });
    });
  }
}

export const realtimeInferenceService = new RealtimeInferenceService();
