# User Avatar API

## Overview

User avatar configuration - combines unlocked components into a complete avatar. Users can only use components they have unlocked.

## Endpoints

### Get User Avatar
```
GET /api/user-avatar
```

**Description**: Get authenticated user's current avatar configuration.

**Authentication**: Required

**Response**: 200 OK
```json
{
  "avatar": {
    "userId": "uuid",
    "hairId": "uuid",
    "faceId": "uuid",
    "shirtId": "uuid",
    "pantsId": "uuid",
    "specialId": "uuid",
    "updatedAt": "2024-01-10T10:00:00.000Z",
    "hair": {
      "avaId": "uuid",
      "name": "Long Blue Hair",
      "assetPath": "/assets/avatar/hair/long_blue.png"
    },
    "face": {
      "avaId": "uuid",
      "name": "Glasses",
      "assetPath": "/assets/avatar/face/glasses.png"
    },
    "shirt": {
      "avaId": "uuid",
      "name": "Hoodie",
      "assetPath": "/assets/avatar/shirt/hoodie.png"
    },
    "pants": {
      "avaId": "uuid",
      "name": "Jeans",
      "assetPath": "/assets/avatar/pants/jeans.png"
    },
    "special": {
      "avaId": "uuid",
      "name": "Golden Aura",
      "assetPath": "/assets/avatar/special/aura_gold.png"
    }
  }
}
```

**Note**: If user has no avatar record, one is created automatically with empty slots.

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Update User Avatar
```
PUT /api/user-avatar
```

**Description**: Update avatar configuration with unlocked components.

**Authentication**: Required

**Request Body** (all optional):
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| hairId | UUID | Must be unlocked, category=hair | Hair component |
| faceId | UUID | Must be unlocked, category=face | Face component |
| shirtId | UUID | Must be unlocked, category=shirt | Shirt component |
| pantsId | UUID | Must be unlocked, category=pants | Pants component |
| specialId | UUID | Must be unlocked, category=special | Special component |

**Response**: 200 OK
```json
{
  "avatar": {
    "userId": "uuid",
    "hairId": "uuid",
    "faceId": "uuid",
    "shirtId": "uuid",
    "pantsId": "uuid",
    "specialId": "uuid",
    "updatedAt": "2024-01-10T10:30:00.000Z",
    "hair": { ... },
    "face": { ... },
    "shirt": { ... },
    "pants": { ... },
    "special": { ... }
  }
}
```

**Validation**:
- Component must exist in AvatarComponent table
- Component category must match slot (hairId → hair category)
- User must have unlocked the component (AvatarUnlock record exists)

**Errors**:
- 400: Validation error / Component not unlocked / Invalid category
- 401: Unauthorized
- 404: User not found / Component not found

---

## UserAvatar Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| userId | UUID | No | - | PK + FK to users |
| hairId | UUID | Yes | null | FK to avatar_components (hair) |
| faceId | UUID | Yes | null | FK to avatar_components (face) |
| shirtId | UUID | Yes | null | FK to avatar_components (shirt) |
| pantsId | UUID | Yes | null | FK to avatar_components (pants) |
| specialId | UUID | Yes | null | FK to avatar_components (special) |
| updatedAt | TIMESTAMPTZ | No | NOW | Last update |

### Relationships
- **User** (1:1) - Avatar owner
- **AvatarComponent** (M:1) - Hair
- **AvatarComponent** (M:1) - Face
- **AvatarComponent** (M:1) - Shirt
- **AvatarComponent** (M:1) - Pants
- **AvatarComponent** (M:1) - Special

---

## Avatar Composition

The avatar is composed by layering components in this order (back to front):
1. **Special** (background effects)
2. **Pants** (lower body)
3. **Shirt** (upper body)
4. **Face** (facial features)
5. **Hair** (hairstyle)
6. **Head** (headwear - if implemented)

Frontend renders by composing these layers with the assetPath as image sources.

---

## Default Avatar

New users start with empty avatar (all slots null). Frontend should show base/default avatar when slots are empty.

---

## Example Usage

```bash
# Get current avatar
curl -X GET http://localhost:3000/api/user-avatar \
  -H "Authorization: Bearer <token>"

# Update avatar (equip unlocked components)
curl -X PUT http://localhost:3000/api/user-avatar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hairId": "<hair-component-uuid>",
    "faceId": "<face-component-uuid>",
    "shirtId": "<shirt-component-uuid>",
    "pantsId": "<pants-component-uuid>",
    "specialId": "<special-component-uuid>"
  }'

# Equip just hair
curl -X PUT http://localhost:3000/api/user-avatar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"hairId": "<hair-component-uuid>"}'
```