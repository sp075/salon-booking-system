'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'owner@salon.com',
        mobile: '9876543210',
        password: bcrypt.hashSync('Owner@123', 10),
        first_name: 'Raj',
        last_name: 'Kumar',
        role: 'owner',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'owner@salon.com' }, {});
  },
};
