# Card List Collaboration API

## Overview

Card collaboration allows users to share cards with other users for collaborative learning. Supports owner/member roles with chat functionality.

## Endpoints

### Add Collaborator
```
POST /api/card-list-collab/card/:cardId
```

**Description**: Invite a user to collaborate on a card.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Card ID to share |

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| userId | UUID | Yes | Valid UUID | User to invite |
| role | string | No | owner/member | Role (default: member) |

**Response**: 201 Created
```json
{
  "collaboration": {
    "collabId": "uuid",
    "cardId": "uuid",
    "userId": "uuid",
    "role": "member",
    "addedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error / User already collaborator / Card not found
- 401: Unauthorized
- 404: Card or User not found

---

### Get All Collaborations
```
GET /api/card-list-collab
```

**Description**: List collaborations with filters.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| cardId | UUID | Filter by card |
| userId | UUID | Filter by user |
| role | string | Filter by role (owner/member) |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "collaborations": [
    {
      "collabId": "uuid",
      "cardId": "uuid",
      "userId": "uuid",
      "role": "member",
      "addedAt": "2024-01-10T10:00:00.000Z",
      "cardList": {
        "cardId": "uuid",
        "card": {
          "cardId": "uuid",
          "title": "Shared Card"
        }
      },
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

### Get Collaboration by ID
```
GET /api/card-list-collab/:id
```

**Description**: Get a specific collaboration.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Collaboration ID |

**Response**: 200 OK
```json
{
  "collaboration": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Collaboration not found

---

### Get Collaborations by Card
```
GET /api/card-list-collab/card/:cardId
```

**Description**: Get all collaborators for a card.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Card ID |

**Response**: 200 OK
```json
{
  "collaborations": [
    {
      "collabId": "uuid",
      "cardId": "uuid",
      "userId": "uuid",
      "role": "owner",
      "addedAt": "2024-01-10T10:00:00.000Z",
      "user": {
        "userId": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe"
      }
    },
    {
      "collabId": "uuid",
      "cardId": "uuid",
      "userId": "uuid",
      "role": "member",
      "addedAt": "2024-01-10T10:30:00.000Z",
      "user": { ... }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: Card not found

---

### Get User's Collaborations
```
GET /api/card-list-collab/user/:userId
```

**Description**: Get all cards a user collaborates on.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Response**: 200 OK
```json
{
  "collaborations": [
    {
      "collabId": "uuid",
      "cardId": "uuid",
      "userId": "uuid",
      "role": "member",
      "addedAt": "2024-01-10T10:00:00.000Z",
      "cardList": {
        "cardId": "uuid",
        "card": {
          "cardId": "uuid",
          "title": "Collaborative Project"
        }
      }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Update Collaborator Role
```
PUT /api/card-list-collab/:id/role
```

**Description**: Change collaborator role (owner/member).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Collaboration ID |

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| role | string | Yes | owner/member | New role |

**Response**: 200 OK
```json
{
  "collaboration": {
    "collabId": "uuid",
    "cardId": "uuid",
    "userId": "uuid",
    "role": "owner",
    "addedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Authorization**: Only card owner can change roles.

**Errors**:
- 400: Validation error / Not authorized
- 401: Unauthorized
- 404: Collaboration not found

---

### Remove Collaborator
```
DELETE /api/card-list-collab/:id
```

**Description**: Remove a collaborator from a card.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Collaboration ID |

**Response**: 200 OK
```json
{
  "message": "Collaborator removed"
}
```

**Authorization**: Owner can remove anyone; members can remove themselves.

**Errors**:
- 400: Not authorized
- 401: Unauthorized
- 404: Collaboration not found

---

## CardListCollab Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| collabId | UUID | No | UUIDv4 | Primary key |
| cardId | UUID | No | - | FK to card_list |
| userId | UUID | No | - | FK to users |
| role | VARCHAR(10) | Yes | member | owner/member |
| addedAt | TIMESTAMPTZ | No | NOW | Invitation timestamp |

### Constraints
- Unique: (cardId, userId) - One collaboration per user per card

### Relationships
- **CardList** (M:1) - Shared card
- **User** (M:1) - Collaborator
- **CardListChat** (1:M) - Collaboration messages

---

## Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full access: edit card, manage collaborators, delete card, chat |
| `member` | View card, chat, suggest edits (cannot delete or manage collaborators) |

---

## Collaboration Flow

```
Card Owner                          Collaborator
    │                                    │
    ├──── Send Invitation (POST) ──────▶│
    │                                    │
    │◀─── Accept (automatic) ───────────┤
    │                                    │
    ├──── Chat (CardListChat) ─────────▶│
    │◀─── Chat ─────────────────────────┤
    │                                    │
    ├──── Update Role ────────────────▶│ (if needed)
    │                                    │
    ├──── Remove ──────────────────────▶│ (if needed)
```

---

## Example Usage

```bash
# Invite collaborator
curl -X POST http://localhost:3000/api/card-list-collab/card/<cardId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<target-user-uuid>", "role": "member"}'

# Get card collaborators
curl -X GET "http://localhost:3000/api/card-list-collab/card/<cardId>" \
  -H "Authorization: Bearer <token>"

# Get my collaborations
curl -X GET "http://localhost:3000/api/card-list-collab/user/me" \
  -H "Authorization: Bearer <token>"

# Change role to owner
curl -X PUT http://localhost:3000/api/card-list-collab/<collabId>/role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "owner"}'

# Remove collaborator
curl -X DELETE http://localhost:3000/api/card-list-collab/<collabId> \
  -H "Authorization: Bearer <token>"
```