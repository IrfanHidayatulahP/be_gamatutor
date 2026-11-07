require('dotenv').config({ path: 'D:/Data Kerjaan/Gamatutor/backend-gamatutor/.env' });
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    const [calls] = await sequelize.query("SELECT * FROM calls WHERE call_id = 'bfc4b24a-f34a-4c32-a708-d98967821c68'");
    const [participants] = await sequelize.query("SELECT * FROM call_participants WHERE call_id = 'bfc4b24a-f34a-4c32-a708-d98967821c68'");
    console.log('Call:', JSON.stringify(calls, null, 2));
    console.log('Participants:', JSON.stringify(participants, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();