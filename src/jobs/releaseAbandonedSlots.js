const { Op } = require('sequelize');
const { Booking } = require('../models');
const logger = require('../utils/logger');

const HOLD_TIMEOUT_MINUTES = parseInt(process.env.HOLD_TIMEOUT_MINUTES, 10) || 10;

async function releaseAbandonedSlots() {
  const cutoff = new Date(Date.now() - HOLD_TIMEOUT_MINUTES * 60 * 1000);

  const [count] = await Booking.update(
    { status: 'abandoned' },
    {
      where: {
        status: 'pending',
        heldAt: {
          [Op.ne]: null,
          [Op.lt]: cutoff,
        },
      },
    }
  );

  if (count > 0) {
    logger.info(`Released ${count} abandoned booking(s)`);
  }
}

module.exports = releaseAbandonedSlots;
