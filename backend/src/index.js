const dns = require('dns');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const createApp = require('./app');
const { getTransportConfig, hasEmailConfig } = require('./config/email');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = createApp();
const emailConfig = getTransportConfig();

if (!hasEmailConfig()) {
  console.warn(
    process.env.NODE_ENV === 'production'
      ? '[startup] Email service is not configured. OTP signup will fail until SMTP_* or EMAIL_USER plus EMAIL_APP_PASSWORD are set.'
      : '[startup] Email service is not configured. OTP codes will be printed in this terminal during local development.',
  );
} else {
  console.log(`[startup] Email service configured via ${emailConfig.description}.`);
}

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DBNAME;
const mongoOptions = {};

if (mongoDbName) {
  mongoOptions.dbName = mongoDbName;
} else if (mongoUri) {
  try {
    const parsedUri = new URL(mongoUri);
    const hasDbInUri = Boolean(parsedUri.pathname && parsedUri.pathname !== '/');
    if (!hasDbInUri) {
      // Preserve the previous default while keeping the URI's database when provided.
      mongoOptions.dbName = 'proconnect-database';
    }
  } catch (error) {
    // If the URI is invalid, let Mongoose surface the error without masking it here.
  }
}

mongoose
  .connect(mongoUri, mongoOptions)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
