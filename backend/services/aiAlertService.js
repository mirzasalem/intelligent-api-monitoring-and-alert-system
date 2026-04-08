const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateAlertMessage(anomalyData) {
  const { api_name, status_code, response_time_ms, records_returned, anomalies, severity } = anomalyData;

  const prompt = `You are an API monitoring assistant. Generate a concise, human-readable alert message for the following API anomaly.
The message should be 1-3 sentences, professional, and clearly explain what went wrong and possible causes.

API Details:
- API Name: ${api_name}
- HTTP Status Code: ${status_code}
- Response Time: ${response_time_ms}ms
- Records Returned: ${records_returned}
- Detected Issues: ${anomalies.join('; ')}
- Severity Level: ${severity}

Generate ONLY the alert message text, no preamble or labels.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      temperature: 0.7
    });

    const message = completion.choices[0]?.message?.content?.trim();
    if (!message) throw new Error('Empty response from Groq');
    logger.info(`Groq alert generated for ${api_name}`);
    return message;
  } catch (error) {
    logger.error(`Groq alert generation failed for ${api_name}: ${error.message}`);
    return generateFallbackMessage(anomalyData);
  }
}

function generateFallbackMessage({ api_name, status_code, response_time_ms, records_returned, anomalies }) {
  const parts = [];
  if (status_code >= 500) parts.push(`${api_name} encountered a server error (HTTP ${status_code})`);
  else if (status_code >= 400) parts.push(`${api_name} returned a client error (HTTP ${status_code})`);
  if (response_time_ms >= 3000) parts.push(`response time was critically high at ${response_time_ms}ms`);
  if (records_returned === 0) parts.push(`no records were returned`);
  if (parts.length === 0) parts.push(`${api_name} reported issues: ${anomalies.join(', ')}`);
  return parts.join(', ') + '. Immediate investigation is recommended.';
}

async function batchGenerateAlerts(anomalies) {
  const results = [];
  for (const anomaly of anomalies) {
    const message = await generateAlertMessage(anomaly);
    results.push({ ...anomaly, ai_alert_message: message });
  }
  return results;
}

module.exports = { generateAlertMessage, batchGenerateAlerts };