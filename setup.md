# Backend Kanban - Express.js MVC Setup (Sequelize + PostgreSQL)
## Database Schema (PostgreSQL)

**Note**: The database contains 20 tables. All 20 tables are fully implemented in the codebase. The schema below reflects the actual Sequelize model definitions (field mappings, types, constraints, timestamps).

```sql

-- ==========================================
-- A. USER MANAGEMENT & AUTHENTICATION
-- ==========================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(7) DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
    reset_token TEXT,
    reset_token_expiry TIMESTAMPTZ,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

delete from users;
select * from users;
CREATE TABLE token (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    access_token_expiry TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
select * from token;
-- ==========================================
-- B. LLM SYSTEM, PROMPT & MSLQ QUIZ ENGINE
-- ==========================================
-- Penampung System Prompt Dynamic (Biar gak hardcoded di Node.js)
CREATE TABLE llm_prompt_templates (
    prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) UNIQUE NOT NULL, -- 'mslq_quiz_generator', 'monthly_evaluation'
    version INT DEFAULT 1,
    system_prompt TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Soal Statis (Fallback kalau API LLM error/limit)
CREATE TABLE mslq_static_questions (
    static_q_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hasil Kuis MSLQ User + Mapping Lock/Unlock Fitur
CREATE TABLE user_quiz_results (
    quiz_result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    dominant_strategy VARCHAR(50) NOT NULL,
    user_profile VARCHAR(100) NOT NULL,
    unlocked_features JSONB NOT NULL, -- ex: ["organization", "time_management"]
    locked_features JSONB NOT NULL,
    answers_payload JSONB NOT NULL,   -- Detail jawaban kuis
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluasi Bulanan (Deteksi Disinkronisasi Antara Profile vs Perilaku)
CREATE TABLE monthly_evaluations (
    eval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    month_year VARCHAR(20) NOT NULL, -- Format: 'MM-YYYY'
    is_synchronized BOOLEAN NOT NULL,
    requires_quiz_retake BOOLEAN DEFAULT FALSE,
    detected_issues JSONB NOT NULL,
    llm_feedback TEXT NOT NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_monthly_eval UNIQUE(user_id, month_year)
);

-- ==========================================
-- C. STRATEGI BELAJAR & CARD MANAGEMENT
-- ==========================================
CREATE TABLE learning_strats (
    learning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_code VARCHAR(50) UNIQUE NOT NULL, -- ex: 'time_management', 'organization'
    learning_strategy VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cards (
    card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
	description TEXT,
    course_name VARCHAR(50),
    difficulty VARCHAR(10) CHECK (difficulty IN ('easy','medium','hard','expert')),
    priority VARCHAR(10) CHECK (priority IN ('low','medium','high','critical')),
    deadline DATE NOT NULL,
    url TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    deleted BOOLEAN DEFAULT FALSE,
    
    -- Evaluasi & Refleksi Mandiri Card
    satisfaction_rating NUMERIC,
    notes TEXT,
    pre_test_grade INT,
    post_test_grade INT,
    reflection_q1_strategy TEXT,
    reflection_q2_confidence NUMERIC,
    reflection_q3_what_learned TEXT,
    reflection_q4_value TEXT,
    reflection_completed_at TIMESTAMPTZ,
    goal_check_rating NUMERIC,
    goal_check_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_list (
    card_id UUID PRIMARY KEY REFERENCES cards(card_id) ON DELETE CASCADE,
    learning_id UUID NOT NULL REFERENCES learning_strats(learning_id) ON DELETE CASCADE,
    sub_title VARCHAR(255)    
);

CREATE TABLE card_column_movements (
    ccm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    from_column VARCHAR(100),
    to_column VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- D. KOLABORASI, CHAT & SOSIAL
-- ==========================================
CREATE TABLE friendships (
    fs_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending','accepted','declined','blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_request UNIQUE (user_id, friend_id),
    CONSTRAINT no_self_request CHECK (user_id <> friend_id)
);

CREATE TABLE chat (
    chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_chat TEXT NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('delivered','read')),
    time_chat TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_list_collab (
    collab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(10) CHECK (role IN ('owner','member')),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(card_id, user_id)
);

CREATE TABLE card_list_chat (
    chat_colab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collab_id UUID NOT NULL REFERENCES card_list_collab(collab_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- E. ACTIVITY LOGS & LLM RECOMMENDATIONS (DIREVISI TOTAL)
-- ==========================================

-- 1. Log Aktivitas Ringkas (Sumber data LLM buat evaluasi bulanan)
CREATE TABLE user_activity_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'CARD_MOVED', 'CHAT_SENT', 'REFLECTIONS_COMPLETED'
    ref_id UUID,                         -- Bisa nunjuk ke card_id, chat_id, atau ccm_id
    metadata JSONB,                      -- Detail log ex: {"from":"Planning", "to":"Progress"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Histori Rekomendasi Strategi dari LLM (Disimpan rapi buat Jejak Audit/Tesis)
CREATE TABLE llm_recommendation_histories (
    rec_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,  -- 'MONTHLY_EVAL', 'QUIZ_RESULT', 'ON_DEMAND'
    input_context JSONB NOT NULL,       -- Data mentah log/kuis yang dilempar ke LLM
    llm_output JSONB NOT NULL,          -- Respon rekomendasi utuh dari LLM
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- F. GAMIFIKASI (AVATAR) & NOTIFIKASI
-- ==========================================
CREATE TABLE avatar_components (
    ava_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(10) NOT NULL CHECK (category IN ('head','hair','face','shirt','pants','special')),
    name VARCHAR(50) NOT NULL,
    asset_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_avatar (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    hair_id UUID REFERENCES avatar_components(ava_id),
    face_id UUID REFERENCES avatar_components(ava_id),
    shirt_id UUID REFERENCES avatar_components(ava_id),
    pants_id UUID REFERENCES avatar_components(ava_id),
    special_id UUID REFERENCES avatar_components(ava_id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE avatar_unlocks (
    ava_un_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES avatar_components(ava_id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, component_id)
);

CREATE TABLE notifications (
    notif_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(30) CHECK (type IN ('push', 'smart_reminder', 'social_presence', 'encouragement')),
    title VARCHAR(255),
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    delivered BOOLEAN DEFAULT FALSE,
    delivery_error TEXT,
    scheduled_for TIMESTAMPTZ,
    reminder_reason TEXT,
    trigger_action TEXT,
    trigger_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Penjelasan Schema Database

Nama Tabel            | Primary Key        | Deskripsi Utama                                  | Column JSONB                    |
----------------------|--------------------|--------------------------------------------------|---------------------------------|
users                 | user_id            | Data kredensial, role (user/admin), status online| -                               |
token                 | token_id           | Token autentikasi JWT / session                  | -                               |
llm_prompt_templates  | prompt_id          | Template System Prompt dinamis untuk LLM         | -                              | 
mslq_static_questions | static_q_id        | Bank soal statis MSLQ                            | options                         |
user_quiz_results     | quiz_result_id     | Hasil kuis MSLQ & pemetaan lock/unlock           | unlocked_features,              |
                      |                    |                                                  | locked_features,                |
                      |                    |                                                  | answers_payload                 |
monthly_evaluations   | eval_id            | Hasil evaluasi bulanan & feedback LLM            | detected_issues                 |
learning_strats       | learning_id        | Daftar strategi belajar (master data)            | -                               |
cards                 | card_id            | Container board utama user (nm_matkul, learning_id, refleksi, nilai) | - |
card_list             | card_id (FK cards) | Item tugas tambahan (sub_title)                  | -                               |
card_column_movements | ccm_id             | Tracker pergerakan kolom board                   | -                               |
friendships           | fs_id              | Sistem relasi pertemanan                         | -                               |
chat                  | chat_id            | Pesan langsung antar pengguna                    | -                               |
card_list_collab      | collab_id          | Pengaturan kolaborator pada tiap card (ref cards)| -                               |
card_list_chat        | chat_colab_id      | Obrolan grup pada item kolaborasi                | -                               |
user_activity_logs    | log_id             | Log aktivitas untuk analisis LLM                 |metadata                      |   
llm_recommendation_histories | rec_id      | Audit trail rekomendasi buatan LLM               | input_context,                  |
                      |                    |                                                  | llm_output                    |  
avatar_components     | ava_id             | Item aset avatar gamifikasi                      | -                               |
user_avatar           | user_id (FK users) | Komponen avatar terpasang pada user              | -                               |
avatar_unlocks        | ava_un_id          | Status kepemilikan komponen avatar               | -                               |
notifications         | notif_id           | Log notifikasi push, pengingat, & dorongan       | -                               |


## Project Structure

```
backend-kanban/
├── src/
│   ├── app.js              # Express app configuration
│   ├── server.js           # Entry point
│   ├── config/
│   │   └── database.js     # Database configuration (Sequelize + PostgreSQL)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── avatarComponentController.js
│   │   ├── avatarUnlockController.js
│   │   ├── cardController.js
│   │   ├── cardListChatController.js
│   │   ├── cardListCollabController.js
│   │   ├── cardListController.js
│   │   ├── chatController.js
│   │   ├── columnMovementController.js
│   │   ├── friendshipController.js
│   │   ├── learningStratController.js
│   │   ├── llmPromptTemplateController.js
│   │   ├── llmRecommendationHistoryController.js
│   │   ├── monthlyEvaluationController.js
│   │   ├── mslqStaticQuestionController.js
│   │   ├── notificationController.js
│   │   ├── userActivityLogController.js
│   │   ├── userAvatarController.js
│   │   ├── userController.js
│   │   └── userQuizResultController.js
│   ├── models/             # Sequelize models
│   │   ├── avatarComponent.js
│   │   ├── avatarUnlock.js
│   │   ├── card.js
│   │   ├── cardList.js
│   │   ├── cardListChat.js
│   │   ├── cardListCollab.js
│   │   ├── chat.js
│   │   ├── columnMovement.js
│   │   ├── friendship.js
│   │   ├── index.js
│   │   ├── learningStrat.js
│   │   ├── llmPromptTemplate.js
│   │   ├── llmRecommendationHistory.js
│   │   ├── monthlyEvaluation.js
│   │   ├── mslqStaticQuestion.js
│   │   ├── notification.js
│   │   ├── token.js
│   │   ├── user.js
│   │   ├── userActivityLog.js
│   │   ├── userAvatar.js
│   │   └── userQuizResult.js
│   ├── routes/             # Route definitions
│   │   ├── authRoutes.js
│   │   ├── avatarComponentRoutes.js
│   │   ├── avatarUnlockRoutes.js
│   │   ├── cardListChatRoutes.js
│   │   ├── cardListCollabRoutes.js
│   │   ├── cardListRoutes.js
│   │   ├── cardRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── columnMovementRoutes.js
│   │   ├── friendshipRoutes.js
│   │   ├── learningStratRoutes.js
│   │   ├── llmPromptTemplateRoutes.js
│   │   ├── llmRecommendationHistoryRoutes.js
│   │   ├── monthlyEvaluationRoutes.js
│   │   ├── mslqStaticQuestionRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── userActivityLogRoutes.js
│   │   ├── userAvatarRoutes.js
│   │   ├── userQuizResultRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── services/           # Business logic
│   │   ├── authService.js
│   │   ├── avatarComponentService.js
│   │   ├── avatarUnlockService.js
│   │   ├── cardListChatService.js
│   │   ├── cardListCollabService.js
│   │   ├── cardListService.js
│   │   ├── cardService.js
│   │   ├── chatService.js
│   │   ├── columnMovementService.js
│   │   ├── friendshipService.js
│   │   ├── learningStratService.js
│   │   ├── llmPromptTemplateService.js
│   │   ├── llmRecommendationHistoryService.js
│   │   ├── monthlyEvaluationService.js
│   │   ├── mslqStaticQuestionService.js
│   │   ├── notificationService.js
│   │   ├── userActivityLogService.js
│   │   ├── userAvatarService.js
│   │   ├── userQuizResultService.js
│   │   └── userService.js
│   └── utils/              # Helper functions
│       ├── jwt.js
│       └── helpers.js
├── package.json
└── SETUP.md
```

## Dependencies

### Production
- `express` - Web framework
- `sequelize` - SQL ORM
- `pg` - PostgreSQL driver
- `pg-hstore` - PostgreSQL hstore support for JSONB
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - CORS support
- `dotenv` - Environment variables
- `helmet` - Security headers
- `morgan` - HTTP logging
- `express-validator` - Request validation
- `uuid` - UUID generation
- `node-cron` - Scheduled tasks

### Development
- `nodemon` - Auto-reload
- `jest` - Testing
- `supertest` - API testing
- `sequelize-auto` - Auto-generate models from existing DB

## Environment Variables (.env)

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Gamatutor
DB_USER=postgres
DB_PASSWORD=DoNotEnter!
DB_SSL=false
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Auto-generate Models from Existing DB

### For PostgreSQL (Current Setup - Gamatutor DB)

```bash
# Install sequelize-auto globally or use npx
npm install -g sequelize-auto

# Or use npm script (configured in package.json)
npm run db:generate

# Manual command for Gamatutor DB (all 20 tables):
npx sequelize-auto \
  -h localhost \
  -d Gamatutor \
  -u postgres \
  -p 5432 \
  -x "DoNotEnter!" \
  -e postgres \
  -o src/models \
  -l esm \
  --camelCase \
  --tables users,token,cards,learning_strats,card_list,card_column_movements,notifications,chat,friendships,llm_prompt_templates,mslq_static_questions,user_quiz_results,monthly_evaluations,card_list_collab,card_list_chat,user_activity_logs,llm_recommendation_histories,avatar_components,user_avatar,avatar_unlocks
```

### sequelize-auto options:

| Option | Description |
|--------|-------------|
| `-h` | Host |
| `-d` | Database name |
| `-u` | Username |
| `-p` | Port |
| `-x` | Password (quote if special chars) |
| `-e` | Dialect (postgres, mysql, sqlite, mssql) |
| `-o` | Output directory |
| `-l` | Language (esm, ts, js) |
| `--camelCase` | Convert column names to camelCase |
| `--tables` | Tables to include (comma-separated) |
| `-s` | Schema (postgres/mssql) |

## Package.json Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "db:generate": "sequelize-auto -h localhost -d Gamatutor -u postgres -p 5432 -x \"DoNotEnter!\" -e postgres -o src/models -l esm --camelCase --tables users,token,cards,learning_strats,card_list,card_column_movements,notifications,chat,friendships,llm_prompt_templates,mslq_static_questions,user_quiz_results,monthly_evaluations,card_list_collab,card_list_chat,user_activity_logs,llm_recommendation_histories,avatar_components,user_avatar,avatar_unlocks",
    "db:generate:all": "sequelize-auto -h localhost -d Gamatutor -u postgres -p 5432 -x \"DoNotEnter!\" -e postgres -o src/models -l esm --camelCase"
  }
}
```

## Model Associations (src/models/index.js)

```javascript
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// 1. Inisialisasi setiap model dengan memasukkan (sequelize, DataTypes)
const User = require('./user')(sequelize, DataTypes);
const Token = require('./token')(sequelize, DataTypes);
const Card = require('./card')(sequelize, DataTypes);
const CardList = require('./cardList')(sequelize, DataTypes);
const LearningStrat = require('./learningStrat')(sequelize, DataTypes);
const ColumnMovement = require('./columnMovement')(sequelize, DataTypes);
const Notification = require('./notification')(sequelize, DataTypes);
const Chat = require('./chat')(sequelize, DataTypes);
const Friendship = require('./friendship')(sequelize, DataTypes);
const LlmPromptTemplate = require('./llmPromptTemplate')(sequelize, DataTypes);
const MslqStaticQuestion = require('./mslqStaticQuestion')(sequelize, DataTypes);
const UserQuizResult = require('./userQuizResult')(sequelize, DataTypes);
const MonthlyEvaluation = require('./monthlyEvaluation')(sequelize, DataTypes);
const CardListCollab = require('./cardListCollab')(sequelize, DataTypes);
const CardListChat = require('./cardListChat')(sequelize, DataTypes);
const UserActivityLog = require('./userActivityLog')(sequelize, DataTypes);
const LlmRecommendationHistory = require('./llmRecommendationHistory')(sequelize, DataTypes);
const AvatarComponent = require('./avatarComponent')(sequelize, DataTypes);
const UserAvatar = require('./userAvatar')(sequelize, DataTypes);
const AvatarUnlock = require('./avatarUnlock')(sequelize, DataTypes);

// A. USER MANAGEMENT & AUTHENTICATION
// User -> Token (1:M)
User.hasMany(Token, { foreignKey: 'userId', as: 'tokens' });
Token.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Card (1:M)
User.hasMany(Card, { foreignKey: 'userId', as: 'cards' });
Card.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Notification (1:M)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Friendship (1:M) - as requester
User.hasMany(Friendship, { foreignKey: 'userId', as: 'friendRequestsSent' });
Friendship.belongsTo(User, { foreignKey: 'userId', as: 'requester' });

// User -> Friendship (1:M) - as friend
User.hasMany(Friendship, { foreignKey: 'friendId', as: 'friendRequestsReceived' });
Friendship.belongsTo(User, { foreignKey: 'friendId', as: 'friend' });

// User -> Chat (1:M) - as sender
User.hasMany(Chat, { foreignKey: 'userId', as: 'chats' });
Chat.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> UserQuizResult (1:M)
User.hasMany(UserQuizResult, { foreignKey: 'userId', as: 'quizResults' });
UserQuizResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> MonthlyEvaluation (1:M)
User.hasMany(MonthlyEvaluation, { foreignKey: 'userId', as: 'monthlyEvaluations' });
MonthlyEvaluation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> UserActivityLog (1:M)
User.hasMany(UserActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
UserActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> LlmRecommendationHistory (1:M)
User.hasMany(LlmRecommendationHistory, { foreignKey: 'userId', as: 'recommendationHistories' });
LlmRecommendationHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> CardListCollab (1:M)
User.hasMany(CardListCollab, { foreignKey: 'userId', as: 'collaborations' });
CardListCollab.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> CardListChat (1:M)
User.hasMany(CardListChat, { foreignKey: 'userId', as: 'cardListChats' });
CardListChat.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> UserAvatar (1:1)
User.hasOne(UserAvatar, { foreignKey: 'userId', as: 'avatar' });
UserAvatar.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> AvatarUnlock (1:M)
User.hasMany(AvatarUnlock, { foreignKey: 'userId', as: 'avatarUnlocks' });
AvatarUnlock.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// C. STRATEGI BELAJAR & CARD MANAGEMENT
// Card -> CardList (1:1)
Card.hasOne(CardList, { foreignKey: 'cardId', as: 'cardList' });
CardList.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// LearningStrat -> CardList (1:M)
LearningStrat.hasMany(CardList, { foreignKey: 'learningId', as: 'cardLists' });
CardList.belongsTo(LearningStrat, { foreignKey: 'learningId', as: 'learningStrat' });

// Card -> ColumnMovement (1:M)
Card.hasMany(ColumnMovement, { foreignKey: 'cardId', as: 'columnMovements' });
ColumnMovement.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// D. KOLABORASI, CHAT & SOSIAL
// Chat -> User (1:M) - as friend/recipient
Chat.belongsTo(User, { foreignKey: 'friendId', as: 'recipient' });
User.hasMany(Chat, { foreignKey: 'friendId', as: 'receivedChats' });

// CardList -> CardListCollab (1:M)
CardList.hasMany(CardListCollab, { foreignKey: 'cardId', as: 'collaborations' });
CardListCollab.belongsTo(CardList, { foreignKey: 'cardId', as: 'cardList' });

// CardListCollab -> CardListChat (1:M)
CardListCollab.hasMany(CardListChat, { foreignKey: 'collabId', as: 'chats' });
CardListChat.belongsTo(CardListCollab, { foreignKey: 'collabId', as: 'collab' });

// E. GAMIFIKASI (AVATAR)
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'hairId', as: 'hairUsers' });
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'faceId', as: 'faceUsers' });
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'shirtId', as: 'shirtUsers' });
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'pantsId', as: 'pantsUsers' });
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'specialId', as: 'specialUsers' });

AvatarComponent.hasMany(AvatarUnlock, { foreignKey: 'componentId', as: 'unlocks' });
AvatarUnlock.belongsTo(AvatarComponent, { foreignKey: 'componentId', as: 'component' });

UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'hairId', as: 'hair' });
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'faceId', as: 'face' });
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'shirtId', as: 'shirt' });
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'pantsId', as: 'pants' });
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'specialId', as: 'special' });

module.exports = {
  User,
  Token,
  Card,
  CardList,
  LearningStrat,
  ColumnMovement,
  Notification,
  Chat,
  Friendship,
  LlmPromptTemplate,
  MslqStaticQuestion,
  UserQuizResult,
  MonthlyEvaluation,
  CardListCollab,
  CardListChat,
  UserActivityLog,
  LlmRecommendationHistory,
  AvatarComponent,
  UserAvatar,
  AvatarUnlock,
  sequelize
};
```

**Key Notes from Actual Implementation:**
- Foreign keys use **camelCase** (`userId`, `cardId`, `learningId`, `ccmId`, `chatId`, `friendId`, `collabId`, `componentId`, `hairId`, `faceId`, `shirtId`, `pantsId`, `specialId`)
- All associations use `as` aliases for eager loading
- `Chat` has dual association to User: as sender (`userId`) and as recipient (`friendId`)
- `UserAvatar` has 5 separate belongsTo associations to `AvatarComponent` for different component types
- Models with no direct associations: `LlmPromptTemplate`, `MslqStaticQuestion`


## Alur Integrasi Evaluasi & Rekomendasi LLM

```
[1. Registrasi User] ──> [2. LLM Recommendation Engine (Initial)]
                                      │
                                      ▼
                        [3. Kuis Diagnostik MSLQ (LLM / Static Fallback)]
                                      │
                                      ▼
                        [4. Recommender: Lock/Unlock Fitur & Strategi]
                                      │
                                      ▼
                        [5. Aktivitas Harian (user_activity_logs)]
                                      │
                                      ▼
                        [6. Evaluasi Bulanan (monthly_evaluations)]
                                 │                 │
                   (Synchronized)│                 │(Disynchronized)
                                 ▼                 ▼
                       [Lanjut Aktivitas]   [7. Trigger Re-Quiz (Retake)]
```

**Detail Flow:**

1. **Initial LLM Recommendation** (Post-Registration):
   - Saat user baru register, LLM dijalankan untuk memberikan rekomendasi awal
   - Mengambil `llm_prompt_templates` (system prompt: `template_name`='initial_recommendation' atau 'mslq_quiz_generator')
   - Input: data profil user (role, preferensi awal jika ada)
   - Output: rekomendasi strategi belajar awal & fitur yang disarankan
   - Disimpan ke `llm_recommendation_histories` dengan `trigger_type`='ON_DEMAND'

2. **Input Sources** (Data Collection):
   - `user_activity_logs` - Mencatat aktivitas: CARD_MOVED, CHAT_SENT, REFLECTIONS_COMPLETED, dll
     - Fields: `activity_type` (VARCHAR), `ref_id` (UUID reference ke card/chat/ccm), `metadata` (JSONB detail: {"from":"Planning","to":"Progress"})
   - `user_quiz_results` - Menyimpan hasil kuis MSLQ
     - Fields: `dominant_strategy`, `user_profile`, `unlocked_features` (JSONB array), `locked_features` (JSONB array), `answers_payload` (JSONB detail jawaban)

3. **LLM Evaluation Engine** (Processing):
   - Mengambil `llm_prompt_templates` (system prompt dinamis: `template_name`='monthly_evaluation' atau 'mslq_quiz_generator')
   - Query `user_activity_logs` + `user_quiz_results` sebagai `input_context` JSONB
   - Kirim ke LLM untuk evaluasi sinkronisasi profil vs perilaku & rekomendasi strategi

4. **Output Storage** (Persistence):
   - `monthly_evaluations` - Hasil evaluasi bulanan
     - Fields: `month_year` (MM-YYYY), `is_synchronized` (BOOLEAN), `requires_quiz_retake` (BOOLEAN), `detected_issues` (JSONB), `llm_feedback` (TEXT), `resolved_at` (TIMESTAMPTZ nullable)
     - Unique constraint: `unique_user_monthly_eval` (user_id + month_year)
   - `llm_recommendation_histories` - Audit trail rekomendasi LLM
     - Fields: `trigger_type` (INITIAL_RECOMMENDATION/MONTHLY_EVAL/QUIZ_RESULT/ON_DEMAND), `input_context` (JSONB: logs + quiz), `llm_output` (JSONB: rekomendasi utuh LLM)

5. **Trigger Types**:
   - `INITIAL_RECOMMENDATION` - Rekomendasi awal saat user baru register
   - `MONTHLY_EVAL` - Evaluasi bulanan otomatis (via cron job / scheduled task)
   - `QUIZ_RESULT` - Saat user menyelesaikan kuis MSLQ (POST `/api/user-quiz-results`)
   - `ON_DEMAND` - Manual trigger via API (POST `/api/llm-recommendation-histories`)

6. **Data Flow Sequence (Monthly Evaluation Cron)**:
   ```
   CRON Trigger (Monthly)
        │
        ▼
   [1] Query user_activity_logs (filter by user_id, month range)
   [2] Query user_quiz_results (latest by user_id)
   [3] Get llm_prompt_templates WHERE template_name='monthly_evaluation' AND is_active=true
   [4] Build input_context = { activity_logs[], quiz_result{} }
   [5] Call LLM with system_prompt + input_context
   [6] Parse LLM response → { is_synchronized, detected_issues[], llm_feedback, requires_quiz_retake }
   [7] INSERT monthly_evaluations + INSERT llm_recommendation_histories (trigger_type='MONTHLY_EVAL')
   ```

7. **Key JSONB Structures**:
   - `user_activity_logs.metadata`: `{ "from": "Planning", "to": "Progress", "card_title": "Task A" }`
   - `user_quiz_results.answers_payload`: `{ "q1": "A", "q2": "B", ... }`
   - `user_quiz_results.unlocked_features`: `["organization", "time_management"]`
   - `monthly_evaluations.detected_issues`: `[{ "type": "strategy_drift", "detail": "User claims organization but rarely moves cards to Done" }]`
   - `llm_recommendation_histories.input_context`: `{ logs: [...], quiz: {...} }`
   - `llm_recommendation_histories.llm_output`: `{ recommendations: [...], priority: "high" }`

## API Endpoints

### Auth
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- POST `/api/auth/logout` - Logout user (invalidate token)
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password

### Users
- GET `/api/users` - Get all users (admin)
- GET `/api/users/username/:username` - Get user by username
- GET `/api/users/:email` - Get user by email
- PUT `/api/users/:id` - Update user profile
- PUT `/api/users/:id/status` - Update user status (online/offline)
- DELETE `/api/users/:id` - Delete user (admin)

### Cards
- POST `/api/cards` - Create card
- GET `/api/cards` - Get all cards (with filters)
- GET `/api/cards/:id` - Get card by ID
- PUT `/api/cards/:id` - Update card
- DELETE `/api/cards/:id` - Delete card
- GET `/api/cards/user/:userId` - Get cards by user

### Card Lists (Card Details)
- POST `/api/cards/:cardId/list` - Create card list (details)
- GET `/api/cards/:cardId/list` - Get card list
- PUT `/api/cards/:cardId/list` - Update card list
- DELETE `/api/cards/:cardId/list` - Delete card list
- PUT `/api/cards/:cardId/list/archive` - Archive card
- PUT `/api/cards/:cardId/list/restore` - Restore archived card

### Learning Strategies
- POST `/api/learning-strats` - Create learning strategy
- GET `/api/learning-strats` - Get all learning strategies
- GET `/api/learning-strats/:learning_startegy` - Get learning strategy by learning_strategy
- PUT `/api/learning-strats/:id` - Update learning strategy
- DELETE `/api/learning-strats/:id` - Delete learning strategy

### Column Movements
- POST `/api/column-movements` - Record column movement
- GET `/api/column-movements` - Get all movements (with filters)
- GET `/api/column-movements/:id` - Get movement by ID
- GET `/api/column-movements/card/:cardId` - Get movements for a card
- PUT `/api/column-movements/:id/complete` - Mark movement as completed

### Notifications
- POST `/api/notifications` - Create notification
- GET `/api/notifications` - Get user notifications (with filters)
- GET `/api/notifications/:id` - Get notification by ID
- PUT `/api/notifications/:id/read` - Mark as read
- PUT `/api/notifications/:id/click` - Mark as clicked
- PUT `/api/notifications/read-all` - Mark all as read
- DELETE `/api/notifications/:id` - Delete notification

### Chat (Direct Messages)
- POST `/api/chat` - Create chat message
- GET `/api/chat` - Get chat messages (with filters)
- GET `/api/chat/:id` - Get chat message by ID
- GET `/api/chat/user/:userId` - Get user's chat messages
- PUT `/api/chat/:id` - Update chat message
- DELETE `/api/chat/:id` - Delete chat message

### Friendships
- POST `/api/friendships` - Send friend request
- GET `/api/friendships` - Get friendships (with filters)
- GET `/api/friendships/:email` - Get friendship by email
- PUT `/api/friendships/:id/accept` - Accept friend request
- PUT `/api/friendships/:id/block` - Block friend
- PUT `/api/friendships/:id/reject` - Reject friend request
- DELETE `/api/friendships/:id` - Remove friendship
- GET `/api/friendships/user/:userId` - Get user's friends
- GET `/api/friendships/pending/:userId` - Get pending requests

### LLM Prompt Templates (Admin)
- POST `/api/llm-prompt-templates` - Create prompt template
- GET `/api/llm-prompt-templates` - Get all prompt templates
- GET `/api/llm-prompt-templates/name/:templateName` - Get by name
- GET `/api/llm-prompt-templates/:id` - Get by ID
- PUT `/api/llm-prompt-templates/:id` - Update template
- DELETE `/api/llm-prompt-templates/:id` - Delete template

### MSLQ Static Questions (Admin)
- POST `/api/mslq-static-questions` - Create static question
- GET `/api/mslq-static-questions` - Get all static questions
- GET `/api/mslq-static-questions/category/:category` - Get by category
- GET `/api/mslq-static-questions/:id` - Get by ID
- PUT `/api/mslq-static-questions/:id` - Update question
- DELETE `/api/mslq-static-questions/:id` - Delete question

### User Quiz Results
- POST `/api/user-quiz-results` - Create quiz result
- GET `/api/user-quiz-results` - Get all quiz results (admin)
- GET `/api/user-quiz-results/latest/:userId` - Get latest for user
- GET `/api/user-quiz-results/user/:userId` - Get all for user
- GET `/api/user-quiz-results/:id` - Get by ID
- PUT `/api/user-quiz-results/:id` - Update (admin)
- DELETE `/api/user-quiz-results/:id` - Delete (admin)

### Monthly Evaluations
- POST `/api/monthly-evaluations` - Create monthly evaluation
- GET `/api/monthly-evaluations` - Get all (admin)
- GET `/api/monthly-evaluations/user/:userId` - Get user's evaluations
- GET `/api/monthly-evaluations/user/:userId/month/:monthYear` - Get by user and month
- GET `/api/monthly-evaluations/:id` - Get by ID
- PUT `/api/monthly-evaluations/:id` - Update (admin)
- DELETE `/api/monthly-evaluations/:id` - Delete (admin)

### Card List Collaboration
- POST `/api/card-list-collab/card/:cardId` - Add collaborator
- GET `/api/card-list-collab` - Get all collaborations
- GET `/api/card-list-collab/card/:cardId` - Get by card
- GET `/api/card-list-collab/user/:userId` - Get by user
- GET `/api/card-list-collab/:id` - Get by ID
- PUT `/api/card-list-collab/:id/role` - Update role
- DELETE `/api/card-list-collab/:id` - Remove collaborator

### Card List Chat
- POST `/api/card-list-chat/collab/:collabId` - Send message
- GET `/api/card-list-chat` - Get all messages
- GET `/api/card-list-chat/collab/:collabId` - Get messages for collaboration
- GET `/api/card-list-chat/:id` - Get by ID
- PUT `/api/card-list-chat/:id` - Update message
- DELETE `/api/card-list-chat/:id` - Delete message

### User Activity Logs
- POST `/api/user-activity-logs` - Create activity log
- GET `/api/user-activity-logs` - Get all logs (admin)
- GET `/api/user-activity-logs/user/:userId` - Get user's logs
- GET `/api/user-activity-logs/type/:activityType` - Get by type
- GET `/api/user-activity-logs/:id` - Get by ID
- DELETE `/api/user-activity-logs/:id` - Delete (admin)

### LLM Recommendation Histories
- POST `/api/llm-recommendation-histories` - Create recommendation history
- GET `/api/llm-recommendation-histories` - Get all (admin)
- GET `/api/llm-recommendation-histories/user/:userId` - Get user's histories
- GET `/api/llm-recommendation-histories/trigger/:triggerType` - Get by trigger type
- GET `/api/llm-recommendation-histories/:id` - Get by ID
- DELETE `/api/llm-recommendation-histories/:id` - Delete (admin)

### Avatar Components (Admin)
- POST `/api/avatar-components` - Create component
- GET `/api/avatar-components` - Get all components
- GET `/api/avatar-components/category/:category` - Get by category
- GET `/api/avatar-components/:id` - Get by ID
- PUT `/api/avatar-components/:id` - Update component
- DELETE `/api/avatar-components/:id` - Delete component

### User Avatar
- GET `/api/user-avatar` - Get current user's avatar
- PUT `/api/user-avatar` - Update avatar

### Avatar Unlocks
- POST `/api/avatar-unlocks` - Unlock component
- GET `/api/avatar-unlocks` - Get all unlocks
- GET `/api/avatar-unlocks/user/:userId` - Get user's unlocks
- GET `/api/avatar-unlocks/component/:componentId` - Get by component
- GET `/api/avatar-unlocks/check/:componentId` - Check if unlocked
- GET `/api/avatar-unlocks/:id` - Get by ID
- DELETE `/api/avatar-unlocks/:id` - Remove unlock

## Quick Start

```bash
npm install
cp .env.example .env  # Configure variables

# Option 1: Create DB manually, then generate models
createdb -U postgres Gamatutor
npm run db:generate

# Option 2: Use sync (development) - creates tables automatically
npm run dev           # Development with nodemon
npm start             # Production
```

## Notes

### Current Implementation Status
- ✅ **Core Database Schema**: 20 tables fully implemented (users, token, cards, learning_strats, card_list, card_column_movements, notifications, chat, friendships, llm_prompt_templates, mslq_static_questions, user_quiz_results, monthly_evaluations, card_list_collab, card_list_chat, user_activity_logs, llm_recommendation_histories, avatar_components, user_avatar, avatar_unlocks)
- ✅ **Models**: All 20 models defined matching DB schema
- ✅ **Associations**: All defined per DB foreign keys (see Model Associations section above for exact code)
- ✅ **Controllers/Services/Routes**: All 20 implemented
- ✅ **API Endpoints**: All endpoints implemented

### Key Schema Notes
| Table | Primary Key | Key Relationships |
|-------|-------------|-------------------|
| users | user_id (UUID) | - |
| token | token_id (UUID) | user_id → users |
| cards | card_id (UUID) | user_id → users, learning_id → learning_strats |
| learning_strats | learning_id (UUID) | - |
| card_list | card_id (UUID, PK+FK) | card_id → cards |
| card_column_movements | ccm_id (UUID) | card_id → cards |
| notifications | notif_id (UUID) | user_id → users, trigger_user_id → users |
| chat | chat_id (UUID) | user_id → users, friend_id → users |
| friendships | fs_id (UUID) | user_id → users, friend_id → users |
| llm_prompt_templates | prompt_id (UUID) | - |
| mslq_static_questions | static_q_id (UUID) | - |
| user_quiz_results | quiz_result_id (UUID) | user_id → users |
| monthly_evaluations | eval_id (UUID) | user_id → users |
| card_list_collab | collab_id (UUID) | card_id → cards, user_id → users |
| card_list_chat | chat_colab_id (UUID) | collab_id → card_list_collab, user_id → users |
| user_activity_logs | log_id (UUID) | user_id → users |
| llm_recommendation_histories | rec_id (UUID) | user_id → users |
| avatar_components | ava_id (UUID) | - |
| user_avatar | user_id (UUID, PK+FK) | user_id → users, component FKs → avatar_components |
| avatar_unlocks | ava_un_id (UUID) | user_id → users, component_id → avatar_components |

### Important Observations (Based on Actual Model Code & QueryDb.sql)
1. **No Boards/Columns tables** - The schema uses `card_column_movements` for tracking column transitions instead of explicit board/column entities
2. **card_list extends cards** - 1:1 relationship where card_list.card_id is both PK and FK to cards
3. **UUID everywhere** - All primary keys use UUID with gen_random_uuid()
4. **token table** - Separate table for JWT tokens (stateful auth) rather than stateless JWT
5. **No eval_strats table** - Database has 20 tables (excludes eval_strats); evaluation data flows through user_activity_logs + user_quiz_results → monthly_evaluations + llm_recommendation_histories
6. **Column name note** - `learning_strats.learning_id` (not `lerning_id`)
7. **password length** - Model validates 6-16 chars, DB column allows VARCHAR(255)
8. **Timestamps** - Most models use `timestamps: false` with explicit `createdAt`/`updatedAt` fields mapped to snake_case columns
9. **Token & Card models** - No `created_at` column in model (timestamps: false, no createdAt field)
10. **cards table** - Has `nm_matkul` (required), `learning_id` FK to learning_strats, and all reflection/evaluation fields
11. **card_list table** - Only has `card_id` (PK+FK), `sub_title`, `end_time_list` - NO `learning_id` 
12. **card_list_collab** - References `cards` (not `card_list`) via `card_id`
13. **Chat model** - Includes `status` field (delivered/read) and `friendId` FK
14. **Friendship status** - Includes 'declined' status along with 'pending', 'accepted', 'blocked'
15. **Foreign keys in associations** - Use camelCase (`userId`, `cardId`, etc.) matching Sequelize model field names, not snake_case DB column names
16. **learning_strats** - Includes `key_code` field (UNIQUE) with 7 valid values: rehearsal, organization, elaboration, time_management, help_seeking, metacognitive_self_regulation, critical_thinking

### SSL for Production (Supabase, Neon, Railway)
In `.env`:
```
DB_SSL=true
```
In `database.js`:
```javascript
dialectOptions: {
  ssl: process.env.DB_SSL === 'true' ? {
    require: true,
    rejectUnauthorized: false
  } : false
}
```

## MVC Pattern Implementation

- **Models**: Sequelize models in `src/models/` (auto-generated from DB + manual associations)
- **Views**: JSON responses (REST API)
- **Controllers**: Request handling in `src/controllers/`
- **Routes**: URL mapping in `src/routes/`
- **Services**: Business logic in `src/services/`
- **Middleware**: Cross-cutting concerns in `src/middleware/`