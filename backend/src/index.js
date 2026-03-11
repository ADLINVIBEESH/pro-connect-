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

mongoose
  // Force the Atlas connection to use the project database even if the URI omits it.
  .connect(process.env.MONGODB_URI, { dbName: 'proconnect-database' })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
