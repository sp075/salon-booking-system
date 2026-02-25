const { Op } = require('sequelize');
const { sequelize, Booking, BookingService, OwnerProfile, OwnerService, Service, User } = require('../models');
const slotService = require('./slotService');
const { addMinutes } = require('../utils/timeUtils');
const appConfig = require('../../config/app');

/**
 * Create a new booking for a customer.
 * @param {string} customerId - UUID of the customer
 * @param {object} params
 * @param {string} params.ownerProfileId
 * @param {string} params.bookingDate - "YYYY-MM-DD"
 * @param {string} params.startTime - "HH:MM"
 * @param {Array<number>} params.serviceIds
 * @returns {Promise<object>} - the created booking with its services
 */
async function createBooking(customerId, { ownerProfileId, bookingDate, startTime, serviceIds }) {
  // 1. Get available slots for the date and services
  const availableSlots = await slotService.getAvailableSlots(ownerProfileId, bookingDate, serviceIds);

  // 2. Validate the requested slots are available
  const slotsToBook = slotService.validateBookingSlots(availableSlots, startTime, serviceIds.length);

  // 3. Get service prices (from OwnerService custom_price or Service default_price)
  const servicePrices = [];
  for (const serviceId of serviceIds) {
    const ownerSvc = await OwnerService.findOne({
      where: { ownerProfileId, serviceId },
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['defaultPrice'],
        },
      ],
    });

    if (!ownerSvc) {
      const error = new Error(`Service ID ${serviceId} is not offered by this owner`);
      error.statusCode = 400;
      throw error;
    }

    const price = ownerSvc.customPrice !== null ? parseFloat(ownerSvc.customPrice) : parseFloat(ownerSvc.service.defaultPrice);
    servicePrices.push({ serviceId, price });
  }

  // 4. Calculate total price
  const totalPrice = servicePrices.reduce((sum, sp) => sum + sp.price, 0);

  // 5. Use a transaction to create booking and booking services
  const durationMinutes = appConfig.slotDurationMinutes;
  const endTime = addMinutes(startTime, durationMinutes * serviceIds.length);

  const result = await sequelize.transaction(async (t) => {
    // 5a. Create Booking
    const booking = await Booking.create(
      {
        customerId,
        ownerProfileId,
        bookingDate,
        startTime,
        endTime,
        totalPrice,
        status: 'pending',
        heldAt: new Date(),
      },
      { transaction: t }
    );

    // 5b. Create BookingService rows for each service with consecutive 30-min slots
    const bookingServiceRows = [];
    for (let i = 0; i < serviceIds.length; i++) {
      const slot = slotsToBook[i];
      const bs = await BookingService.create(
        {
          bookingId: booking.id,
          serviceId: serviceIds[i],
          slotStart: slot.start,
          slotEnd: slot.end,
          price: servicePrices[i].price,
        },
        { transaction: t }
      );
      bookingServiceRows.push(bs);
    }

    return { booking, bookingServices: bookingServiceRows };
  });

  // 6. Return the booking with its services
  const fullBooking = await Booking.findByPk(result.booking.id, {
    include: [
      {
        model: BookingService,
        as: 'bookingServices',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name'],
          },
        ],
      },
      {
        model: OwnerProfile,
        as: 'ownerProfile',
        attributes: ['id', 'salonName'],
      },
    ],
  });

  return fullBooking;
}

/**
 * Confirm a pending booking (customer-side confirmation within hold timeout).
 * @param {string} bookingId
 * @param {string} customerId
 * @returns {Promise<object>}
 */
async function confirmBooking(bookingId, customerId) {
  // 1. Find booking
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: OwnerProfile,
        as: 'ownerProfile',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify customer_id matches
  if (booking.customerId !== customerId) {
    const error = new Error('Booking does not belong to this customer');
    error.statusCode = 403;
    throw error;
  }

  // 3. Verify status is 'pending'
  if (booking.status !== 'pending') {
    const error = new Error('Only pending bookings can be confirmed');
    error.statusCode = 400;
    throw error;
  }

  // 4. Check heldAt is within timeout
  const holdTimeoutMinutes = appConfig.holdTimeoutMinutes;
  if (booking.heldAt) {
    const heldAtTime = new Date(booking.heldAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - heldAtTime) / (1000 * 60);
    if (diffMinutes > holdTimeoutMinutes) {
      const error = new Error('Booking hold has expired. Please create a new booking.');
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Update status to 'confirmed', clear heldAt
  await booking.update({ status: 'confirmed', heldAt: null });

  return booking;
}

/**
 * Cancel a booking (customer-side).
 * @param {string} bookingId
 * @param {string} customerId
 * @returns {Promise<object>}
 */
async function cancelBooking(bookingId, customerId) {
  // 1. Find booking
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: OwnerProfile,
        as: 'ownerProfile',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify customer_id matches
  if (booking.customerId !== customerId) {
    const error = new Error('Booking does not belong to this customer');
    error.statusCode = 403;
    throw error;
  }

  // 3. Verify status is 'pending' or 'confirmed'
  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    const error = new Error('Only pending or confirmed bookings can be cancelled');
    error.statusCode = 400;
    throw error;
  }

  // 4. Update status to 'cancelled'
  await booking.update({ status: 'cancelled' });

  return booking;
}

/**
 * Get all bookings for a customer.
 * @param {string} customerId
 * @returns {Promise<Array>}
 */
async function getCustomerBookings(customerId) {
  const bookings = await Booking.findAll({
    where: { customerId },
    include: [
      {
        model: OwnerProfile,
        as: 'ownerProfile',
        attributes: ['id', 'salonName'],
      },
      {
        model: BookingService,
        as: 'bookingServices',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name'],
          },
        ],
      },
      {
        model: require('../models').Review,
        as: 'review',
      },
    ],
    order: [
      ['bookingDate', 'DESC'],
      ['startTime', 'DESC'],
    ],
  });

  return bookings;
}

/**
 * Get a single booking by ID with all includes.
 * @param {string} bookingId
 * @returns {Promise<object|null>}
 */
async function getBookingById(bookingId) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: OwnerProfile,
        as: 'ownerProfile',
        attributes: ['id', 'salonName'],
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }],
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: BookingService,
        as: 'bookingServices',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name'],
          },
        ],
      },
      {
        model: require('../models').Review,
        as: 'review',
      },
    ],
  });

  return booking;
}

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  getCustomerBookings,
  getBookingById,
};
