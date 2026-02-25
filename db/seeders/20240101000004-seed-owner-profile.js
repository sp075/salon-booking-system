'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('owner_profiles', [
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        salon_name: "Raj's Style Studio",
        address: '123 MG Road, Pune',
        open_time: '09:00:00',
        close_time: '18:00:00',
        day_off: 0,
        avg_rating: 0,
        total_reviews: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('owner_profiles', {
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }, {});
  },
};
