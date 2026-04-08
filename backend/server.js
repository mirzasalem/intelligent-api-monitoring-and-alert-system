
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const logger = require('./utils/logger');
const monitorRoutes = require('./routes/monitor');
const alertRoutes = require('./routes/alerts');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { logger.debug(`${req.method} ${req.path}`); next(); });
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.use('/monitor', monitorRoutes);
app.use('/alerts', alertRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '../frontend/public/index.html')); });
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/api_monitor');
    logger.info('MongoDB connected');
    app.listen(PORT, () => { logger.info(`Server running on http://localhost:${PORT}`); });
  } catch (err) { logger.error(`Startup failed: ${err.message}`); process.exit(1); }
}
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });
start();
