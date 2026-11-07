# Monthly Evaluations API

## Overview

Monthly evaluations detect synchronization between user's self-reported learning profile (from MSLQ quiz) and actual behavior (from activity logs). Uses LLM analysis to identify discrepancies and recommend interventions.

## Endpoints

### Create Monthly Evaluation
```
POST /api/monthly-evaluations
```

**Description**: Create a monthly evaluation for a user (typically system-generated via cron).

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| monthYear | string | Yes | Format: MM-YYYY | Evaluation month (e.g., '01-2024') |
| isSynchronized | boolean | Yes | - | Whether profile matches behavior |
| requiresQuizRetake | boolean | No | - | Whether user should retake quiz (default: false) |
| detectedIssues | object | Yes | Valid JSON | Issues found by LLM |
| llmFeedback | string | Yes | Not empty | LLM-generated feedback text |

**Detected Issues Format**:
```json
{
  "detectedIssues": {
    "profileBehaviorMismatch": true,
    "dominantStrategyShift": "time_management → organization",
    "inactivityPeriods": ["2024-01-10 to 2024-01-15"],
    "missedDeadlines": 3,
    "lowReflectionCompletion": 0.3,
    "strategyUsageGap": {
      "time_management": {"quizScore": 3, "actualUsage": 0.2}
    }
  }
}
```

**Response**: 201 Created
```json
{
  "monthlyEvaluation": {
    "evalId": "uuid",
    "userId": "uuid",
    "monthYear": "01-2024",
    "isSynchronized": false,
    "requiresQuizRetake": true,
    "detectedIssues": { ... },
    "llmFeedback": "Your quiz shows Time Management as dominant, but activity logs show...",
    "resolvedAt": null,
    "createdAt": "2024-02-01T00:00:00.000Z"
  }
}
```

**Constraints**: One evaluation per user per month (unique constraint).

**Errors**:
- 400: Validation error / Evaluation for month already exists
- 401: Unauthorized
- 404: User not found

---

### Get All Evaluations (Admin)
```
GET /api/monthly-evaluations
```

**Description**: List all monthly evaluations (admin only).

**Authentication**: Required (admin role)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | Filter by user |
| monthYear | string | Filter by month (MM-YYYY) |
| isSynchronized | boolean | Filter by sync status |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "monthlyEvaluations": [
    {
      "evalId": "uuid",
      "userId": "uuid",
      "monthYear": "01-2024",
      "isSynchronized": false,
      "requiresQuizRetake": true,
      "detectedIssues": { ... },
      "llmFeedback": "...",
      "resolvedAt": null,
      "createdAt": "2024-02-01T00:00:00.000Z",
      "user": { ... }
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

### Get Evaluation by ID
```
GET /api/monthly-evaluations/:id
```

**Description**: Get a specific monthly evaluation.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Evaluation ID |

**Response**: 200 OK
```json
{
  "monthlyEvaluation": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Evaluation not found

---

### Get User's Evaluations
```
GET /api/monthly-evaluations/user/:userId
```

**Description**: Get all evaluations for a specific user.

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
  "monthlyEvaluations": [ ... ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Get Evaluation by User and Month
```
GET /api/monthly-evaluations/user/:userId/month/:monthYear
```

**Description**: Get specific month's evaluation for a user.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |
| monthYear | string | Yes | Month in MM-YYYY format |

**Response**: 200 OK
```json
{
  "monthlyEvaluation": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Evaluation not found

---

### Update Evaluation (Admin)
```
PUT /api/monthly-evaluations/:id
```

**Description**: Update a monthly evaluation (admin only).

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Evaluation ID |

**Request Body** (all optional):
| Field | Type | Description |
|-------|------|-------------|
| monthYear | string | MM-YYYY format |
| isSynchronized | boolean | Sync status |
| requiresQuizRetake | boolean | Retake flag |
| detectedIssues | object | Issues JSON |
| llmFeedback | string | Feedback text |
| resolvedAt | ISO 8601 | Resolution timestamp |

**Response**: 200 OK
```json
{
  "monthlyEvaluation": { ... updated ... }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (non-admin)
- 404: Evaluation not found

---

### Delete Evaluation (Admin)
```
DELETE /api/monthly-evaluations/:id
```

**Description**: Delete a monthly evaluation (admin only).

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Evaluation ID |

**Response**: 200 OK
```json
{
  "message": "Monthly evaluation deleted"
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Evaluation not found

---

## MonthlyEvaluation Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| evalId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | FK to users |
| monthYear | VARCHAR(20) | No | - | Format: MM-YYYY |
| isSynchronized | BOOLEAN | No | - | Profile-behavior sync |
| requiresQuizRetake | BOOLEAN | No | false | Quiz retake needed |
| detectedIssues | JSONB | No | - | LLM-detected issues |
| llmFeedback | TEXT | No | - | LLM feedback text |
| resolvedAt | TIMESTAMPTZ | Yes | null | Resolution timestamp |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |

### Constraints
- Unique: (userId, monthYear) - One per user per month

### Relationships
- **User** (M:1) - Evaluation subject

---

## Evaluation Process Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Activity    │────▶│ LLM Analysis │────▶│ Monthly     │
│ Logs        │     │ (monthly)    │     │ Evaluation  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Quiz Result  │
                    │ Comparison   │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Sync Decision│
                    └──────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       Synchronized              Not Synchronized
       (no action)               ▼
                          ┌──────────────┐
                          │ Requires     │
                          │ Quiz Retake  │
                          └──────────────┘
```

---

## LLM Analysis Input

The LLM receives:
1. **User's latest quiz result** - Dominant strategy, profile, unlocked features
2. **Monthly activity logs** - Card movements, reflections, chat, collaborations
3. **Card completion rates** - By strategy, difficulty, priority
4. **Reflection quality** - Completion rate, depth scores
5. **Time patterns** - Active hours, procrastination indicators

---

## Detected Issues Types

| Issue Type | Description | Action |
|------------|-------------|--------|
| `profileBehaviorMismatch` | Quiz strategy ≠ actual behavior | Quiz retake recommended |
| `dominantStrategyShift` | Strategy changed significantly | Re-assess features |
| `inactivityPeriods` | Gaps > 3 days no activity | Encouragement notification |
| `missedDeadlines` | > 2 missed deadlines | Time management focus |
| `lowReflectionCompletion` | < 50% cards reflected | Reflection prompts |
| `strategyUsageGap` | Quiz score ≠ actual usage | Targeted strategy training |

---

## Example Usage

```bash
# System: Create monthly evaluation (cron job)
curl -X POST http://localhost:3000/api/monthly-evaluations \
  -H "Authorization: Bearer <system-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-uuid>",
    "monthYear": "01-2024",
    "isSynchronized": false,
    "requiresQuizRetake": true,
    "detectedIssues": {
      "profileBehaviorMismatch": true,
      "dominantStrategyShift": "time_management → organization",
      "missedDeadlines": 3,
      "strategyUsageGap": {
        "time_management": {"quizScore": 3, "actualUsage": 0.2}
      }
    },
    "llmFeedback": "Your quiz indicates Time Management as your dominant strategy, but your activity logs show you rarely use scheduling features. Consider retaking the quiz or practicing time management techniques."
  }'

# Get user's evaluation history
curl -X GET "http://localhost:3000/api/monthly-evaluations/user/me" \
  -H "Authorization: Bearer <token>"

# Get specific month
curl -X GET "http://localhost:3000/api/monthly-evaluations/user/me/month/01-2024" \
  -H "Authorization: Bearer <token>"

# Admin: List all
curl -X GET "http://localhost:3000/api/monthly-evaluations?monthYear=01-2024&isSynchronized=false" \
  -H "Authorization: Bearer <admin-token>"
```