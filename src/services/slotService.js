const { Op } = require('sequelize');
const { Booking, BookingService, OwnerProfile, OwnerService, Service } = require('../models');
const { timeToMinutes, minutesToTime, addMinutes } = require('../utils/timeUtils');
const appConfig = require('../../config/app');

/**
 * Generate all 30-minute slots from openTime to closeTime.
 * @param {string} openTime - "HH:MM" format
 * @param {string} closeTime - "HH:MM" format
 * @param {number} durationMinutes - slot duration, defaults to 30
 * @returns {Array<{start: string, end: string}>}
 */
function generateAllSlots(openTime, closeTime, durationMinutes = 30) {
  const slots = [];
  let currentStart = timeToMinutes(openTime);
  const endMins = timeToMinutes(closeTime);

  while (currentStart + durationMinutes <= endMins) {
    const currentEnd = currentStart + durationMinutes;
    slots.push({
      start: minutesToTime(currentStart),
      end: minutesToTime(currentEnd),
    });
    currentStart = currentEnd;
  }

  return slots;
}

/**
 * Filter out slots that overlap with the lunch break.
 * A slot overlaps if slot.start < lunchEnd AND slot.end > lunchStart.
 * @param {Array<{start: string, end: string}>} slots
 * @param {string} lunchStart - "HH:MM" format, defaults from config
 * @param {string} lunchEnd - "HH:MM" format, defaults from config
 * @returns {Array<{start: string, end: string}>}
 */
function excludeLunchSlots(slots, lunchStart, lunchEnd) {
  const ls = lunchStart || appConfig.lunchStart;
  const le = lunchEnd || appConfig.lunchEnd;
  const lunchStartMins = timeToMinutes(ls);
  const lunchEndMins = timeToMinutes(le);

  return slots.filter((slot) => {
    const slotStartMins = timeToMinutes(slot.start);
    const slotEndMins = timeToMinutes(slot.end);
    // A slot overlaps lunch if it starts before lunch ends AND ends after lunch starts
    const overlaps = slotStartMins < lunchEndMins && slotEndMins > lunchStartMins;
    return !overlaps;
  });
}

/**
 * Query booked slots for an owner on a specific date.
 * Only considers bookings with status 'pending' or 'confirmed'.
 * @param {string} ownerProfileId
 * @param {string} date - "YYYY-MM-DD" format
 * @returns {Promise<Array<{start: string, end: string}>>}
 */
async function getBookedSlots(ownerProfileId, date) {
  const bookingServices = await BookingService.findAll({
    include: [
      {
        model: Booking,
        as: 'booking',
        where: {
          ownerProfileId,
          bookingDate: date,
          status: { [Op.in]: ['pending', 'confirmed'] },
        },
        attributes: [],
      },
    ],
    attributes: ['slotStart', 'slotEnd'],
    raw: true,
  });

  return bookingServices.map((bs) => ({
    start: bs.slotStart,
    end: bs.slotEnd,
  }));
}

/**
 * Get available slots for an owner on a date, considering services requested.
 * @param {string} ownerProfileId
 * @param {string} date - "YYYY-MM-DD"
 * @param {Array<number>} serviceIds
 * @returns {Promise<Array<{start: string, end: string}>>}
 */
async function getAvailableSlots(ownerProfileId, date, serviceIds) {
  // 1. Get owner profile
  const ownerProfile = await OwnerProfile.findByPk(ownerProfileId);
  if (!ownerProfile) {
    const error = new Error('Owner profile not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check if date falls on owner's day off
  const requestedDate = new Date(date + 'T00:00:00');
  const dayOfWeek = requestedDate.getDay(); // 0 = Sunday
  if (ownerProfile.dayOff !== null && ownerProfile.dayOff === dayOfWeek) {
    return [];
  }

  // 3. Generate all slots from owner's open time to close time
  const durationMinutes = appConfig.slotDurationMinutes;
  let slots = generateAllSlots(ownerProfile.openTime, ownerProfile.closeTime, durationMinutes);

  // 4. Exclude lunch slots
  slots = excludeLunchSlots(slots);

  // 5. Get booked slots for the date
  const bookedSlots = await getBookedSlots(ownerProfileId, date);

  // 6. Filter out booked slots (a slot is unavailable if it overlaps any booked slot)
  slots = slots.filter((slot) => {
    const slotStartMins = timeToMinutes(slot.start);
    const slotEndMins = timeToMinutes(slot.end);

    const isBooked = bookedSlots.some((booked) => {
      const bookedStartMins = timeToMinutes(booked.start);
      const bookedEndMins = timeToMinutes(booked.end);
      return slotStartMins < bookedEndMins && slotEndMins > bookedStartMins;
    });

    return !isBooked;
  });

  // 7. If multiple services, find consecutive windows of N slots
  const serviceCount = serviceIds ? serviceIds.length : 1;
  if (serviceCount > 1) {
    const consecutiveSlots = [];
    for (let i = 0; i <= slots.length - serviceCount; i++) {
      let isConsecutive = true;
      for (let j = 0; j < serviceCount - 1; j++) {
        if (slots[i + j].end !== slots[i + j + 1].start) {
          isConsecutive = false;
          break;
        }
      }
      if (isConsecutive) {
        consecutiveSlots.push(slots[i]);
      }
    }
    return consecutiveSlots;
  }

  // 8. Return available slots
  return slots;
}

/**
 * Validate that starting from startTime, there are serviceCount consecutive slots available.
 * @param {Array<{start: string, end: string}>} availableSlots
 * @param {string} startTime - "HH:MM"
 * @param {number} serviceCount
 * @returns {Array<{start: string, end: string}>} - the consecutive slot objects to be booked
 */
function validateBookingSlots(availableSlots, startTime, serviceCount) {
  // Find the starting slot index
  const startIndex = availableSlots.findIndex((slot) => slot.start === startTime);
  if (startIndex === -1) {
    const error = new Error('Requested start time is not available');
    error.statusCode = 400;
    throw error;
  }
  // Check that we have enough consecutive slots
  if ((startIndex + serviceCount) > availableSlots.length) {
    const error = new Error('Not enough consecutive slots available for the requested services');
    error.statusCode = 400;
    throw error;
  }

  const slotsToBook = [];
  for (let i = 0; i < serviceCount; i++) {
    const slot = availableSlots[startIndex + i];
    console.log(`Checking slot ${slot.start} - ${slot.end} for service ${i + 1}/${serviceCount}`);

    // Verify consecutive: each slot's start should match previous slot's end
    if (i > 0 && slot.start !== availableSlots[startIndex + i - 1].end) {
      const error = new Error('Not enough consecutive slots available for the requested services');
      error.statusCode = 400;
      throw error;
    }

    slotsToBook.push(slot);
  }

  return slotsToBook;
}

module.exports = {
  generateAllSlots,
  excludeLunchSlots,
  getBookedSlots,
  getAvailableSlots,
  validateBookingSlots,
};
