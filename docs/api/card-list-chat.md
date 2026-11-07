# Card List Chat API

## Overview

Real-time chat for card collaborators. Messages are scoped to a specific collaboration.

## Endpoints

### Send Message
```
POST /api/card-list-chat/collab/:collabId
```

**Description**: Send a message in a collaboration chat.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| collabId | UUID | Yes | Collaboration ID |

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| message | string | Yes | Not empty | Message content |

**Response**: 201 Created
```json
{
  "message": {
    "chatColabId": "uuid",
    "collabId": "uuid",
    "userId": "uuid",
    "message": "Let's work on this together!",
    "sentAt": "2024-01-10T10:30:00.000Z"
  }
}
```

**Authorization**: User must be a collaborator on the card.

**Errors**:
- 400: Validation error / Not a collaborator
- 401: Unauthorized
- 404: Collaboration not found

---

### Get All Messages
```
GET /api/card-list-chat
```

**Description**: Get all collaboration messages with filters.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| collabId | UUID | Filter by collaboration |
| userId | UUID | Filter by user |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "messages": [
    {
      "chatColabId": "uuid",
      "collabId": "uuid",
      "userId": "uuid",
      "message": "Let's work on this together!",
      "sentAt": "2024-01-10T10:30:00.000Z",
      "collab": { ... },
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

### Get Message by ID
```
GET /api/card-list-chat/:id
```

**Description**: Get a specific message.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Message ID |

**Response**: 200 OK
```json
{
  "message": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Message not found

---

### Get Messages by Collaboration
```
GET /api/card-list-chat/collab/:collabId
```

**Description**: Get all messages for a collaboration (chronological).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| collabId | UUID | Yes | Collaboration ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "messages": [
    {
      "chatColabId": "uuid",
      "collabId": "uuid",
      "userId": "uuid",
      "message": "Hi team!",
      "sentAt": "2024-01-10T10:00:00.000Z",
      "user": { ... }
    },
    {
      "chatColabId": "uuid",
      "collabId": "uuid",
      "userId": "uuid",
      "message": "Let's start with the outline",
      "sentAt": "2024-01-10T10:05:00.000Z",
      "user": { ... }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: Collaboration not found

---

### Update Message
```
PUT /api/card-list-chat/:id
```

**Description**: Edit a message.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Message ID |

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | Updated message |

**Response**: 200 OK
```json
{
  "message": { ... updated ... }
}
```

**Authorization**: Users can only edit their own messages.

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (not own message)
- 404: Message not found

---

### Delete Message
```
DELETE /api/card-list-chat/:id
```

**Description**: Delete a message.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Message ID |

**Response**: 200 OK
```json
{
  "message": "Message deleted"
}
```

**Authorization**: Users can only delete their own messages.

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Message not found

---

## CardListChat Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| chatColabId | UUID | No | UUIDv4 | Primary key |
| collabId | UUID | No | - | FK to card_list_collab |
| userId | UUID | No | - | FK to users (sender) |
| message | TEXT | No | - | Message content |
| sentAt | TIMESTAMPTZ | No | NOW | Send timestamp |

### Relationships
- **CardListCollab** (M:1) - Parent collaboration
- **User** (M:1) - Message sender

---

## Collaboration Chat Flow

```
Collaborator A                    Collaborator B
    │                                  │
    ├──── Send Message (POST) ───────▶│
    │                                  │
    │◀─── Receive (GET /collab) ───────┤
    │                                  │
    ├──── Update Message ────────────▶│ (if edit)
    │                                  │
    ├──── Delete Message ────────────▶│ (if delete)
```

---

## Example Usage

```bash
# Send message to collaboration
curl -X POST http://localhost:3000/api/card-list-chat/collab/<collabId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hey, let me share my notes on this topic"}'

# Get collaboration chat history
curl -X GET "http://localhost:3000/api/card-list-chat/collab/<collabId>?limit=50" \
  -H "Authorization: Bearer <token>"

# Edit message
curl -X PUT http://localhost:3000/api/card-list-chat/<messageId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Updated message"}'

# Delete message
curl -X DELETE http://localhost:3000/api/card-list-chat/<messageId> \
  -H "Authorization: Bearer <token>"
```