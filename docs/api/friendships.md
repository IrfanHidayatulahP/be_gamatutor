# Friendships API

## Overview

Friendship system for social features. Supports friend requests, acceptance, blocking, and friend lists.

## Friendship Statuses

| Status | Description |
|--------|-------------|
| `pending` | Request sent, awaiting response |
| `accepted` | Friends (bidirectional) |
| `blocked` | One user blocked the other |
| `declined` | Request declined (removed) |

## Endpoints

### Send Friend Request
```
POST /api/friendships
```

**Description**: Send a friend request to another user.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| friendId | UUID | Yes | Valid UUID, not self | Target user ID |

**Response**: 201 Created
```json
{
  "friendship": {
    "fsId": "uuid",
    "userId": "uuid",
    "friendId": "uuid",
    "status": "pending",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Errors**:
- 400: Cannot send to self / Request already exists / User not found
- 401: Unauthorized

---

### Get All Friendships
```
GET /api/friendships
```

**Description**: Get all friendships with filters (admin or own).

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (pending/accepted/blocked) |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "friendships": [
    {
      "fsId": "uuid",
      "userId": "uuid",
      "friendId": "uuid",
      "status": "accepted",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z",
      "requester": {
        "userId": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe"
      },
      "friend": {
        "userId": "uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "username": "janesmith"
      }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized

---

### Get Friendship by ID
```
GET /api/friendships/:fsId
```

**Description**: Get a specific friendship.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fsId | UUID | Yes | Friendship ID |

**Response**: 200 OK
```json
{
  "friendship": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Friendship not found

---

### Get User's Friends
```
GET /api/friendships/user/:userId/friends
```

**Description**: Get accepted friends for a user.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "friendships": [
    {
      "fsId": "uuid",
      "userId": "uuid",
      "friendId": "uuid",
      "status": "accepted",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z",
      "requester": { ... },
      "friend": { ... }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Get Pending Requests
```
GET /api/friendships/user/:userId/pending
```

**Description**: Get pending friend requests for a user (received).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "friendships": [
    {
      "fsId": "uuid",
      "userId": "uuid",
      "friendId": "uuid",
      "status": "pending",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z",
      "requester": {
        "userId": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe"
      }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Accept Friend Request
```
PUT /api/friendships/:fsId/accept
```

**Description**: Accept a pending friend request.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fsId | UUID | Yes | Friendship ID |

**Response**: 200 OK
```json
{
  "friendship": {
    "fsId": "uuid",
    "userId": "uuid",
    "friendId": "uuid",
    "status": "accepted",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  }
}
```

**Authorization**: Only the recipient (friendId) can accept.

**Errors**:
- 400: Not authorized / Not pending
- 401: Unauthorized
- 404: Friendship not found

---

### Block User
```
PUT /api/friendships/:fsId/block
```

**Description**: Block a user (from either side of friendship).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fsId | UUID | Yes | Friendship ID |

**Response**: 200 OK
```json
{
  "friendship": {
    "fsId": "uuid",
    "userId": "uuid",
    "friendId": "uuid",
    "status": "blocked",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  }
}
```

**Authorization**: Either user in the friendship can block.

**Errors**:
- 400: Not authorized
- 401: Unauthorized
- 404: Friendship not found

---

### Reject Friend Request
```
PUT /api/friendships/:fsId/reject
```

**Description**: Reject (delete) a pending friend request.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fsId | UUID | Yes | Friendship ID |

**Response**: 200 OK
```json
{
  "message": "Friend request rejected"
}
```

**Authorization**: Only the recipient (friendId) can reject.

**Side Effects**: Deletes the friendship record.

**Errors**:
- 400: Not authorized / Not pending
- 401: Unauthorized
- 404: Friendship not found

---

### Remove Friendship
```
DELETE /api/friendships/:fsId
```

**Description**: Remove friendship (unfriend) or delete pending request.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fsId | UUID | Yes | Friendship ID |

**Response**: 200 OK
```json
{
  "message": "Friendship removed"
}
```

**Authorization**: Either user in the friendship can remove.

**Errors**:
- 400: Not authorized
- 401: Unauthorized
- 404: Friendship not found

---

## Friendship Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| fsId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | Requester FK to users |
| friendId | UUID | No | - | Recipient FK to users |
| status | VARCHAR(20) | No | pending | pending/accepted/blocked |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |
| updatedAt | TIMESTAMPTZ | No | NOW | Last update timestamp |

### Constraints
- Unique: (userId, friendId) - No duplicate requests
- Check: userId != friendId - No self-friendship

### Relationships
- **User** (M:1) - Requester
- **User** (M:1) - Friend/Recipient

---

## Social Features Integration

Friendships enable:
- **Direct Messaging** - Chat between friends
- **Social Presence** - Online/offline status
- **Collaboration** - Invite friends to cards
- **Notifications** - Social presence alerts
- **Leaderboards** - Friend comparisons (future)

---

## Example Usage

```bash
# Send friend request
curl -X POST http://localhost:3000/api/friendships \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"friendId": "<target-user-uuid>"}'

# Get my friends
curl -X GET "http://localhost:3000/api/friendships/user/me/friends" \
  -H "Authorization: Bearer <token>"

# Get pending requests
curl -X GET "http://localhost:3000/api/friendships/user/me/pending" \
  -H "Authorization: Bearer <token>"

# Accept request
curl -X PUT http://localhost:3000/api/friendships/<fsId>/accept \
  -H "Authorization: Bearer <token>"

# Block user
curl -X PUT http://localhost:3000/api/friendships/<fsId>/block \
  -H "Authorization: Bearer <token>"

# Unfriend
curl -X DELETE http://localhost:3000/api/friendships/<fsId> \
  -H "Authorization: Bearer <token>"
```