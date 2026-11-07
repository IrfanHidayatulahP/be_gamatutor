# Users API

## Endpoints

### Get User Profile
```
GET /api/users/:userId
```

**Description**: Get user profile by ID.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Response**: 200 OK
```json
{
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "username",
    "firstName": "First",
    "lastName": "Last",
    "role": "user",
    "status": "online",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: User not found

---

### Update User Profile
```
PUT /api/users/:userId
```

**Description**: Update user profile (own profile only unless admin).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Request Body** (all optional):
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| firstName | string | Max 50 chars | First name |
| lastName | string | Max 50 chars | Last name |
| username | string | Max 50 chars, unique | Username |
| status | string | 'online' or 'offline' | User status |

**Response**: 200 OK
```json
{
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "newusername",
    "firstName": "Updated",
    "lastName": "Name",
    "role": "user",
    "status": "online",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Authorization**: Users can only update their own profile. Admins can update any profile.

**Errors**:
- 401: Unauthorized
- 403: Forbidden (trying to update another user's profile)
- 404: User not found
- 400: Validation error / Username already taken

---

### Delete User (Archive)
```
DELETE /api/users/:userId
```

**Description**: Archive user account (soft delete).

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | UUID | Yes | User ID |

**Response**: 200 OK
```json
{
  "message": "User archived successfully"
}
```

**Side Effects**:
- Sets `archived = true` on user record
- Does not actually delete (preserves data integrity)

**Authorization**: Users can only archive their own account. Admins can archive any account.

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: User not found

---

### Get All Users (Admin)
```
GET /api/users
```

**Description**: List all users with pagination (admin only).

**Authentication**: Required (admin role)

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Items per page |
| offset | integer | 0 | Items to skip |

**Response**: 200 OK
```json
{
  "users": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "username": "username",
      "firstName": "First",
      "lastName": "Last",
      "role": "user",
      "status": "online",
      "archived": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

## User Model

### Fields
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| userId | UUID | No | UUIDv4 | Primary key |
| email | VARCHAR(255) | No | - | Unique, validated email |
| username | VARCHAR(50) | No | - | Unique |
| password | VARCHAR(255) | No | - | Bcrypt hashed (excluded from JSON) |
| firstName | VARCHAR(50) | Yes | null | |
| lastName | VARCHAR(50) | Yes | null | |
| role | VARCHAR(10) | No | 'user' | 'user' or 'admin' |
| status | CHAR(7) | No | 'offline' | 'online' or 'offline' |
| resetToken | TEXT | Yes | null | Password reset token |
| resetTokenExpiry | TIMESTAMPTZ | Yes | null | Reset token expiry |
| archived | BOOLEAN | No | false | Soft delete flag |
| createdAt | TIMESTAMPTZ | No | NOW | Creation timestamp |

### Relationships
- **Token** (1:M) - User tokens
- **Card** (1:M) - User's Kanban cards
- **Notification** (1:M) - User's notifications
- **Chat** (1:M) - Sent messages
- **Friendship** (1:M) - Sent friend requests
- **Friendship** (1:M) - Received friend requests
- **UserQuizResult** (1:M) - Quiz results
- **MonthlyEvaluation** (1:M) - Monthly evaluations
- **UserActivityLog** (1:M) - Activity logs
- **LlmRecommendationHistory** (1:M) - LLM recommendations
- **CardListCollab** (1:M) - Collaborations
- **CardListChat** (1:M) - Collaboration messages
- **UserAvatar** (1:1) - Avatar configuration
- **AvatarUnlock** (1:M) - Unlocked avatar components

---

## Example Usage

```bash
# Get own profile
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"

# Update profile
curl -X PUT http://localhost:3000/api/users/<userId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Updated", "lastName": "Name"}'

# Admin: List all users
curl -X GET "http://localhost:3000/api/users?limit=20&offset=0" \
  -H "Authorization: Bearer <admin-token>"
```