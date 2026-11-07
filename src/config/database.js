const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'gamatutor',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'DoNotEnter!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected successfully');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.authenticate();
      console.log('Models synchronized');
    }
  } catch (error) {
    console.error('Unable to connect to database:', error.message);
    console.log('Server starting without database connection...');
  }
};

module.exports = { sequelize, connectDB };