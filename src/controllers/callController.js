const {
  initiateCall,
  answerCall,
  rejectCall,
  endCall,
  cancelCall,
  getCallById,
  getUserCallHistory,
  updateCallSignaling
} = require('../services/callService');
const { generateCallToken } = require('../services/livekitService');
const { sendPushToUser } = require('../services/notificationService');
const { User, Call } = require('../models');

const initiate = async (req, res, next) => {
  try {
    const { calleeId } = req.body; // Voice-only app: ignore type from body, always audio
    const callerId = req.user.userId;
    const call = await initiateCall(callerId, calleeId, 'audio', {});

    // Get caller info for FCM/Socket
    const caller = await User.findByPk(callerId, {
      attributes: ['userId', 'firstName', 'lastName', 'username']
    });
    const callerName = `${caller.firstName} ${caller.lastName}`.trim() || caller.username;

    // Generate LiveKit credentials for voice call (required for FCM navigation)
    const { token, roomName, livekitUrl } = generateCallToken(callerId, calleeId, call.callId);

    const io = req.app.get('io');

    // Voice-only app: always send audio type in FCM/Socket
    const title = 'Incoming Voice Call';
    const body = `${callerName} is calling you`;

    // Send FCM push notification to callee (include LiveKit credentials for navigation)
    try {
      await sendPushToUser(calleeId, title, body, {
        type: 'call_incoming',  // Notification type for frontend routing
        callType: 'audio',      // Actual call type (voice-only)
        callId: call.callId,
        callerId,
        callerName,
        isVideo: false,
        token: String(token),   // Ensure string serialization
        roomName: String(roomName),
        livekitUrl: String(livekitUrl)
      });
    } catch (fcmError) {
      console.error('FCM send failed:', fcmError);
    }

    // Socket.IO emit for real-time notification (when app is foreground) - include LiveKit credentials
    if (io) {
      io.emitToUser(calleeId, 'call:incoming', {
        type: 'call_incoming',
        callType: 'audio',
        callId: call.callId,
        callerId,
        callerName,
        isVideo: false,
        token: String(token),
        roomName: String(roomName),
        livekitUrl: String(livekitUrl)
      });
    }

    res.status(201).json({ call });
  } catch (error) {
    next(error)
  }
};

const answer = async (req, res, next) => {
  try {
    const { signalingData } = req.body;
    const call = await answerCall(req.params.callId, req.user.userId, signalingData);

    // Emit WebSocket event to notify caller that callee accepted
    const io = req.app.get('io');
    if (io) {
      const callerId = call.callerId;
      const callType = call.type; // 'audio' or 'video'

      if (callType === 'audio') {
        // LiveKit audio call - generate token, roomName, livekitUrl for caller
        const { generateCallToken } = require('../services/livekitService');
        const { token, roomName, livekitUrl } = generateCallToken(callerId, call.calleeId, call.callId);

        io.to(`user:${callerId}`).emit('call:accepted', {
          callId: String(call.callId),
          callerId: String(call.calleeId), // callee is the one who answered
          calleeId: String(call.callerId),
          type: 'audio',
          status: 'answered',
          token: String(token),
          roomName: String(roomName),
          livekitUrl: String(livekitUrl),
        });
      } else {
        // WebRTC video call - include signalingData (SDP answer)
        io.to(`user:${callerId}`).emit('call:accepted', {
          callId: String(call.callId),
          callerId: String(call.calleeId),
          calleeId: String(call.callerId),
          type: 'video',
          status: 'answered',
          signalingData: signalingData || call.signalingData || {}
        });
      }
    }

    res.json({ call });
  } catch (error) {
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const result = await rejectCall(req.params.callId, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const end = async (req, res, next) => {
  try {
    const result = await endCall(req.params.callId, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    const result = await cancelCall(req.params.callId, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const call = await getCallById(req.params.callId, req.user.userId);
    res.json({ call });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const calls = await getUserCallHistory(req.user.userId, filters);
    res.json({ calls });
  } catch (error) {
    next(error);
  }
};

const updateSignaling = async (req, res, next) => {
  try {
    const { signalingData } = req.body;
    const call = await updateCallSignaling(req.params.callId, req.user.userId, signalingData);
    res.json({ call });
  } catch (error) {
    next(error);
  }
};

const initiateLiveKit = async (req, res, next) => {
  try {
    const { calleeId } = req.body;
    const callerId = req.user.userId;

    if (callerId === calleeId) {
      return res.status(400).json({ error: 'Cannot call yourself' });
    }

    // Check if callee exists
    const callee = await User.findByPk(calleeId);
    if (!callee) {
      return res.status(404).json({ error: 'Callee not found' });
    }

    // Check if callee has an active call (WebRTC or LiveKit)
    const { Call } = require('../models');
    const { Op } = require('sequelize');
    const activeCall = await Call.findOne({
      where: {
        [Op.or]: [
          { callerId: calleeId },
          { calleeId: calleeId }
        ],
        status: { [Op.in]: ['pending', 'ringing', 'answered'] }
      }
    });

    if (activeCall) {
      return res.status(409).json({ error: 'User is currently in a call' });
    }

    // Create call record (audio only)
    const call = await initiateCall(callerId, calleeId, 'audio', {});

    // Generate LiveKit token
    const { token, roomName, livekitUrl } = generateCallToken(callerId, calleeId, call.callId);

    // Get caller info for FCM
    const caller = await User.findByPk(callerId, {
      attributes: ['userId', 'firstName', 'lastName', 'username']
    });
    const callerName = `${caller.firstName} ${caller.lastName}`.trim() || caller.username;

    // Send FCM push notification to callee
    try {
      await sendPushToUser(calleeId, 'Incoming Call', `${callerName} is calling you`, {
        type: 'call_incoming',  // Notification type for frontend routing
        callType: 'audio',      // Actual call type (voice-only)
        callId: call.callId,
        callerId,
        callerName,
        isVideo: false,
        token: String(token),   // Ensure string serialization
        roomName: String(roomName),
        livekitUrl: String(livekitUrl)
      });
    } catch (fcmError) {
      console.error('FCM send failed:', fcmError);
      // Don't fail the request if FCM fails
    }

    // Socket.IO emit for real-time notification (when app is foreground)
    const io = req.app.get('io');
    if (io) {
      io.emitToUser(calleeId, 'call:incoming', {
        type: 'call_incoming',
        callType: 'audio',
        callId: call.callId,
        callerId,
        callerName,
        isVideo: false,
        token: String(token),
        roomName: String(roomName),
        livekitUrl: String(livekitUrl)
      });
    }

    res.status(201).json({
      callId: call.callId,
      token,
      roomName,
      livekitUrl,
      call: {
        callId: call.callId,
        callerId: call.callerId,
        calleeId: call.calleeId,
        type: call.type,
        status: call.status,
        createdAt: call.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Accept incoming LiveKit audio call
const acceptLiveKit = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const calleeId = req.user.userId;

    // Update call status to answered
    const call = await answerCall(callId, calleeId, {});

    // Generate LiveKit token for CALLEE (the one accepting)
    const { token, roomName, livekitUrl } = generateCallToken(calleeId, call.callerId, call.callId);

    // Generate token for CALLER too (for call:answered event)
    const { token: callerToken, roomName: callerRoomName, livekitUrl: callerLivekitUrl } =
      generateCallToken(call.callerId, calleeId, call.callId);

    // Emit to caller via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${call.callerId}`).emit('call:answered', {
        callId: String(call.callId),
        token: String(callerToken),
        roomName: String(callerRoomName),
        livekitUrl: String(callerLivekitUrl),
        status: 'answered'
      });
    }

    // Return callee's token in response
    res.json({ token, roomName, livekitUrl, call });
  } catch (error) {
    next(error);
  }
};

// Reject incoming LiveKit audio call
const rejectLiveKit = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const calleeId = req.user.userId;

    const result = await rejectCall(callId, calleeId);

    // Emit to caller via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Need to get callerId from the call before it's rejected
      const call = await getCallById(callId, calleeId);
      if (call) {
        io.to(`user:${call.callerId}`).emit('call:rejected', {
          callId,
          reason: 'rejected'
        });
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { initiate, answer, reject, end, cancel, getById, getHistory, updateSignaling, initiateLiveKit, acceptLiveKit, rejectLiveKit };