const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/notifications.log');

function getTimestamp() {
  return new Date().toISOString();
}

function ensureLogDirectory() {
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

const logger = {
  info(...args) {
    console.log(`[${getTimestamp()}] [INFO]`, ...args);
  },

  error(...args) {
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
  },

  notification(...args) {
    const timestamp = getTimestamp();
    const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');

    console.log(`[${timestamp}] [NOTIFICATION]`, ...args);

    try {
      ensureLogDirectory();
      fs.appendFileSync(LOG_FILE, `[${timestamp}] [NOTIFICATION] ${message}\n`);
    } catch (err) {
      console.error(`[${timestamp}] [ERROR] Failed to write to notification log:`, err.message);
    }
  },
};

module.exports = logger;
