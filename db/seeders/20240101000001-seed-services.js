'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('services', [
      {
        name: 'Haircut',
        default_price: 300.00,
        duration_minutes: 30,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Shave',
        default_price: 150.00,
        duration_minutes: 30,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Hair Color',
        default_price: 800.00,
        duration_minutes: 30,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Facial',
        default_price: 500.00,
        duration_minutes: 30,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Head Massage',
        default_price: 200.00,
        duration_minutes: 30,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Hair Spa',
        default_price: 1000.00,
        duration_minutes: 30,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('services', null, {});
  },
};
