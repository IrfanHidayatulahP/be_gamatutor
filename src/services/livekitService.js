const { AccessToken } = require('livekit-server-sdk');

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.warn('LiveKit environment variables not configured');
}

const generateAccessToken = (identity, roomName, grants = {}) => {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit not configured');
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: identity,
    ttl: '10m',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: grants.canPublish ?? true,
    canSubscribe: grants.canSubscribe ?? true,
    canPublishData: grants.canPublishData ?? true,
    canUpdateOwnMetadata: grants.canUpdateOwnMetadata ?? true,
  });

  return at.toJwt();
};

const generateCallToken = (callerId, calleeId, callId) => {
  const roomName = `call_${callId}`;
  const identity = callerId;

  return {
    token: generateAccessToken(identity, roomName),
    roomName,
    livekitUrl: LIVEKIT_URL,
  };
};

const generateGroupCallToken = (userId, taskId, groupCallId, userName) => {
  const roomName = `task_${taskId}`;
  const identity = userId;

  return {
    token: generateAccessToken(identity, roomName, {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    }),
    roomName,
    livekitUrl: LIVEKIT_URL,
  };
};

module.exports = {
  generateAccessToken,
  generateCallToken,
  generateGroupCallToken,
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
};