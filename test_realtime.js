const io = require('socket.io-client');
const axios = require('axios');

async function test() {
  // Login as superadmin (sender) - we know this works
  const login1 = await axios.post('http://localhost:3000/api/auth/login', {
    email: 'superadmin123@gmail.com',
    password: 'superadmin123'
  });
  const token1 = login1.data.token;
  const userId1 = login1.data.user.userId;
  console.log('superadmin userId:', userId1);

  // madekkecil userId from database
  const userId2 = '9da79e41-6129-429a-b2cd-0aef7bfc26f0';
  console.log('madekkecil userId:', userId2);

  // Connect WebSocket as superadmin
  const socket1 = io('http://localhost:3000', {
    auth: { token: token1 },
    transports: ['websocket', 'polling'],
    path: '/socket.io',
    reconnection: false
  });

  socket1.on('connect', () => {
    console.log('superadmin Connected! Socket ID:', socket1.id);
  });

  socket1.on('connect_error', (err) => {
    console.log('superadmin connect_error:', err.message);
  });

  socket1.on('disconnect', (reason) => {
    console.log('superadmin Disconnected:', reason);
  });

  socket1.on('new_message', (data) => {
    console.log('superadmin received new_message:', JSON.stringify(data, null, 2));
  });

  socket1.onAny((event, ...args) => {
    console.log('superadmin Event:', event, args);
  });

  // Wait for connection, then send message from superadmin
  setTimeout(async () => {
    console.log('\n--- Sending message from superadmin via REST API ---');
    const msg = await axios.post('http://localhost:3000/api/chat', {
      friendId: userId2,
      messageChat: 'Real-time test from superadmin at ' + new Date().toISOString()
    }, {
      headers: { Authorization: 'Bearer ' + token1 }
    });
    console.log('Send result:', msg.data.chat.messageChat);

    setTimeout(() => {
      socket1.disconnect();
      process.exit(0);
    }, 3000);
  }, 2000);
}

test().catch(e => { console.error(e); process.exit(1); });