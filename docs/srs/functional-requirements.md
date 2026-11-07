# System Requirements Specification (SRS) - Gamatutor Backend

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for the Gamatutor Backend - an educational Kanban board platform with learning strategy assessment (MSLQ), gamification, collaboration, and LLM-powered monthly evaluations.

### 1.2 Scope
The system provides:
- Kanban-based task management for students
- MSLQ-based learning strategy assessment
- Gamified avatar system with achievement unlocks
- Social features (friends, chat, collaboration)
- LLM-powered monthly behavior-profile synchronization analysis
- Admin management for content and templates

### 1.3 Definitions
| Term | Definition |
|------|------------|
| MSLQ | Motivated Strategies for Learning Questionnaire |
| SRL | Self-Regulated Learning |
| LLM | Large Language Model |
| Kanban | Visual workflow management method |
| JWT | JSON Web Token |
| SRS | System Requirements Specification |

---

## 2. Functional Requirements

### 2.1 User Management (FR-UM)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-UM-01 | User registration with email, password, name, username | High |
| FR-UM-02 | User login with email/password returning JWT | High |
| FR-UM-03 | Password hashing with bcrypt (12 rounds) | High |
| FR-UM-04 | JWT token storage in database with 7-day expiry | High |
| FR-UM-05 | Token refresh endpoint (revokes old tokens) | High |
| FR-UM-06 | Logout revokes current token | High |
| FR-UM-07 | Forgot password with reset token (1hr expiry) | High |
| FR-UM-08 | Reset password with token validation | High |
| FR-UM-09 | User profile CRUD (own profile) | High |
| FR-UM-10 | User roles: user, admin | High |
| FR-UM-11 | User status: online/offline | Medium |
| FR-UM-12 | Soft delete (archive) user accounts | Medium |

### 2.2 Kanban Card Management (FR-KC)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-KC-01 | Create card with title | High |
| FR-KC-02 | List user's cards with pagination | High |
| FR-KC-03 | Get card by ID | High |
| FR-KC-04 | Update card title | High |
| FR-KC-05 | Delete card (cascade to CardList, ColumnMovements) | High |

### 2.3 Card List Details (FR-CL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CL-01 | Create CardList linked to Card with learning strategy | High |
| FR-CL-02 | CardList fields: subtitle, description, course, difficulty, priority, URL, schedule, deadline | High |
| FR-CL-03 | Archive/restore CardList (soft delete) | High |
| FR-CL-04 | Self-evaluation: satisfaction rating, notes, pre/post test grades | High |
| FR-CL-05 | Reflection: 4 questions (strategy, confidence, learned, value) | High |
| FR-CL-06 | Personal best tracking (time, grade, timestamp) | Medium |
| FR-CL-07 | Goal check rating and timestamp | Medium |
| FR-CL-08 | One CardList per Card (1:1) | High |

### 2.4 Learning Strategies (FR-LS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-LS-01 | Pre-seeded 7 MSLQ strategies | High |
| FR-LS-02 | Admin CRUD for strategies | High |
| FR-LS-03 | Strategy validation on CardList creation | High |

### 2.5 Column Movements (FR-CM)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CM-01 | Record card column transitions (from→to) | High |
| FR-CM-02 | Track timestamp and completion status | High |
| FR-CM-03 | Filter by card, date range, completion | High |
| FR-CM-04 | Get chronological history per card | High |
| FR-CM-05 | Mark movement completed | Medium |

### 2.6 Notifications (FR-NT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-NT-01 | Four types: push, smart_reminder, social_presence, encouragement | High |
| FR-NT-02 | Title, message, scheduling, delivery tracking | High |
| FR-NT-03 | Read/click tracking with timestamps | High |
| FR-NT-04 | Mark all as read | High |
| FR-NT-05 | Filter by type, read status, delivery status | Medium |
| FR-NT-06 | Trigger fields: reason, action, trigger user | Medium |

### 2.7 Social Features (FR-SF)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SF-01 | Friend requests (send, accept, reject, block) | High |
| FR-SF-02 | Friend status: pending, accepted, blocked | High |
| FR-SF-03 | Get friends list, pending requests | High |
| FR-SF-04 | Direct messaging between friends | High |
| FR-SF-05 | Message status: delivered, read | High |
| FR-SF-06 | Edit/delete own messages | Medium |

### 2.8 Collaboration (FR-CB)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CB-01 | Share card with users (owner/member roles) | High |
| FR-CB-02 | Collaboration chat per card | High |
| FR-CB-03 | Role management (owner can promote/demote) | High |
| FR-CB-04 | Remove collaborators | High |

### 2.9 MSLQ Assessment (FR-MQ)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MQ-01 | Submit quiz results with dominant strategy | High |
| FR-MQ-02 | Store unlocked/locked features based on results | High |
| FR-MQ-03 | Store full answers payload | High |
| FR-MQ-04 | Get latest quiz result (current profile) | High |
| FR-MQ-05 | Admin static question bank (fallback) | High |
| FR-MQ-06 | Dynamic LLM quiz generation via prompt templates | High |

### 2.10 Monthly Evaluations (FR-ME)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ME-01 | One evaluation per user per month | High |
| FR-ME-02 | LLM analysis of activity logs vs quiz profile | High |
| FR-ME-03 | Detect synchronization (profile vs behavior) | High |
| FR-ME-04 | Identify issues: mismatch, inactivity, missed deadlines | High |
| FR-ME-05 | Generate LLM feedback text | High |
| FR-ME-06 | Flag quiz retake if desynchronized | High |
| FR-ME-07 | Resolution tracking | Medium |

### 2.11 Activity Logging (FR-AL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AL-01 | Log 18+ activity types with metadata | High |
| FR-AL-02 | Reference ID linking to source objects | High |
| FR-AL-03 | Filter by user, type, reference | High |
| FR-AL-04 | Primary data source for LLM analysis | High |

### 2.12 LLM Recommendation History (FR-LR)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-LR-01 | Store all LLM recommendations with context | High |
| FR-LR-02 | Track trigger type (monthly, quiz, on_demand) | High |
| FR-LR-03 | Store input context and full LLM output | High |
| FR-LR-04 | Audit trail for thesis research | High |

### 2.13 Gamification - Avatar (FR-GA)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-GA-01 | 6 component categories (head, hair, face, shirt, pants, special) | High |
| FR-GA-02 | Admin component library management | High |
| FR-GA-03 | User avatar configuration (5 slots) | High |
| FR-GA-04 | Unlock system (achievement-based) | High |
| FR-GA-05 | Validation: only unlocked components usable | High |
| FR-GA-06 | Category-slot matching enforcement | High |

### 2.14 LLM Prompt Templates (FR-LP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-LP-01 | Admin-managed dynamic system prompts | High |
| FR-LP-02 | Versioning with active flag | High |
| FR-LP-03 | Template names: mslq_quiz_generator, monthly_evaluation | High |
| FR-LP-04 | Runtime retrieval by name | High |

### 2.15 Admin Features (FR-AD)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AD-01 | Role-based access control (admin endpoints) | High |
| FR-AD-02 | Admin: manage learning strategies | High |
| FR-AD-03 | Admin: manage prompt templates | High |
| FR-AD-04 | Admin: manage static questions | High |
| FR-AD-05 | Admin: manage avatar components | High |
| FR-AD-06 | Admin: view all user data (quiz, evaluations, logs) | High |

---

## 3. Non-Functional Requirements

### 3.1 Performance (NFR-PF)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PF-01 | API response time (p95) | < 500ms |
| NFR-PF-02 | Database query time (p95) | < 100ms |
| NFR-PF-03 | Support concurrent users | 1000+ |
| NFR-PF-04 | LLM API timeout handling | 30s max |

### 3.2 Security (NFR-SE)

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-SE-01 | JWT authentication on all protected endpoints | Bearer token |
| NFR-SE-02 | Password hashing | bcrypt 12 rounds |
| NFR-SE-03 | Token expiry and rotation | 7 days, refresh |
| NFR-SE-04 | Input validation | express-validator |
| NFR-SE-05 | SQL injection prevention | Sequelize ORM |
| NFR-SE-06 | Rate limiting | Recommended for prod |
| NFR-SE-07 | CORS configuration | Configured |
| NFR-SE-08 | Helmet headers | Enabled |
| NFR-SE-09 | Admin-only endpoints protected | authorize('admin') |

### 3.3 Scalability (NFR-SC)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SC-01 | Horizontal scaling support | Stateless API |
| NFR-SC-02 | Database connection pooling | 5-10 connections |
| NFR-SC-03 | Background job support | node-cron |

### 3.4 Reliability (NFR-RL)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-RL-01 | Uptime | 99.9% |
| NFR-RL-02 | Error handling | Centralized, structured |
| NFR-RL-03 | Database sync (dev) | sequelize.sync({alter: true}) |
| NFR-RL-04 | Graceful shutdown | SIGTERM handling |

### 3.5 Maintainability (NFR-MT)

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-MT-01 | MVC architecture | Controllers, Services, Models |
| NFR-MT-02 | Modular route structure | Per-feature routes |
| NFR-MT-03 | Validation middleware | Reusable validators |
| NFR-MT-04 | Error handling middleware | AppError class |
| NFR-MT-05 | Environment configuration | dotenv |

### 3.6 Data Requirements (NFR-DT)

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-DT-01 | PostgreSQL database | Primary datastore |
| NFR-DT-02 | UUID primary keys | All entities |
| NFR-DT-03 | Soft deletes | archived/deleted flags |
| NFR-DT-04 | Audit timestamps | createdAt on all tables |
| NFR-DT-05 | JSONB for flexible data | Options, payloads, metadata |

---

## 4. Data Requirements

### 4.1 Entities Summary

| Entity | Table | Description |
|--------|-------|-------------|
| User | users | Core user account |
| Token | token | JWT token storage |
| Card | cards | Kanban card |
| CardList | card_list | Card details + strategy |
| LearningStrat | learning_strats | MSLQ strategies |
| ColumnMovement | card_column_movements | Kanban transitions |
| Notification | notifications | Multi-type notifications |
| Chat | chat | Direct messages |
| Friendship | friendships | Social connections |
| LlmPromptTemplate | llm_prompt_templates | Dynamic LLM prompts |
| MslqStaticQuestion | mslq_static_questions | Fallback quiz bank |
| UserQuizResult | user_quiz_results | MSLQ results + unlocks |
| MonthlyEvaluation | monthly_evaluations | Monthly sync analysis |
| CardListCollab | card_list_collab | Card sharing |
| CardListChat | card_list_chat | Collaboration chat |
| UserActivityLog | user_activity_logs | Activity audit trail |
| LlmRecommendationHistory | llm_recommendation_histories | LLM output audit |
| AvatarComponent | avatar_components | Avatar asset library |
| UserAvatar | user_avatar | User avatar config |
| AvatarUnlock | avatar_unlocks | Unlock achievements |

### 4.2 Key Constraints

| Constraint | Tables |
|------------|--------|
| UUID PK | All tables |
| Unique email/username | users |
| Unique (userId, monthYear) | monthly_evaluations |
| Unique (cardId, userId) | card_list_collab |
| Unique (userId, componentId) | avatar_unlocks |
| FK cascade delete | Card→CardList, Card→ColumnMovement |
| Check constraints | status enums, difficulty, priority |

---

## 5. Integration Requirements

### 5.1 LLM Integration (IR-LLM)

| ID | Requirement | Details |
|----|-------------|---------|
| IR-LLM-01 | Dynamic prompt templates | Via LlmPromptTemplate |
| IR-LLM-02 | MSLQ quiz generation | 7 questions, JSON output |
| IR-LLM-03 | Monthly evaluation analysis | Activity logs → sync assessment |
| IR-LLM-04 | Fallback to static questions | MslqStaticQuestion |
| IR-LLM-05 | Recommendation storage | LlmRecommendationHistory |
| IR-LLM-06 | Token usage tracking | In llmOutput |

### 5.2 Database (IR-DB)

| ID | Requirement | Details |
|----|-------------|---------|
| IR-DB-01 | PostgreSQL 14+ | Primary |
| IR-DB-02 | Sequelize ORM | Node.js |
| IR-DB-03 | Auto-migration (dev) | sequelize.sync({alter: true}) |
| IR-DB-04 | Connection pooling | 5-10 connections |

### 5.3 External Services (IR-EXT)

| ID | Requirement | Details |
|----|-------------|---------|
| IR-EXT-01 | Email service | For password reset (not implemented) |
| IR-EXT-02 | File storage | For avatar assets (local/path) |
| IR-EXT-03 | Cron jobs | node-cron for evaluations |

---

## 6. User Roles and Permissions

| Endpoint Category | User | Admin |
|-------------------|------|-------|
| Auth | ✓ | ✓ |
| Users (own) | ✓ | ✓ |
| Users (all) | ✗ | ✓ |
| Cards | ✓ | ✓ |
| CardLists | ✓ | ✓ |
| Learning Strategies | Read | CRUD |
| Column Movements | ✓ | ✓ |
| Notifications | ✓ | ✓ |
| Chat | ✓ | ✓ |
| Friendships | ✓ | ✓ |
| Prompt Templates | ✗ | CRUD |
| Static Questions | ✗ | CRUD |
| Quiz Results | Own | All |
| Monthly Evaluations | Own | All |
| Collaborations | ✓ | ✓ |
| Activity Logs | Own | All |
| Recommendation History | Own | All |
| Avatar Components | Read | CRUD |
| User Avatar | ✓ | ✓ |
| Avatar Unlocks | Own | All |

---

## 7. Business Rules

### 7.1 Quiz Feature Unlocking
- Each dominant strategy unlocks 2 features
- Features map to avatar component categories
- Locked features require quiz retake or achievement

### 7.2 Monthly Evaluation
- Runs 1st of each month via cron
- Compares latest quiz result vs month's activity logs
- LLM analyzes and produces feedback
- Desynchronized → requiresQuizRetake = true

### 7.3 Avatar Unlocks
- Only unlocked components can be equipped
- Category must match slot (hairId → hair category)
- Unlocks permanent once granted

### 7.4 Collaboration
- Card owner auto-added as owner
- Owner can manage roles and remove members
- Members can chat, view, suggest

### 7.5 Token Management
- One active token per user (refresh revokes all)
- Token stored in DB with expiry
- Logout removes specific token

---

## 8. Acceptance Criteria

### 8.1 Critical Paths
1. **Registration → Quiz → First Card**: New user can register, take quiz, create card with strategy
2. **Card Workflow**: Create → Detail → Move columns → Reflect → Complete
3. **Monthly Cycle**: Activity → Evaluation → Feedback → Adjustment
4. **Social**: Friend → Chat → Collaborate → Co-reflect
5. **Gamification**: Achieve → Unlock → Customize avatar

### 8.2 Error Scenarios
- Invalid token → 401 with clear message
- Validation error → 400 with field details
- Not found → 404
- Forbidden → 403
- Server error → 500 with logging

---

## 9. Future Enhancements (Out of Scope)

- Real-time WebSocket notifications
- Mobile push notifications (FCM/APNS)
- Advanced analytics dashboard
- AI-generated card suggestions
- Multi-language support
- Web frontend integration
- Mobile app API optimization