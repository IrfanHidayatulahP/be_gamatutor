# Gamatutor Backend API Documentation

## Overview

This document provides comprehensive API documentation for the Gamatutor Backend - an educational Kanban board platform with learning strategy assessment, gamification, collaboration features, and LLM-powered monthly evaluations.

## Base Information

| Property | Value |
|----------|-------|
| **Base URL** | `http://localhost:3000/api` (development) |
| **Protocol** | HTTPS (production) / HTTP (development) |
| **Content-Type** | `application/json` |
| **Authentication** | Bearer Token (JWT) |

## Authentication

All API endpoints (except `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, and `/health`) require authentication via JWT Bearer token.

### Header Format
```
Authorization: Bearer <access_token>
```

### Token Management
- **Access Token Expiry**: 7 days (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: Available via `/auth/refresh` endpoint
- **Token Storage**: Tokens are stored in database `token` table with expiry tracking
- **Logout**: Removes token from database (`/auth/logout`)

### Token Response Format
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

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "details": []  // Only for validation errors
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Validation Error Format
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message: "Valid email required"
    }
  ]
}
```

## Common Query Parameters

### Pagination
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of items per page (max 100) |
| `offset` | integer | 0 | Number of items to skip |

### Filtering
Endpoints support various filter parameters depending on the resource. Common filters:
- `userId` - Filter by user
- `status` - Filter by status
- `type` / `category` - Filter by type/category
- Date ranges: `fromDate`, `toDate`, `monthYear`

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Standard user | Access own resources, create cards, take quizzes, collaborate |
| `admin` | Administrator | All user permissions + manage learning strategies, prompt templates, static questions, avatar components, view all data |

### Admin-Only Endpoints
- `POST/PUT/DELETE /api/learning-strats`
- `POST/PUT/DELETE /api/llm-prompt-templates`
- `POST/PUT/DELETE /api/mslq-static-questions`
- `POST/PUT/DELETE /api/avatar-components`
- `GET /api/user-quiz-results` (list all)
- `GET /api/monthly-evaluations` (list all)
- `GET /api/user-activity-logs` (list all)
- `GET /api/llm-recommendation-histories` (list all)

## API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Authentication | `/auth` | Register, login, token management, password reset |
| Users | `/users` | User profile management |
| Cards | `/cards` | Kanban card management |
| Card Lists | `/cards/:cardId/list` | Card details with learning strategies |
| Learning Strategies | `/learning-strats` | Learning strategy catalog |
| Column Movements | `/column-movements` | Kanban column transition tracking |
| Notifications | `/notifications` | Multi-type notification system |
| Chat | `/chat` | Direct messaging |
| Friendships | `/friendships` | Social connections |
| LLM Prompt Templates | `/llm-prompt-templates` | Admin: Dynamic system prompts |
| MSLQ Static Questions | `/mslq-static-questions` | Admin: Fallback quiz questions |
| User Quiz Results | `/user-quiz-results` | MSLQ assessment results |
| Monthly Evaluations | `/monthly-evaluations` | LLM-powered monthly sync check |
| Card Collaboration | `/card-list-collab` | Card sharing & collaboration |
| Card List Chat | `/card-list-chat` | Collaboration messaging |
| User Activity Logs | `/user-activity-logs` | Activity tracking for LLM analysis |
| LLM Recommendation History | `/llm-recommendation-histories` | LLM recommendation audit trail |
| Avatar Components | `/avatar-components` | Admin: Avatar asset management |
| User Avatar | `/user-avatar` | User avatar configuration |
| Avatar Unlocks | `/avatar-unlocks` | Gamification unlock system |

## Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests/minute per user for standard endpoints
- 10 requests/minute for auth endpoints

## Versioning

API versioning not currently implemented. All endpoints at `/api/`. Future versions should use `/api/v1/`, `/api/v2/` pattern.

## Conventions

### Naming
- **Paths**: kebab-case (`/user-quiz-results`)
- **Parameters**: camelCase in query/body, snake_case in database
- **Response fields**: camelCase

### Dates
- **Request**: ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Response**: ISO 8601 format
- **Date-only**: `YYYY-MM-DD` (for deadlines)

### UUIDs
All resource IDs use UUID v4 format.

### JSON Bodies
- **Request**: Only include fields being updated (partial updates supported)
- **Response**: Full object with all fields

## Related Documentation

- [Authentication API](auth.md)
- [Users API](users.md)
- [Cards API](cards.md)
- [Learning Strategies API](learning-strats.md)
- [Column Movements API](column-movements.md)
- [Notifications API](notifications.md)
- [Chat API](chat.md)
- [Friendships API](friendships.md)
- [LLM Prompt Templates API](llm-prompt-templates.md)
- [MSLQ Static Questions API](mslq-static-questions.md)
- [User Quiz Results API](user-quiz-results.md)
- [Monthly Evaluations API](monthly-evaluations.md)
- [Card Collaboration API](card-list-collab.md)
- [Card List Chat API](card-list-chat.md)
- [User Activity Logs API](user-activity-logs.md)
- [LLM Recommendation History API](llm-recommendation-histories.md)
- [Avatar Components API](avatar-components.md)
- [User Avatar API](user-avatar.md)
- [Avatar Unlocks API](avatar-unlocks.md)