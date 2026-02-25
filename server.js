const app = require('./app');
const { sequelize } = require('./src/models');
const scheduler = require('./src/jobs/scheduler');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    scheduler.start();
    logger.info('Cron jobs started');

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
