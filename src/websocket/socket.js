const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const userSockets = new Map(); // userId -> Set of socketIds
const socketUsers = new Map(); // socketId -> userId
const callRooms = new Map(); // callId -> Set of socketIds
const groupCallRooms = new Map(); // groupCallId -> Set of socketIds

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (socket: ${socket.id})`);

    // Track user sockets
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);
    socketUsers.set(socket.id, socket.userId);

    // Join user's personal room for direct messages
    socket.join(`user:${socket.userId}`);

    // Handle call signaling - emit events matching frontend WebSocketEvents constants (snake_case)
    socket.on('call:offer', (data) => {
      const { callId, targetUserId, offer } = data;
      const targetSockets = userSockets.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('incoming_call', {
            callId,
            fromUserId: socket.userId,
            callerId: socket.userId,
            calleeId: targetUserId,
            type: 'audio', // default, could be passed from client
            status: 'ringing',
            offer,
            createdAt: new Date().toISOString()
          });
        });
      }
    });

    socket.on('call:answer', (data) => {
      const { callId, targetUserId, answer } = data;
      const targetSockets = userSockets.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('call:accepted', {
            callId,
            callerId: socket.userId,
            calleeId: targetUserId,
            type: 'audio',
            status: 'answered',
            signalingData: { answer },
            startedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
        });
      }
    });

    socket.on('call:ice-candidate', (data) => {
      const { callId, targetUserId, candidate } = data;
      const targetSockets = userSockets.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          // Emit to call_signaling for ICE candidates (matches frontend)
          io.to(targetSocketId).emit('call_signaling', { callId, candidate });
        });
      }
    });

    socket.on('call:reject', (data) => {
      const { callId, targetUserId } = data;
      const targetSockets = userSockets.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('call_rejected', {
            callId,
            callerId: socket.userId,
            calleeId: targetUserId,
            status: 'rejected',
            endedAt: new Date().toISOString()
          });
        });
      }
    });

    socket.on('call:end', (data) => {
      const { callId, targetUserId } = data;
      const targetSockets = userSockets.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('call_ended', {
            callId,
            callerId: socket.userId,
            calleeId: targetUserId,
            status: 'ended',
            endedAt: new Date().toISOString()
          });
        });
      }
    });

    socket.on('call:cancel', (data) => {
      const { callId, targetUserId } = data;
      const targetSockets = userSockets.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('call_cancelled', {
            callId,
            callerId: socket.userId,
            calleeId: targetUserId,
            status: 'cancelled',
            endedAt: new Date().toISOString()
          });
        });
      }
    });

    // Handle group call signaling (LiveKit only - no mediasoup)
    socket.on('group-call:join', (data) => {
      const { groupCallId } = data;

      if (!groupCallRooms.has(groupCallId)) {
        groupCallRooms.set(groupCallId, new Set());
      }
      groupCallRooms.get(groupCallId).add(socket.id);
      socket.join(`group-call:${groupCallId}`);

      // Notify others in the group call
      socket.to(`group-call:${groupCallId}`).emit('group-call:user-joined', {
        groupCallId,
        userId: socket.userId,
        user: {
          userId: socket.user.userId,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          username: socket.user.username
        }
      });
    });

    socket.on('group-call:leave', (data) => {
      const { groupCallId } = data;
      leaveGroupCallRoom(socket, groupCallId);
    });

    socket.on('group-call:chat', (data) => {
      const { groupCallId, message } = data;
      io.to(`group-call:${groupCallId}`).emit('group-call:chat', {
        groupCallId,
        fromUserId: socket.userId,
        user: {
          userId: socket.user.userId,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          username: socket.user.username
        },
        message,
        timestamp: new Date().toISOString()
      });
    });

    // ===== End LiveKit Group Call Signaling =====

    // Handle chat messages (direct messages)
    socket.on('chat:message', (data) => {
      const { friendId, message } = data;
      const targetSockets = userSockets.get(friendId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('chat:message', {
            fromUserId: socket.userId,
            message,
            timestamp: new Date().toISOString()
          });
        });
      }
    });

    socket.on('chat:typing', (data) => {
      const { friendId } = data;
      const targetSockets = userSockets.get(friendId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('chat:typing', { fromUserId: socket.userId });
        });
      }
    });

    socket.on('chat:stop-typing', (data) => {
      const { friendId } = data;
      const targetSockets = userSockets.get(friendId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('chat:stop-typing', { fromUserId: socket.userId });
        });
      }
    });

    socket.on('chat:read', (data) => {
      const { friendId, messageIds } = data;
      const targetSockets = userSockets.get(friendId);
      if (targetSockets) {
        targetSockets.forEach(targetSocketId => {
          io.to(targetSocketId).emit('chat:read', { fromUserId: socket.userId, messageIds });
        });
      }
    });

    // Presence
    socket.on('presence:update', (data) => {
      const { status } = data; // 'online' | 'offline' | 'busy' | 'away'
      socket.broadcast.emit('presence:update', { userId: socket.userId, status });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId} (socket: ${socket.id})`);

      // Remove from user sockets
      const userSocketSet = userSockets.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(socket.userId);
          // Notify others user is offline
          socket.broadcast.emit('presence:update', { userId: socket.userId, status: 'offline' });
        }
      }

      socketUsers.delete(socket.id);

      // Leave all call rooms
      for (const [callId, sockets] of callRooms.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            callRooms.delete(callId);
          }
        }
      }

      // Leave all group call rooms
      for (const [groupCallId, sockets] of groupCallRooms.entries()) {
        if (sockets.has(socket.id)) {
          leaveGroupCallRoom(socket, groupCallId);
        }
      }
    });
  });

  const leaveGroupCallRoom = (socket, groupCallId) => {
    const room = groupCallRooms.get(groupCallId);
    if (room) {
      room.delete(socket.id);
      socket.leave(`group-call:${groupCallId}`);

      if (room.size === 0) {
        groupCallRooms.delete(groupCallId);
      } else {
        socket.to(`group-call:${groupCallId}`).emit('group-call:user-left', {
          groupCallId,
          userId: socket.userId
        });
      }
    }
  };

  // Helper to emit to specific user
  io.emitToUser = (userId, event, data) => {
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        io.to(socketId).emit(event, data);
      });
    }
  };

  // Helper to emit to call room
  io.emitToCall = (callId, event, data) => {
    io.to(`call:${callId}`).emit(event, data);
  };

  // Helper to emit to group call room
  io.emitToGroupCall = (groupCallId, event, data) => {
    io.to(`group-call:${groupCallId}`).emit(event, data);
  };

  return io;
};

module.exports = { initializeSocket };