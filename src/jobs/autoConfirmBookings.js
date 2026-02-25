const { Op, literal } = require('sequelize');
const { Booking } = require('../models');
const logger = require('../utils/logger');

async function autoConfirmBookings() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const thresholdMinutes = currentMinutes + 30;
  const thresholdHours = String(Math.floor(thresholdMinutes / 60)).padStart(2, '0');
  const thresholdMins = String(thresholdMinutes % 60).padStart(2, '0');
  const thresholdTime = `${thresholdHours}:${thresholdMins}`;

  const [count] = await Booking.update(
    { status: 'confirmed' },
    {
      where: {
        status: 'pending',
        bookingDate: today,
        startTime: { [Op.lte]: thresholdTime },
      },
    }
  );

  if (count > 0) {
    logger.info(`Auto-confirmed ${count} booking(s)`);
  }
}

async function markCompleted() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMins}`;

  const [count] = await Booking.update(
    { status: 'completed' },
    {
      where: {
        status: 'confirmed',
        bookingDate: { [Op.lte]: today },
        endTime: { [Op.lte]: currentTime },
      },
    }
  );

  if (count > 0) {
    logger.info(`Marked ${count} booking(s) as completed`);
  }
}

autoConfirmBookings.markCompleted = markCompleted;

module.exports = autoConfirmBookings;
