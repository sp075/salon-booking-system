'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        email: 'customer@example.com',
        mobile: '9876543211',
        password: bcrypt.hashSync('Customer@123', 10),
        first_name: 'Priya',
        last_name: 'Sharma',
        role: 'customer',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'customer@example.com' }, {});
  },
};
