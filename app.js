require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const { sequelize } = require('./src/models');
const sessionConfig = require('./config/session');
const errorHandler = require('./src/middleware/errorHandler');
const apiRoutes = require('./src/routes');

const app = express();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session store
const sessionStore = new SequelizeStore({ db: sequelize });
app.use(session({
  ...sessionConfig,
  store: sessionStore,
}));
sessionStore.sync();

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use(errorHandler);

module.exports = app;
