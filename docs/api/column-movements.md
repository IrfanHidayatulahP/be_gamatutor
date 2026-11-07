# Column Movements API

## Overview

Column Movements track the transitions of cards between Kanban columns (e.g., "Planning" → "In Progress" → "Done"). This provides audit trail and analytics for user behavior patterns.

## Endpoints

### Create Column Movement
```
POST /api/column-movements
```

**Description**: Record a card column transition.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| cardId | UUID | Yes | Valid UUID, owned by user | Card ID |
| fromColumn | string | No | - | Source column name |
| toColumn | string | No | - | Destination column name |
| timestamp | string | No | ISO 8601 | Transition time (default: now) |
| completed | boolean | No | - | Whether movement completed (default: false) |

**Response**: 201 Created
```json
{
  "movement": {
    "ccmId": "uuid",
    "cardId": "uuid",
    "fromColumn": "Planning",
    "toColumn": "In Progress",
    "timestamp": "2024-01-10T09:00:00.000Z",
    "completed": false
  }
}
```

**Errors**:
- 400: Validation error / Card not found
- 401: Unauthorized
- 404: Card not found

---

### Get All Column Movements
```
GET /api/column-movements
```

**Description**: Get column movements with filtering.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| cardId | UUID | Filter by card |
| completed | boolean | Filter by completion status |
| fromDate | ISO 8601 | Filter from date |
| toDate | ISO 8601 | Filter to date |
| limit | integer | Default: 100 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "movements": [
    {
      "ccmId": "uuid",
      "cardId": "uuid",
      "fromColumn": "Planning",
      "toColumn": "In Progress",
      "timestamp": "2024-01-10T09:00:00.000Z",
      "completed": false
    }
  ]
}
```

**Errors**:
- 401: Unauthorized

---

### Get Column Movement by ID
```
GET /api/column-movements/:id
```

**Description**: Get a specific column movement.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Movement ID (ccmId) |

**Response**: 200 OK
```json
{
  "movement": {
    "ccmId": "uuid",
    "cardId": "uuid",
    "fromColumn": "Planning",
    "toColumn": "In Progress",
    "timestamp": "2024-01-10T09:00:00.000Z",
    "completed": false
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Movement not found

---

### Get Movements by Card
```
GET /api/column-movements/card/:cardId
```

**Description**: Get all movements for a specific card (chronological).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Card ID |

**Response**: 200 OK
```json
{
  "movements": [
    {
      "ccmId": "uuid",
      "cardId": "uuid",
      "fromColumn": null,
      "toColumn": "Planning",
      "timestamp": "2024-01-10T08:00:00.000Z",
      "completed": false
    },
    {
      "ccmId": "uuid",
      "cardId": "uuid",
      "fromColumn": "Planning",
      "toColumn": "In Progress",
      "timestamp": "2024-01-10T09:00:00.000Z",
      "completed": false
    },
    {
      "ccmId": "uuid",
      "cardId": "uuid",
      "fromColumn": "In Progress",
      "toColumn": "Done",
      "timestamp": "2024-01-10T11:00:00.000Z",
      "completed": true
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 404: Card not found

---

### Update Column Movement
```
PUT /api/column-movements/:id
```

**Description**: Update a column movement record.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Movement ID |

**Request Body** (all optional):
| Field | Type | Description |
|-------|------|-------------|
| fromColumn | string | Source column |
| toColumn | string | Destination column |
| timestamp | ISO 8601 | Transition time |
| completed | boolean | Completion status |

**Response**: 200 OK
```json
{
  "movement": { ... updated movement ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Movement not found

---

### Mark Movement Completed
```
PUT /api/column-movements/:id/complete
```

**Description**: Mark a column movement as completed.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Movement ID |

**Response**: 200 OK
```json
{
  "movement": {
    "ccmId": "uuid",
    "cardId": "uuid",
    "fromColumn": "In Progress",
    "toColumn": "Done",
    "timestamp": "2024-01-10T11:00:00.000Z",
    "completed": true
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Movement not found

---

### Delete Column Movement
```
DELETE /api/column-movements/:id
```

**Description**: Delete a column movement record.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Movement ID |

**Response**: 200 OK
```json
{
  "message": "Column movement deleted"
}
```

**Errors**:
- 401: Unauthorized
- 404: Movement not found

---

## ColumnMovement Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| ccmId | UUID | No | UUIDv4 | Primary key |
| cardId | UUID | No | - | FK to cards |
| fromColumn | VARCHAR(255) | Yes | null | Source column |
| toColumn | VARCHAR(255) | Yes | null | Destination column |
| timestamp | TIMESTAMPTZ | Yes | NOW | Transition timestamp |
| completed | BOOLEAN | No | false | Completion flag |

### Relationships
- **Card** (M:1) - Parent card

---

## Typical Column Flow

Standard Kanban columns (customizable per user):
1. **Backlog** - Ideas, future tasks
2. **Planning** - Scheduled, ready to start
3. **In Progress** - Currently working
4. **Review** - Completed, awaiting review
5. **Done** - Finished

---

## Analytics Use Cases

Column movements enable:
- **Time in Column** - How long cards stay in each stage
- **Bottleneck Detection** - Columns where cards pile up
- **Velocity Tracking** - Cards completed per time period
- **Behavior Patterns** - For LLM monthly evaluation analysis
- **Procrastination Detection** - Cards stuck in Planning

---

## Example Usage

```bash
# Record card moving to In Progress
curl -X POST http://localhost:3000/api/column-movements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "<card-uuid>",
    "fromColumn": "Planning",
    "toColumn": "In Progress"
  }'

# Get card movement history
curl -X GET "http://localhost:3000/api/column-movements/card/<cardId>" \
  -H "Authorization: Bearer <token>"

# Mark as completed when card reaches Done
curl -X PUT http://localhost:3000/api/column-movements/<ccmId>/complete \
  -H "Authorization: Bearer <token>"

# Filter movements for analytics
curl -X GET "http://localhost:3000/api/column-movements?fromDate=2024-01-01&toDate=2024-01-31&completed=true" \
  -H "Authorization: Bearer <token>"
```