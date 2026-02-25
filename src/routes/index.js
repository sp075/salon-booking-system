const express = require('express');
const router = express.Router();
const { Service } = require('../models');

const authRoutes = require('./authRoutes');
const ownerRoutes = require('./ownerRoutes');
const customerRoutes = require('./customerRoutes');
const bookingRoutes = require('./bookingRoutes');

router.use('/auth', authRoutes);
router.use('/owner', ownerRoutes);
router.use('/customer', customerRoutes);
router.use('/booking', bookingRoutes);

// Public: List all services
router.get('/services', async (req, res, next) => {
  try {
    const services = await Service.findAll({
      attributes: ['id', 'name', 'defaultPrice', 'durationMinutes'],
      order: [['id', 'ASC']],
    });
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

module.exports = router;
