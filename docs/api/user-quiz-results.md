# User Quiz Results API

## Overview

MSLQ (Motivated Strategies for Learning Questionnaire) quiz results with feature unlocking based on dominant learning strategy.

## Endpoints

### Submit Quiz Result
```
POST /api/user-quiz-results
```

**Description**: Submit MSLQ quiz answers and get results with feature unlocks.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| dominantStrategy | string | Yes | Not empty | Dominant strategy from quiz (e.g., 'time_management') |
| userProfile | string | Yes | Not empty | Profile description (e.g., 'Strategic Planner') |
| unlockedFeatures | array | Yes | Array of strings | Features unlocked (e.g., ['time_management', 'organization']) |
| lockedFeatures | array | Yes | Array of strings | Features still locked |
| answersPayload | object | Yes | Valid JSON | Full answer details |

**Answers Payload Format**:
```json
{
  "answersPayload": {
    "organization": {"selectedOption": 0, "score": 3},
    "time_management": {"selectedOption": 1, "score": 2},
    "metacognitive_self_regulation": {"selectedOption": 0, "score": 3},
    "help_seeking": {"selectedOption": 2, "score": 1},
    "elaboration": {"selectedOption": 0, "score": 3},
    "rehearsal": {"selectedOption": 1, "score": 2},
    "critical_thinking": {"selectedOption": 0, "score": 3}
  }
}
```

**Response**: 201 Created
```json
{
  "quizResult": {
    "quizResultId": "uuid",
    "userId": "uuid",
    "dominantStrategy": "time_management",
    "userProfile": "Strategic Planner",
    "unlockedFeatures": ["time_management", "organization"],
    "lockedFeatures": ["help_seeking", "critical_thinking"],
    "answersPayload": { ... },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Side Effects**:
- Updates user's available learning strategies
- Triggers avatar unlocks for new features
- Creates activity log entry

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 404: User not found

---

### Get All Quiz Results (Admin)
```
GET /api/user-quiz-results
```

**Description**: List all quiz results (admin only).

**Authentication**: Required (admin role)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | Filter by user |
| dominantStrategy | string | Filter by strategy |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "quizResults": [
    {
      "quizResultId": "uuid",
      "userId": "uuid",
      "dominantStrategy": "time_management",
      "userProfile": "Strategic Planner",
      "unlockedFeatures": ["time_management", "organization"],
      "lockedFeatures": ["help_seeking"],
      "answersPayload": { ... },
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z",
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

### Get Quiz Result by ID
```
GET /api/user-quiz-results/:id
```

**Description**: Get a specific quiz result.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Quiz result ID |

**Response**: 200 OK
```json
{
  "quizResult": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Quiz result not found

---

### Get User's Quiz Results
```
GET /api/user-quiz-results/user/:userId
```

**Description**: Get all quiz results for a specific user.

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
  "quizResults": [ ... ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Get Latest Quiz Result
```
GET /api/user-quiz-results/latest/:userId
```

**Description**: Get most recent quiz result for a user (current profile).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Response**: 200 OK
```json
{
  "quizResult": {
    "quizResultId": "uuid",
    "userId": "uuid",
    "dominantStrategy": "time_management",
    "userProfile": "Strategic Planner",
    "unlockedFeatures": ["time_management", "organization"],
    "lockedFeatures": ["help_seeking", "critical_thinking"],
    "answersPayload": { ... },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found / No quiz results

---

### Update Quiz Result (Admin)
```
PUT /api/user-quiz-results/:id
```

**Description**: Update a quiz result (admin only).

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Quiz result ID |

**Request Body** (all optional):
| Field | Type | Description |
|-------|------|-------------|
| dominantStrategy | string | Dominant strategy |
| userProfile | string | Profile description |
| unlockedFeatures | array | Unlocked features |
| lockedFeatures | array | Locked features |
| answersPayload | object | Answer details |

**Response**: 200 OK
```json
{
  "quizResult": { ... updated ... }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (non-admin)
- 404: Quiz result not found

---

### Delete Quiz Result (Admin)
```
DELETE /api/user-quiz-results/:id
```

**Description**: Delete a quiz result (admin only).

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Quiz result ID |

**Response**: 200 OK
```json
{
  "message": "Quiz result deleted"
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Quiz result not found

---

## UserQuizResult Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| quizResultId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | FK to users |
| dominantStrategy | VARCHAR(50) | No | - | Dominant strategy key |
| userProfile | VARCHAR(100) | No | - | Profile label |
| unlockedFeatures | JSONB | No | [] | Array of unlocked feature keys |
| lockedFeatures | JSONB | No | [] | Array of locked feature keys |
| answersPayload | JSONB | No | - | Full answer breakdown |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |
| updatedAt | TIMESTAMPTZ | No | NOW | Last update timestamp |

### Relationships
- **User** (M:1) - Quiz owner

---

## Feature Unlocking Logic

Based on quiz results, features are unlocked:

| Dominant Strategy | Unlocked Features | Description |
|-------------------|-------------------|-------------|
| time_management | time_management, organization | Scheduling, prioritization tools |
| organization | organization, elaboration | Structuring, connecting ideas |
| metacognitive_self_regulation | metacognitive_self_regulation, critical_thinking | Planning, monitoring, analysis |
| help_seeking | help_seeking, collaboration | Asking for help, peer learning |
| elaboration | elaboration, critical_thinking | Deep processing, connections |
| rehearsal | rehearsal, organization | Practice, memorization techniques |
| critical_thinking | critical_thinking, metacognitive_self_regulation | Analysis, evaluation |

---

## User Profiles

| Dominant Strategy | Profile Label |
|-------------------|---------------|
| time_management | Strategic Planner |
| organization | Structured Organizer |
| metacognitive_self_regulation | Reflective Learner |
| help_seeking | Collaborative Learner |
| elaboration | Deep Connector |
| rehearsal | Diligent Practitioner |
| critical_thinking | Analytical Thinker |

---

## Example Usage

```bash
# Submit quiz result
curl -X POST http://localhost:3000/api/user-quiz-results \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dominantStrategy": "time_management",
    "userProfile": "Strategic Planner",
    "unlockedFeatures": ["time_management", "organization"],
    "lockedFeatures": ["help_seeking", "critical_thinking"],
    "answersPayload": {
      "organization": {"selectedOption": 0, "score": 3},
      "time_management": {"selectedOption": 0, "score": 3},
      "metacognitive_self_regulation": {"selectedOption": 1, "score": 2},
      "help_seeking": {"selectedOption": 2, "score": 1},
      "elaboration": {"selectedOption": 1, "score": 2},
      "rehearsal": {"selectedOption": 1, "score": 2},
      "critical_thinking": {"selectedOption": 2, "score": 1}
    }
  }'

# Get latest result (current profile)
curl -X GET http://localhost:3000/api/user-quiz-results/latest/me \
  -H "Authorization: Bearer <token>"

# Get quiz history
curl -X GET http://localhost:3000/api/user-quiz-results/user/me \
  -H "Authorization: Bearer <token>"
```