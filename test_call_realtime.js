const io = require('socket.io-client');
const axios = require('axios');

async function test() {
  // Login as superadmin (caller)
  const login1 = await axios.post('http://localhost:3000/api/auth/login', {
    email: 'superadmin123@gmail.com',
    password: 'superadmin123'
  });
  const token1 = login1.data.token;
  const userId1 = login1.data.user.userId;
  console.log('superadmin (caller) userId:', userId1);

  // madekkecil userId from database (callee)
  const userId2 = '9da79e41-6129-429a-b2cd-0aef7bfc26f0';
  console.log('madekkecil (callee) userId:', userId2);

  // Connect WebSocket as superadmin (caller)
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

  // Listen for call events that frontend expects
  socket1.on('incoming_call', (data) => {
    console.log('superadmin received incoming_call:', JSON.stringify(data, null, 2));
  });

  socket1.on('call_answered', (data) => {
    console.log('superadmin received call_answered:', JSON.stringify(data, null, 2));
  });

  socket1.on('call_rejected', (data) => {
    console.log('superadmin received call_rejected:', JSON.stringify(data, null, 2));
  });

  socket1.on('call_ended', (data) => {
    console.log('superadmin received call_ended:', JSON.stringify(data, null, 2));
  });

  socket1.on('call_cancelled', (data) => {
    console.log('superadmin received call_cancelled:', JSON.stringify(data, null, 2));
  });

  socket1.on('call_signaling', (data) => {
    console.log('superadmin received call_signaling:', JSON.stringify(data, null, 2));
  });

  socket1.onAny((event, ...args) => {
    if (!['connect', 'disconnect', 'connect_error'].includes(event)) {
      console.log('superadmin Event:', event, args);
    }
  });

  // Wait for connection, then test call signaling
  setTimeout(async () => {
    console.log('\n--- Test 1: superadmin sends call:offer to madekkecil ---');
    const callId = 'test-call-' + Date.now();
    socket1.emit('call:offer', {
      callId: callId,
      targetUserId: userId2,
      offer: { sdp: 'test-offer-sdp', type: 'offer' }
    });

    setTimeout(async () => {
      console.log('\n--- Test 2: superadmin sends call:ice-candidate to madekkecil ---');
      socket1.emit('call:ice-candidate', {
        callId: callId,
        targetUserId: userId2,
        candidate: { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 54400 typ host', sdpMid: '0', sdpMLineIndex: 0 }
      });

      setTimeout(async () => {
        console.log('\n--- Test 3: superadmin sends call:end to madekkecil ---');
        socket1.emit('call:end', {
          callId: callId,
          targetUserId: userId2
        });

        setTimeout(() => {
          socket1.disconnect();
          process.exit(0);
        }, 2000);
      }, 1000);
    }, 1000);
  }, 2000);
}

test().catch(e => { console.error(e); process.exit(1); });