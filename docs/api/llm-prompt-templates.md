# LLM Prompt Templates API (Admin)

## Overview

Dynamic system prompt management for LLM interactions. Allows admins to version and manage prompts without code deployment.

## Endpoints

### Create Prompt Template (Admin)
```
POST /api/llm-prompt-templates
```

**Description**: Create a new LLM prompt template.

**Authentication**: Required (admin role)

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| templateName | string | Yes | Not empty, unique | Template identifier (e.g., 'mslq_quiz_generator', 'monthly_evaluation') |
| systemPrompt | string | Yes | Not empty | Full system prompt text |
| version | integer | No | Min: 1 | Version number (default: 1) |
| isActive | boolean | No | - | Active status (default: true) |

**Response**: 201 Created
```json
{
  "template": {
    "promptId": "uuid",
    "templateName": "mslq_quiz_generator",
    "version": 1,
    "systemPrompt": "You are an expert in Psychometrics and Self-Regulated Learning (MSLQ)...",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error / Template name already exists
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

### Get All Prompt Templates
```
GET /api/llm-prompt-templates
```

**Description**: List all prompt templates with filters.

**Authentication**: Required (admin role)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| templateName | string | Filter by name |
| limit | integer | Default: 50 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "templates": [
    {
      "promptId": "uuid",
      "templateName": "mslq_quiz_generator",
      "version": 1,
      "systemPrompt": "...",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

### Get Template by ID
```
GET /api/llm-prompt-templates/:id
```

**Description**: Get a specific prompt template.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Template ID |

**Response**: 200 OK
```json
{
  "template": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Template not found

---

### Get Template by Name
```
GET /api/llm-prompt-templates/name/:templateName
```

**Description**: Get active template by name (used by LLM services).

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| templateName | string | Yes | Template name |

**Response**: 200 OK
```json
{
  "template": {
    "promptId": "uuid",
    "templateName": "mslq_quiz_generator",
    "version": 1,
    "systemPrompt": "...",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Template not found

---

### Update Prompt Template (Admin)
```
PUT /api/llm-prompt-templates/:id
```

**Description**: Update a prompt template.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Template ID |

**Request Body** (all optional):
| Field | Type | Description |
|-------|------|-------------|
| templateName | string | Template name |
| systemPrompt | string | System prompt text |
| version | integer | Version number |
| isActive | boolean | Active status |

**Response**: 200 OK
```json
{
  "template": { ... updated ... }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Template not found

---

### Delete Prompt Template (Admin)
```
DELETE /api/llm-prompt-templates/:id
```

**Description**: Delete a prompt template.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Template ID |

**Response**: 200 OK
```json
{
  "message": "Prompt template deleted"
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Template not found

---

## LlmPromptTemplate Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| promptId | UUID | No | UUIDv4 | Primary key |
| templateName | VARCHAR(100) | No | - | Unique identifier |
| version | INTEGER | No | 1 | Version number |
| systemPrompt | TEXT | No | - | Full system prompt |
| isActive | BOOLEAN | No | true | Active flag |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |

---

## Default Seeded Template

### mslq_quiz_generator (v1)

**Purpose**: Generate 7-question MSLQ scenario-based quiz

**System Prompt**:
```
You are an expert in Psychometrics and Self-Regulated Learning (MSLQ).
Your task is to create 7 multiple-choice quiz questions based on student life scenarios.

Each question MUST represent one of the 7 MSLQ categories:
1. organization
2. time_management
3. metacognitive_self_regulation
4. help_seeking
5. elaboration
6. rehearsal
7. critical_thinking

Output MUST be valid JSON array without additional text:
[
  {
    "category": "organization",
    "question_text": "...",
    "options": [
      {"text": "...", "score": 3},
      {"text": "...", "score": 2},
      {"text": "...", "score": 1}
    ]
  }
]

Option Scoring:
- Score 3: Actively/ideally applies the strategy
- Score 2: Partially/passively applies the strategy
- Score 1: Does not apply the strategy at all
```

---

## Versioning Strategy

- **Version increment**: Create new record with same `templateName`, incremented `version`
- **Active flag**: Only one active version per template name
- **Rollback**: Set `isActive: true` on previous version, `false` on current

---

## Usage by LLM Services

Services fetch active template by name:
```javascript
const template = await LlmPromptTemplate.findOne({ 
  where: { templateName: 'mslq_quiz_generator', isActive: true } 
});
const prompt = template.systemPrompt;
```

---

## Example Usage

```bash
# Admin: Create template
curl -X POST http://localhost:3000/api/llm-prompt-templates \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "monthly_evaluation",
    "systemPrompt": "You are an educational analyst...",
    "version": 1,
    "isActive": true
  }'

# Admin: List templates
curl -X GET "http://localhost:3000/api/llm-prompt-templates?isActive=true" \
  -H "Authorization: Bearer <admin-token>"

# Get by name (for LLM service)
curl -X GET "http://localhost:3000/api/llm-prompt-templates/name/mslq_quiz_generator" \
  -H "Authorization: Bearer <admin-token>"
```