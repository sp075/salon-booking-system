const { Sequelize } = require('sequelize');
const dbConfig = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
  }
);

const User = require('./User')(sequelize);
const OwnerProfile = require('./OwnerProfile')(sequelize);
const Service = require('./Service')(sequelize);
const OwnerService = require('./OwnerService')(sequelize);
const Booking = require('./Booking')(sequelize);
const BookingService = require('./BookingService')(sequelize);
const Review = require('./Review')(sequelize);
const Notification = require('./Notification')(sequelize);

const models = {
  User,
  OwnerProfile,
  Service,
  OwnerService,
  Booking,
  BookingService,
  Review,
  Notification,
};

// Run associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = { sequelize, Sequelize, ...models };
