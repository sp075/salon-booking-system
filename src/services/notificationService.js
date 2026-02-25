const logger = require('../utils/logger');
const { Notification } = require('../models');

async function sendEmail(userId, recipient, subject, body) {
  logger.notification(`EMAIL to ${recipient} | Subject: ${subject} | Body: ${body}`);
  await Notification.create({
    userId,
    type: 'email',
    recipient,
    subject,
    body,
  });
}

async function sendSMS(userId, recipient, body) {
  logger.notification(`SMS to ${recipient} | Body: ${body}`);
  await Notification.create({
    userId,
    type: 'sms',
    recipient,
    subject: null,
    body,
  });
}

async function notifyBookingConfirmed(booking, owner, customer) {
  const subject = 'Booking Confirmed';
  const body = `Hello ${owner.firstName}, booking #${booking.id} on ${booking.bookingDate} ` +
    `from ${booking.startTime} to ${booking.endTime} has been confirmed. ` +
    `Customer: ${customer.firstName} ${customer.lastName} (${customer.email}).`;
  await sendEmail(owner.id, owner.email, subject, body);
}

async function notifyBookingRejected(booking, customer) {
  const subject = 'Booking Rejected';
  const body = `Hello ${customer.firstName}, your booking #${booking.id} on ${booking.bookingDate} ` +
    `from ${booking.startTime} to ${booking.endTime} has been rejected. ` +
    `Please try a different time or salon.`;
  await sendEmail(customer.id, customer.email, subject, body);
}

async function notifyBookingCancelled(booking, owner) {
  const subject = 'Booking Cancelled';
  const body = `Hello ${owner.firstName}, booking #${booking.id} on ${booking.bookingDate} ` +
    `from ${booking.startTime} to ${booking.endTime} has been cancelled by the customer.`;
  await sendEmail(owner.id, owner.email, subject, body);
}

module.exports = {
  sendEmail,
  sendSMS,
  notifyBookingConfirmed,
  notifyBookingRejected,
  notifyBookingCancelled,
};
