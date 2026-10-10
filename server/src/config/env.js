import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '"Moment IQ Offer Engine" <offers@momentiq.internal>',
  },
  paths: {
    mlEngineDir: path.resolve(__dirname, '../../../ml_engine'),
    predictionsJsonl: path.resolve(__dirname, '../../../ml_engine/eval/public_predictions.jsonl'),
    customersCsv: path.resolve(__dirname, '../../../ml_engine/data/customers.csv'),
    merchantsCsv: path.resolve(__dirname, '../../../ml_engine/data/merchants.csv'),
    scenariosCsv: path.resolve(__dirname, '../../../ml_engine/data/scenarios_public.csv'),
    catalogCsv: path.resolve(__dirname, '../../../ml_engine/data/catalog_items.csv'),
  }
};
