const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    defaultPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'default_price',
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: 'duration_minutes',
    },
  }, {
    tableName: 'services',
    underscored: true,
  });

  Service.associate = (models) => {
    Service.hasMany(models.OwnerService, { foreignKey: 'service_id', as: 'ownerServices' });
    Service.hasMany(models.BookingService, { foreignKey: 'service_id', as: 'bookingServices' });
  };

  return Service;
};
