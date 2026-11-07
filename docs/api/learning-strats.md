# Learning Strategies API

## Endpoints

### Create Learning Strategy (Admin)
```
POST /api/learning-strats
```

**Description**: Create a new learning strategy.

**Authentication**: Required (admin role)

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| learningStrategy | string | Yes | One of: Rehearsal, Organization, Elaboration, Time Management, Help-Seeking, Metacognitive Self-Regulation | Strategy name |
| description | string | No | - | Strategy description |

**Response**: 201 Created
```json
{
  "learningStrat": {
    "learningId": "uuid",
    "learningStrategy": "Time Management",
    "description": "Scheduling, targets, priority scaling",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error / Invalid strategy name
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

### Get All Learning Strategies
```
GET /api/learning-strats
```

**Description**: Get all learning strategies.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "learningStrats": [
    {
      "learningId": "uuid",
      "learningStrategy": "Rehearsal",
      "description": "Memorizing/repeating information verbatim",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "learningId": "uuid",
      "learningStrategy": "Organization",
      "description": "Extracting main ideas and grouping material",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**:
- 401: Unauthorized

---

### Get Learning Strategy by ID
```
GET /api/learning-strats/:id
```

**Description**: Get a specific learning strategy.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Learning strategy ID |

**Response**: 200 OK
```json
{
  "learningStrat": {
    "learningId": "uuid",
    "learningStrategy": "Time Management",
    "description": "Scheduling, targets, priority scaling",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Learning strategy not found

---

### Update Learning Strategy (Admin)
```
PUT /api/learning-strats/:id
```

**Description**: Update a learning strategy.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Learning strategy ID |

**Request Body** (all optional):
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| learningStrategy | string | Valid strategy enum | Strategy name |
| description | string | - | Strategy description |

**Response**: 200 OK
```json
{
  "learningStrat": {
    "learningId": "uuid",
    "learningStrategy": "Updated Strategy",
    "description": "Updated description",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (non-admin)
- 404: Learning strategy not found

---

### Delete Learning Strategy (Admin)
```
DELETE /api/learning-strats/:id
```

**Description**: Delete a learning strategy.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Learning strategy ID |

**Response**: 200 OK
```json
{
  "message": "Learning strategy deleted"
}
```

**Note**: Cannot delete if referenced by CardList records (foreign key constraint).

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)
- 404: Learning strategy not found
- 400: Referenced resource (if in use)

---

## LearningStrat Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| learningId | UUID | No | UUIDv4 | Primary key |
| learningStrategy | VARCHAR(30) | No | - | Enum: Rehearsal, Organization, Elaboration, Time Management, Help-Seeking, Metacognitive Self-Regulation, Critical Thinking |
| description | TEXT | Yes | null | Strategy description |
| createdAt | TIMESTAMPTZ | Yes | NOW | Creation timestamp |

### Relationships
- **CardList** (1:M) - Cards using this strategy

---

## Default Seeded Data

The system comes with 7 pre-seeded learning strategies based on MSLQ (Motivated Strategies for Learning Questionnaire):

| Strategy | Key Code | Description |
|----------|----------|-------------|
| Rehearsal | rehearsal | Memorizing or repeating information verbatim |
| Organization | organization | Extracting main ideas and grouping study material |
| Elaboration | elaboration | Connecting new material with prior knowledge |
| Time Management | time_management | Scheduling, setting targets, priority scaling |
| Help-Seeking | help_seeking | Effectively requesting help when encountering difficulties |
| Metacognitive Self-Regulation | metacognitive_self_regulation | Planning, monitoring, and adjusting own thinking process |
| Critical Thinking | critical_thinking | Analyzing and evaluating arguments deeply |

---

## MSLQ Categories Mapping

Each learning strategy maps to one of the 7 MSLQ categories used in the quiz system:

1. **organization** → Organization
2. **time_management** → Time Management
3. **metacognitive_self_regulation** → Metacognitive Self-Regulation
4. **help_seeking** → Help-Seeking
5. **elaboration** → Elaboration
6. **rehearsal** → Rehearsal
7. **critical_thinking** → Critical Thinking

---

## Example Usage

```bash
# Get all learning strategies (for card creation)
curl -X GET http://localhost:3000/api/learning-strats \
  -H "Authorization: Bearer <token>"

# Admin: Create new strategy
curl -X POST http://localhost:3000/api/learning-strats \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"learningStrategy": "Critical Thinking", "description": "Deep analysis and evaluation"}'

# Admin: Update strategy
curl -X PUT http://localhost:3000/api/learning-strats/<learningId> \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'
```