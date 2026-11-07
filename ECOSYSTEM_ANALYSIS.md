# Gamatutor Backend Ecosystem Analysis

**Date:** 2026-10-23  
**Based on:** API-DOCUMENTATION.md v1.1.0, BACKEND_REQUIREMENTS.md, and actual codebase review

---

## Executive Summary

The Gamatutor backend is a **Node.js/Express/PostgreSQL (Sequelize) MVC application** with 19 models and 20+ API endpoint groups. The codebase is **well-structured** with clear separation of concerns (routes → controllers → services → models).

### Current State
| Metric | Status |
|--------|--------|
| Total Models | 19 |
| Total Route Groups | 20 |
| Authentication | JWT (7-day expiry, DB-stored tokens) |
| Authorization | Role-based (user/admin) |
| Code Coverage | ~95% of documented endpoints implemented |
| Critical Gaps | 0 route mismatches, 0 missing endpoints, 0 alias needed (all resolved Sprint 0) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXPRESS APP                              │
├─────────────────────────────────────────────────────────────────┤
│  Middleware: helmet, cors, morgan, json, urlencoded             │
├─────────────────────────────────────────────────────────────────┤
│  /api/auth          → AuthController      → AuthService        │
│  /api/users         → UserController      → UserService        │
│  /api/cards         → CardController      → CardService        │
│  /api/cards/:id/lists → CardListController  → CardListService   │
│  /api/cards/:id/list → CardListController  → CardListService   │
│  /api/learning-strategies → LearningStratCtrl → LearningStratSvc │
│  /api/learning-strats → LearningStratCtrl   → LearningStratSvc  │
│  /api/column-movements→ ColumnMovementCtrl → ColumnMovementSvc │
│  /api/notifications → NotificationCtrl    → NotificationSvc    │
│  /api/chat          → ChatController      → ChatService        │
│  /api/friendships   → FriendshipCtrl      → FriendshipService  │
│  /api/llm-prompt-templates → LLMPromptCtrl  → LLMPromptSvc     │
│  /api/mslq-static-questions → MSLQCtrl      → MSLQService      │
│  /api/user-quiz-results → QuizResultCtrl   → QuizResultSvc     │
│  /api/monthly-evaluations → MonthlyEvalCtrl  → MonthlyEvalSvc   │
│  /api/card-list-collab → CollabController   → CollabService    │
│  /api/card-list-chat   → CollabChatCtrl    → CollabChatService │
│  /api/user-activity-logs → ActivityLogCtrl  → ActivityLogSvc   │
│  /api/llm-recommendation-histories → LLMRecCtrl → LLMRecSvc    │
│  /api/avatar-components → AvatarCompCtrl    → AvatarCompSvc    │
│  /api/user-avatar      → UserAvatarCtrl     → UserAvatarSvc    │
│  /api/avatar-unlocks   → AvatarUnlockCtrl   → AvatarUnlockSvc   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model Relationships (ER Summary)

```
User (1) ─────< (M) Token
User (1) ─────< (M) Card
User (1) ─────< (M) Notification
User (1) ─────< (M) Friendship (as requester)
User (1) ─────< (M) Friendship (as friend)
User (1) ─────< (M) Chat (as sender)
User (1) ─────< (M) Chat (as recipient)
User (1) ─────< (M) UserQuizResult
User (1) ─────< (M) MonthlyEvaluation
User (1) ─────< (M) UserActivityLog
User (1) ─────< (M) LlmRecommendationHistory
User (1) ─────< (M) CardListCollab
User (1) ─────< (M) CardListChat
User (1) ─────< (1) UserAvatar
User (1) ─────< (M) AvatarUnlock

Card (1) ─────< (1) CardList (subtasks)
Card (M) ─────> (1) LearningStrat
Card (1) ─────< (M) ColumnMovement
Card (1) ─────< (M) CardListCollab

CardListCollab (1) ─────< (M) CardListChat
CardListCollab (M) ─────> (1) Card
CardListCollab (M) ─────> (1) User

AvatarComponent (1) ─────< (M) UserAvatar (5 FKs: hair, face, shirt, pants, special)
AvatarComponent (1) ─────< (M) AvatarUnlock
AvatarUnlock (M) ─────> (1) User
AvatarUnlock (M) ─────> (1) AvatarComponent

UserAvatar (1) ─────> (1) User (PK = FK)
UserAvatar (M) ─────> (1) AvatarComponent (5 belongsTo)
```

---

## Implementation Status Matrix

### ✅ Fully Implemented (All CRUD + Filters)

| Module | Endpoints | Notes |
|--------|-----------|-------|
| **Authentication** | 7/7 | register, login, me, refresh, logout, forgot-password, reset-password |
| **User Management** | 5/5 | All CRUD + status update; admin list/delete |
| **Cards** | 5/5 | Full CRUD + nested includes (learningStrat, subtasks, movements, collabs) |
| **Card Lists (Subtasks)** | 4/4 | Full CRUD scoped to card |
| **Chat (Direct Messages)** | 6/6 | Full CRUD + user filter |
| **Friendships** | 10/10 | Full CRUD + accept/block/reject/unblock/remove |
| **Notifications** | 8/8 | Full CRUD + read/click/read-all |
| **User Avatar** | 2/2 | GET (auto-create) + PUT (upsert) |
| **Avatar Components** | 6/6 | Full CRUD (admin write) + category filter |
| **Avatar Unlocks** | 7/7 | Full CRUD + check endpoint |
| **Card List Collaborations** | 7/7 | Full CRUD + card/user filters |
| **Card List Chat** | 6/6 | Full CRUD + collab filter |
| **Column Movements** | 7/7 | Full CRUD + date range filter + complete |
| **Learning Strategies** | 6/6 | Full CRUD + name/ID lookup |
| **LLM Prompt Templates** | 6/6 | Admin only |
| **LLM Recommendation History** | 5/5 | Admin list/delete |
| **Monthly Evaluations** | 7/7 | User create/read; admin write/delete |
| **MSLQ Static Questions** | 6/6 | Admin write |
| **User Activity Logs** | 5/5 | User create/read; admin list/delete |
| **User Quiz Results** | 7/7 | User create/read latest; admin full CRUD |

---

## Critical Issues Found — **ALL RESOLVED (Sprint 0)**

### 1. Route Path Mismatches — ✅ RESOLVED
Both routes now mounted in `src/app.js`:
- `/api/cards/:cardId/lists` (plural) **AND** `/api/cards/:cardId/list` (singular) → `cardListRoutes`
- `/api/learning-strategies` **AND** `/api/learning-strats` → `learningStratRoutes`

### 2. Missing Endpoints — ✅ RESOLVED
| Endpoint | Module | Status |
|----------|--------|--------|
| `GET /users/search?q=email` | User Management | Implemented in `userRoutes.js`, `userController.js`, `userService.js` |
| `PUT /friendships/:fsId/unblock` | Friendships | Implemented in `friendshipRoutes.js`, `friendshipController.js`, `friendshipService.js` |
| `POST /user-avatar` | User Avatar | Not needed — PUT `/user-avatar` is upsert (creates if not exists) |

### 3. Frontend-Backend Contract Mismatches — ✅ RESOLVED
| Issue | Module | Resolution |
|-------|--------|------------|
| Frontend calls `/avatar-unlocks/user/me` | Avatar Unlocks | Controller accepts `me` param → uses `req.user.userId` |
| Frontend uses `/chat/mark-read` (batch) | Chat | Frontend updated to use per-message PUT `/chat/:id` with `status: 'read'` |
| WebSocket `/ws/chat` not documented | Chat | Documented in `docs/WEBSOCKET_SIGNALING.md` |

### 4. Data Seeding — ✅ RESOLVED
**23 Avatar Components** seeded via `scripts/seed-avatar-components.js` (not 18):
| Category | Components |
|----------|------------|
| head | 1 (Default Head) |
| hair | 5 (Short, Long, Curly, Bald, Ponytail) |
| face | 5 (Smile, Serious, Wink, Glasses, Blush) |
| shirt | 4 (T-Shirt, Hoodie, Formal, Tank Top) |
| pants | 4 (Jeans, Shorts, Sweatpants, Formal) |
| special | 4 (Cape, Wings, Halo, Backpack) |

All components have valid UUIDs in database.

---

## Frontend Service Mapping

| Frontend Service | Backend Endpoints Used | Status |
|------------------|------------------------|--------|
| AuthService | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout` | ✅ All work |
| LoginService | `/auth/logout` | ✅ Works |
| UserService | `/users/:id`, `/users/:id`, `/users/:id/status` | ✅ Works |
| BoardService | `/cards` (CRUD), `/cards/:cardId/lists` (CRUD), `/card-list-collabs/card/:cardId`, `/column-movements` | ✅ Both `/lists` and `/list` work |
| CardService (legacy) | `/cards` (CRUD), `/cards/:cardId/list` (singular!) | ✅ Singular route now mounted |
| FriendshipService | `/friendships` (all), `/users/search` | ✅ Search implemented |
| ChatService | `/chat` (all) | ✅ Uses per-message PUT for read status |
| AvatarService | `/user-avatar` (GET/PUT), `/avatar-components`, `/avatar-unlocks` | ✅ `/user/me` alias works in controller |
| NotificationService | None (local only) | - |
| RekomendasiService | `/user-quiz-results/latest/:userId` | ✅ Works |
| WebSocketService | `/ws/chat` (signaling) | ✅ Documented in `docs/WEBSOCKET_SIGNALING.md` |
| CallService | None (WebRTC only) | ❌ No REST endpoints (Sprint 2) |

---

## Sprint Implementation Plan

### Sprint 0: Foundation (Week 1) — **Critical Fixes — ✅ COMPLETED**

| Task | Description | Files Modified | Status |
|------|-------------|----------------|--------|
| **S0-1** | Fix route mismatch: `/cards/:cardId/list` → `/cards/:cardId/lists` (add alias) | `src/app.js` line 46-47 | ✅ Done |
| **S0-2** | Fix route mismatch: add `/api/learning-strategies` alias for `/api/learning-strats` | `src/app.js` line 48-49 | ✅ Done |
| **S0-3** | Add `GET /users/search` endpoint | `src/routes/userRoutes.js`, `src/controllers/userController.js`, `src/services/userService.js` | ✅ Done |
| **S0-4** | Add `PUT /friendships/:fsId/unblock` endpoint | `src/routes/friendshipRoutes.js`, `src/controllers/friendshipController.js`, `src/services/friendshipService.js` | ✅ Done |
| **S0-5** | Add `/avatar-unlocks/user/me` route alias | `src/controllers/avatarUnlockController.js` (handles `me` param) | ✅ Done |
| **S0-6** | Create avatar components seed script | `scripts/seed-avatar-components.js` (23 components) | ✅ Done |
| **S0-7** | Document WebSocket signaling contract | `docs/WEBSOCKET_SIGNALING.md` | ✅ Done |

**Total Sprint 0:** ~11 hours — **COMPLETED**

---

### Sprint 1: Chat & Notifications Polish (Week 2)

| Task | Description | Files to Modify | Effort |
|------|-------------|-----------------|--------|
| **S1-1** | Remove `/chat/mark-read` from frontend (use per-message PUT) OR add batch endpoint | Decision: update frontend to use existing PUT `/chat/:id` with `status: 'read'` | Frontend only |
| **S1-2** | Verify notification FCM/APNs integration readiness | `src/services/notificationService.js` | 4h |
| **S1-3** | Add pagination metadata to list responses (total count) | All list controllers | 3h |
| **S1-4** | Add rate limiting to auth endpoints | `src/middleware/rateLimit.js`, `src/app.js` | 3h |

**Total Sprint 1:** ~10 hours

---

### Sprint 2: Voice/Group Call Feature (Week 3-4) — **New Feature**

| Task | Description | Files to Modify | Effort |
|------|-------------|-----------------|--------|
| **S2-1** | Design Call model (Call, CallParticipant, CallActivity) | `src/models/call.js`, `src/models/index.js` | 4h |
| **S2-2** | Create Call REST endpoints (initiate, answer, reject, end, history, group) | `src/routes/callRoutes.js`, `src/controllers/callController.js`, `src/services/callService.js` | 12h |
| **S2-3** | Implement WebSocket signaling server (offer/answer/ICE) | `src/websocket/signaling.js`, `src/app.js` integration | 16h |
| **S2-4** | Add CallParticipant & CallActivity models | `src/models/callParticipant.js`, `src/models/callActivity.js` | 4h |
| **S2-5** | Frontend integration: CallService + WebSocketService | Frontend work | Frontend team |

**Total Sprint 2:** ~36 hours (backend only)

---

### Sprint 3: Advanced Features (Week 5-6) — **Nice to Have**

| Task | Description | Files to Modify | Effort |
|------|-------------|-----------------|--------|
| **S3-1** | Implement LLM prompt template usage (integrate with evaluation) | `src/services/llmPromptTemplateService.js` | 8h |
| **S3-2** | Build monthly evaluation workflow (trigger LLM, store recommendation) | `src/services/monthlyEvaluationService.js`, cron job | 12h |
| **S3-3** | Implement MSLQ questionnaire flow | `src/services/mslqStaticQuestionService.js`, quiz service | 8h |
| **S3-4** | Add user activity logging to all mutating operations | Middleware or service decorators | 8h |

**Total Sprint 3:** ~36 hours

---

### Sprint 4: Polish & Production Ready (Week 7)

| Task | Description | Files to Modify | Effort |
|------|-------------|-----------------|--------|
| **S4-1** | Comprehensive integration testing | Test scripts | 8h |
| **S4-2** | API documentation sync (update API-DOCUMENTATION.md) | This doc | 2h |
| **S4-3** | Performance optimization (query indexing, caching) | DB indexes, Redis | 8h |
| **S4-4** | Security audit (OWASP, rate limits, validation) | All endpoints | 8h |
| **S4-5** | Deployment pipeline (Docker, CI/CD) | `.github/workflows`, `Dockerfile` | 8h |

**Total Sprint 4:** ~34 hours

---

## Total Effort Estimate

| Phase | Hours | Weeks |
|-------|-------|-------|
| Sprint 0 (Critical) | 11 | 1 |
| Sprint 1 (Polish) | 10 | 1 |
| Sprint 2 (Voice/Call) | 36 | 2 |
| Sprint 3 (Advanced) | 36 | 2 |
| Sprint 4 (Production) | 34 | 1 |
| **Total** | **127** | **7** |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Route mismatch breaks frontend | High | High | Sprint 0 fixes both aliases |
| Missing seed data blocks avatar | High | Medium | Sprint 0-6 seed script |
| WebSocket signaling complexity | Medium | High | Sprint 2 dedicated time |
| Frontend-backend sync drift | Medium | Medium | Shared contract docs, regular sync |
| LLM integration cost/complexity | Low | Medium | Sprint 3, can defer |

---

## Immediate Action Items (Do First)

1. **Add route aliases** in `src/app.js`:
   ```js
   // Line 46: Change to support both
   app.use('/api/cards/:cardId/lists', cardListRoutes);  // plural (docs)
   app.use('/api/cards/:cardId/list', cardListRoutes);   // singular (legacy)
   
   // Line 47: Add alias
   app.use('/api/learning-strategies', learningStratRoutes);  // docs
   app.use('/api/learning-strats', learningStratRoutes);      // current
   ```

2. **Create seed script** for avatar components (run once in production)

3. **Add `/users/search`** endpoint for friend search

4. **Add `/friendships/:fsId/unblock`** for unblock functionality

5. **Update frontend** to use `/avatar-unlocks/user/:userId` instead of `/user/me` OR add backend alias

---

## Appendix: File Structure Reference

```
src/
├── app.js                          # Main app - route mounting
├── config/database.js              # DB connection
├── server.js                       # Entry point
├── middleware/
│   ├── auth.js                     # JWT auth + authorize()
│   ├── errorHandler.js             # AppError class
│   └── validation.js               # express-validator rules
├── models/
│   ├── index.js                    # Model associations
│   ├── user.js, token.js, card.js, ...
│   └── (19 total models)
├── controllers/
│   ├── authController.js           # 7 endpoints
│   ├── userController.js           # 5 endpoints
│   ├── cardController.js           # 5 endpoints
│   ├── cardListController.js       # 4 endpoints
│   ├── learningStratController.js  # 6 endpoints
│   ├── columnMovementController.js # 7 endpoints
│   ├── notificationController.js   # 8 endpoints
│   ├── chatController.js           # 6 endpoints
│   ├── friendshipController.js     # 9 endpoints
│   ├── llmPromptTemplateController.js
│   ├── mslqStaticQuestionController.js
│   ├── userQuizResultController.js
│   ├── monthlyEvaluationController.js
│   ├── cardListCollabController.js # 7 endpoints
│   ├── cardListChatController.js   # 6 endpoints
│   ├── userActivityLogController.js
│   ├── llmRecommendationHistoryController.js
│   ├── avatarComponentController.js
│   ├── userAvatarController.js     # 2 endpoints
│   └── avatarUnlockController.js   # 7 endpoints
├── services/
│   ├── authService.js              # JWT, bcrypt, token mgmt
│   ├── userService.js
│   ├── cardService.js              # Complex: subtasks + column movements
│   ├── cardListService.js
│   ├── learningStratService.js
│   ├── columnMovementService.js
│   ├── notificationService.js
│   ├── chatService.js
│   ├── friendshipService.js
│   ├── llmPromptTemplateService.js
│   ├── mslqStaticQuestionService.js
│   ├── userQuizResultService.js
│   ├── monthlyEvaluationService.js
│   ├── cardListCollabService.js
│   ├── cardListChatService.js
│   ├── userActivityLogService.js
│   ├── llmRecommendationHistoryService.js
│   ├── avatarComponentService.js
│   ├── userAvatarService.js        # Upsert on PUT
│   └── avatarUnlockService.js
├── routes/
│   ├── authRoutes.js               # Public + protected
│   ├── userRoutes.js               # Admin + user
│   ├── cardRoutes.js
│   ├── cardListRoutes.js           # mergeParams: true
│   ├── learningStratRoutes.js
│   ├── columnMovementRoutes.js
│   ├── notificationRoutes.js
│   ├── chatRoutes.js
│   ├── friendshipRoutes.js
│   ├── llmPromptTemplateRoutes.js  # Admin only
│   ├── mslqStaticQuestionRoutes.js # Admin write
│   ├── userQuizResultRoutes.js
│   ├── monthlyEvaluationRoutes.js
│   ├── cardListCollabRoutes.js
│   ├── cardListChatRoutes.js
│   ├── userActivityLogRoutes.js
│   ├── llmRecommendationHistoryRoutes.js
│   ├── avatarComponentRoutes.js    # Admin write
│   ├── userAvatarRoutes.js
│   └── avatarUnlockRoutes.js
└── utils/
    ├── helpers.js
    └── jwt.js
```