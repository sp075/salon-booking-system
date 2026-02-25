const { OwnerProfile, OwnerService, Service, Booking, BookingService, User } = require('../models');
const { Op } = require('sequelize');

async function getProfile(userId) {
  const profile = await OwnerProfile.findOne({
    where: { userId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email', 'mobile'],
      },
    ],
  });

  if (!profile) {
    const error = new Error('Owner profile not found');
    error.statusCode = 404;
    throw error;
  }

  return profile;
}

async function updateProfile(userId, { salonName, address }) {
  const profile = await OwnerProfile.findOne({ where: { userId } });

  if (!profile) {
    const error = new Error('Owner profile not found');
    error.statusCode = 404;
    throw error;
  }

  await profile.update({
    salonName,
    address,
  });

  return profile;
}

async function updateSchedule(userId, { openTime, closeTime, dayOff }) {
  const profile = await OwnerProfile.findOne({ where: { userId } });

  if (!profile) {
    const error = new Error('Owner profile not found');
    error.statusCode = 404;
    throw error;
  }

  await profile.update({
    openTime,
    closeTime,
    dayOff,
  });

  return profile;
}

async function getServices(ownerProfileId) {
  const services = await OwnerService.findAll({
    where: { ownerProfileId },
    include: [
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'name', 'defaultPrice', 'durationMinutes'],
      },
    ],
  });

  return services;
}

async function addService(ownerProfileId, serviceId, customPrice) {
  const existing = await OwnerService.findOne({
    where: { ownerProfileId, serviceId },
  });

  if (existing) {
    await existing.update({ customPrice, isActive: true });
    return existing;
  }

  const ownerService = await OwnerService.create({
    ownerProfileId,
    serviceId,
    customPrice,
  });

  return ownerService;
}

async function removeService(ownerProfileId, serviceId) {
  const deleted = await OwnerService.destroy({
    where: { ownerProfileId, serviceId },
  });

  if (!deleted) {
    const error = new Error('Service not found for this owner');
    error.statusCode = 404;
    throw error;
  }

  return { removed: true };
}

async function getBookings(ownerProfileId, { date, status } = {}) {
  const where = { ownerProfileId };

  if (date) {
    where.bookingDate = date;
  }

  if (status) {
    where.status = status;
  }

  const bookings = await Booking.findAll({
    where,
    include: [
      {
        model: User,
        as: 'customer',
        attributes: ['firstName', 'lastName', 'email'],
      },
      {
        model: BookingService,
        as: 'bookingServices',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['name'],
          },
        ],
      },
    ],
    order: [
      ['bookingDate', 'DESC'],
      ['startTime', 'ASC'],
    ],
  });

  return bookings;
}

async function confirmBooking(bookingId, ownerProfileId) {
  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.ownerProfileId !== ownerProfileId) {
    const error = new Error('Booking does not belong to this owner');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status !== 'pending') {
    const error = new Error('Only pending bookings can be confirmed');
    error.statusCode = 400;
    throw error;
  }

  await booking.update({ status: 'confirmed' });
  return booking;
}

async function rejectBooking(bookingId, ownerProfileId) {
  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.ownerProfileId !== ownerProfileId) {
    const error = new Error('Booking does not belong to this owner');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    const error = new Error('Only pending or confirmed bookings can be rejected');
    error.statusCode = 400;
    throw error;
  }

  await booking.update({ status: 'rejected' });
  return booking;
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
