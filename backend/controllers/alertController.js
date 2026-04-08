const Alert = require('../models/Alert');
const logger = require('../utils/logger');

async function getAlerts(req, res) {
  try {
    const { severity, api_name, resolved, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (resolved === 'true') filter.is_resolved = true;
    else if (resolved === 'false') filter.is_resolved = false;
    if (severity) filter.severity = severity.toUpperCase();
    if (api_name) filter.api_name = { $regex: api_name, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Alert.countDocuments(filter)
    ]);

    res.json({ success: true, total, page: parseInt(page), limit: parseInt(limit), alerts });
  } catch (error) {
    logger.error(`Get alerts error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
}

async function getStats(req, res) {
  try {
    const [total, active, bySeverity, byApi] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ is_resolved: false }),
      Alert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Alert.aggregate([
        { $group: { _id: '$api_name', count: { $sum: 1 }, lastSeen: { $max: '$createdAt' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total_alerts: total,
        active_alerts: active,
        resolved_alerts: total - active,
        by_severity: bySeverity.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        top_apis: byApi
      }
    });
  } catch (error) {
    logger.error(`Stats error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
}

async function resolveAlert(req, res) {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { is_resolved: true, resolved_at: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    logger.info(`Alert ${req.params.id} marked as resolved`);
    res.json({ success: true, alert });
  } catch (error) {
    logger.error(`Resolve alert error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to resolve alert.' });
  }
}

async function deleteAlert(req, res) {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    res.json({ success: true, message: 'Alert deleted.' });
  } catch (error) {
    logger.error(`Delete alert error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to delete alert.' });
  }
}

module.exports = { getAlerts, getStats, resolveAlert, deleteAlert };
