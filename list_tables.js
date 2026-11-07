const { sequelize } = require('./src/config/database');

async function listTables() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const [results] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nTables in database:');
    results.forEach(r => console.log(`  - ${r.table_name}`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

listTables();