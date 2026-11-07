require('dotenv').config({ path: 'D:/Data Kerjaan/Gamatutor/backend-gamatutor/.env' });
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    // End all pending/ringing/answered calls
    await sequelize.query("UPDATE calls SET status = 'ended', ended_at = NOW() WHERE status IN ('pending', 'ringing', 'answered')");
    // Update call participants
    await sequelize.query("UPDATE call_participants SET left_at = NOW(), connection_status = 'disconnected' WHERE left_at IS NULL");
    console.log('Cleaned up active calls');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();