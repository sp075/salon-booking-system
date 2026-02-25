const cron = require('node-cron');
const releaseAbandonedSlots = require('./releaseAbandonedSlots');
const autoConfirmBookings = require('./autoConfirmBookings');
const logger = require('../utils/logger');

function start() {
  // Every 1 minute: release abandoned bookings (held > 10 min)
  cron.schedule('* * * * *', async () => {
    try {
      await releaseAbandonedSlots();
    } catch (err) {
      logger.error('Release abandoned slots job failed:', err.message);
    }
  });

  // Every 5 minutes: auto-confirm pending bookings 30 min before start
  cron.schedule('*/5 * * * *', async () => {
    try {
      await autoConfirmBookings();
    } catch (err) {
      logger.error('Auto-confirm bookings job failed:', err.message);
    }
  });

  // Every 15 minutes: mark confirmed bookings as completed after end_time
  cron.schedule('*/15 * * * *', async () => {
    try {
      await autoConfirmBookings.markCompleted();
    } catch (err) {
      logger.error('Mark completed job failed:', err.message);
    }
  });
}

module.exports = { start };
