# Avatar Components API (Admin)

## Overview

Admin-managed avatar component library. Components are categorized and used for user avatar customization through the unlock system.

## Categories

| Category | Description | Example Assets |
|----------|-------------|----------------|
| `head` | Head shapes/accessories | Hats, headbands, glasses |
| `hair` | Hairstyles | Short, long, curly, colors |
| `face` | Facial features | Eyes, expressions, facial hair |
| `shirt` | Upper body clothing | T-shirts, hoodies, jackets |
| `pants` | Lower body clothing | Jeans, shorts, skirts |
| `special` | Special effects/items | Auras, pets, backgrounds |

## Endpoints

### Create Avatar Component (Admin)
```
POST /api/avatar-components
```

**Description**: Add a new avatar component to the library.

**Authentication**: Required (admin role)

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| category | string | Yes | head/hair/face/shirt/pants/special | Component category |
| name | string | Yes | Not empty, max 50 | Component name |
| assetPath | string | Yes | Not empty | Path/URL to asset file |

**Response**: 201 Created
```json
{
  "component": {
    "avaId": "uuid",
    "category": "hair",
    "name": "Long Blue Hair",
    "assetPath": "/assets/avatar/hair/long_blue.png",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 400: Validation error / Invalid category
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

### Get All Avatar Components
```
GET /api/avatar-components
```

**Description**: List all avatar components with filters.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| limit | integer | Default: 100 |
| offset | integer | Default: 0 |

**Response**: 200 OK
```json
{
  "components": [
    {
      "avaId": "uuid",
      "category": "hair",
      "name": "Long Blue Hair",
      "assetPath": "/assets/avatar/hair/long_blue.png",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "avaId": "uuid",
      "category": "shirt",
      "name": "Hoodie",
      "assetPath": "/assets/avatar/shirt/hoodie.png",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**:
- 401: Unauthorized

---

### Get Component by ID
```
GET /api/avatar-components/:id
```

**Description**: Get a specific avatar component.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Component ID |

**Response**: 200 OK
```json
{
  "component": { ... }
}
```

**Errors**:
- 401: Unauthorized
- 404: Component not found

---

### Get Components by Category
```
GET /api/avatar-components/category/:category
```

**Description**: Get all components in a category.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | Yes | Category (head/hair/face/shirt/pants/special) |

**Response**: 200 OK
```json
{
  "components": [
    { "avaId": "uuid", "category": "hair", "name": "Long Blue Hair", ... },
    { "avaId": "uuid", "category": "hair", "name": "Short Red Hair", ... }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 400: Invalid category

---

### Update Avatar Component (Admin)
```
PUT /api/avatar-components/:id
```

**Description**: Update an avatar component.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Component ID |

**Request Body** (all optional):
| Field | Type | Description |
|-------|------|-------------|
| category | string | Category |
| name | string | Component name |
| assetPath | string | Asset path |

**Response**: 200 OK
```json
{
  "component": { ... updated ... }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Component not found

---

### Delete Avatar Component (Admin)
```
DELETE /api/avatar-components/:id
```

**Description**: Delete an avatar component.

**Authentication**: Required (admin role)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Component ID |

**Response**: 200 OK
```json
{
  "message": "Avatar component deleted"
}
```

**Note**: Cannot delete if referenced by UserAvatar or AvatarUnlock (foreign key constraint).

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Component not found
- 400: Referenced resource

---

## AvatarComponent Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| avaId | UUID | No | UUIDv4 | Primary key |
| category | VARCHAR(10) | No | - | head/hair/face/shirt/pants/special |
| name | VARCHAR(50) | No | - | Display name |
| assetPath | TEXT | No | - | File path or URL |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |

### Relationships
- **UserAvatar** (1:M) - Via hairId, faceId, shirtId, pantsId, specialId
- **AvatarUnlock** (1:M) - Unlock records

---

## Asset Organization

Recommended file structure:
```
/assets/avatar/
  /head/
    cap.png
    headband.png
  /hair/
    long_blue.png
    short_red.png
    curly_brown.png
  /face/
    glasses.png
    beard.png
    freckles.png
  /shirt/
    tshirt.png
    hoodie.png
    jacket.png
  /pants/
    jeans.png
    shorts.png
    skirt.png
  /special/
    aura_gold.png
    pet_cat.png
    background_stars.png
```

---

## Example Usage

```bash
# Admin: Add component
curl -X POST http://localhost:3000/api/avatar-components \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "hair",
    "name": "Long Blue Hair",
    "assetPath": "/assets/avatar/hair/long_blue.png"
  }'

# Get all hair components
curl -X GET "http://localhost:3000/api/avatar-components/category/hair" \
  -H "Authorization: Bearer <token>"

# Get all components for avatar builder UI
curl -X GET "http://localhost:3000/api/avatar-components?limit=200" \
  -H "Authorization: Bearer <token>"
```