const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    api_name: { type: String, required: true, trim: true, index: true },
    status_code: { type: Number, required: true },
    response_time_ms: { type: Number, required: true },
    records_returned: { type: Number, default: 0 },
    anomalies: { type: [String], required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM', index: true },
    ai_alert_message: { type: String, required: true },
    is_resolved: { type: Boolean, default: false, index: true },
    resolved_at: { type: Date, default: null },
    raw_input: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

alertSchema.index({ createdAt: -1 });
alertSchema.index({ api_name: 1, is_resolved: 1 });

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
