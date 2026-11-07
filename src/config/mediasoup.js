'use strict';

/**
 * mediasoup configuration
 * Optimized for audio-only group calls
 */

module.exports = {
  // Worker settings
  worker: {
    logLevel: process.env.MEDIASOUP_LOG_LEVEL || 'warn',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
      // 'rtx',
      // 'sctp',
    ],
    rtcMinPort: Number(process.env.MEDIASOUP_RTC_MIN_PORT) || 40000,
    rtcMaxPort: Number(process.env.MEDIASOUP_RTC_MAX_PORT) || 40100,
    dtlsCertificateFile: process.env.MEDIASOUP_DTLS_CERT_FILE,
    dtlsPrivateKeyFile: process.env.MEDIASOUP_DTLS_KEY_FILE,
  },

  // Router media codecs (audio-only optimized)
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        parameters: {
          minptime: 10,
          useinbandfec: 1,
          stereo: 1,
          maxplaybackrate: 48000,
        },
      },
    ],
  },

  // WebRTC transport settings
  webRtcTransport: {
    listenIps: [
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP, // Required for production behind NAT
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000, // 1 Mbps
    // enableSctp: false,
    // numSctpStreams: { OS: 1024, MIS: 1024 },
    // maxSctpMessageSize: 262144,
  },

  // Plain transport (for recording/streaming)
  plainTransport: {
    listenIp: {
      ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
      announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
    },
    maxSctpMessageSize: 262144,
  },

  // Room settings
  room: {
    maxPeers: Number(process.env.MEDIASOUP_MAX_PEERS) || 50,
    // Audio level observer for dominant speaker detection
    audioLevelObserver: {
      maxEntries: 1,
      threshold: -80, // dB
      interval: 800, // ms
    },
  },

  // Audio producer defaults
  audioProducer: {
    encodings: [
      {
        scalabilityMode: 'S1T3', // Simulcast: 1 spatial layer, 3 temporal layers
        maxBitrate: 64000, // 64 kbps per layer
        // priority: 1,
        // networkPriority: 'high',
      },
    ],
    codecOptions: {
      opusStereo: 1,
      opusDtx: 1,
      opusFec: 1,
      opusMaxPlaybackRate: 48000,
      opusMaxAverageBitrate: 64000,
    },
  },

  // Audio consumer defaults
  audioConsumer: {
    // No special defaults needed
  },
};