const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { isAuthenticated, isRole } = require('../middleware/authMiddleware');

router.use(isAuthenticated, isRole('owner'));

router.get('/profile', ownerController.getProfile);
router.put('/profile', ownerController.updateProfile);
router.put('/schedule', ownerController.updateSchedule);

router.get('/services', ownerController.getServices);
router.post('/services', ownerController.addService);
router.delete('/services/:serviceId', ownerController.removeService);

router.get('/bookings', ownerController.getBookings);
router.put('/bookings/:id/confirm', ownerController.confirmBooking);
router.put('/bookings/:id/reject', ownerController.rejectBooking);

module.exports = router;
