import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEthereal = false;
    this.etherealAccount = null;
    this.emailQueue = [];
    this.sentHistory = [];
    this.initPromise = this.initializeTransporter();
  }

  async initializeTransporter() {
    // If SMTP host and credentials provided in env, use custom SMTP
    if (config.email.host && config.email.user && config.email.pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.pass,
          },
        });
        await this.transporter.verify();
        this.isEthereal = false;
        console.log(`[EmailService] Connected to custom SMTP at ${config.email.host}:${config.email.port}`);
        return;
      } catch (err) {
        console.warn(`[EmailService] Custom SMTP connection failed: ${err.message}. Falling back to Ethereal test account.`);
      }
    }

    // Otherwise, create an Ethereal test account (safe, zero-cost, real visual preview URLs)
    try {
      this.etherealAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.etherealAccount.user,
          pass: this.etherealAccount.pass,
        },
      });
      this.isEthereal = true;
      console.log(`[EmailService] Created Ethereal Test Inbox: ${this.etherealAccount.user}`);
    } catch (err) {
      console.error('[EmailService] Failed to create Ethereal account:', err.message);
      // Fallback pseudo transporter
      this.transporter = {
        sendMail: async (options) => ({
          messageId: `mock_${Date.now()}`,
          response: 'Mock sent',
        })
      };
    }
  }

  async getStatus() {
    await this.initPromise;
    return {
      isReady: Boolean(this.transporter),
      isEthereal: this.isEthereal,
      etherealUser: this.etherealAccount ? this.etherealAccount.user : null,
      queuedCount: this.emailQueue.length,
      sentCount: this.sentHistory.length,
      configuredFrom: config.email.from,
    };
  }

  async sendEmail({ to, subject, html, text, scenario_id = null, metadata = {} }) {
    await this.initPromise;

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      text: text || '',
      html: html || '',
    };

    const startTime = Date.now();
    try {
      const info = await this.transporter.sendMail(mailOptions);
      const previewUrl = this.isEthereal ? nodemailer.getTestMessageUrl(info) : null;

      const record = {
        id: info.messageId || `msg_${Date.now()}`,
        scenario_id,
        to,
        from: config.email.from,
        subject,
        sentAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        status: 'DELIVERED',
        previewUrl: previewUrl || false,
        metadata,
      };

      this.sentHistory.unshift(record);
      if (this.sentHistory.length > 100) this.sentHistory.pop(); // Cap history to 100

      console.log(`[EmailService] Email sent to ${to} (ID: ${record.id}). Preview: ${previewUrl || 'Live SMTP'}`);
      return record;
    } catch (err) {
      console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
      const failedRecord = {
        id: `fail_${Date.now()}`,
        scenario_id,
        to,
        from: config.email.from,
        subject,
        sentAt: new Date().toISOString(),
        status: 'FAILED',
        error: err.message,
        metadata,
      };
      this.sentHistory.unshift(failedRecord);
      throw err;
    }
  }

  queueEmail({ to, subject, html, text, scenario_id = null, metadata = {} }) {
    const queueItem = {
      queueId: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      to,
      subject,
      html,
      text,
      scenario_id,
      metadata,
      queuedAt: new Date().toISOString(),
      status: 'QUEUED',
    };

    this.emailQueue.push(queueItem);
    return queueItem;
  }

  async processQueue() {
    await this.initPromise;
    const results = [];

    while (this.emailQueue.length > 0) {
      const item = this.emailQueue.shift();
      try {
        const sent = await this.sendEmail({
          to: item.to,
          subject: item.subject,
          html: item.html,
          text: item.text,
          scenario_id: item.scenario_id,
          metadata: item.metadata,
        });
        results.push({ ...item, status: 'DELIVERED', result: sent });
      } catch (err) {
        results.push({ ...item, status: 'FAILED', error: err.message });
      }
    }

    return results;
  }

  getQueue() {
    return [...this.emailQueue];
  }

  getHistory() {
    return [...this.sentHistory];
  }

  clearQueue() {
    const count = this.emailQueue.length;
    this.emailQueue = [];
    return count;
  }
}

export const emailService = new EmailService();
