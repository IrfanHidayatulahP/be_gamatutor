const { sequelize } = require('./src/models');

sequelize.authenticate().then(async () => {
  const [results] = await sequelize.query("SELECT * FROM mslq_static_questions WHERE category='learning_strategies';");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});