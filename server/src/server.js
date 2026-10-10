import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRouter from './routes/api.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev flexibility, or restrict to config.clientOrigin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api', apiRouter);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(config.port, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Moment IQ Decision Backend Server running on http://localhost:${config.port}`);
  console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`📊 Predictions API: http://localhost:${config.port}/api/predictions`);
  console.log(`🤖 Gemini AI Configured: ${Boolean(config.gemini.apiKey)}`);
  console.log(`✉️ Email Service Mode: ${config.email.host ? 'Custom SMTP' : 'Ethereal Test Mailbox'}`);
  console.log('='.repeat(60));
});
