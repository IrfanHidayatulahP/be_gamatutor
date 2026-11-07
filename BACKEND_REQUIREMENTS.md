# Backend Requirements for Collaboration Features (Current Sprint)

**Date:** 2026-10-31  
**Focus:** Friend requests, Notifications, FCM Push, Team Friends

---

## 1. FCM Token Endpoints (Critical for Push Notifications)

**File:** `src/routes/userRoutes.js`
```javascript
// Add to existing router (after router.use(authenticate))
router.post('/fcm-token', registerFcmToken);
router.delete('/fcm-token', unregisterFcmToken);
```

**File:** `src/controllers/userController.js`
```javascript
const { registerFcmTokenService, unregisterFcmTokenService } = require('../services/userService');

const registerFcmToken = async (req, res, next) => {
  try {
    const { fcmToken, platform } = req.body; // platform: 'android' | 'ios' | 'web'
    const userId = req.user.userId;
    await registerFcmTokenService(userId, fcmToken, platform);
    res.status(201).json({ message: 'FCM token registered' });
  } catch (error) {
    next(error);
  }
};

const unregisterFcmToken = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await unregisterFcmTokenService(userId);
    res.json({ message: 'FCM token unregistered' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // ... existing exports
  registerFcmToken,
  unregisterFcmToken,
};
```

**File:** `src/services/userService.js`
```javascript
const registerFcmTokenService = async (userId, fcmToken, platform) => {
  await User.update(
    { fcmToken, fcmPlatform: platform },
    { where: { userId } }
  );
};

const unregisterFcmTokenService = async (userId) => {
  await User.update(
    { fcmToken: null, fcmPlatform: null },
    { where: { userId } }
  );
};

module.exports = {
  // ... existing exports
  registerFcmTokenService,
  unregisterFcmTokenService,
};
```

**File:** `src/models/User.js` - Ensure these fields exist:
```javascript
fcmToken: {
  type: DataTypes.STRING,
  allowNull: true,
},
fcmPlatform: {
  type: DataTypes.ENUM('android', 'ios', 'web'),
  allowNull: true,
},
```

---

## 2. Notification Creation in Friendship Service

**File:** `src/services/friendshipService.js` (or wherever friendship logic lives)

### sendFriendRequest - Add notification for recipient
```javascript
const sendFriendRequest = async (userId, friendId) => {
  // ... existing logic to create friendship ...
  
  // Get requester info for notification
  const requester = await User.findByPk(userId, { attributes: ['firstName', 'lastName', 'userId'] });
  
  // Create notification for recipient
  await Notification.create({
    userId: friendId,
    type: 'push',
    title: 'New Friend Request',
    message: `${requester.firstName} ${requester.lastName} sent you a friend request`,
    triggerAction: 'friend_request_received',
    triggerUserId: userId,
  });
  
  // Emit WebSocket for real-time
  // Assuming you have a way to emit to specific user
  wsManager.emitToUser(friendId, 'notificationReceived', {
    event: 'notificationReceived',
    data: {
      type: 'friend_request_received',
      message: 'New friend request',
      triggerUserId: userId,
    }
  });
  
  return friendship;
};
```

### acceptFriendRequest - Add notification for requester
```javascript
const acceptFriendRequest = async (fsId, userId) => {
  // ... existing logic ...
  
  // Get friend info for notification
  const friendship = await Friendship.findByPk(fsId, { include: ['requester', 'friend'] });
  
  // Create notification for original requester
  await Notification.create({
    userId: friendship.userId, // original requester
    type: 'push',
    title: 'Friend Request Accepted',
    message: `${friendship.friend.firstName} ${friendship.friend.lastName} accepted your friend request`,
    triggerAction: 'friend_request_accepted',
    triggerUserId: friendship.friendId,
  });
  
  wsManager.emitToUser(friendship.userId, 'notificationReceived', {
    event: 'notificationReceived',
    data: {
      type: 'friend_request_accepted',
      message: 'Friend request accepted',
      triggerUserId: friendship.friendId,
    }
  });
  
  return friendship;
};
```

### rejectFriendRequest - Add notification for requester
```javascript
const rejectFriendRequest = async (fsId, userId) => {
  // ... existing logic ...
  
  const friendship = await Friendship.findByPk(fsId, { include: ['requester', 'friend'] });
  
  await Notification.create({
    userId: friendship.userId,
    type: 'push',
    title: 'Friend Request Declined',
    message: `${friendship.friend.firstName} ${friendship.friend.lastName} declined your friend request`,
    triggerAction: 'friend_request_rejected',
    triggerUserId: friendship.friendId,
  });
  
  wsManager.emitToUser(friendship.userId, 'notificationReceived', {
    event: 'notificationReceived',
    data: {
      type: 'friend_request_rejected',
      message: 'Friend request declined',
      triggerUserId: friendship.friendId,
    }
  });
  
  return friendship;
};
```

---

## 3. Notification Creation in CardListCollab Service

**File:** `src/services/cardListCollabService.js`

### addCollaborator - Add notification for invited user
```javascript
const addCollaborator = async (cardId, userId, inviterId, role = 'member') => {
  // ... existing logic ...
  
  const inviter = await User.findByPk(inviterId, { attributes: ['firstName', 'lastName', 'userId'] });
  const card = await Card.findByPk(cardId, { attributes: ['title', 'cardId'] });
  
  await Notification.create({
    userId: userId,
    type: 'push',
    title: 'Collaboration Invitation',
    message: `${inviter.firstName} ${inviter.lastName} invited you to collaborate on "${card.title}"`,
    triggerAction: 'collaboration_invite',
    triggerUserId: inviterId,
    collabId: collaboration.id, // if collaboration record has ID
  });
  
  wsManager.emitToUser(userId, 'notificationReceived', {
    event: 'notificationReceived',
    data: {
      type: 'collaboration_invite',
      message: 'New collaboration invite',
      triggerUserId: inviterId,
      collabId: collaboration.id,
    }
  });
  
  return collaboration;
};
```

---

## 4. Team Friends Endpoint (For "Dalam Tim" Tab)

**File:** `src/routes/friendshipRoutes.js`
```javascript
router.get('/user/:userId/team-friends', getTeamFriends);
```

**File:** `src/controllers/friendshipController.js`
```javascript
const { getTeamFriendsService } = require('../services/friendshipService');

const getTeamFriends = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const result = await getTeamFriendsService(userId, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    next(error);
  }
};
```

**File:** `src/services/friendshipService.js`
```javascript
const getTeamFriendsService = async (userId, limit = 50, offset = 0) => {
  // Find friends who share at least one card_list_collab
  const query = `
    SELECT 
      f."fsId" as "fsId",
      f."userId" as "userId",
      f."friendId" as "friendId",
      f.status,
      f."createdAt" as "createdAt",
      f."updatedAt" as "updatedAt",
      u."userId" as "friend.userId",
      u."firstName" as "friend.firstName",
      u."lastName" as "friend.lastName",
      u.username as "friend.username",
      u.email as "friend.email"
    FROM friendships f
    JOIN users u ON (f."userId" = u."userId" OR f."friendId" = u."userId")
    JOIN card_list_collabs clc1 ON clc1."userId" = :userId
    JOIN card_list_collabs clc2 ON clc2."cardId" = clc1."cardId" AND clc2."userId" = u."userId"
    WHERE (f."userId" = :userId OR f."friendId" = :userId)
      AND f.status = 'accepted'
      AND u."userId" != :userId
    GROUP BY f."fsId", u."userId"
    ORDER BY f."createdAt" DESC
    LIMIT :limit OFFSET :offset
  `;
  
  const friendships = await sequelize.query(query, {
    replacements: { userId, limit, offset },
    type: QueryTypes.SELECT
  });
  
  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT u."userId") as total
    FROM friendships f
    JOIN users u ON (f."userId" = u."userId" OR f."friendId" = u."userId")
    JOIN card_list_collabs clc1 ON clc1."userId" = :userId
    JOIN card_list_collabs clc2 ON clc2."cardId" = clc1."cardId" AND clc2."userId" = u."userId"
    WHERE (f."userId" = :userId OR f."friendId" = :userId)
      AND f.status = 'accepted'
      AND u."userId" != :userId
  `;
  
  const [{ total }] = await sequelize.query(countQuery, {
    replacements: { userId },
    type: QueryTypes.SELECT
  });
  
  return { friendships, total };
};
```

---

## 5. WebSocket Event Emission

Frontend expects these exact event names (from `lib/core/utils/constants.dart`):

```javascript
// In your WebSocket manager, emit to specific user:
wsManager.emitToUser(userId, 'notificationReceived', {
  event: 'notificationReceived',  // or 'friend_request_received' for friendship events
  data: { ... }
});

// Friendship-specific events (for real-time friend list updates):
wsManager.emitToUser(userId, 'friend_request_received', { ... });
wsManager.emitToUser(userId, 'friend_request_accepted', { ... });
wsManager.emitToUser(userId, 'friend_request_rejected', { ... });
wsManager.emitToUser(userId, 'friend_blocked', { ... });
wsManager.emitToUser(userId, 'friend_unblocked', { ... });
wsManager.emitToUser(userId, 'friend_removed', { ... });
wsManager.emitToUser(userId, 'friend_status_changed', { ... });
```

---

## 6. Verify Notification Endpoints Exist

Per API-DOCUMENTATION.md, these should work:
- `GET /notifications?type=push&read=false&delivered=true&limit=50&offset=0`
- `PUT /notifications/:notifId/read`
- `PUT /notifications/:notifId/click`
- `PUT /notifications/read-all`
- `DELETE /notifications/:notifId`

**Response format** must match frontend `NotificationModel`:
```json
{
  "notifId": "uuid",
  "userId": "uuid",
  "type": "push",
  "title": "string",
  "message": "string",
  "sentAt": "ISO8601",
  "delivered": true,
  "read": false,
  "triggerAction": "friend_request_received",
  "triggerUserId": "uuid",
  "collabId": "uuid",
  "groupCallId": "uuid",
  "createdAt": "ISO8601"
}
```

---

## 7. Testing Checklist

After implementation:

1. **FCM Token Registration**
   - [ ] Login on mobile → `POST /users/fcm-token` called with token + platform
   - [ ] Logout → `DELETE /users/fcm-token` called
   - [ ] Token stored in User table

2. **Friend Request Flow**
   - [ ] User A sends request to User B
   - [ ] Notification created for User B (`friend_request_received`)
   - [ ] WebSocket `notificationReceived` emitted to User B
   - [ ] User B accepts → Notification for User A (`friend_request_accepted`)
   - [ ] WebSocket `friend_request_accepted` emitted to User A
   - [ ] Friend lists update in real-time

3. **Collaboration Invite**
   - [ ] User A invites User B to card
   - [ ] Notification created for User B (`collaboration_invite`)
   - [ ] WebSocket `notificationReceived` emitted

4. **Team Friends**
   - [ ] User A and User B are friends + share card collab
   - [ ] `GET /friendships/user/:userId/team-friends` returns User B
   - [ ] Frontend "Dalam Tim" tab loads data

5. **Push Notifications**
   - [ ] App in background → push notification received on device
   - [ ] Tap push → deep links to correct screen