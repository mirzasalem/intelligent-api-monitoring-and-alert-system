const Alert = require('../models/Alert');
const { batchDetect } = require('../services/anomalyDetector');
const { batchGenerateAlerts } = require('../services/aiAlertService');
const { sendAnomalyEmail } = require('../services/emailService');
const logger = require('../utils/logger');

async function processMonitorData(req, res) {
  try {
    let apiResponses = req.body;
    if (!Array.isArray(apiResponses)) apiResponses = [apiResponses];

    if (!apiResponses || apiResponses.length === 0) {
      return res.status(400).json({ success: false, message: 'Request body must be a non-empty array of API responses.' });
    }

    const invalid = apiResponses.filter(r => !r.api_name || r.status_code === undefined || r.response_time_ms === undefined);
    if (invalid.length > 0) {
      return res.status(400).json({ success: false, message: 'Each entry must have api_name, status_code, and response_time_ms.', invalid_entries: invalid });
    }

    logger.info(`Processing ${apiResponses.length} API response(s)...`);

    const anomaliesDetected = batchDetect(apiResponses);

    if (anomaliesDetected.length === 0) {
      return res.json({ success: true, message: 'All APIs healthy. No anomalies detected.', processed: apiResponses.length, anomalies_found: 0, alerts_created: [] });
    }

    const alertsWithMessages = await batchGenerateAlerts(anomaliesDetected);

    const savedAlerts = await Alert.insertMany(
      alertsWithMessages.map(a => ({
        api_name: a.api_name,
        status_code: a.status_code,
        response_time_ms: a.response_time_ms,
        records_returned: a.records_returned ?? 0,
        anomalies: a.anomalies,
        severity: a.severity,
        ai_alert_message: a.ai_alert_message,
        raw_input: a
      }))
    );

    logger.info(`Saved ${savedAlerts.length} alert(s) to database`);
    sendAnomalyEmail(savedAlerts).catch(err => logger.error('Email error:', err));

    return res.status(201).json({
      success: true,
      message: `Processed ${apiResponses.length} API(s). ${savedAlerts.length} anomaly alert(s) created.`,
      processed: apiResponses.length,
      anomalies_found: savedAlerts.length,
      alerts_created: savedAlerts
    });

  } catch (error) {
    logger.error(`Monitor processing error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
}

module.exports = { processMonitorData };
