# LLM Recommendation Histories API

## Overview

Audit trail for all LLM-generated recommendations. Stores the input context, LLM output, and trigger type for transparency and thesis research.

## Trigger Types

| Type | Description | When Generated |
|------|-------------|----------------|
| `MONTHLY_EVAL` | Monthly evaluation recommendations | After monthly analysis |
| `QUIZ_RESULT` | Post-quiz strategy recommendations | After MSLQ quiz submission |
| `ON_DEMAND` | User-requested recommendations | Manual trigger |
| `DEADLINE_ALERT` | Proactive deadline suggestions | Cron job check |
| `INACTIVITY_NUDGE` | Re-engagement recommendations | Inactivity detection |

## Endpoints

### Create Recommendation History
```
POST /api/llm-recommendation-histories
```

**Description**: Record an LLM recommendation (typically system-generated).

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| triggerType | string | Yes | Not empty | Trigger type from list above |
| inputContext | object | Yes | Valid JSON | Data sent to LLM |
| llmOutput | object | Yes | Valid JSON | Full LLM response |

**Input Context Format**:
```json
{
  "inputContext": {
    "userProfile": "Strategic Planner",
    "dominantStrategy": "time_management",
    "activitySummary": {
      "totalCards": 15,
      "completedCards": 8,
      "avgReflectionScore": 4.2,
      "missedDeadlines": 1
    },
    "currentMonth": "01-2024"
  }
}
```

**LLM Output Format**:
```json
{
  "llmOutput": {
    "recommendations": [
      {
        "type": "strategy_focus",
        "strategy": "elaboration",
        "reason": "Low usage detected vs quiz score",
        "actions": ["Create elaboration cards", "Connect topics"]
      },
      {
        "type": "schedule_optimization",
        "suggestion": "Block 2hr morning focus time",
        "reason": "Most productive hours 9-11am"
      }
    ],
    "llmModel": "gpt-4",
    "tokensUsed": 1250,
    "timestamp": "2024-02-01T00:00:00.000Z"
  }
}
```

**Response**: 201 Created
```json
{
  "recommendationHistory": {
    "recId": "uuid",
    "userId": "uuid",
    "triggerType": "MONTHLY_EVAL",
    "inputContext": { ... },
    "llmOutput": { ... },
    "createdAt": "2024-02-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 404: User not found

---

### Get All Recommendations (Admin)
```
GET /api/llm-recommendation-histories
```

**Description**: List all recommendation histories (admin only).

**Authentication**: Required (admin role)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | Filter by user |
| triggerType | string | Filter by trigger |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "recommendationHistories": [
    {
      "recId": "uuid",
      "userId": "uuid",
      "triggerType": "MONTHLY_EVAL",
      "inputContext": { ... },
      "llmOutput": { ... },
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

### Get Recommendation by ID
```
GET /api/llm-recommendation-histories/:id
```

**Description**: Get a specific recommendation record.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Recommendation ID |

**Response**: 200 OK
```json
{
  "recommendationHistory": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Recommendation not found

---

### Get User's Recommendations
```
GET /api/llm-recommendation-histories/user/:userId
```

**Description**: Get all recommendations for a user.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| triggerType | string | Filter by trigger |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "recommendationHistories": [ ... ]
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Get Recommendations by Trigger
```
GET /api/llm-recommendation-histories/trigger/:triggerType
```

**Description**: Get all recommendations of a specific trigger type.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| triggerType | string | Yes | Trigger type |

**Response**: 200 OK
```json
{
  "recommendationHistories": [ ... ]
}
```

**Errors**:
- 401: Unauthorized

---

### Delete Recommendation (Admin)
```
DELETE /api/llm-recommendation-histories/:id
```

**Description**: Delete a recommendation record (admin only).

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Recommendation ID |

**Response**: 200 OK
```json
{
  "message": "Recommendation history deleted"
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Recommendation not found

---

## LlmRecommendationHistory Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| recId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | FK to users |
| triggerType | VARCHAR(50) | No | - | Trigger type |
| inputContext | JSONB | No | - | Data sent to LLM |
| llmOutput | JSONB | No | - | Full LLM response |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |

### Relationships
- **User** (M:1) - Recommendation recipient

---

## Research Value

This audit trail enables:
- **Thesis Research** - Track LLM recommendation quality over time
- **Bias Detection** - Analyze recommendation patterns
- **Effectiveness Measurement** - Correlate recommendations with outcomes
- **Reproducibility** - Exact input/output for each recommendation
- **Model Comparison** - Compare different LLM models/prompts

---

## Example Usage

```bash
# System: Record monthly evaluation recommendation
curl -X POST http://localhost:3000/api/llm-recommendation-histories \
  -H "Authorization: Bearer <system-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-uuid>",
    "triggerType": "MONTHLY_EVAL",
    "inputContext": {
      "userProfile": "Strategic Planner",
      "dominantStrategy": "time_management",
      "activitySummary": {"totalCards": 15, "completedCards": 8}
    },
    "llmOutput": {
      "recommendations": [
        {"type": "strategy_focus", "strategy": "elaboration", "reason": "Low usage vs quiz"}
      ],
      "llmModel": "gpt-4"
    }
  }'

# Get user's recommendation history
curl -X GET "http://localhost:3000/api/llm-recommendation-histories/user/me" \
  -H "Authorization: Bearer <token>"

# Admin: Analyze MONTHLY_EVAL recommendations
curl -X GET "http://localhost:3000/api/llm-recommendation-histories/trigger/MONTHLY_EVAL" \
  -H "Authorization: Bearer <admin-token>"
```