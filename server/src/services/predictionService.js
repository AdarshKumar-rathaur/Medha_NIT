import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { config } from '../config/env.js';

// Helper to parse standard CSV with quoted strings
function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

class PredictionService {
  constructor() {
    this.cachedData = null;
    this.lastLoaded = 0;
  }

  async loadContextMaps() {
    const customersMap = new Map();
    const merchantsMap = new Map();
    const scenariosMap = new Map();

    try {
      const customersRaw = await fs.readFile(config.paths.customersCsv, 'utf-8');
      const customers = parseCSV(customersRaw);
      customers.forEach(c => customersMap.set(c.id, c));
    } catch (err) {
      console.warn('Could not load customers.csv:', err.message);
    }

    try {
      const merchantsRaw = await fs.readFile(config.paths.merchantsCsv, 'utf-8');
      const merchants = parseCSV(merchantsRaw);
      merchants.forEach(m => merchantsMap.set(m.id, m));
    } catch (err) {
      console.warn('Could not load merchants.csv:', err.message);
    }

    try {
      const scenariosRaw = await fs.readFile(config.paths.scenariosCsv, 'utf-8');
      const scenarios = parseCSV(scenariosRaw);
      scenarios.forEach(s => scenariosMap.set(s.id, s));
    } catch (err) {
      console.warn('Could not load scenarios_public.csv:', err.message);
    }

    return { customersMap, merchantsMap, scenariosMap };
  }

  async getAllPredictions(forceRefresh = false) {
    const now = Date.now();
    // Cache for 10 seconds unless forceRefresh
    if (this.cachedData && !forceRefresh && now - this.lastLoaded < 10000) {
      return this.cachedData;
    }

    const { customersMap, merchantsMap, scenariosMap } = await this.loadContextMaps();

    let jsonlContent = '';
    try {
      jsonlContent = await fs.readFile(config.paths.predictionsJsonl, 'utf-8');
    } catch (err) {
      throw new Error(`Failed to read predictions file at ${config.paths.predictionsJsonl}: ${err.message}`);
    }

    const lines = jsonlContent.trim().split(/\r?\n/);
    const predictions = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const raw = JSON.parse(line);
        const scenario = scenariosMap.get(raw.scenario_id) || {};
        const customer = customersMap.get(scenario.customer_id) || {};
        const merchantId = raw.offer?.merchant_id || scenario.merchant_id;
        const merchant = merchantsMap.get(merchantId) || {};

        // Synthesize recipient email if customer exists
        const recipientName = customer.name || 'Valued Customer';
        const sanitizedName = recipientName.toLowerCase().replace(/[^a-z0-9]/g, '.');
        const recipientEmail = customer.id 
          ? `${sanitizedName}.${customer.id}@priority-member.in`
          : 'customer@priority-member.in';

        const enriched = {
          ...raw,
          customer: {
            id: scenario.customer_id || 'unknown',
            name: recipientName,
            email: recipientEmail,
            age: customer.age ? parseInt(customer.age, 10) : null,
            locality: customer.locality || scenario.locality || 'Bengaluru',
            wallet_inr: customer.wallet_inr ? parseFloat(customer.wallet_inr) : null,
            marketing_consent: customer.marketing_consent !== 'False',
            declared_preferences: customer.declared_preferences || 'None',
            observed_signals: customer.observed_signals || '',
          },
          merchant: {
            id: merchantId || 'unknown',
            name: merchant.name || 'Featured Merchant',
            category: merchant.category || 'Dining',
            locality: merchant.locality || 'Central',
            occupancy_pct: merchant.occupancy_pct ? parseFloat(merchant.occupancy_pct) : null,
            inventory_signal: merchant.inventory_signal || 'healthy',
          },
          context: {
            title: scenario.title || raw.scenario_id,
            intent: scenario.intent || 'Daily leisure',
            scenario_type: scenario.scenario_type || 'standard',
            minutes_available: scenario.minutes_available ? parseFloat(scenario.minutes_available) : 30,
            weather: {
              temp_c: scenario.temp_c ? parseFloat(scenario.temp_c) : 30.0,
              condition: scenario.condition || 'clear',
              rain_mm: scenario.rain_mm ? parseFloat(scenario.rain_mm) : 0.0,
            },
            timestamp: scenario.timestamp || new Date().toISOString(),
          }
        };

        predictions.push(enriched);
      } catch (e) {
        console.error('Error parsing prediction line:', e.message);
      }
    }

    // Compute metrics
    const total = predictions.length;
    const sends = predictions.filter(p => p.action === 'send');
    const skips = predictions.filter(p => p.action === 'skip');
    const totalProfit = sends.reduce((acc, p) => acc + (p.profit_estimate_inr || 0), 0);
    const avgDiscount = sends.length > 0 
      ? sends.reduce((acc, p) => acc + (p.offer?.discount_pct || 0), 0) / sends.length 
      : 0;

    const result = {
      summary: {
        total,
        sendCount: sends.length,
        skipCount: skips.length,
        sendRatio: total > 0 ? (sends.length / total) * 100 : 0,
        totalProfitInr: Math.round(totalProfit * 100) / 100,
        averageDiscountPct: Math.round(avgDiscount * 10) / 10,
        lastUpdated: new Date().toISOString(),
      },
      predictions,
    };

    this.cachedData = result;
    this.lastLoaded = now;
    return result;
  }

  async getPredictionById(scenarioId) {
    const data = await this.getAllPredictions();
    const found = data.predictions.find(p => p.scenario_id === scenarioId);
    if (!found) {
      throw new Error(`Scenario prediction with ID '${scenarioId}' not found.`);
    }
    return found;
  }

  async triggerPythonPipeline() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.resolve(config.paths.mlEngineDir, 'test_ml_pipeline.py');
      const process = spawn('python', [scriptPath], {
        cwd: config.paths.mlEngineDir,
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', data => { stdout += data.toString(); });
      process.stderr.on('data', data => { stderr += data.toString(); });

      process.on('close', code => {
        if (code === 0) {
          this.cachedData = null; // Invalidate cache
          resolve({ success: true, message: 'ML pipeline executed successfully.', output: stdout });
        } else {
          reject(new Error(`ML pipeline exited with code ${code}: ${stderr || stdout}`));
        }
      });
    });
  }
}

export const predictionService = new PredictionService();
