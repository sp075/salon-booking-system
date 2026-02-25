'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('owner_services', [
      {
        owner_profile_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        service_id: 1,
        is_active: true,
        custom_price: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        owner_profile_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        service_id: 2,
        is_active: true,
        custom_price: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        owner_profile_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        service_id: 3,
        is_active: true,
        custom_price: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        owner_profile_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        service_id: 4,
        is_active: true,
        custom_price: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        owner_profile_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        service_id: 5,
        is_active: true,
        custom_price: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        owner_profile_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        service_id: 6,
        is_active: true,
        custom_price: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('owner_services', {
      owner_profile_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    }, {});
  },
};
