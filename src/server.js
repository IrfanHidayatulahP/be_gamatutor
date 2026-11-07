require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const bonjour = require('bonjour')();
const { connectDB } = require('./config/database');
const { initializeSocket } = require('./websocket/socket');
const { initializeFCM } = require('./config/fcm');
const { setIo } = require('./websocket/ioInstance');

const app = require('./app');
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

// Inisialisasi Socket.io (Real-time Chat & WebRTC Signaling)
const io = initializeSocket(httpServer);

// Inisialisasi Firebase Cloud Messaging
initializeFCM();

// Akses global io untuk service & controllers
setIo(io);
app.set('io', io);

const startServer = async() => {
    await connectDB();

    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`WebSocket server ready`);

        // Broadcast service via mDNS untuk deteksi otomatis aplikasi mobile 
        try {
            bonjour.publish({
                name: 'Kanban API',
                type: 'http',
                port: PORT,
                host: require('os').hostname()
            });
        } catch (e) {
            console.warn('mDNS broadcast warning:', e.message);
        }
    });
};

startServer();

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    if (err && err.original) console.error('Detail error:', err.original);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    if (err && err.original) console.error('Detail error:', err.original);
    process.exit(1);
});