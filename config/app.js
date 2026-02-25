module.exports = {
  slotDurationMinutes: parseInt(process.env.SLOT_DURATION_MINUTES, 10) || 30,
  holdTimeoutMinutes: parseInt(process.env.HOLD_TIMEOUT_MINUTES, 10) || 10,
  lunchStart: process.env.LUNCH_START || '13:00',
  lunchEnd: process.env.LUNCH_END || '14:00',
  defaultServices: [
    { name: 'Haircut', defaultPrice: 300, durationMinutes: 30 },
    { name: 'Shave', defaultPrice: 150, durationMinutes: 30 },
    { name: 'Hair Color', defaultPrice: 800, durationMinutes: 30 },
    { name: 'Facial', defaultPrice: 500, durationMinutes: 30 },
    { name: 'Head Massage', defaultPrice: 200, durationMinutes: 30 },
    { name: 'Hair Spa', defaultPrice: 1000, durationMinutes: 30 },
  ],
};
