const { AccessToken } = require('livekit-server-sdk');

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.warn('⚠️ LiveKit environment variables not configured');
}

/**
 * Generate LiveKit JWT access token.
 * Defensive: `toJwt()` bisa sync atau async tergantung versi SDK.
 */
const generateAccessToken = async (identity, roomName, grants = {}) => {
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

  // ─── FIX: handle sync & async toJwt ───
  let token = at.toJwt();

  // Kalau toJwt() return Promise, await. Kalau string, tetap string.
  if (token && typeof token.then === 'function') {
    token = await token;
  }

  // ─── DEBUG: log tipe token ───
  console.log(
    `🎟️  LiveKit token for identity="${identity}", room="${roomName}" → ` +
    `type=${typeof token}, length=${typeof token === 'string' ? token.length : 'N/A'}`
  );
  if (typeof token !== 'string') {
    console.error('❌ CRITICAL: at.toJwt() did NOT return a string:', token);
  }

  return token;
};

const generateCallToken = async (callerId, calleeId, callId) => {
  const roomName = `call_${callId}`;
  const identity = callerId;

  const token = await generateAccessToken(identity, roomName);

  return {
    token,
    roomName,
    livekitUrl: LIVEKIT_URL,
  };
};

const generateGroupCallToken = async (userId, taskId, groupCallId, userName) => {
  const roomName = `task_${taskId}`;
  const identity = userId;

  const token = await generateAccessToken(identity, roomName, {
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    token,
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