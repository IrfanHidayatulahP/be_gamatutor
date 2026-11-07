# Flutter Frontend Data Documentation
## Backend Kanban - Express.js MVC (Sequelize + PostgreSQL)

**Base URL**: `http://localhost:3000/api`  
**Content-Type**: `application/json`  
**Authentication**: Bearer Token (JWT)

---

## 1. Authentication Flow

### 1.1 Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}
```

**Response (201):**
```json
{
    "user": {
        "userId": "57a5522d-ff32-4259-b4de-c51555698bab",
        "archived": false,
        "createdAt": "2026-09-30T09:24:25.580Z",
        "email": "superadmin123@gmail.com",
        "firstName": "super",
        "lastName": "admin",
        "username": "superadmin123",
        "role": "admin",
        "status": "online "
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU3YTU1MjJkLWZmMzItNDI1OS1iNGRlLWM1MTU1NTY5OGJhYiIsImlhdCI6MTc5MDc2MDI2NSwiZXhwIjoxNzkxMzY1MDY1fQ.fNiSxMC034kl225w1jhnzuhoR0rf3ubEtk-3dKPkcAI"
}
```

### 1.2 Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": { ... }, // Same as register response
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "accessTokenExpiry": "2024-01-22T10:30:00.000Z"
}
```

### 1.3 Get Current User
**GET** `/auth/me`  
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": { ... }
}
```

### 1.4 Refresh Token
**POST** `/auth/refresh`  
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "accessTokenExpiry": "2024-01-22T10:30:00.000Z"
}
```

### 1.5 Logout
**POST** `/auth/logout`  
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

### 1.6 Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{ "email": "user@example.com" }
```

### 1.7 Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "resetToken": "uuid",
  "newPassword": "newpassword123"
}
```

---

## 2. Data Models (DTOs)

### 2.1 User
```dart
class User {
  final String userId;
  final String email;
  final String? firstName;
  final String? lastName;
  final String username;
  final String role; // 'user' | 'admin'
  final String status; // 'online' | 'offline'
  final bool archived;
  final DateTime createdAt;
}
```

### 2.2 Token
```dart
class Token {
  final String tokenId;
  final String userId;
  final String? accessToken;
  final DateTime? accessTokenExpiry;
}
```

### 2.3 Card
```dart
class Card {
  final String cardId;
  final String userId;
  final String title;
  // No createdAt in model
  final CardList? cardList; // 1:1 relation
  final List<ColumnMovement>? columnMovements;
}
```

### 2.4 CardList (Card Details)
```dart
class CardList {
  final String cardId; // PK + FK to cards
  final String learningId;
  final String? subTitle;
  final String? description;
  final String? courseName;
  final String difficulty; // 'easy' | 'medium' | 'hard' | 'expert'
  final String priority; // 'low' | 'medium' | 'high' | 'critical'
  final DateTime deadline;
  final String url;
  final DateTime startTime;
  final DateTime? endTime;
  final bool deleted;
  
  // Self-reflection fields
  final double? satisfactionRating;
  final String? notes;
  final int? preTestGrade;
  final int? postTestGrade;
  final String? reflectionQ1Strategy;
  final double? reflectionQ2Confidence;
  final String? reflectionQ3WhatLearned;
  final String? reflectionQ4Value;
  final DateTime? reflectionCompletedAt;
  final double? personalBestTime;
  final double? personalBestGrade;
  final DateTime? personalBestAchievedAt;
  final double? goalCheckRating;
  final DateTime? goalCheckTimestamp;
  
  // Relations
  final LearningStrat? learningStrat;
  final List<CardListCollab>? collaborations;
}
```

### 2.5 LearningStrat
```dart
class LearningStrat {
  final String learningId;
  final String keyCode; // 'time_management', 'organization', etc.
  final String learningStrategy; // 'Rehearsal' | 'Organization' | 'Elaboration' | 'Time Management' | 'Help-Seeking' | 'Metacognitive Self-Regulation'
  final String? description;
  final DateTime? createdAt;
  final List<CardList>? cardLists;
}
```

### 2.6 ColumnMovement
```dart
class ColumnMovement {
  final String ccmId;
  final String cardId;
  final String? fromColumn;
  final String? toColumn;
  final DateTime? timestamp;
  final bool completed;
}
```

### 2.7 Notification
```dart
class Notification {
  final String notifId;
  final String userId;
  final String type; // 'push' | 'smart_reminder' | 'social_presence' | 'encouragement'
  final String? title;
  final String message;
  final DateTime? sentAt;
  final bool delivered;
  final String? deliveryError;
  final DateTime? scheduledFor;
  final String? reminderReason;
  final String? triggerAction;
  final String? triggerUserId;
  final bool read;
  final DateTime? readAt;
  final bool clicked;
  final DateTime? clickedAt;
  final DateTime createdAt;
}
```

### 2.8 Chat (Direct Messages)
```dart
class Chat {
  final String chatId;
  final String userId; // sender
  final String friendId; // recipient
  final String messageChat;
  final DateTime timeChat;
}
```

### 2.9 Friendship
```dart
class Friendship {
  final String fsId;
  final String userId; // requester
  final String friendId; // recipient
  final String status; // 'pending' | 'accepted' | 'blocked'
  final DateTime createdAt;
  final DateTime updatedAt;
}
```

### 2.9 LlmPromptTemplate
```dart
class LlmPromptTemplate {
  final String promptId;
  final String templateName; // 'mslq_quiz_generator' | 'monthly_evaluation' | 'initial_recommendation'
  final int version;
  final String systemPrompt;
  final bool isActive;
  final DateTime createdAt;
}
```

### 2.10 MslqStaticQuestion
```dart
class MslqStaticQuestion {
  final String staticQId;
  final String category;
  final String questionText;
  final Map<String, dynamic> options; // JSONB
  final DateTime createdAt;
}
```

### 2.11 UserQuizResult
```dart
class UserQuizResult {
  final String quizResultId;
  final String userId;
  final String dominantStrategy;
  final String userProfile;
  final List<String> unlockedFeatures; // JSONB array
  final List<String> lockedFeatures; // JSONB array
  final Map<String, dynamic> answersPayload; // JSONB
  final DateTime createdAt;
  final DateTime updatedAt;
}
```

### 2.12 MonthlyEvaluation
```dart
class MonthlyEvaluation {
  final String evalId;
  final String userId;
  final String monthYear; // 'MM-YYYY'
  final bool isSynchronized;
  final bool requiresQuizRetake;
  final List<Map<String, dynamic>> detectedIssues; // JSONB array
  final String llmFeedback;
  final DateTime? resolvedAt;
  final DateTime createdAt;
}
```

### 2.13 CardListCollab
```dart
class CardListCollab {
  final String collabId;
  final String cardId;
  final String userId;
  final String role; // 'owner' | 'member'
  final DateTime addedAt;
}
```

### 2.14 CardListChat
```dart
class CardListChat {
  final String chatColabId;
  final String collabId;
  final String userId;
  final String message;
  final DateTime sentAt;
}
```

### 2.15 UserActivityLog
```dart
class UserActivityLog {
  final String logId;
  final String userId;
  final String activityType; // 'CARD_MOVED' | 'CHAT_SENT' | 'REFLECTIONS_COMPLETED' | ...
  final String? refId; // UUID reference to card/chat/ccm
  final Map<String, dynamic>? metadata; // JSONB: {"from": "Planning", "to": "Progress"}
  final DateTime createdAt;
}
```

### 2.16 LlmRecommendationHistory
```dart
class LlmRecommendationHistory {
  final String recId;
  final String userId;
  final String triggerType; // 'INITIAL_RECOMMENDATION' | 'MONTHLY_EVAL' | 'QUIZ_RESULT' | 'ON_DEMAND'
  final Map<String, dynamic> inputContext; // JSONB: { logs: [...], quiz: {...} }
  final Map<String, dynamic> llmOutput; // JSONB: { recommendations: [...], priority: "high" }
  final DateTime createdAt;
}
```

### 2.17 AvatarComponent
```dart
class AvatarComponent {
  final String avaId;
  final String category; // 'head' | 'hair' | 'face' | 'shirt' | 'pants' | 'special'
  final String name;
  final String assetPath;
  final DateTime createdAt;
}
```

### 2.18 UserAvatar
```dart
class UserAvatar {
  final String userId; // PK + FK to users
  final String? hairId;
  final String? faceId;
  final String? shirtId;
  final String? pantsId;
  final String? specialId;
  final DateTime updatedAt;
  
  // Populated via joins
  final AvatarComponent? hair;
  final AvatarComponent? face;
  final AvatarComponent? shirt;
  final AvatarComponent? pants;
  final AvatarComponent? special;
}
```

### 2.19 AvatarUnlock
```dart
class AvatarUnlock {
  final String avaUnId;
  final String userId;
  final String componentId;
  final DateTime unlockedAt;
}
```

---

## 3. API Endpoints with Request/Response

### 3.1 Users
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| GET | `/users` | Query: `limit`, `offset` | `{ users: User[] }` |
| GET | `/users/username/:username` | - | `{ user: User }` |
| GET | `/users/:email` | - | `{ user: User }` |
| PUT | `/users/:id` | Partial<User> | `{ user: User }` |
| PUT | `/users/:id/status` | `{ status: 'online' \| 'offline' }` | `{ user: User }` |
| DELETE | `/users/:id` | - | `{ message: 'User deleted' }` |

### 3.2 Cards
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/cards` | `{ title: string }` | `{ card: Card }` |
| GET | `/cards` | Query: `userId`, `limit`, `offset` | `{ cards: Card[] }` |
| GET | `/cards/:id` | - | `{ card: Card }` |
| PUT | `/cards/:id` | `{ title: string }` | `{ card: Card }` |
| DELETE | `/cards/:id` | - | `{ message: 'Card deleted' }` |
| GET | `/cards/user/:userId` | - | `{ cards: Card[] }` |

### 3.3 Card Lists (Card Details)
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/cards/:cardId/list` | CardListInput | `{ cardList: CardList }` |
| GET | `/cards/:cardId/list` | - | `{ cardList: CardList }` |
| PUT | `/cards/:cardId/list` | Partial<CardListInput> | `{ cardList: CardList }` |
| DELETE | `/cards/:cardId/list` | - | `{ message: 'Card list deleted' }` |
| PUT | `/cards/:cardId/list/archive` | - | `{ cardList: CardList }` |
| PUT | `/cards/:cardId/list/restore` | - | `{ cardList: CardList }` |

**CardListInput:**
```json
{
  "learningId": "uuid",
  "subTitle": "string",
  "description": "string",
  "courseName": "string",
  "difficulty": "easy|medium|hard|expert",
  "priority": "low|medium|high|critical",
  "deadline": "ISO8601",
  "url": "string",
  "startTime": "ISO8601",
  "endTime": "ISO8601?",
  "satisfactionRating": "number?",
  "notes": "string?",
  "preTestGrade": "number?",
  "postTestGrade": "number?",
  "reflectionQ1Strategy": "string?",
  "reflectionQ2Confidence": "number?",
  "reflectionQ3WhatLearned": "string?",
  "reflectionQ4Value": "string?",
  "personalBestTime": "number?",
  "personalBestGrade": "number?",
  "goalCheckRating": "number?"
}
```

### 3.4 Learning Strategies
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/learning-strats` | `{ learningStrategy, description? }` | `{ learningStrat: LearningStrat }` |
| GET | `/learning-strats` | Query: `limit`, `offset` | `{ learningStrats: LearningStrat[] }` |
| GET | `/learning-strats/:id` | - | `{ learningStrat: LearningStrat }` |
| PUT | `/learning-strats/:id` | Partial<LearningStrat> | `{ learningStrat: LearningStrat }` |
| DELETE | `/learning-strats/:id` | - | `{ message: 'Learning strategy deleted' }` |

### 3.5 Column Movements
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/column-movements` | `{ cardId, fromColumn?, toColumn? }` | `{ columnMovement: ColumnMovement }` |
| GET | `/column-movements` | Query: `cardId`, `limit`, `offset` | `{ columnMovements: ColumnMovement[] }` |
| GET | `/column-movements/:id` | - | `{ columnMovement: ColumnMovement }` |
| GET | `/column-movements/card/:cardId` | - | `{ columnMovements: ColumnMovement[] }` |
| PUT | `/column-movements/:id/complete` | - | `{ columnMovement: ColumnMovement }` |

### 3.6 Notifications
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/notifications` | NotificationInput | `{ notification: Notification }` |
| GET | `/notifications` | Query: `userId`, `type`, `read`, `limit`, `offset` | `{ notifications: Notification[] }` |
| GET | `/notifications/:id` | - | `{ notification: Notification }` |
| PUT | `/notifications/:id/read` | - | `{ notification: Notification }` |
| PUT | `/notifications/:id/click` | - | `{ notification: Notification }` |
| PUT | `/notifications/read-all` | `{ userId }` | `{ message: 'All marked as read' }` |
| DELETE | `/notifications/:id` | - | `{ message: 'Notification deleted' }` |

### 3.7 Chat (Direct Messages)
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/chat` | `{ friendId, messageChat }` | `{ chat: Chat }` |
| GET | `/chat` | Query: `userId`, `friendId`, `limit`, `offset` | `{ chats: Chat[] }` |
| GET | `/chat/:id` | - | `{ chat: Chat }` |
| GET | `/chat/user/:userId` | - | `{ chats: Chat[] }` |
| PUT | `/chat/:id` | `{ messageChat }` | `{ chat: Chat }` |
| DELETE | `/chat/:id` | - | `{ message: 'Chat deleted' }` |

### 3.8 Friendships
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/friendships` | `{ friendId }` | `{ friendship: Friendship }` |
| GET | `/friendships` | Query: `userId`, `status`, `limit`, `offset` | `{ friendships: Friendship[] }` |
| GET | `/friendships/:email` | - | `{ friendship: Friendship }` |
| PUT | `/friendships/:id/accept` | - | `{ friendship: Friendship }` |
| PUT | `/friendships/:id/block` | - | `{ friendship: Friendship }` |
| PUT | `/friendships/:id/reject` | - | `{ friendship: Friendship }` |
| DELETE | `/friendships/:id` | - | `{ message: 'Friendship removed' }` |
| GET | `/friendships/user/:userId` | - | `{ friendships: Friendship[] }` |
| GET | `/friendships/pending/:userId` | - | `{ friendships: Friendship[] }` |

### 3.9 LLM Prompt Templates (Admin)
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/llm-prompt-templates` | `{ templateName, systemPrompt, version?, isActive? }` | `{ template: LlmPromptTemplate }` |
| GET | `/llm-prompt-templates` | - | `{ templates: LlmPromptTemplate[] }` |
| GET | `/llm-prompt-templates/name/:templateName` | - | `{ template: LlmPromptTemplate }` |
| GET | `/llm-prompt-templates/:id` | - | `{ template: LlmPromptTemplate }` |
| PUT | `/llm-prompt-templates/:id` | Partial<Template> | `{ template: LlmPromptTemplate }` |
| DELETE | `/llm-prompt-templates/:id` | - | `{ message: 'Template deleted' }` |

### 3.10 MSLQ Static Questions (Admin)
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/mslq-static-questions` | `{ category, questionText, options }` | `{ question: MslqStaticQuestion }` |
| GET | `/mslq-static-questions` | Query: `category`, `limit`, `offset` | `{ questions: MslqStaticQuestion[] }` |
| GET | `/mslq-static-questions/category/:category` | - | `{ questions: MslqStaticQuestion[] }` |
| GET | `/mslq-static-questions/:id` | - | `{ question: MslqStaticQuestion }` |
| PUT | `/mslq-static-questions/:id` | Partial<Question> | `{ question: MslqStaticQuestion }` |
| DELETE | `/mslq-static-questions/:id` | - | `{ message: 'Question deleted' }` |

### 3.11 User Quiz Results
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/user-quiz-results` | UserQuizResultInput | `{ quizResult: UserQuizResult }` |
| GET | `/user-quiz-results` | Query: `userId`, `limit`, `offset` | `{ quizResults: UserQuizResult[] }` |
| GET | `/user-quiz-results/latest/:userId` | - | `{ quizResult: UserQuizResult }` |
| GET | `/user-quiz-results/user/:userId` | - | `{ quizResults: UserQuizResult[] }` |
| GET | `/user-quiz-results/:id` | - | `{ quizResult: UserQuizResult }` |
| PUT | `/user-quiz-results/:id` | Partial<QuizResult> | `{ quizResult: UserQuizResult }` |
| DELETE | `/user-quiz-results/:id` | - | `{ message: 'Quiz result deleted' }` |

**UserQuizResultInput:**
```json
{
  "dominantStrategy": "string",
  "userProfile": "string",
  "unlockedFeatures": ["string"],
  "lockedFeatures": ["string"],
  "answersPayload": { "q1": "A", "q2": "B" }
}
```

### 3.12 Monthly Evaluations
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/monthly-evaluations` | MonthlyEvaluationInput | `{ evaluation: MonthlyEvaluation }` |
| GET | `/monthly-evaluations` | Query: `limit`, `offset` | `{ evaluations: MonthlyEvaluation[] }` |
| GET | `/monthly-evaluations/user/:userId` | - | `{ evaluations: MonthlyEvaluation[] }` |
| GET | `/monthly-evaluations/user/:userId/month/:monthYear` | - | `{ evaluation: MonthlyEvaluation }` |
| GET | `/monthly-evaluations/:id` | - | `{ evaluation: MonthlyEvaluation }` |
| PUT | `/monthly-evaluations/:id` | Partial<Evaluation> | `{ evaluation: MonthlyEvaluation }` |
| DELETE | `/monthly-evaluations/:id` | - | `{ message: 'Evaluation deleted' }` |

**MonthlyEvaluationInput:**
```json
{
  "monthYear": "MM-YYYY",
  "isSynchronized": true,
  "requiresQuizRetake": false,
  "detectedIssues": [{ "type": "string", "detail": "string" }],
  "llmFeedback": "string"
}
```

### 3.13 Card List Collaboration
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/card-list-collab/card/:cardId` | `{ userId, role? }` | `{ collab: CardListCollab }` |
| GET | `/card-list-collab` | Query: `cardId`, `userId` | `{ collaborations: CardListCollab[] }` |
| GET | `/card-list-collab/card/:cardId` | - | `{ collaborations: CardListCollab[] }` |
| GET | `/card-list-collab/user/:userId` | - | `{ collaborations: CardListCollab[] }` |
| GET | `/card-list-collab/:id` | - | `{ collab: CardListCollab }` |
| PUT | `/card-list-collab/:id/role` | `{ role: 'owner'|'member' }` | `{ collab: CardListCollab }` |
| DELETE | `/card-list-collab/:id` | - | `{ message: 'Collaborator removed' }` |

### 3.14 Card List Chat
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/card-list-chat/collab/:collabId` | `{ message }` | `{ chat: CardListChat }` |
| GET | `/card-list-chat` | Query: `collabId`, `limit`, `offset` | `{ chats: CardListChat[] }` |
| GET | `/card-list-chat/collab/:collabId` | - | `{ chats: CardListChat[] }` |
| GET | `/card-list-chat/:id` | - | `{ chat: CardListChat }` |
| PUT | `/card-list-chat/:id` | `{ message }` | `{ chat: CardListChat }` |
| DELETE | `/card-list-chat/:id` | - | `{ message: 'Message deleted' }` |

### 3.15 User Activity Logs
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/user-activity-logs` | `{ activityType, refId?, metadata? }` | `{ log: UserActivityLog }` |
| GET | `/user-activity-logs` | Query: `userId`, `activityType`, `limit`, `offset` | `{ logs: UserActivityLog[] }` |
| GET | `/user-activity-logs/user/:userId` | - | `{ logs: UserActivityLog[] }` |
| GET | `/user-activity-logs/type/:activityType` | - | `{ logs: UserActivityLog[] }` |
| GET | `/user-activity-logs/:id` | - | `{ log: UserActivityLog }` |
| DELETE | `/user-activity-logs/:id` | - | `{ message: 'Log deleted' }` |

**Activity Types:** `CARD_MOVED`, `CHAT_SENT`, `REFLECTIONS_COMPLETED`, `QUIZ_COMPLETED`, `CARD_CREATED`, `CARD_UPDATED`, `COLLABORATION_STARTED`

### 3.16 LLM Recommendation Histories
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/llm-recommendation-histories` | `{ triggerType, inputContext, llmOutput }` | `{ history: LlmRecommendationHistory }` |
| GET | `/llm-recommendation-histories` | Query: `userId`, `triggerType`, `limit`, `offset` | `{ histories: LlmRecommendationHistory[] }` |
| GET | `/llm-recommendation-histories/user/:userId` | - | `{ histories: LlmRecommendationHistory[] }` |
| GET | `/llm-recommendation-histories/trigger/:triggerType` | - | `{ histories: LlmRecommendationHistory[] }` |
| GET | `/llm-recommendation-histories/:id` | - | `{ history: LlmRecommendationHistory }` |
| DELETE | `/llm-recommendation-histories/:id` | - | `{ message: 'History deleted' }` |

**Trigger Types:** `INITIAL_RECOMMENDATION`, `MONTHLY_EVAL`, `QUIZ_RESULT`, `ON_DEMAND`

### 3.17 Avatar Components (Admin)
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/avatar-components` | `{ category, name, assetPath }` | `{ component: AvatarComponent }` |
| GET | `/avatar-components` | Query: `category` | `{ components: AvatarComponent[] }` |
| GET | `/avatar-components/category/:category` | - | `{ components: AvatarComponent[] }` |
| GET | `/avatar-components/:id` | - | `{ component: AvatarComponent }` |
| PUT | `/avatar-components/:id` | Partial<Component> | `{ component: AvatarComponent }` |
| DELETE | `/avatar-components/:id` | - | `{ message: 'Component deleted' }` |

### 3.18 User Avatar
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| GET | `/user-avatar` | Headers: Auth | `{ avatar: UserAvatar }` |
| PUT | `/user-avatar` | `{ hairId?, faceId?, shirtId?, pantsId?, specialId? }` | `{ avatar: UserAvatar }` |

### 3.19 Avatar Unlocks
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/avatar-unlocks` | `{ componentId }` | `{ unlock: AvatarUnlock }` |
| GET | `/avatar-unlocks` | Query: `userId`, `componentId` | `{ unlocks: AvatarUnlock[] }` |
| GET | `/avatar-unlocks/user/:userId` | - | `{ unlocks: AvatarUnlock[] }` |
| GET | `/avatar-unlocks/component/:componentId` | - | `{ unlocks: AvatarUnlock[] }` |
| GET | `/avatar-unlocks/check/:componentId` | Headers: Auth | `{ unlocked: boolean }` |
| GET | `/avatar-unlocks/:id` | - | `{ unlock: AvatarUnlock }` |
| DELETE | `/avatar-unlocks/:id` | - | `{ message: 'Unlock removed' }` |

---

## 4. Error Response Format

All error responses follow this structure:

```json
{
  "error": "Error message",
  "details": [
    { "field": "email", "message": "Valid email required" }
  ]
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (admin only)
- `404` - Not Found
- `500` - Internal Server Error

---

## 5. Pagination

List endpoints support pagination:
- Query params: `limit` (default: 50), `offset` (default: 0)
- Response includes data array only (no meta)

---

## 6. Flutter Implementation Tips

### 6.1 HTTP Client Setup
```dart
class ApiClient {
  final Dio _dio;
  String? _accessToken;
  
  ApiClient() : _dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3000/api',
    connectTimeout: Duration(seconds: 10),
    receiveTimeout: Duration(seconds: 10),
  )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Try refresh token
          final refreshed = await _refreshToken();
          if (refreshed) {
            return handler.resolve(await _retryRequest(error.requestOptions));
          }
          // Redirect to login
        }
        handler.next(error);
      },
    ));
  }
  
  Future<bool> _refreshToken() async { ... }
  Future<Response> _retryRequest(RequestOptions options) async { ... }
}
```

### 6.2 JSON Serialization
Use `json_serializable` or `freezed` for model generation:

```dart
@freezed
class User with _$User {
  const factory User({
    required String userId,
    required String email,
    String? firstName,
    String? lastName,
    required String username,
    required String role,
    required String status,
    required bool archived,
    required DateTime createdAt,
  }) = _User;
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
```

### 6.3 DateTime Parsing
Backend returns ISO8601 strings. Parse with:
```dart
DateTime.parse(json['createdAt'] as String)
```

### 6.4 UUID Handling
All IDs are UUID strings. Use `uuid` package for generation if needed client-side.

---

## 7. LLM Integration Flow (Frontend Perspective)

### 7.1 Post-Registration Initial Recommendation
1. User registers → `POST /auth/register`
2. Frontend calls `POST /llm-recommendation-histories` with:
```json
{
  "triggerType": "INITIAL_RECOMMENDATION",
  "inputContext": { "userProfile": { "role": "user" } },
  "llmOutput": {} // Will be filled by backend
}
```
3. Backend processes via LLM and returns recommendation

### 7.2 MSLQ Quiz Flow
1. Fetch questions: `GET /mslq-static-questions`
2. Submit answers: `POST /user-quiz-results`
3. Backend triggers LLM recommendation (`QUIZ_RESULT`)
4. Fetch result: `GET /user-quiz-results/latest/:userId`

### 7.3 Monthly Evaluation (Automatic via Cron)
- Backend runs monthly cron
- Creates `MonthlyEvaluation` + `LlmRecommendationHistory`
- Frontend polls: `GET /monthly-evaluations/user/:userId`
- Or listens for push notifications

### 7.4 Activity Logging
Log user actions via `POST /user-activity-logs`:
```dart
await api.post('/user-activity-logs', {
  'activityType': 'CARD_MOVED',
  'refId': cardId,
  'metadata': { 'from': 'Planning', 'to': 'Progress', 'cardTitle': title }
});
```

---

## 8. WebSocket / Real-time (If Implemented)

Currently no WebSocket endpoints documented. For real-time features:
- Notifications: Poll `/notifications` or implement WebSocket
- Chat: Poll `/chat` or implement WebSocket
- Collaboration: Poll `/card-list-chat/collab/:collabId`

---

## 9. Environment Configuration

```dart
// config.dart
class Config {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );
}
```

Build with: `flutter build apk --dart-define=API_BASE_URL=https://your-api.com/api`

---

## 10. Testing Checklist

- [ ] Auth: Register, Login, Refresh, Logout
- [ ] Auth: Forgot/Reset Password
- [ ] CRUD for all 20 resources
- [ ] Pagination on list endpoints
- [ ] Error handling (400, 401, 403, 404, 500)
- [ ] Token refresh on 401
- [ ] File uploads (avatar assetPath)
- [ ] Date/time formatting (ISO8601)
- [ ] JSONB fields parsing
- [ ] UUID validation
- [ ] Offline support (cache strategies)

---

## 11. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-29 | Initial documentation for 20-table schema |
---
---

*Generated from backend setup.md - 20 tables, 20 models, 20 controllers/services/routes*