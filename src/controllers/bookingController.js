const bookingService = require('../services/bookingService');
const reviewService = require('../services/reviewService');
const notificationService = require('../services/notificationService');
const { Booking, OwnerProfile, User } = require('../models');

/**
 * Create a new booking.
 * POST /customer/bookings
 */
async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.session.userId, req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

/**
 * Confirm a pending booking (customer-side).
 * PUT /customer/bookings/:id/confirm
 */
async function confirmBooking(req, res, next) {
  try {
    const booking = await bookingService.confirmBooking(req.params.id, req.session.userId);

    // Send notification to the owner
    try {
      const owner = booking.ownerProfile && booking.ownerProfile.user;
      const customer = booking.customer;
      if (owner && customer) {
        await notificationService.notifyBookingConfirmed(booking, owner, customer);
      }
    } catch (notifErr) {
      // Log but don't fail the request if notification fails
      console.error('Failed to send confirmation notification:', notifErr.message);
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a booking (customer-side).
 * PUT /customer/bookings/:id/cancel
 */
async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.session.userId);

    // Send notification to the owner
    try {
      const owner = booking.ownerProfile && booking.ownerProfile.user;
      if (owner) {
        await notificationService.notifyBookingCancelled(booking, owner);
      }
    } catch (notifErr) {
      // Log but don't fail the request if notification fails
      console.error('Failed to send cancellation notification:', notifErr.message);
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all bookings for the logged-in customer.
 * GET /customer/bookings
 */
async function getMyBookings(req, res, next) {
  try {
    const bookings = await bookingService.getCustomerBookings(req.session.userId);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit a review for a completed booking.
 * POST /customer/reviews
 */
async function submitReview(req, res, next) {
  try {
    const review = await reviewService.createReview(req.session.userId, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  getMyBookings,
  submitReview,
};
