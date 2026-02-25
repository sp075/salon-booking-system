const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OwnerService = sequelize.define('OwnerService', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ownerProfileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_profile_id',
      references: { model: 'owner_profiles', key: 'id' },
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'service_id',
      references: { model: 'services', key: 'id' },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    customPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'custom_price',
    },
  }, {
    tableName: 'owner_services',
    underscored: true,
    indexes: [
      { unique: true, fields: ['owner_profile_id', 'service_id'] },
    ],
  });

  OwnerService.associate = (models) => {
    OwnerService.belongsTo(models.OwnerProfile, { foreignKey: 'owner_profile_id', as: 'ownerProfile' });
    OwnerService.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  };

  return OwnerService;
};
