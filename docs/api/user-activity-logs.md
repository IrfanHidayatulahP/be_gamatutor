# User Activity Logs API

## Overview

Activity logging system that records user actions for LLM analysis, analytics, and audit trails. Used as primary data source for monthly evaluations.

## Activity Types

| Type | Description | Metadata Example |
|------|-------------|------------------|
| `CARD_CREATED` | New card created | `{"title": "Math Assignment"}` |
| `CARD_UPDATED` | Card details updated | `{"field": "priority", "old": "low", "new": "high"}` |
| `CARD_MOVED` | Column transition | `{"from": "Planning", "to": "In Progress"}` |
| `CARD_COMPLETED` | Card marked done | `{"cardId": "uuid", "timeSpent": 45}` |
| `CARD_ARCHIVED` | Card archived | `{"cardId": "uuid"}` |
| `CARD_DELETED` | Card deleted | `{"cardId": "uuid"}` |
| `REFLECTION_COMPLETED` | Self-reflection done | `{"rating": 4.5, "grade": 90}` |
| `QUIZ_COMPLETED` | MSLQ quiz submitted | `{"dominantStrategy": "time_management"}` |
| `CHAT_SENT` | Direct message sent | `{"friendId": "uuid"}` |
| `COLLAB_CHAT_SENT` | Collaboration message | `{"collabId": "uuid"}` |
| `FRIEND_REQUEST_SENT` | Friend request sent | `{"friendId": "uuid"}` |
| `FRIEND_ACCEPTED` | Friend request accepted | `{"friendId": "uuid"}` |
| `AVATAR_UNLOCKED` | Avatar component unlocked | `{"componentId": "uuid", "category": "hair"}` |
| `AVATAR_UPDATED` | Avatar customized | `{"hairId": "uuid", "shirtId": "uuid"}` |
| `NOTIFICATION_READ` | Notification read | `{"notifId": "uuid"}` |
| `NOTIFICATION_CLICKED` | Notification clicked | `{"notifId": "uuid"}` |
| `LOGIN` | User login | `{"ip": "192.168.1.1"}` |
| `LOGOUT` | User logout | `{}` |

## Endpoints

### Create Activity Log
```
POST /api/user-activity-logs
```

**Description**: Log a user activity (typically system-generated).

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| activityType | string | Yes | Not empty | Activity type from list above |
| refId | UUID | No | Valid UUID | Reference ID (card, chat, etc.) |
| metadata | object | No | Valid JSON | Additional context |

**Response**: 201 Created
```json
{
  "activityLog": {
    "logId": "uuid",
    "userId": "uuid",
    "activityType": "CARD_MOVED",
    "refId": "uuid",
    "metadata": {
      "from": "Planning",
      "to": "In Progress",
      "cardId": "uuid"
    },
    "createdAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 404: User not found

---

### Get All Activity Logs (Admin)
```
GET /api/user-activity-logs
```

**Description**: List all activity logs with filters (admin only).

**Authentication**: Required (admin role)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | Filter by user |
| activityType | string | Filter by type |
| refId | UUID | Filter by reference |
| limit | integer | Default: 100 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "activityLogs": [
    {
      "logId": "uuid",
      "userId": "uuid",
      "activityType": "CARD_MOVED",
      "refId": "uuid",
      "metadata": { ... },
      "createdAt": "2024-01-10T10:00:00.000Z",
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
- 403: Forbidden (non-admin)

---

### Get Activity Log by ID
```
GET /api/user-activity-logs/:id
```

**Description**: Get a specific activity log.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Log ID |

**Response**: 200 OK
```json
{
  "activityLog": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Activity log not found

---

### Get User's Activity Logs
```
GET /api/user-activity-logs/user/:userId
```

**Description**: Get activity logs for a specific user.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| activityType | string | Filter by type |
| limit | integer | Default: 100 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "activityLogs": [ ... ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Get Logs by Activity Type
```
GET /api/user-activity-logs/type/:activityType
```

**Description**: Get all logs of a specific type across users.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| activityType | string | Yes | Activity type |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| userId | UUID | - | Filter by user |
| limit | integer | 100 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "activityLogs": [ ... ]
}
```

**Errors**:
- 401: Unauthorized

---

### Delete Activity Log (Admin)
```
DELETE /api/user-activity-logs/:id
```

**Description**: Delete an activity log (admin only).

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Log ID |

**Response**: 200 OK
```json
{
  "message": "Activity log deleted"
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)
- 404: Activity log not found

---

## UserActivityLog Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| logId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | FK to users |
| activityType | VARCHAR(50) | No | - | Activity type |
| refId | UUID | Yes | null | Reference object ID |
| metadata | JSONB | Yes | null | Additional context |
| createdAt | TIMESTAMPTZ | No | NOW | Timestamp |

### Relationships
- **User** (M:1) - Actor

---

## Usage in Monthly Evaluation

Activity logs are the primary data source for LLM monthly analysis:

```
Activity Logs (monthly)
        │
        ▼
┌───────────────┐
│ Aggregate &   │
│ Filter        │
└───────────────┘
        │
        ▼
┌───────────────┐     ┌─────────────┐
│ LLM Prompt    │────▶│ LLM Analysis│
│ Template      │     │             │
└───────────────┘     └─────────────┘
        │
        ▼
┌───────────────┐
│ Monthly       │
│ Evaluation    │
└───────────────┘
```

---

## Example Usage

```bash
# System: Log card movement
curl -X POST http://localhost:3000/api/user-activity-logs \
  -H "Authorization: Bearer <system-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-uuid>",
    "activityType": "CARD_MOVED",
    "refId": "<card-uuid>",
    "metadata": {"from": "Planning", "to": "In Progress", "ccmId": "<movement-uuid>"}
  }'

# Get user's recent activity
curl -X GET "http://localhost:3000/api/user-activity-logs/user/me?limit=50" \
  -H "Authorization: Bearer <token>"

# Get all CARD_COMPLETED logs for analytics
curl -X GET "http://localhost:3000/api/user-activity-logs/type/CARD_COMPLETED?limit=100" \
  -H "Authorization: Bearer <admin-token>"

# Admin: Get user activity for evaluation
curl -X GET "http://localhost:3000/api/user-activity-logs/user/<userId>?activityType=REFLECTION_COMPLETED" \
  -H "Authorization: Bearer <admin-token>"
```