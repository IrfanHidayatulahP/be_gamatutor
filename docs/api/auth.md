# Authentication API

## Endpoints

### Register User
```
POST /api/auth/register
```

**Description**: Register a new user account.

**Authentication**: None required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | string | Yes | Valid email, unique | User email address |
| password | string | Yes | 6-16 characters | User password |
| firstName | string | No | Max 50 chars | First name |
| lastName | string | No | Max 50 chars | Last name |
| username | string | No | Max 50 chars, unique | Username (auto-generated from email if not provided) |
| role | string | No | 'user' or 'admin' | Default: 'user' |
| status | string | No | 'online' or 'offline' | Default: 'online' |

**Response**: 201 Created
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
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- 400: Email already registered
- 400: Validation error

---

### Login User
```
POST /api/auth/login
```

**Description**: Authenticate user and receive access token.

**Authentication**: None required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | string | Yes | Valid email | User email |
| password | string | Yes | Not empty | User password |

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
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Side Effects**:
- Updates user status to 'online'
- Creates new token record in database

**Errors**:
- 401: Invalid credentials
- 400: Validation error

---

### Get Current User
```
GET /api/auth/me
```

**Description**: Get authenticated user's profile.

**Authentication**: Required (Bearer token)

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
- 401: No token provided / Token expired / Invalid token / User not found

---

### Logout User
```
POST /api/auth/logout
```

**Description**: Logout user by revoking current token.

**Authentication**: Required (Bearer token)

**Response**: 200 OK
```json
{
  "message": "Logged out successfully"
}
```

**Side Effects**:
- Removes current token from database token table

**Errors**:
- 401: No token provided / Token expired / Invalid token

---

### Refresh Token
```
POST /api/auth/refresh
```

**Description**: Generate new access token and invalidate old ones.

**Authentication**: Required (Bearer token)

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
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Side Effects**:
- Deletes all existing tokens for user
- Creates new token with 7-day expiry

**Errors**:
- 401: No token provided / Token expired / Invalid token / User not found

---

### Forgot Password
```
POST /api/auth/forgot-password
```

**Description**: Request password reset token.

**Authentication**: None required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | string | Yes | Valid email | User email |

**Response**: 200 OK
```json
{
  "message": "If the email exists, a reset link has been sent",
  "resetToken": "uuid"  // Only in development mode
}
```

**Note**: Always returns success message for security (prevents email enumeration). In development, returns reset token for testing.

**Errors**:
- 400: Validation error

---

### Reset Password
```
POST /api/auth/reset-password
```

**Description**: Reset password using reset token.

**Authentication**: None required

**Request Body**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| resetToken | string | Yes | Valid UUID | Reset token from email |
| newPassword | string | Yes | 6-16 characters | New password |

**Response**: 200 OK
```json
{
  "message": "Password reset successful"
}
```

**Side Effects**:
- Updates user password (hashed with bcrypt, 12 rounds)
- Clears reset token and expiry
- Revokes all existing tokens for user (forces re-login)

**Errors**:
- 400: Invalid or expired reset token
- 400: Validation error

---

## Token Security

### JWT Payload
```json
{
  "id": "user-uuid",
  "iat": 1704067200,
  "exp": 1704672000
}
```

### Token Storage
Tokens are stored in the `token` table with:
- `accessToken`: The JWT string
- `accessTokenExpiry`: Expiration timestamp (7 days from creation)
- `userId`: Foreign key to user

### Token Validation Flow
1. Extract token from `Authorization: Bearer <token>` header
2. Verify JWT signature and expiration
3. Look up token in database token table
4. Verify token exists and not expired in database
5. Attach user to request object

---

## Password Requirements

- Minimum 6 characters
- Maximum 16 characters
- Hashed with bcrypt (12 rounds) before storage
- Never returned in API responses (excluded in User.toJSON())

---

## User Status

| Status | Description |
|--------|-------------|
| `online` | User is active (set on login) |
| `offline` | User is inactive (default on register) |

---

## Example Usage

### Register and Login Flow
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "firstName": "John", "lastName": "Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Use token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

### Password Reset Flow
```bash
# Request reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Reset password (with token from email/dev response)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"resetToken": "uuid-from-email", "newPassword": "newpassword123"}'
```