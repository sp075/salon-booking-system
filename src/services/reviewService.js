const { Review, Booking, OwnerProfile, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

/**
 * Create a review for a completed booking.
 * @param {string} customerId
 * @param {object} params
 * @param {string} params.bookingId
 * @param {number} params.rating - 1 to 5
 * @param {string} [params.comment]
 * @returns {Promise<object>} - the created review
 */
async function createReview(customerId, { bookingId, rating, comment }) {
  // 1. Find the booking, verify it belongs to customer and status is 'completed'
  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.customerId !== customerId) {
    const error = new Error('Booking does not belong to this customer');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status !== 'completed') {
    const error = new Error('Only completed bookings can be reviewed');
    error.statusCode = 400;
    throw error;
  }

  // 2. Check if a review already exists for this booking
  const existingReview = await Review.findOne({ where: { bookingId } });
  if (existingReview) {
    const error = new Error('A review already exists for this booking');
    error.statusCode = 409;
    throw error;
  }

  // 3. Create review record
  const review = await Review.create({
    customerId,
    ownerProfileId: booking.ownerProfileId,
    bookingId,
    rating,
    comment: comment || null,
  });

  // 4. Update OwnerProfile avg_rating and total_reviews using SQL calculation
  await sequelize.query(
    `UPDATE owner_profiles
     SET total_reviews = (
           SELECT COUNT(*) FROM reviews WHERE owner_profile_id = :ownerProfileId
         ),
         avg_rating = (
           SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE owner_profile_id = :ownerProfileId
         )
     WHERE id = :ownerProfileId`,
    {
      replacements: { ownerProfileId: booking.ownerProfileId },
      type: sequelize.QueryTypes.UPDATE,
    }
  );

  // 5. Return the review
  return review;
}

/**
 * Get all reviews for an owner profile.
 * @param {string} ownerProfileId
 * @returns {Promise<Array>}
 */
async function getOwnerReviews(ownerProfileId) {
  const reviews = await Review.findAll({
    where: { ownerProfileId },
    include: [
      {
        model: User,
        as: 'customer',
        attributes: ['firstName', 'lastName'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  return reviews;
}

module.exports = {
  createReview,
  getOwnerReviews,
};
