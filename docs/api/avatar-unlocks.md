# Avatar Unlocks API

## Overview

Gamification system for unlocking avatar components through achievements, quiz results, and activity milestones.

## Unlock Triggers

| Trigger | Description | Example |
|---------|-------------|---------|
| Quiz Completion | Unlock features from MSLQ result | Time Management → unlock scheduling components |
| Card Completion | Complete cards with reflection | 10 reflections → unlock special component |
| Streak Milestone | Consecutive active days | 7-day streak → unlock hair |
| Social Milestone | Friend/collaboration count | 5 friends → unlock face |
| Admin Grant | Manual unlock by admin | Special event rewards |

## Endpoints

### Unlock Component
```
POST /api/avatar-unlocks
```

**Description**: Unlock an avatar component for the authenticated user.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| componentId | UUID | Yes | Valid UUID, exists | Component to unlock |

**Response**: 201 Created
```json
{
  "unlock": {
    "avaUnId": "uuid",
    "userId": "uuid",
    "componentId": "uuid",
    "unlockedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Validation**:
- Component must exist
- User must not already have it unlocked

**Errors**:
- 400: Validation error / Already unlocked / Component not found
- 401: Unauthorized
- 404: User or Component not found

---

### Get All Unlocks
```
GET /api/avatar-unlocks
```

**Description**: List unlock records with filters.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | Filter by user (admin) |
| componentId | UUID | Filter by component |
| limit | integer | Default: 100 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "unlocks": [
    {
      "avaUnId": "uuid",
      "userId": "uuid",
      "componentId": "uuid",
      "unlockedAt": "2024-01-10T10:00:00.000Z",
      "user": { ... },
      "component": {
        "avaId": "uuid",
        "category": "hair",
        "name": "Long Blue Hair",
        "assetPath": "/assets/avatar/hair/long_blue.png"
      }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized

---

### Get Unlock by ID
```
GET /api/avatar-unlocks/:id
```

**Description**: Get a specific unlock record.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Unlock record ID |

**Response**: 200 OK
```json
{
  "unlock": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Unlock not found

---

### Get User's Unlocks
```
GET /api/avatar-unlocks/user/:userId
```

**Description**: Get all unlocked components for a user.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Response**: 200 OK
```json
{
  "unlocks": [
    {
      "avaUnId": "uuid",
      "userId": "uuid",
      "componentId": "uuid",
      "unlockedAt": "2024-01-10T10:00:00.000Z",
      "component": { ... }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Get Unlocks by Component
```
GET /api/avatar-unlocks/component/:componentId
```

**Description**: Get all users who have unlocked a component.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| componentId | UUID | Yes | Component ID |

**Response**: 200 OK
```json
{
  "unlocks": [
    {
      "avaUnId": "uuid",
      "userId": "uuid",
      "componentId": "uuid",
      "unlockedAt": "2024-01-10T10:00:00.000Z",
      "user": { ... }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: Component not found

---

### Check If Unlocked
```
GET /api/avatar-unlocks/check/:componentId
```

**Description**: Check if authenticated user has unlocked a specific component.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| componentId | UUID | Yes | Component ID |

**Response**: 200 OK
```json
{
  "unlocked": true
}
```

**Errors**:
- 401: Unauthorized
- 404: Component not found

---

### Delete Unlock Record (Admin)
```
DELETE /api/avatar-unlocks/:id
```

**Description**: Delete an unlock record (admin only, e.g., for moderation).

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Unlock record ID |

**Response**: 200 OK
```json
{
  "message": "Unlock record deleted"
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Unlock not found

---

## AvatarUnlock Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| avaUnId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | FK to users |
| componentId | UUID | No | - | FK to avatar_components |
| unlockedAt | TIMESTAMPTZ | No | NOW | Unlock timestamp |

### Constraints
- Unique: (userId, componentId) - One unlock per user per component

### Relationships
- **User** (M:1) - Unlock owner
- **AvatarComponent** (M:1) - Unlocked component

---

## Automatic Unlock Logic

### From Quiz Results
When user submits quiz result with `unlockedFeatures`:
```javascript
// Map features to component categories
const featureToCategory = {
  'time_management': 'special',  // Scheduling tools
  'organization': 'shirt',       // Structured look
  'elaboration': 'face',         // Thoughtful expression
  'help_seeking': 'hair',        // Open appearance
  'metacognitive_self_regulation': 'head', // Planning headwear
  'rehearsal': 'pants',          // Practice gear
  'critical_thinking': 'special' // Analysis aura
};

// Unlock one component per category for each feature
```

### From Achievements
```javascript
// Milestone-based unlocks
const milestones = [
  { condition: 'reflections_completed >= 5', reward: 'hair' },
  { condition: 'cards_completed >= 10', reward: 'shirt' },
  { condition: 'streak_days >= 7', reward: 'face' },
  { condition: 'friends_count >= 5', reward: 'special' },
  { condition: 'collaborations >= 3', reward: 'head' }
];
```

---

## Example Usage

```bash
# Unlock component (system-triggered)
curl -X POST http://localhost:3000/api/avatar-unlocks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"componentId": "<component-uuid>"}'

# Check if unlocked
curl -X GET "http://localhost:3000/api/avatar-unlocks/check/<componentId>" \
  -H "Authorization: Bearer <token>"

# Get my unlocked components
curl -X GET "http://localhost:3000/api/avatar-unlocks/user/me" \
  -H "Authorization: Bearer <token>"

# Get all unlocks for component (admin)
curl -X GET "http://localhost:3000/api/avatar-unlocks/component/<componentId>" \
  -H "Authorization: Bearer <admin-token>"
```