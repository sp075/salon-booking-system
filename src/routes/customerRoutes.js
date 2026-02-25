const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const bookingController = require('../controllers/bookingController');
const { isAuthenticated, isRole } = require('../middleware/authMiddleware');
const { validateBooking, validateReview } = require('../middleware/validationMiddleware');

// All customer routes require authentication and customer role
router.use(isAuthenticated, isRole('customer'));

// Browse salon owners
router.get('/owners', customerController.browseOwners);

// Get detailed info about an owner
router.get('/owners/:id', customerController.getOwnerDetail);

// Get available time slots for an owner
router.get('/owners/:id/slots', customerController.getAvailableSlots);

// Get customer's bookings
router.get('/bookings', bookingController.getMyBookings);

// Create a new booking
router.post('/bookings', validateBooking, bookingController.createBooking);

// Confirm a pending booking
router.put('/bookings/:id/confirm', bookingController.confirmBooking);

// Cancel a booking
router.put('/bookings/:id/cancel', bookingController.cancelBooking);

// Submit a review
router.post('/reviews', validateReview, bookingController.submitReview);

module.exports = router;
