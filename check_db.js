const { sequelize } = require('./src/config/database');

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nAll tables in database:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    // For each table, get columns
    for (const t of tables) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, { bind: [t.table_name] });

      console.log(`\n${t.table_name}:`);
      columns.forEach(c => {
        console.log(`  ${c.column_name} | ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTables();