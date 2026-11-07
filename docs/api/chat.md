# Chat API (Direct Messaging)

## Overview

Direct messaging between users. Requires friendship (accepted) for messaging.

## Endpoints

### Send Message
```
POST /api/chat
```

**Description**: Send a direct message to a friend.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| messageChat | string | Yes | Not empty | Message content |

**Note**: The recipient is determined by the authenticated user's friendships. Currently the API expects the message to be sent to a friend, but the service creates a chat with the authenticated user as sender. The friendId should be included in the request or derived from context.

**Response**: 201 Created
```json
{
  "chat": {
    "chatId": "uuid",
    "userId": "uuid",
    "friendId": "uuid",
    "messageChat": "Hello!",
    "status": "delivered",
    "timeChat": "2024-01-10T10:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized

---

### Get All Chats
```
GET /api/chat
```

**Description**: Get all messages (sent and received) for authenticated user.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| userId | UUID | - | Filter by user (admin) |
| limit | integer | 50 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "chats": [
    {
      "chatId": "uuid",
      "userId": "uuid",
      "friendId": "uuid",
      "messageChat": "Hello!",
      "status": "delivered",
      "timeChat": "2024-01-10T10:00:00.000Z",
      "user": {
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

---

### Get Chat by ID
```
GET /api/chat/:id
```

**Description**: Get a specific message.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Chat message ID |

**Response**: 200 OK
```json
{
  "chat": {
    "chatId": "uuid",
    "userId": "uuid",
    "friendId": "uuid",
    "messageChat": "Hello!",
    "status": "delivered",
    "timeChat": "2024-01-10T10:00:00.000Z",
    "user": { ... }
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Chat not found

---

### Get Chats by User
```
GET /api/chat/user/:userId
```

**Description**: Get messages with a specific user.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | Target user ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "chats": [
    {
      "chatId": "uuid",
      "userId": "uuid",
      "friendId": "uuid",
      "messageChat": "Hello!",
      "status": "delivered",
      "timeChat": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Update Message
```
PUT /api/chat/:id
```

**Description**: Update a message (edit).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Chat message ID |

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messageChat | string | Yes | Updated message |

**Response**: 200 OK
```json
{
  "chat": { ... updated ... }
}
```

**Authorization**: Users can only update their own messages.

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (not own message)
- 404: Chat not found

---

### Delete Message
```
DELETE /api/chat/:id
```

**Description**: Delete a message.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Chat message ID |

**Response**: 200 OK
```json
{
  "message": "Chat deleted"
}
```

**Authorization**: Users can only delete their own messages.

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Chat not found

---

## Chat Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| chatId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | Sender FK to users |
| friendId | UUID | No | - | Recipient FK to users |
| messageChat | TEXT | No | - | Message content |
| status | VARCHAR(10) | No | delivered | delivered/read |
| timeChat | TIMESTAMPTZ | No | NOW | Message timestamp |

### Relationships
- **User** (M:1) - Sender
- **User** (M:1) - Recipient (friendId)

---

## Message Status

| Status | Description |
|--------|-------------|
| `delivered` | Message sent to recipient |
| `read` | Message read by recipient |

---

## Example Usage

```bash
# Send message
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"messageChat": "Hey, how are you?"}'

# Get conversation with user
curl -X GET "http://localhost:3000/api/chat/user/<friendId>?limit=50" \
  -H "Authorization: Bearer <token>"

# Get all messages
curl -X GET "http://localhost:3000/api/chat?limit=20" \
  -H "Authorization: Bearer <token>"

# Update message
curl -X PUT http://localhost:3000/api/chat/<chatId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"messageChat": "Updated message"}'
```