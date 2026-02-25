const ownerService = require('../services/ownerService');
const notificationService = require('../services/notificationService');
const { OwnerProfile, User } = require('../models');

async function getProfile(req, res, next) {
  try {
    const profile = await ownerService.getProfile(req.session.userId);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { salonName, address } = req.body;
    const profile = await ownerService.updateProfile(req.session.userId, { salonName, address });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateSchedule(req, res, next) {
  try {
    const { openTime, closeTime, dayOff } = req.body;
    const profile = await ownerService.updateSchedule(req.session.userId, { openTime, closeTime, dayOff });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function getServices(req, res, next) {
  try {
    const ownerProfile = await OwnerProfile.findOne({ where: { userId: req.session.userId } });
    if (!ownerProfile) {
      const error = new Error('Owner profile not found');
      error.statusCode = 404;
      throw error;
    }
    const services = await ownerService.getServices(ownerProfile.id);
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
}

async function addService(req, res, next) {
  try {
    const ownerProfile = await OwnerProfile.findOne({ where: { userId: req.session.userId } });
    if (!ownerProfile) {
      const error = new Error('Owner profile not found');
      error.statusCode = 404;
      throw error;
    }
    const { serviceId, customPrice } = req.body;
    const ownerSvc = await ownerService.addService(ownerProfile.id, serviceId, customPrice);
    res.status(201).json({ success: true, data: ownerSvc });
  } catch (err) {
    next(err);
  }
}

async function removeService(req, res, next) {
  try {
    const ownerProfile = await OwnerProfile.findOne({ where: { userId: req.session.userId } });
    if (!ownerProfile) {
      const error = new Error('Owner profile not found');
      error.statusCode = 404;
      throw error;
    }
    const result = await ownerService.removeService(ownerProfile.id, req.params.serviceId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getBookings(req, res, next) {
  try {
    const ownerProfile = await OwnerProfile.findOne({ where: { userId: req.session.userId } });
    if (!ownerProfile) {
      const error = new Error('Owner profile not found');
      error.statusCode = 404;
      throw error;
    }
    const { date, status } = req.query;
    const bookings = await ownerService.getBookings(ownerProfile.id, { date, status });
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
}

async function confirmBooking(req, res, next) {
  try {
    const ownerProfile = await OwnerProfile.findOne({
      where: { userId: req.session.userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });
    if (!ownerProfile) {
      const error = new Error('Owner profile not found');
      error.statusCode = 404;
      throw error;
    }

    const booking = await ownerService.confirmBooking(req.params.id, ownerProfile.id);

    const customer = await User.findByPk(booking.customerId, {
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    await notificationService.notifyBookingConfirmed(booking, ownerProfile.user, customer);

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

async function rejectBooking(req, res, next) {
  try {
    const ownerProfile = await OwnerProfile.findOne({ where: { userId: req.session.userId } });
    if (!ownerProfile) {
      const error = new Error('Owner profile not found');
      error.statusCode = 404;
      throw error;
    }

    const booking = await ownerService.rejectBooking(req.params.id, ownerProfile.id);

    const customer = await User.findByPk(booking.customerId, {
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    await notificationService.notifyBookingRejected(booking, customer);

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  updateSchedule,
  getServices,
  addService,
  removeService,
  getBookings,
  confirmBooking,
  rejectBooking,
};
