const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    req.session.userId = user.id;
    req.session.role = user.role;
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const user = await authService.login(req.body);
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.session.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body);
    res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, resetPassword };
