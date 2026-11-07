'use strict';

const mediasoup = require('mediasoup');
const config = require('../config/mediasoup');

let worker;
let initialized = false;

/**
 * Room structure:
 * {
 *   router: Router,
 *   transports: Map<transportId, { transport, userId, direction }>,
 *   producers: Map<producerId, { producer, userId, kind, appData }>,
 *   consumers: Map<consumerId, { consumer, userId, producerId }>,
 *   audioLevelObserver: AudioLevelObserver,
 *   peerMap: Map<userId, Set<transportId>> // for quick lookup
 * }
 */
const rooms = new Map();

/**
 * Initialize mediasoup worker and main router
 * Call once at server startup
 */
async function initializeMediasoup() {
  if (initialized) {
    console.log('⚠️ mediasoup already initialized');
    return;
  }

  try {
    worker = await mediasoup.createWorker({
      logLevel: config.worker.logLevel,
      logTags: config.worker.logTags,
      rtcMinPort: config.worker.rtcMinPort,
      rtcMaxPort: config.worker.rtcMaxPort,
      dtlsCertificateFile: config.worker.dtlsCertificateFile,
      dtlsPrivateKeyFile: config.worker.dtlsPrivateKeyFile,
    });

    worker.on('died', (error) => {
      console.error('❌ mediasoup worker died:', error);
      // In production, you might want to restart the worker
      process.exit(1);
    });

    console.log('✅ mediasoup worker created');

    // Create a global router for sharing across rooms (optional optimization)
    // For now, each room gets its own router
    initialized = true;
    console.log('✅ mediasoup initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize mediasoup:', error);
    throw error;
  }
}

/**
 * Get or create a room for a group call
 */
async function getOrCreateRoom(groupCallId) {
  if (!initialized) {
    await initializeMediasoup();
  }

  let room = rooms.get(groupCallId);
  if (room) {
    return room;
  }

  // Create new router for this room
  const router = await worker.createRouter({ mediaCodecs: config.router.mediaCodecs });

  // Create audio level observer for dominant speaker detection
  const audioLevelObserver = await router.createAudioLevelObserver({
    maxEntries: config.room.audioLevelObserver.maxEntries,
    threshold: config.room.audioLevelObserver.threshold,
    interval: config.room.audioLevelObserver.interval,
  });

  audioLevelObserver.on('volumes', (volumes) => {
    if (volumes.length === 0) return;
    // volumes is sorted by volume descending
    const [loudest] = volumes;
    if (loudest.volume > -50 && loudest.producer) {
      // Emit event via socket.io - will be handled in socket.js
      room._onDominantSpeaker?.(loudest.producer.appData?.userId, loudest.volume);
    }
  });

  audioLevelObserver.on('silence', () => {
    room._onSilence?.();
  });

  room = {
    router,
    transports: new Map(),      // transportId -> { transport, userId, direction }
    producers: new Map(),       // producerId -> { producer, userId, kind, appData }
    consumers: new Map(),       // consumerId -> { consumer, userId, producerId }
    audioLevelObserver,
    peerMap: new Map(),         // userId -> Set<transportId>
    _onDominantSpeaker: null,   // callback set by socket.js
    _onSilence: null,           // callback set by socket.js
  };

  rooms.set(groupCallId, room);
  console.log(`📦 Created mediasoup room: ${groupCallId}`);

  return room;
}

/**
 * Delete a room and clean up all resources
 */
async function deleteRoom(groupCallId) {
  const room = rooms.get(groupCallId);
  if (!room) {
    return;
  }

  console.log(`🗑️ Deleting mediasoup room: ${groupCallId}`);

  // Close all consumers
  for (const [consumerId, consumerData] of room.consumers) {
    try {
      consumerData.consumer.close();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
  room.consumers.clear();

  // Close all producers
  for (const [producerId, producerData] of room.producers) {
    try {
      producerData.producer.close();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
  room.producers.clear();

  // Close all transports
  for (const [transportId, transportData] of room.transports) {
    try {
      transportData.transport.close();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
  room.transports.clear();

  // Close audio level observer
  try {
    await room.audioLevelObserver.close();
  } catch (e) {
    // Ignore
  }

  // Close router
  try {
    await room.router.close();
  } catch (e) {
    // Ignore
  }

  rooms.delete(groupCallId);
  console.log(`✅ Room deleted: ${groupCallId}`);
}

/**
 * Get room stats for monitoring
 */
function getRoomStats(groupCallId) {
  const room = rooms.get(groupCallId);
  if (!room) return null;

  return {
    groupCallId,
    transports: room.transports.size,
    producers: room.producers.size,
    consumers: room.consumers.size,
    peers: room.peerMap.size,
  };
}

/**
 * Get all rooms stats
 */
function getAllRoomsStats() {
  const stats = [];
  for (const [groupCallId] of rooms) {
    stats.push(getRoomStats(groupCallId));
  }
  return stats;
}

// ===== Transport Management =====

/**
 * Create a WebRTC transport
 */
async function createWebRtcTransport(groupCallId, direction, userId) {
  const room = await getOrCreateRoom(groupCallId);

  const transport = await room.router.createWebRtcTransport({
    listenIps: config.webRtcTransport.listenIps,
    enableUdp: config.webRtcTransport.enableUdp,
    enableTcp: config.webRtcTransport.enableTcp,
    preferUdp: config.webRtcTransport.preferUdp,
    initialAvailableOutgoingBitrate: config.webRtcTransport.initialAvailableOutgoingBitrate,
  });

  transport.on('dtlsstatechange', (dtlsState) => {
    if (dtlsState === 'failed' || dtlsState === 'closed') {
      console.log(`🔴 Transport ${transport.id} DTLS state: ${dtlsState}`);
      transport.close();
    }
  });

  transport.on('close', () => {
    room.transports.delete(transport.id);
    // Remove from peer map
    const peerTransports = room.peerMap.get(userId);
    if (peerTransports) {
      peerTransports.delete(transport.id);
      if (peerTransports.size === 0) {
        room.peerMap.delete(userId);
      }
    }
  });

  room.transports.set(transport.id, { transport, userId, direction });

  // Track transport for user
  if (!room.peerMap.has(userId)) {
    room.peerMap.set(userId, new Set());
  }
  room.peerMap.get(userId).add(transport.id);

  console.log(`🚀 Created ${direction} transport ${transport.id} for user ${userId} in room ${groupCallId}`);

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
}

/**
 * Connect a WebRTC transport
 */
async function connectTransport(groupCallId, transportId, dtlsParameters) {
  const room = rooms.get(groupCallId);
  if (!room) {
    throw new Error('Room not found');
  }

  const transportData = room.transports.get(transportId);
  if (!transportData) {
    throw new Error('Transport not found');
  }

  await transportData.transport.connect({ dtlsParameters });
  console.log(`🔗 Transport ${transportId} connected`);
}

/**
 * Close a transport and clean up associated producers/consumers
 */
async function closeTransport(groupCallId, transportId) {
  const room = rooms.get(groupCallId);
  if (!room) return;

  const transportData = room.transports.get(transportId);
  if (!transportData) return;

  const { transport, userId, direction } = transportData;

  // If send transport, close associated producers
  if (direction === 'send') {
    const producersToClose = [];
    for (const [producerId, producerData] of room.producers) {
      if (producerData.userId === userId) {
        producersToClose.push(producerId);
      }
    }
    for (const producerId of producersToClose) {
      await closeProducer(groupCallId, producerId);
    }
  }

  // If recv transport, close associated consumers
  if (direction === 'recv') {
    const consumersToClose = [];
    for (const [consumerId, consumerData] of room.consumers) {
      if (consumerData.userId === userId) {
        consumersToClose.push(consumerId);
      }
    }
    for (const consumerId of consumersToClose) {
      await closeConsumer(groupCallId, consumerId);
    }
  }

  transport.close();
}

/**
 * Get transport info for a user
 */
function getUserTransports(groupCallId, userId) {
  const room = rooms.get(groupCallId);
  if (!room) return { send: null, recv: null };

  let sendTransport = null;
  let recvTransport = null;

  for (const [, data] of room.transports) {
    if (data.userId === userId) {
      if (data.direction === 'send') sendTransport = data.transport;
      if (data.direction === 'recv') recvTransport = data.transport;
    }
  }

  return { sendTransport, recvTransport };
}

// ===== Producer Management =====

/**
 * Produce media on a send transport
 */
async function produce(groupCallId, transportId, { kind, rtpParameters, appData }) {
  const room = rooms.get(groupCallId);
  if (!room) {
    throw new Error('Room not found');
  }

  const transportData = room.transports.get(transportId);
  if (!transportData || transportData.direction !== 'send') {
    throw new Error('Send transport not found');
  }

  const producer = await transportData.transport.produce({
    kind,
    rtpParameters,
    appData: { ...appData, userId: transportData.userId },
  });

  producer.on('transportclose', () => {
    room.producers.delete(producer.id);
    // Notify others via socket.io callback
    room._onProducerClosed?.(producer.id, transportData.userId);
  });

  producer.on('trackended', () => {
    console.log(`🎤 Producer ${producer.id} track ended`);
  });

  room.producers.set(producer.id, {
    producer,
    userId: transportData.userId,
    kind,
    appData: producer.appData,
  });

  // Add to audio level observer if audio
  if (kind === 'audio') {
    try {
      await room.audioLevelObserver.addProducer({ producerId: producer.id });
    } catch (e) {
      console.warn('Failed to add producer to audio level observer:', e.message);
    }
  }

  console.log(`🎤 Producer created: ${producer.id} (${kind}) by user ${transportData.userId}`);

  return {
    id: producer.id,
    kind: producer.kind,
    rtpParameters: producer.rtpParameters,
    type: producer.type,
    consumable: producer.consumable,
  };
}

/**
 * Close a producer
 */
async function closeProducer(groupCallId, producerId) {
  const room = rooms.get(groupCallId);
  if (!room) return;

  const producerData = room.producers.get(producerId);
  if (!producerData) return;

  // Remove from audio level observer
  try {
    await room.audioLevelObserver.removeProducer({ producerId });
  } catch (e) {
    // Ignore
  }

  producerData.producer.close();
  room.producers.delete(producerId);

  // Close associated consumers
  const consumersToClose = [];
  for (const [consumerId, consumerData] of room.consumers) {
    if (consumerData.producerId === producerId) {
      consumersToClose.push(consumerId);
    }
  }
  for (const consumerId of consumersToClose) {
    await closeConsumer(groupCallId, consumerId);
  }

  console.log(`🛑 Producer closed: ${producerId}`);
}

/**
 * Pause a producer (mute)
 */
async function pauseProducer(groupCallId, producerId) {
  const room = rooms.get(groupCallId);
  if (!room) return false;

  const producerData = room.producers.get(producerId);
  if (!producerData) return false;

  await producerData.producer.pause();
  console.log(`⏸️ Producer paused: ${producerId}`);
  return true;
}

/**
 * Resume a producer (unmute)
 */
async function resumeProducer(groupCallId, producerId) {
  const room = rooms.get(groupCallId);
  if (!room) return false;

  const producerData = room.producers.get(producerId);
  if (!producerData) return false;

  await producerData.producer.resume();
  console.log(`▶️ Producer resumed: ${producerId}`);
  return true;
}

/**
 * Get producer info
 */
function getProducer(groupCallId, producerId) {
  const room = rooms.get(groupCallId);
  if (!room) return null;
  return room.producers.get(producerId);
}

/**
 * Get all producers for a user
 */
function getUserProducers(groupCallId, userId) {
  const room = rooms.get(groupCallId);
  if (!room) return [];

  const producers = [];
  for (const [, data] of room.producers) {
    if (data.userId === userId) {
      producers.push(data);
    }
  }
  return producers;
}

/**
 * Get all active producers in room (for new peers to consume)
 */
function getActiveProducers(groupCallId) {
  const room = rooms.get(groupCallId);
  if (!room) return [];

  const producers = [];
  for (const [producerId, data] of room.producers) {
    if (!data.producer.closed) {
      producers.push({
        producerId,
        userId: data.userId,
        kind: data.kind,
        appData: data.appData,
      });
    }
  }
  return producers;
}

// ===== Consumer Management =====

/**
 * Consume a producer on a recv transport
 */
async function consume(groupCallId, transportId, { producerId, rtpCapabilities, paused = false }) {
  const room = rooms.get(groupCallId);
  if (!room) {
    throw new Error('Room not found');
  }

  const transportData = room.transports.get(transportId);
  if (!transportData || transportData.direction !== 'recv') {
    throw new Error('Recv transport not found');
  }

  const producerData = room.producers.get(producerId);
  if (!producerData) {
    throw new Error('Producer not found');
  }

  // Check if router can consume
  if (!room.router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Cannot consume this producer');
  }

  const consumer = await transportData.transport.consume({
    producerId,
    rtpCapabilities,
    paused,
  });

  consumer.on('transportclose', () => {
    room.consumers.delete(consumer.id);
    room._onConsumerClosed?.(consumer.id, transportData.userId);
  });

  consumer.on('producerclose', () => {
    console.log(`🔴 Consumer ${consumer.id} producer closed`);
    consumer.close();
    room.consumers.delete(consumer.id);
    room._onConsumerClosed?.(consumer.id, transportData.userId);
  });

  consumer.on('trackended', () => {
    console.log(`🔴 Consumer ${consumer.id} track ended`);
  });

  room.consumers.set(consumer.id, {
    consumer,
    userId: transportData.userId,
    producerId,
  });

  console.log(`👂 Consumer created: ${consumer.id} for producer ${producerId} by user ${transportData.userId}`);

  return {
    id: consumer.id,
    producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
    type: consumer.type,
    producerPaused: consumer.producerPaused,
  };
}

/**
 * Close a consumer
 */
async function closeConsumer(groupCallId, consumerId) {
  const room = rooms.get(groupCallId);
  if (!room) return;

  const consumerData = room.consumers.get(consumerId);
  if (!consumerData) return;

  consumerData.consumer.close();
  room.consumers.delete(consumerId);
  console.log(`🛑 Consumer closed: ${consumerId}`);
}

/**
 * Resume a paused consumer
 */
async function resumeConsumer(groupCallId, consumerId) {
  const room = rooms.get(groupCallId);
  if (!room) return false;

  const consumerData = room.consumers.get(consumerId);
  if (!consumerData) return false;

  await consumerData.consumer.resume();
  return true;
}

/**
 * Pause a consumer
 */
async function pauseConsumer(groupCallId, consumerId) {
  const room = rooms.get(groupCallId);
  if (!room) return false;

  const consumerData = room.consumers.get(consumerId);
  if (!consumerData) return false;

  await consumerData.consumer.pause();
  return true;
}

/**
 * Set consumer preferred layers (for bandwidth adaptation)
 */
async function setConsumerPreferredLayers(groupCallId, consumerId, { spatialLayer, temporalLayer }) {
  const room = rooms.get(groupCallId);
  if (!room) return false;

  const consumerData = room.consumers.get(consumerId);
  if (!consumerData) return false;

  await consumerData.consumer.setPreferredLayers({ spatialLayer, temporalLayer });
  return true;
}

/**
 * Get consumer info
 */
function getConsumer(groupCallId, consumerId) {
  const room = rooms.get(groupCallId);
  if (!room) return null;
  return room.consumers.get(consumerId);
}

/**
 * Get all consumers for a user
 */
function getUserConsumers(groupCallId, userId) {
  const room = rooms.get(groupCallId);
  if (!room) return [];

  const consumers = [];
  for (const [, data] of room.consumers) {
    if (data.userId === userId) {
      consumers.push(data);
    }
  }
  return consumers;
}

// ===== Callbacks for socket.js integration =====

/**
 * Set callback for dominant speaker detection
 */
function setDominantSpeakerCallback(groupCallId, callback) {
  const room = rooms.get(groupCallId);
  if (room) {
    room._onDominantSpeaker = callback;
  }
}

/**
 * Set callback for silence detection
 */
function setSilenceCallback(groupCallId, callback) {
  const room = rooms.get(groupCallId);
  if (room) {
    room._onSilence = callback;
  }
}

/**
 * Set callback for producer closed
 */
function setProducerClosedCallback(groupCallId, callback) {
  const room = rooms.get(groupCallId);
  if (room) {
    room._onProducerClosed = callback;
  }
}

/**
 * Set callback for consumer closed
 */
function setConsumerClosedCallback(groupCallId, callback) {
  const room = rooms.get(groupCallId);
  if (room) {
    room._onConsumerClosed = callback;
  }
}

// ===== Cleanup all rooms (for graceful shutdown) =====
async function closeAllRooms() {
  console.log('🔄 Closing all mediasoup rooms...');
  const roomIds = Array.from(rooms.keys());
  for (const groupCallId of roomIds) {
    await deleteRoom(groupCallId);
  }
  console.log('✅ All rooms closed');
}

/**
 * Close worker (for graceful shutdown)
 */
async function closeWorker() {
  if (worker) {
    await closeAllRooms();
    await worker.close();
    initialized = false;
    console.log('✅ mediasoup worker closed');
  }
}

module.exports = {
  initializeMediasoup,
  getOrCreateRoom,
  deleteRoom,
  getRoomStats,
  getAllRoomsStats,
  createWebRtcTransport,
  connectTransport,
  closeTransport,
  getUserTransports,
  produce,
  closeProducer,
  pauseProducer,
  resumeProducer,
  getProducer,
  getUserProducers,
  getActiveProducers,
  consume,
  closeConsumer,
  resumeConsumer,
  pauseConsumer,
  setConsumerPreferredLayers,
  getConsumer,
  getUserConsumers,
  setDominantSpeakerCallback,
  setSilenceCallback,
  setProducerClosedCallback,
  setConsumerClosedCallback,
  closeAllRooms,
  closeWorker,
};