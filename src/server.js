require('dotenv').config();
const express = require('express');
const bonjour = require('bonjour')();
const { connectDB } = require('./config/database');

const app = require('./app');
const { error } = require('console');
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Broadcast service via mDNS (publish sekali saja)
    bonjour.publish({
      name: 'Kanban API',
      type: 'http',
      port: PORT,
      host: require('os').hostname()
    });
  });
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  console.error ('detail error :', err.original);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error ('detail error :', err.original);
  process.exit(1);
});
