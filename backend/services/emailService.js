const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }
  return transporter;
}

async function sendAnomalyEmail(alerts) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('Email not configured. Skipping email notification.');
    return;
  }
  if (!alerts || alerts.length === 0) return;

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const subject = `[API Monitor] ${alerts.length} Anomaly Alert(s) Detected${criticalCount > 0 ? ` — ${criticalCount} CRITICAL` : ''}`;

  const htmlRows = alerts.map(alert => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:10px;font-weight:bold;">${alert.api_name}</td>
      <td style="padding:10px;">
        <span style="background:${getSeverityColor(alert.severity)};color:white;padding:3px 8px;border-radius:4px;font-size:12px;">
          ${alert.severity}
        </span>
      </td>
      <td style="padding:10px;">${alert.status_code}</td>
      <td style="padding:10px;">${alert.response_time_ms}ms</td>
      <td style="padding:10px;">${alert.ai_alert_message}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:900px;margin:0 auto;">
      <div style="background:#1a1a2e;color:white;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">🚨 API Monitor — Anomaly Report</h2>
        <p style="margin:5px 0 0;">${new Date().toLocaleString()}</p>
      </div>
      <div style="padding:20px;background:#f9f9f9;">
        <p><strong>${alerts.length}</strong> anomalie(s) detected</p>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#e8e8e8;">
              <th style="padding:10px;text-align:left;">API</th>
              <th style="padding:10px;text-align:left;">Severity</th>
              <th style="padding:10px;text-align:left;">Status</th>
              <th style="padding:10px;text-align:left;">Response Time</th>
              <th style="padding:10px;text-align:left;">Alert</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </div>
    </div>`;

  try {
    await getTransporter().sendMail({
      from: `"API Monitor" <${process.env.EMAIL_USER}>`,
      to: process.env.ALERT_RECIPIENT || process.env.EMAIL_USER,
      subject, html
    });
    logger.info(`Alert email sent for ${alerts.length} anomalies`);
  } catch (error) {
    logger.error(`Failed to send alert email: ${error.message}`);
  }
}

function getSeverityColor(severity) {
  const colors = { CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#d97706', LOW: '#65a30d' };
  return colors[severity] || '#6b7280';
}

module.exports = { sendAnomalyEmail };
