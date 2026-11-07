const { sequelize } = require('./src/config/database');

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nAll tables in database:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTables();