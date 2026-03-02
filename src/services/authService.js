const bcrypt = require('bcryptjs');
const { User, OwnerProfile } = require('../models');
const notificationService = require('./notificationService');

const SALT_ROUNDS = 10;

async function register({ email, mobile, password, firstName, lastName, role }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    email,
    mobile,
    password: hashedPassword,
    firstName,
    lastName,
    role,
  });

  // Auto-create owner profile for owners
  if (role === 'owner') {
    await OwnerProfile.create({ userId: user.id });
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

async function getUserById(id) {
  const user = await User.findByPk(id, {
    attributes: ['id', 'email', 'mobile', 'firstName', 'lastName', 'role'],
    include: [
      {
        model: OwnerProfile,
        as: 'ownerProfile',
        attributes: ['id', 'salonName', 'address', 'openTime', 'closeTime', 'dayOff', 'avgRating', 'totalReviews'],
        required: false,
      },
    ],
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function resetPassword({ email, last4digits, newPassword }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('No account found with that email and phone number combination.');
    error.statusCode = 404;
    throw error;
  }

  const storedLast4 = user.mobile.slice(-4);
  if (storedLast4 !== last4digits.trim()) {
    const error = new Error('No account found with that email and phone number combination.');
    error.statusCode = 404;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.update({ password: hashedPassword });

  await notificationService.sendEmail(
    user.id,
    user.email,
    'Password Reset Successful',
    `Hello ${user.firstName}, your password for your Salon Booking account has been successfully reset. ` +
      `If you did not request this change, please contact support immediately.`
  );

  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

module.exports = { register, login, getUserById, resetPassword };
