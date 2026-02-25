const { isValidEmail, isValidMobile, isValidPassword } = require('../utils/validators');

function validateRegistration(req, res, next) {
  const { email, mobile, password, firstName, lastName, role } = req.body;

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'First name is required.' });
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Last name is required.' });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email is required.' });
  }

  if (!mobile || !isValidMobile(mobile)) {
    return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required.' });
  }

  if (!password || !isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters with at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character.',
    });
  }

  if (!role || typeof role !== 'string' || role.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Role is required.' });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  next();
}

function validateBooking(req, res, next) {
  const { ownerProfileId, bookingDate, startTime, serviceIds } = req.body;

  if (!ownerProfileId || typeof ownerProfileId !== 'string' || ownerProfileId.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Owner profile ID is required.' });
  }

  if (!bookingDate || typeof bookingDate !== 'string' || bookingDate.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Booking date is required.' });
  }

  if (!startTime || typeof startTime !== 'string' || startTime.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Start time is required.' });
  }

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one service ID is required.' });
  }

  next();
}

function validateReview(req, res, next) {
  const { bookingId, rating } = req.body;

  if (!bookingId || typeof bookingId !== 'string' || bookingId.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Booking ID is required.' });
  }

  if (rating === undefined || rating === null || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5.' });
  }

  next();
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateBooking,
  validateReview,
};
