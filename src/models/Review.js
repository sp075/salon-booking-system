const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'booking_id',
      references: { model: 'bookings', key: 'id' },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'reviews',
    underscored: true,
  });

  Review.associate = (models) => {
    Review.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
    Review.belongsTo(models.OwnerProfile, { foreignKey: 'owner_profile_id', as: 'ownerProfile' });
    Review.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
  };

  return Review;
};
