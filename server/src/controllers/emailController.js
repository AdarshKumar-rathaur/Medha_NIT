import { emailService } from '../services/emailService.js';

export async function getEmailStatus(req, res) {
  try {
    const status = await emailService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function sendEmail(req, res) {
  try {
    const { to, subject, html, text, scenario_id, metadata } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and at least one of html or text are required.'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      scenario_id,
      metadata,
    });

    res.json({
      success: true,
      message: 'Email dispatched successfully.',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function queueEmail(req, res) {
  try {
    const { to, subject, html, text, scenario_id, metadata } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and at least one of html or text are required.'
      });
    }

    const queuedItem = emailService.queueEmail({
      to,
      subject,
      html,
      text,
      scenario_id,
      metadata,
    });

    res.json({
      success: true,
      message: 'Email placed into dispatch queue.',
      data: queuedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function processQueue(req, res) {
  try {
    const results = await emailService.processQueue();
    res.json({
      success: true,
      message: `Processed ${results.length} queued emails.`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getQueue(req, res) {
  res.json({
    success: true,
    data: emailService.getQueue(),
  });
}

export async function getHistory(req, res) {
  res.json({
    success: true,
    data: emailService.getHistory(),
  });
}

export async function clearQueue(req, res) {
  const count = emailService.clearQueue();
  res.json({
    success: true,
    message: `Cleared ${count} items from queue.`,
  });
}
