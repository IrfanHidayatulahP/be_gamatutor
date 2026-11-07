# Notifications API

## Overview

The notification system supports multiple notification types for user engagement, reminders, social interactions, and encouragement.

## Notification Types

| Type | Description | Use Case |
|------|-------------|----------|
| `push` | Standard push notification | General alerts |
| `smart_reminder` | Intelligent deadline/activity reminders | Deadline approaching, inactivity |
| `social_presence` | Friend activity notifications | Friend online, new message |
| `encouragement` | Motivational messages | Streak milestones, achievements |

## Endpoints

### Create Notification
```
POST /api/notifications
```

**Description**: Create a new notification (typically system-generated).

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| userId | UUID | Yes | Valid UUID | Target user |
| type | string | Yes | push/smart_reminder/social_presence/encouragement | Notification type |
| title | string | No | Max 255 chars | Notification title |
| message | string | Yes | Not empty | Notification message |
| sentAt | string | No | ISO 8601 | Send timestamp |
| delivered | boolean | No | - | Delivery status (default: false) |
| deliveryError | string | No | - | Error if delivery failed |
| scheduledFor | string | No | ISO 8601 | Future schedule time |
| reminderReason | string | No | - | Reason for reminder |
| triggerAction | string | No | - | Action that triggered notification |
| triggerUserId | UUID | No | Valid UUID | User who triggered |

**Response**: 201 Created
```json
{
  "notification": {
    "notifId": "uuid",
    "userId": "uuid",
    "type": "smart_reminder",
    "title": "Deadline Approaching",
    "message": "Your Calculus assignment is due tomorrow",
    "sentAt": "2024-01-14T10:00:00.000Z",
    "delivered": false,
    "deliveryError": null,
    "scheduledFor": "2024-01-14T10:00:00.000Z",
    "reminderReason": "Deadline in 24 hours",
    "triggerAction": "deadline_check",
    "triggerUserId": null,
    "read": false,
    "clicked": false,
    "createdAt": "2024-01-14T10:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error / User not found
- 401: Unauthorized

---

### Get User Notifications
```
GET /api/notifications
```

**Description**: Get authenticated user's notifications with filters.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by type |
| read | boolean | Filter by read status |
| delivered | boolean | Filter by delivery status |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "notifications": [
    {
      "notifId": "uuid",
      "userId": "uuid",
      "type": "smart_reminder",
      "title": "Deadline Approaching",
      "message": "Your Calculus assignment is due tomorrow",
      "sentAt": "2024-01-14T10:00:00.000Z",
      "delivered": true,
      "deliveryError": null,
      "scheduledFor": "2024-01-14T10:00:00.000Z",
      "reminderReason": "Deadline in 24 hours",
      "triggerAction": "deadline_check",
      "triggerUserId": null,
      "read": false,
      "readAt": null,
      "clicked": false,
      "clickedAt": null,
      "createdAt": "2024-01-14T10:00:00.000Z",
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

### Get Notification by ID
```
GET /api/notifications/:notifId
```

**Description**: Get a specific notification.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notifId | UUID | Yes | Notification ID |

**Response**: 200 OK
```json
{
  "notification": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Notification not found

---

### Mark as Read
```
PUT /api/notifications/:notifId/read
```

**Description**: Mark notification as read.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notifId | UUID | Yes | Notification ID |

**Response**: 200 OK
```json
{
  "notification": {
    "notifId": "uuid",
    "read": true,
    "readAt": "2024-01-14T10:30:00.000Z",
    ...
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Notification not found

---

### Mark as Clicked
```
PUT /api/notifications/:notifId/click
```

**Description**: Mark notification as clicked (tracked for analytics).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notifId | UUID | Yes | Notification ID |

**Response**: 200 OK
```json
{
  "notification": {
    "notifId": "uuid",
    "clicked": true,
    "clickedAt": "2024-01-14T10:30:00.000Z",
    ...
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Notification not found

---

### Mark All as Read
```
PUT /api/notifications/read-all
```

**Description**: Mark all unread notifications as read for current user.

**Authentication**: Required

**Response**: 200 OK
```json
{
  "message": "All notifications marked as read"
}
```

**Errors**:
- 401: Unauthorized

---

### Update Notification
```
PUT /api/notifications/:notifId
```

**Description**: Update notification (admin/system use).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notifId | UUID | Yes | Notification ID |

**Request Body** (all optional):
| Field | Type | Description |
|-------|------|-------------|
| type | string | Notification type |
| title | string | Title |
| message | string | Message |
| sentAt | ISO 8601 | Sent timestamp |
| delivered | boolean | Delivery status |
| deliveryError | string | Error message |
| scheduledFor | ISO 8601 | Schedule time |
| reminderReason | string | Reminder reason |
| triggerAction | string | Trigger action |
| triggerUserId | UUID | Trigger user |

**Response**: 200 OK
```json
{
  "notification": { ... updated ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Notification not found

---

### Delete Notification
```
DELETE /api/notifications/:notifId
```

**Description**: Delete a notification.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notifId | UUID | Yes | Notification ID |

**Response**: 200 OK
```json
{
  "message": "Notification deleted"
}
```

**Errors**:
- 401: Unauthorized
- 404: Notification not found

---

## Notification Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| notifId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | FK to users |
| type | VARCHAR(20) | No | - | push/smart_reminder/social_presence/encouragement |
| title | VARCHAR(255) | Yes | null | Title |
| message | TEXT | No | - | Message content |
| sentAt | TIMESTAMPTZ | Yes | null | Sent timestamp |
| delivered | BOOLEAN | No | false | Delivery status |
| deliveryError | TEXT | Yes | null | Error if failed |
| scheduledFor | TIMESTAMPTZ | Yes | null | Scheduled time |
| reminderReason | TEXT | Yes | null | Reminder context |
| triggerAction | TEXT | Yes | null | Trigger action |
| triggerUserId | UUID | Yes | null | Triggering user FK |
| read | BOOLEAN | No | false | Read status |
| readAt | TIMESTAMPTZ | Yes | null | Read timestamp |
| clicked | BOOLEAN | No | false | Clicked status |
| clickedAt | TIMESTAMPTZ | Yes | null | Click timestamp |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |

### Relationships
- **User** (M:1) - Notification recipient

---

## Smart Reminder Logic

Smart reminders are typically generated by background jobs (node-cron) that check:
- Upcoming deadlines (24h, 1h before)
- Inactive cards (no movement in 3 days)
- Missed deadlines
- Weekly/monthly review prompts

---

## Example Usage

```bash
# Get unread notifications
curl -X GET "http://localhost:3000/api/notifications?read=false&limit=20" \
  -H "Authorization: Bearer <token>"

# Mark as read
curl -X PUT http://localhost:3000/api/notifications/<notifId>/read \
  -H "Authorization: Bearer <token>"

# Mark all as read
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer <token>"

# System: Create reminder (internal)
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer <system-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-uuid>",
    "type": "smart_reminder",
    "title": "Weekly Review",
    "message": "Time for your weekly reflection!",
    "scheduledFor": "2024-01-15T09:00:00.000Z",
    "reminderReason": "weekly_review",
    "triggerAction": "cron_weekly"
  }'
```