const express = require('express');
const router = express.Router();
const { getAlerts, getStats, resolveAlert, deleteAlert } = require('../controllers/alertController');

router.get('/', getAlerts);
router.get('/stats', getStats);
router.patch('/:id/resolve', resolveAlert);
router.delete('/:id', deleteAlert);

module.exports = router;
