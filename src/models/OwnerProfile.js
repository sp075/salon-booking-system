const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OwnerProfile = sequelize.define('OwnerProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
    },
    salonName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'salon_name',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    openTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'open_time',
    },
    closeTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'close_time',
    },
    dayOff: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'day_off',
      validate: { min: 0, max: 6 },
    },
    avgRating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0,
      field: 'avg_rating',
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_reviews',
    },
  }, {
    tableName: 'owner_profiles',
    underscored: true,
  });

  OwnerProfile.associate = (models) => {
    OwnerProfile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    OwnerProfile.hasMany(models.OwnerService, { foreignKey: 'owner_profile_id', as: 'ownerServices' });
    OwnerProfile.hasMany(models.Booking, { foreignKey: 'owner_profile_id', as: 'bookings' });
    OwnerProfile.hasMany(models.Review, { foreignKey: 'owner_profile_id', as: 'reviews' });
  };

  return OwnerProfile;
};
