const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id',
      references: { model: 'users', key: 'id' },
    },
    ownerProfileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_profile_id',
      references: { model: 'owner_profiles', key: 'id' },
    },
    bookingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'booking_date',
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time',
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_price',
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'abandoned'),
      defaultValue: 'pending',
      allowNull: false,
    },
    heldAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'held_at',
    },
  }, {
    tableName: 'bookings',
    underscored: true,
  });

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
    Booking.belongsTo(models.OwnerProfile, { foreignKey: 'owner_profile_id', as: 'ownerProfile' });
    Booking.hasMany(models.BookingService, { foreignKey: 'booking_id', as: 'bookingServices' });
    Booking.hasOne(models.Review, { foreignKey: 'booking_id', as: 'review' });
  };

  return Booking;
};
