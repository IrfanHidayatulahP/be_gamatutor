// Manual migration to add fcm_platform column to users table
const { sequelize } = require('./src/config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'fcm_platform'
    `);

    if (results.length === 0) {
      console.log('Adding fcm_platform column...');
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN fcm_platform VARCHAR(10)
        CHECK (fcm_platform IN ('android', 'ios', 'web'))
      `);
      console.log('Column added successfully');
    } else {
      console.log('Column fcm_platform already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();