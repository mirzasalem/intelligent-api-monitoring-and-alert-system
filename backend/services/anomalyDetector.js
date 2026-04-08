const logger = require('../utils/logger');

const THRESHOLDS = {
  RESPONSE_TIME_HIGH: parseInt(process.env.RESPONSE_TIME_THRESHOLD_MS) || 3000,
  RESPONSE_TIME_CRITICAL: 8000,
  ERROR_STATUS_CODES: [500, 502, 503, 504, 429],
  WARNING_STATUS_CODES: [400, 401, 403, 404, 408],
};

function detectAnomalies(apiResponse) {
  const { api_name, response_time_ms, status_code, records_returned } = apiResponse;
  const anomalies = [];
  let severityScore = 0;

  if (response_time_ms >= THRESHOLDS.RESPONSE_TIME_CRITICAL) {
    anomalies.push(`Critical response time: ${response_time_ms}ms (threshold: ${THRESHOLDS.RESPONSE_TIME_CRITICAL}ms)`);
    severityScore += 3;
  } else if (response_time_ms >= THRESHOLDS.RESPONSE_TIME_HIGH) {
    anomalies.push(`High response time: ${response_time_ms}ms (threshold: ${THRESHOLDS.RESPONSE_TIME_HIGH}ms)`);
    severityScore += 2;
  }

  if (THRESHOLDS.ERROR_STATUS_CODES.includes(status_code)) {
    anomalies.push(`Server error status code: ${status_code}`);
    severityScore += 3;
  } else if (THRESHOLDS.WARNING_STATUS_CODES.includes(status_code)) {
    anomalies.push(`Client/Warning status code: ${status_code}`);
    severityScore += 1;
  }

  if (records_returned === 0 && status_code === 200) {
    anomalies.push('Zero records returned despite successful status');
    severityScore += 2;
  } else if (records_returned === null || records_returned === undefined) {
    anomalies.push('Missing records_returned field in response');
    severityScore += 1;
  } else if (records_returned < 0) {
    anomalies.push(`Invalid negative records count: ${records_returned}`);
    severityScore += 2;
  }

  let severity = 'LOW';
  if (severityScore >= 6) severity = 'CRITICAL';
  else if (severityScore >= 4) severity = 'HIGH';
  else if (severityScore >= 2) severity = 'MEDIUM';

  const hasAnomaly = anomalies.length > 0;
  if (hasAnomaly) logger.debug(`Anomalies detected for ${api_name}: [Severity: ${severity}]`);

  return { anomalies, severity, hasAnomaly };
}

function batchDetect(apiResponses) {
  const results = [];
  for (const entry of apiResponses) {
    const result = detectAnomalies(entry);
    if (result.hasAnomaly) results.push({ ...entry, ...result });
  }
  logger.info(`Batch detection complete: ${results.length}/${apiResponses.length} anomalies found`);
  return results;
}

module.exports = { detectAnomalies, batchDetect };
