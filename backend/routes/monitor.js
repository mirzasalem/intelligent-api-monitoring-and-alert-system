const express = require('express');
const router = express.Router();
const { processMonitorData } = require('../controllers/monitorController');

router.post('/', processMonitorData);

module.exports = router;
