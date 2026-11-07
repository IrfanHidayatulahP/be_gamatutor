require('dotenv').config({ path: 'D:/Data Kerjaan/Gamatutor/backend-gamatutor/.env' });
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT * FROM calls WHERE status IN ('pending', 'ringing', 'answered')");
    console.log('Active calls:', JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();