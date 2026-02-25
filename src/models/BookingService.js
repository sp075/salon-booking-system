const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BookingService = sequelize.define('BookingService', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'booking_id',
      references: { model: 'bookings', key: 'id' },
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'service_id',
      references: { model: 'services', key: 'id' },
    },
    slotStart: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'slot_start',
    },
    slotEnd: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'slot_end',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName: 'booking_services',
    underscored: true,
  });

  BookingService.associate = (models) => {
    BookingService.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    BookingService.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  };

  return BookingService;
};
