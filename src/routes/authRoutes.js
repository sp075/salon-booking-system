const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin, validatePasswordReset } = require('../middleware/validationMiddleware');

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', isAuthenticated, authController.me);
router.post('/reset-password', validatePasswordReset, authController.resetPassword);

module.exports = router;
