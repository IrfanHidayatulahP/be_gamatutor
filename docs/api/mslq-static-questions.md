# MSLQ Static Questions API (Admin)

## Overview

Fallback static quiz questions for MSLQ assessment when LLM API is unavailable or rate-limited. Admin-managed question bank organized by category.

## Endpoints

### Create Static Question (Admin)
```
POST /api/mslq-static-questions
```

**Description**: Add a new static quiz question.

**Authentication**: Required (admin role)

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| category | string | Yes | Not empty | MSLQ category (organization, time_management, metacognitive_self_regulation, help_seeking, elaboration, rehearsal, critical_thinking) |
| questionText | string | Yes | Not empty | Question text |
| options | object | Yes | Valid JSON object | Answer options with scores |

**Options Format**:
```json
{
  "options": [
    {"text": "Option A - Active strategy", "score": 3},
    {"text": "Option B - Partial strategy", "score": 2},
    {"text": "Option C - No strategy", "score": 1}
  ]
}
```

**Response**: 201 Created
```json
{
  "question": {
    "staticQId": "uuid",
    "category": "time_management",
    "questionText": "When you have multiple assignments due...",
    "options": [
      {"text": "Plan and schedule each task", "score": 3},
      {"text": "Do the easiest first", "score": 2},
      {"text": "Wait until last minute", "score": 1}
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

### Get All Static Questions
```
GET /api/mslq-static-questions
```

**Description**: List all static questions with filters.

**Authentication**: Required (admin role)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "questions": [
    {
      "staticQId": "uuid",
      "category": "time_management",
      "questionText": "When you have multiple assignments due...",
      "options": [...],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

### Get Question by ID
```
GET /api/mslq-static-questions/:id
```

**Description**: Get a specific static question.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Question ID |

**Response**: 200 OK
```json
{
  "question": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Question not found

---

### Get Questions by Category
```
GET /api/mslq-static-questions/category/:category
```

**Description**: Get all questions for a specific MSLQ category.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | Yes | MSLQ category |

**Response**: 200 OK
```json
{
  "questions": [
    { ... },
    { ... }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden

---

### Update Static Question (Admin)
```
PUT /api/mslq-static-questions/:id
```

**Description**: Update a static question.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Question ID |

**Request Body** (all optional):
| Field | Type | Description |
|-------|------|-------------|
| category | string | MSLQ category |
| questionText | string | Question text |
| options | object | Options JSON |

**Response**: 200 OK
```json
{
  "question": { ... updated ... }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Question not found

---

### Delete Static Question (Admin)
```
DELETE /api/mslq-static-questions/:id
```

**Description**: Delete a static question.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Question ID |

**Response**: 200 OK
```json
{
  "message": "Static question deleted"
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Question not found

---

## MslqStaticQuestion Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| staticQId | UUID | No | UUIDv4 | Primary key |
| category | VARCHAR(50) | No | - | MSLQ category |
| questionText | TEXT | No | - | Question content |
| options | JSONB | No | - | Answer options with scores |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |

---

## MSLQ Categories (7)

| Category | Key Code | Description |
|----------|----------|-------------|
| Organization | organization | Extracting main ideas, grouping material |
| Time Management | time_management | Scheduling, targets, priorities |
| Metacognitive Self-Regulation | metacognitive_self_regulation | Planning, monitoring, adjusting thinking |
| Help-Seeking | help_seeking | Effectively requesting help |
| Elaboration | elaboration | Connecting new with prior knowledge |
| Rehearsal | rehearsal | Memorizing, repeating verbatim |
| Critical Thinking | critical_thinking | Analyzing, evaluating arguments |

---

## Scoring System

Each question has 3 options with scores:
- **3 points**: Active/ideal application of strategy
- **2 points**: Partial/passive application
- **1 point**: No application of strategy

Total quiz score range: 7-21 points per category

---

## Fallback Usage

When LLM quiz generation fails:
1. System fetches 1 question per category from static bank
2. Random selection if multiple questions per category
3. Ensures complete 7-question quiz always available

---

## Example Usage

```bash
# Admin: Add static question
curl -X POST http://localhost:3000/api/mslq-static-questions \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "organization",
    "questionText": "When organizing study materials...",
    "options": [
      {"text": "Create outlines and summaries", "score": 3},
      {"text": "Highlight key points", "score": 2},
      {"text": "Read without organizing", "score": 1}
    ]
  }'

# Admin: Get questions by category
curl -X GET "http://localhost:3000/api/mslq-static-questions/category/time_management" \
  -H "Authorization: Bearer <admin-token>"
```