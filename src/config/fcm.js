const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');

let messaging = null;

const initializeFCM = () => {
  try {
    const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      console.warn('FCM_SERVICE_ACCOUNT_PATH not set. FCM push notifications disabled.');
      return null;
    }

    const fullPath = path.resolve(serviceAccountPath);
    const serviceAccount = require(fullPath);

    // Check if service account has valid credentials (not placeholders)
    if (!serviceAccount.private_key || serviceAccount.private_key.includes('YOUR_PRIVATE_KEY') ||
        !serviceAccount.client_email || serviceAccount.client_email.includes('your-project-id')) {
      console.warn('FCM service account has placeholder values. FCM push notifications disabled.');
      return null;
    }

    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });

    messaging = getMessaging();
    console.log('FCM initialized successfully');
    return messaging;
  } catch (error) {
    console.error('FCM initialization failed:', error.message);
    return null;
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!messaging) {
    console.warn('FCM not initialized, skipping push notification');
    return { success: false, reason: 'FCM not initialized' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await messaging.send(message);
    console.log('FCM push sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('FCM send error:', error.message);

    // Check if token is invalid/unregistered
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      return { success: false, reason: 'invalid_token', error: error.message };
    }

    return { success: false, reason: 'send_failed', error: error.message };
  }
};

const sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
  if (!messaging || !fcmTokens.length) {
    return { successCount: 0, failureCount: 0 };
  }

  try {
    const message = {
      tokens: fcmTokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      )
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log('FCM multicast sent:', response.successCount, 'success,', response.failureCount, 'failed');

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    console.error('FCM multicast error:', error.message);
    return { successCount: 0, failureCount: fcmTokens.length, error: error.message };
  }
};

module.exports = {
  initializeFCM,
  sendPushNotification,
  sendMulticastNotification,
  getMessaging: () => messaging
};