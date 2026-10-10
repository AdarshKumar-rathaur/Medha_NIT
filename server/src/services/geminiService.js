import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

class GeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.modelName = config.gemini.model || 'gemini-2.5-flash';
    this.aiClient = null;

    if (this.apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err.message);
      }
    }
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  updateApiKey(newKey) {
    this.apiKey = newKey;
    if (newKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: newKey });
      } catch (err) {
        this.aiClient = null;
      }
    } else {
      this.aiClient = null;
    }
  }

  async generateEmailDraft(prediction, customInstructions = '') {
    // If API key is present, attempt Gemini call
    if (this.isConfigured() && this.aiClient) {
      try {
        return await this.callGeminiModel(prediction, customInstructions);
      } catch (err) {
        console.error('Gemini API call failed, falling back to local algorithmic generator:', err.message);
        const fallback = this.generateAlgorithmicDraft(prediction, customInstructions);
        fallback.ai_warning = `Gemini API returned error: ${err.message}. Showing high-fidelity template draft.`;
        return fallback;
      }
    }

    // High fidelity template fallback
    const draft = this.generateAlgorithmicDraft(prediction, customInstructions);
    draft.ai_warning = 'No GEMINI_API_KEY detected in .env. Generated using the ML heuristic template engine. Add GEMINI_API_KEY in server/.env to activate live Google Gemini generation.';
    return draft;
  }

  async callGeminiModel(prediction, customInstructions) {
    const prompt = this.buildPrompt(prediction, customInstructions);

    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text;
    try {
      const parsed = JSON.parse(responseText);
      return {
        ...parsed,
        is_live_gemini: true,
        model_used: this.modelName,
        generated_at: new Date().toISOString(),
      };
    } catch (parseErr) {
      // Clean potential markdown fences if response contained ```json
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        ...parsed,
        is_live_gemini: true,
        model_used: this.modelName,
        generated_at: new Date().toISOString(),
      };
    }
  }

  buildPrompt(prediction, customInstructions) {
    const isSend = prediction.action === 'send';
    const offer = prediction.offer || {};
    const notify = prediction.notification || {};
    const ui = prediction.ui_hints || {};
    const cust = prediction.customer || {};
    const merch = prediction.merchant || {};
    const ctx = prediction.context || {};

    return `
You are an expert AI Marketing Copywriter & Behavioral Economist for an autonomous real-time hyper-local recommendation engine.
Your task is to transform a raw machine learning decision into an exceptional, high-converting, professional email draft.

### PREDICTION DATA:
- Scenario ID: ${prediction.scenario_id}
- Decision Action: ${prediction.action.toUpperCase()}
- Decision Reason: ${prediction.reason || 'N/A'}
- Estimated Profit: ₹${prediction.profit_estimate_inr || 0}
- Customer Name: ${cust.name || 'Valued Guest'}
- Customer Locality: ${cust.locality || 'Nearby'}
- Customer Declared Preferences: ${cust.declared_preferences || 'None'}
- Customer Observed Signals: ${cust.observed_signals || 'General Explorer'}
- Customer Wallet Balance: ₹${cust.wallet_inr || 'N/A'}
- Contextual Weather: ${ctx.weather?.temp_c || 30}°C, ${ctx.weather?.condition || 'clear'} (Rain: ${ctx.weather?.rain_mm || 0}mm)
- Time Available: ${ctx.minutes_available || 30} minutes
- Customer Intent: ${ctx.intent || 'Leisure & food'}
- Merchant Name: ${merch.name || 'Featured Partner'}
- Merchant Category: ${merch.category || 'Dining'}
- Offer Discount: ${offer.discount_pct || 0}%
- Final Price: ₹${offer.final_price_inr || 'Special Price'}
- Valid Duration: ${offer.valid_minutes || 30} minutes
- Proximity: ${ui.distance_m || 100} meters (~${ui.walk_minutes || 2} min walk)
- Raw Notification Text: "${notify.title || ''}" - "${notify.body || ''}"
${customInstructions ? `\n### CUSTOM USER INSTRUCTIONS:\n${customInstructions}` : ''}

### OUTPUT REQUIREMENTS:
${isSend ? `
Since action is 'SEND', create an enticing, highly personalized customer-facing email draft.
Incorporate:
1. Proximity highlight (e.g. just a quick ${ui.walk_minutes || 2}-minute walk).
2. Weather and time context (e.g. cooling down on a warm ${ctx.weather?.temp_c || 30}°C afternoon or lunch break).
3. The exact item/discount and urgent countdown timer (valid for ${offer.valid_minutes || 30} mins).
4. Responsive HTML body with clean inline styling (dark/light neutral cards, CTA button, discount badge).
` : `
Since action is 'SKIP', create an internal merchant/ops notification email explaining that no offer was sent, citing the business logic and guardrails (e.g., marketing consent blocked, low customer affinity, or margin threshold).
`}

Return STRICTLY a JSON object with this schema:
{
  "subject": "Compelling subject line",
  "previewText": "Short inbox snippet preview text (under 80 characters)",
  "headline": "Hero section header text",
  "tone": "e.g. Friendly, energetic, personalized, contextual",
  "targetAudiencePersona": "Short description of who this email is tailored for",
  "rationale": "Why this specific copy was chosen based on the ML features",
  "plainText": "Clean plain-text version of the email",
  "htmlBody": "<div style=\\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; ...\\">...</div>"
}
`;
  }

  generateAlgorithmicDraft(prediction, customInstructions = '') {
    const isSend = prediction.action === 'send';
    const cust = prediction.customer || {};
    const merch = prediction.merchant || {};
    const ctx = prediction.context || {};
    const offer = prediction.offer || {};
    const ui = prediction.ui_hints || {};
    const notify = prediction.notification || {};

    const customerName = cust.name || 'Friend';
    const merchantName = merch.name || 'Neighborhood Favorite';
    const discountPct = offer.discount_pct || 15;
    const finalPrice = offer.final_price_inr ? `₹${Math.round(offer.final_price_inr)}` : 'Special Rate';
    const walkMins = ui.walk_minutes || 2;
    const validMins = offer.valid_minutes || 30;
    const tempC = ctx.weather?.temp_c || 30;
    const weatherCond = ctx.weather?.condition || 'sunny';

    if (isSend) {
      const subject = `☕ ${merchantName}: Exclusive ${discountPct}% off just for you!`;
      const previewText = `Just ${walkMins} min away. Enjoy your break with a fresh treat at ${finalPrice}.`;
      const headline = `A Curated Treat from ${merchantName}`;
      
      const plainText = `Hi ${customerName},

We noticed you're just ${walkMins} minute(s) away from ${merchantName}! 

Since it's ${tempC}°C and ${weatherCond} outside, here is an exclusive flash offer to brighten your break:
• Discount: ${discountPct}% OFF
• Final Price: ${finalPrice}
• Proximity: Only ${walkMins} min walk (${ui.distance_m || 100}m)
• Validity: Valid for the next ${validMins} minutes only!

Claim your offer now: ${notify.cta || 'Redeem at Counter'}

Have a great rest of your day!
Team Medha Decision Offers`;

      const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 28px; text-align: center;">
    <span style="background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); color: #ffffff; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
      Personalized Flash Offer
    </span>
    <h1 style="color: #ffffff; margin: 16px 0 8px 0; font-size: 26px; font-weight: 800; line-height: 1.2;">${headline}</h1>
    <p style="color: #e0e7ff; margin: 0; font-size: 15px;">Tailored for ${customerName} • Just ${walkMins} min walk away</p>
  </div>

  <div style="padding: 28px 24px;">
    <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">
      Hi <strong>${customerName}</strong>, beat the ${tempC}°C heat with a refreshing recharge! We've unlocked an exclusive offer at <strong>${merchantName}</strong>.
    </p>

    <!-- Offer Card -->
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; display: block;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Special Price</div>
            <div style="font-size: 32px; font-weight: 800; color: #10b981;">${finalPrice}</div>
          </td>
          <td style="text-align: right;">
            <div style="background-color: #065f46; color: #34d399; font-size: 14px; font-weight: 700; padding: 6px 12px; border-radius: 8px; display: inline-block;">
              ${discountPct}% DISCOUNT
            </div>
          </td>
        </tr>
      </table>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #475569; font-size: 14px; color: #94a3b8;">
        <span>📍 <strong>${ui.distance_m || 100}m</strong> distance</span> &bull; 
        <span>⏳ Valid for next <strong>${validMins} mins</strong></span> &bull; 
        <span>🎯 Category: <strong>${merch.category || 'Cafe'}</strong></span>
      </div>
    </div>

    <div style="text-align: center; margin: 32px 0 20px 0;">
      <a href="#" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.4);">
        ${notify.cta || 'Redeem Offer Now'} &rarr;
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
      Reason grounded by ML Model: <em>${prediction.reason || 'Context and commercial rules allow grounded offer.'}</em>
    </p>
  </div>

  <div style="background-color: #090d16; padding: 18px 24px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b;">
    Moment IQ Decision Engine &bull; Grounded Real-Time Decisioning &bull; Powered by Gemini AI
  </div>
</div>`;

      return {
        subject,
        previewText,
        headline,
        tone: 'Warm, context-aware, hyper-local marketing offer',
        targetAudiencePersona: `${customerName} (Locality: ${cust.locality}, Intent: ${ctx.intent})`,
        rationale: `Selected ${discountPct}% discount at ${merchantName} maximizing expected merchant profit (₹${prediction.profit_estimate_inr || 0}) while honoring ${walkMins} min walk budget.`,
        plainText,
        htmlBody,
        is_live_gemini: false,
        model_used: 'heuristic-template-engine',
        generated_at: new Date().toISOString(),
      };
    } else {
      // SKIP Action
      const subject = `[Policy Notice] Scenario ${prediction.scenario_id}: Offer Suppressed`;
      const previewText = `Action: SKIP. Reason: ${prediction.reason || 'Marketing policy constraint.'}`;
      const headline = `Offer Suppression Record`;

      const plainText = `Medha Internal Decision Engine
Scenario: ${prediction.scenario_id}
Action: SKIP
Reason: ${prediction.reason || 'Marketing consent false or commercial threshold unreached.'}
Customer: ${customerName} (${cust.locality || 'Central'})
Policy Note: Suppression prevents spam fatigue and adheres to user consent preferences.`;

      const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 28px; text-align: center;">
    <span style="background-color: rgba(0, 0, 0, 0.3); color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
      Offer Suppressed (SKIP)
    </span>
    <h2 style="color: #ffffff; margin: 12px 0 0 0; font-size: 22px;">Audit Log: ${prediction.scenario_id}</h2>
  </div>
  <div style="padding: 24px;">
    <p style="color: #cbd5e1; font-size: 15px;"><strong>Suppression Reason:</strong> ${prediction.reason}</p>
    <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #94a3b8;">
      <div>Customer: <strong>${customerName}</strong> (${cust.id})</div>
      <div>Marketing Consent: <strong>${cust.marketing_consent ? 'True' : 'False (Revoked)'}</strong></div>
      <div>Observed Signals: <strong>${cust.observed_signals || 'None'}</strong></div>
    </div>
    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This suppression guarantees regulatory compliance and protects brand goodwill.</p>
  </div>
</div>`;

      return {
        subject,
        previewText,
        headline,
        tone: 'Auditing, operational, compliant',
        targetAudiencePersona: `Internal Merchant / Ops Monitor for Customer ${customerName}`,
        rationale: `Offer suppressed due to hard constraint: "${prediction.reason}".`,
        plainText,
        htmlBody,
        is_live_gemini: false,
        model_used: 'heuristic-template-engine',
        generated_at: new Date().toISOString(),
      };
    }
  }
}

export const geminiService = new GeminiService();
