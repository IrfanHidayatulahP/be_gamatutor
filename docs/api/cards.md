# Cards & Card Lists API

## Overview

Cards represent the main Kanban items. Each Card has a one-to-one relationship with a CardList that contains detailed information including learning strategy, scheduling, and reflection data.

## Card Endpoints

### Create Card
```
POST /api/cards
```

**Description**: Create a new Kanban card.

**Authentication**: Required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| title | string | Yes | 1-255 chars | Card title |

**Response**: 201 Created
```json
{
  "card": {
    "cardId": "uuid",
    "userId": "uuid",
    "title": "Card Title",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized

---

### Get All User Cards
```
GET /api/cards
```

**Description**: Get all cards for authenticated user.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "cards": [
    {
      "cardId": "uuid",
      "userId": "uuid",
      "title": "Card Title",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "cardList": { ... }  // If exists
    }
  ]
}
```

**Errors**:
- 401: Unauthorized

---

### Get Card by ID
```
GET /api/cards/:id
```

**Description**: Get a specific card by ID.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Card ID |

**Response**: 200 OK
```json
{
  "card": {
    "cardId": "uuid",
    "userId": "uuid",
    "title": "Card Title",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "cardList": { ... }  // If exists
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Card not found

---

### Update Card
```
PUT /api/cards/:id
```

**Description**: Update card title.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Card ID |

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| title | string | Yes | 1-255 chars | Card title |

**Response**: 200 OK
```json
{
  "card": {
    "cardId": "uuid",
    "userId": "uuid",
    "title": "Updated Title",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 404: Card not found

---

### Delete Card
```
DELETE /api/cards/:id
```

**Description**: Delete a card (cascades to CardList and ColumnMovements).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Card ID |

**Response**: 200 OK
```json
{
  "message": "Card deleted"
}
```

**Errors**:
- 401: Unauthorized
- 404: Card not found

---

## Card List Endpoints

Card Lists are accessed via nested route: `/api/cards/:cardId/list`

### Create Card List
```
POST /api/cards/:cardId/list
```

**Description**: Create detailed card information with learning strategy.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Parent card ID |

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| learningId | UUID | Yes | Valid UUID | Learning strategy ID |
| subTitle | string | No | - | Subtitle |
| description | string | No | - | Description |
| courseName | string | No | - | Course name |
| difficulty | string | No | easy/medium/hard/expert | Difficulty level |
| priority | string | No | low/medium/high/critical | Priority level |
| url | string | No | Valid URL | Resource URL (default: '') |
| startTime | string | Yes | ISO 8601 | Start timestamp |
| endTime | string | No | ISO 8601 | End timestamp |
| deadline | string | Yes | ISO 8601 (date) | Deadline date |

**Response**: 201 Created
```json
{
  "cardList": {
    "cardId": "uuid",
    "learningId": "uuid",
    "subTitle": "Subtitle",
    "description": "Description",
    "courseName": "Course",
    "difficulty": "medium",
    "priority": "high",
    "url": "https://example.com",
    "startTime": "2024-01-01T09:00:00.000Z",
    "endTime": "2024-01-01T11:00:00.000Z",
    "deadline": "2024-01-15",
    "archived": false,
    "deleted": false,
    "satisfactionRating": null,
    "notes": null,
    "preTestGrade": null,
    "postTestGrade": null,
    "reflectionQ1Strategy": null,
    "reflectionQ2Confidence": null,
    "reflectionQ3WhatLearned": null,
    "reflectionQ4Value": null,
    "reflectionCompletedAt": null,
    "personalBestTime": null,
    "personalBestGrade": null,
    "personalBestAchievedAt": null,
    "goalCheckRating": null,
    "goalCheckTimestamp": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "learningStrat": { ... }
  }
}
```

**Errors**:
- 400: Validation error / Learning strategy not found
- 401: Unauthorized
- 404: Card not found
- 400: Card list already exists for this card

---

### Get Card List
```
GET /api/cards/:cardId/list
```

**Description**: Get card list details for a card.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Card ID |

**Response**: 200 OK
```json
{
  "cardList": {
    "cardId": "uuid",
    "learningId": "uuid",
    "subTitle": "Subtitle",
    "description": "Description",
    "courseName": "Course",
    "difficulty": "medium",
    "priority": "high",
    "url": "https://example.com",
    "startTime": "2024-01-01T09:00:00.000Z",
    "endTime": "2024-01-01T11:00:00.000Z",
    "deadline": "2024-01-15",
    "archived": false,
    "deleted": false,
    "satisfactionRating": 4.5,
    "notes": "Notes",
    "preTestGrade": 70,
    "postTestGrade": 90,
    "reflectionQ1Strategy": "Strategy used",
    "reflectionQ2Confidence": 4,
    "reflectionQ3WhatLearned": "What I learned",
    "reflectionQ4Value": "Value gained",
    "reflectionCompletedAt": "2024-01-10T10:00:00.000Z",
    "personalBestTime": 45,
    "personalBestGrade": 95,
    "personalBestAchievedAt": "2024-01-08T10:00:00.000Z",
    "goalCheckRating": 4,
    "goalCheckTimestamp": "2024-01-05T10:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "learningStrat": {
      "learningId": "uuid",
      "learningStrategy": "Time Management",
      "description": "Description"
    }
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Card or CardList not found

---

### Update Card List
```
PUT /api/cards/:cardId/list
```

**Description**: Update card list details.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Card ID |

**Request Body** (all optional):
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| learningId | UUID | Valid UUID | Learning strategy ID |
| subTitle | string | - | Subtitle |
| description | string | - | Description |
| courseName | string | - | Course name |
| difficulty | string | easy/medium/hard/expert | Difficulty |
| priority | string | low/medium/high/critical | Priority |
| url | string | Valid URL | Resource URL |
| startTime | string | ISO 8601 | Start timestamp |
| endTime | string | ISO 8601 | End timestamp |
| deadline | string | ISO 8601 (date) | Deadline date |
| satisfactionRating | number | - | Self-evaluation rating |
| notes | string | - | Notes |
| preTestGrade | integer | - | Pre-test grade |
| postTestGrade | integer | - | Post-test grade |
| reflectionQ1Strategy | string | - | Reflection Q1 |
| reflectionQ2Confidence | number | - | Reflection Q2 |
| reflectionQ3WhatLearned | string | - | Reflection Q3 |
| reflectionQ4Value | string | - | Reflection Q4 |
| reflectionCompletedAt | string | ISO 8601 | Reflection completion |
| personalBestTime | number | - | Best time (minutes) |
| personalBestGrade | number | - | Best grade |
| personalBestAchievedAt | string | ISO 8601 | When best achieved |
| goalCheckRating | number | - | Goal check rating |
| goalCheckTimestamp | string | ISO 8601 | Goal check time |

**Response**: 200 OK
```json
{
  "cardList": { ... updated card list ... }
}
```

**Errors**:
- 400: Validation error / Learning strategy not found
- 401: Unauthorized
- 404: Card or CardList not found

---

### Delete Card List
```
DELETE /api/cards/:cardId/list
```

**Description**: Delete card list (soft delete option available via archive).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Card ID |

**Response**: 200 OK
```json
{
  "message": "Card list deleted"
}
```

**Errors**:
- 401: Unauthorized
- 404: Card or CardList not found

---

### Archive Card List
```
PUT /api/cards/:cardId/list/archive
```

**Description**: Archive card list (soft delete).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Card ID |

**Response**: 200 OK
```json
{
  "cardList": { ... with archived: true ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Card or CardList not found

---

### Restore Card List
```
PUT /api/cards/:cardId/list/restore
```

**Description**: Restore archived/deleted card list.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cardId | UUID | Yes | Card ID |

**Response**: 200 OK
```json
{
  "cardList": { ... with archived: false, deleted: false ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Card or CardList not found

---

## Card Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| cardId | UUID | No | UUIDv4 | Primary key |
| userId | UUID | No | - | FK to users |
| title | VARCHAR(255) | No | - | Card title |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |

### Relationships
- **User** (M:1) - Card owner
- **CardList** (1:1) - Detailed card info
- **ColumnMovement** (1:M) - Column transitions

---

## CardList Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| cardId | UUID | No | - | PK + FK to cards |
| learningId | UUID | No | - | FK to learning_strats |
| subTitle | VARCHAR(255) | Yes | null | Subtitle |
| description | TEXT | Yes | null | Description |
| courseName | VARCHAR(50) | Yes | null | Course name |
| difficulty | VARCHAR(10) | Yes | null | easy/medium/hard/expert |
| priority | VARCHAR(10) | Yes | null | low/medium/high/critical |
| url | TEXT | No | '' | Resource URL |
| startTime | TIMESTAMPTZ | No | - | Start timestamp |
| endTime | TIMESTAMPTZ | Yes | null | End timestamp |
| deadline | DATE | No | - | Deadline date |
| archived | BOOLEAN | No | false | Archive flag |
| deleted | BOOLEAN | No | false | Soft delete flag |
| satisfactionRating | NUMERIC | Yes | null | Self-evaluation (1-5) |
| notes | TEXT | Yes | null | Notes |
| preTestGrade | INTEGER | Yes | null | Pre-test score |
| postTestGrade | INTEGER | Yes | null | Post-test score |
| reflectionQ1Strategy | TEXT | Yes | null | Reflection: strategy used |
| reflectionQ2Confidence | NUMERIC | Yes | null | Reflection: confidence (1-5) |
| reflectionQ3WhatLearned | TEXT | Yes | null | Reflection: what learned |
| reflectionQ4Value | TEXT | Yes | null | Reflection: value gained |
| reflectionCompletedAt | TIMESTAMPTZ | Yes | null | Reflection completion time |
| personalBestTime | NUMERIC | Yes | null | Best completion time (min) |
| personalBestGrade | NUMERIC | Yes | null | Best grade achieved |
| personalBestAchievedAt | TIMESTAMPTZ | Yes | null | When best achieved |
| goalCheckRating | NUMERIC | Yes | null | Goal check rating (1-5) |
| goalCheckTimestamp | TIMESTAMPTZ | Yes | null | Goal check time |
| createdAt | TIMESTAMPTZ | Yes | NOW | Creation timestamp |

### Relationships
- **Card** (1:1) - Parent card
- **LearningStrat** (M:1) - Learning strategy
- **ColumnMovement** (1:M) - Via Card
- **CardListCollab** (1:M) - Collaborators

---

## Learning Strategies (Reference)

Default seeded strategies:
1. **Rehearsal** - Memorizing/repeating information verbatim
2. **Organization** - Extracting main ideas and grouping material
3. **Elaboration** - Connecting new material with prior knowledge
4. **Time Management** - Scheduling, targets, priority scaling
5. **Help-Seeking** - Effectively requesting help when stuck
6. **Metacognitive Self-Regulation** - Planning, monitoring, adjusting thinking
7. **Critical Thinking** - Deep analysis and evaluation of arguments

---

## Example Usage

```bash
# Create card
curl -X POST http://localhost:3000/api/cards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Complete Math Assignment"}'

# Create card list with learning strategy
curl -X POST http://localhost:3000/api/cards/<cardId>/list \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "learningId": "<learning-strategy-uuid>",
    "subTitle": "Calculus Homework",
    "description": "Complete problems 1-20",
    "courseName": "Calculus I",
    "difficulty": "medium",
    "priority": "high",
    "url": "https://example.com/assignment",
    "startTime": "2024-01-10T09:00:00.000Z",
    "endTime": "2024-01-10T11:00:00.000Z",
    "deadline": "2024-01-15"
  }'

# Update reflection after completion
curl -X PUT http://localhost:3000/api/cards/<cardId>/list \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "satisfactionRating": 4.5,
    "postTestGrade": 90,
    "reflectionQ1Strategy": "Used time management and elaboration",
    "reflectionQ2Confidence": 4,
    "reflectionQ3WhatLearned": "Integration by parts",
    "reflectionQ4Value": "Can apply to physics problems",
    "reflectionCompletedAt": "2024-01-10T11:30:00.000Z"
  }'

# Archive card list
curl -X PUT http://localhost:3000/api/cards/<cardId>/list/archive \
  -H "Authorization: Bearer <token>"
```