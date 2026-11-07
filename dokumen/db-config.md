# Database Configuration & Auto-Generate Models Report

## Database Analysis (from QueryDb.sql)

**Reference Schema** (from `dokumen/QueryDb.sql`):
- **Database**: PostgreSQL
- **Database Name**: `Gamatutor` (from current config)
- **Host**: `localhost`
- **Port**: `5432`
- **Username**: `postgres`
- **Password**: `DoNotEnter!`
- **Dialect**: `postgres`
- **Extension**: `pgcrypto` (for `gen_random_uuid()`)

### Key Schema Characteristics

| Aspect | QueryDb.sql Schema | Current Implementation |
|--------|-------------------|----------------------|
| Primary Keys | UUID (`gen_random_uuid()`) | SERIAL (INTEGER) |
| Users Table | first_name, last_name, username, role, reset_token | name, email, password |
| Auth | Separate `token` table | JWT in memory/headers |
| Cards | Minimal (`cards` + `card_list`) | Single `cards` table |
| Kanban | No boards/columns tables | Has `boards`, `columns` |
| Learning | `learning_strats`, `question_strats`, `eval_strats` | Not implemented |
| Tracking | `card_column_movements` | Not implemented |
| Notifications | Rich `notifications` table | Not implemented |

### Tables in QueryDb.sql

1. **users** - User accounts with UUID PK
2. **token** - Access token storage (separate table)
3. **cards** - Minimal card reference
4. **learning_strats** - Learning strategies master
5. **card_list** - Extended card details (difficulty, priority, reflection, grades, goals)
6. **card_column_movements** - Column movement history
7. **question_strats** - Questions per strategy per user
8. **eval_strats** - Evaluations linking movements, questions, users
9. **notifications** - Rich notification system

---

## sequelize-auto Command

### For QueryDb.sql Schema (PostgreSQL with UUID)

```bash
# Using npx (recommended - uses local devDependency)
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
  --tables users,token,cards,learning_strats,card_list,card_column_movements,question_strats,eval_strats,notifications

# Or using npm script (add to package.json)
npm run db:generate
```

### Command Options Explained

| Option | Value | Description |
|--------|-------|-------------|
| `-h` | `localhost` | Database host |
| `-d` | `Gamatutor` | Database name (from config) |
| `-u` | `postgres` | Username |
| `-p` | `5432` | PostgreSQL default port |
| `-x` | `DoNotEnter!` | Password (quoted due to special chars) |
| `-e` | `postgres` | Dialect: postgres |
| `-o` | `src/models` | Output directory |
| `-l` | `esm` | Language: ECMAScript modules |
| `--camelCase` | - | Convert column names to camelCase |
| `--tables` | comma-separated | Only generate listed tables |

### Additional Useful Options

```bash
# Use schema (if not public)
-s public

# Generate TypeScript instead
-l ts

# Skip views
--no-views

# Custom indentation (spaces)
-i 2

# Generate separate files per model (default)
# Use --single-file for single file output

# Include schema in model definition
--schema public
```

---

## Package.json Script

Add to `package.json`:

```json
{
  "scripts": {
    "db:generate": "sequelize-auto -h localhost -d Gamatutor -u postgres -p 5432 -x \"DoNotEnter!\" -e postgres -o src/models -l esm --camelCase --tables users,token,cards,learning_strats,card_list,card_column_movements,question_strats,eval_strats,notifications",
    "db:generate:all": "sequelize-auto -h localhost -d Gamatutor -u postgres -p 5432 -x \"DoNotEnter!\" -e postgres -o src/models -l esm --camelCase"
  }
}
```

---

## Expected Generated Model Structure

After running, `src/models/` will contain:

```
src/models/
├── index.js              # Auto-generated - loads all models
├── user.js               # users table
├── token.js              # token table
├── card.js               # cards table
├── learningStrat.js      # learning_strats table
├── cardList.js           # card_list table
├── cardColumnMovement.js # card_column_movements table
├── questionStrat.js      # question_strats table
├── evalStrat.js          # eval_strats table
└── notification.js       # notifications table
```

---

## Post-Generation Steps Required

### 1. Fix UUID Primary Keys
Auto-generated models may need manual adjustment for UUID PKs:

```javascript
// In each model, ensure:
id: {
  type: DataTypes.UUID,
  primaryKey: true,
  defaultValue: DataTypes.UUIDV4,  // or UUIDV1
  allowNull: false
}
```

### 2. Add Missing Associations
The schema has complex relationships that sequelize-auto may not fully capture:

```javascript
// In src/models/index.js - add after auto-generation:

// User associations
User.hasMany(Token, { foreignKey: 'userId', as: 'tokens', onDelete: 'CASCADE' });
User.hasMany(Card, { foreignKey: 'userId', as: 'cards', onDelete: 'CASCADE' });
User.hasMany(CardList, { foreignKey: 'userId', as: 'cardLists', onDelete: 'CASCADE' });
User.hasMany(QuestionStrat, { foreignKey: 'userId', as: 'questionStrats', onDelete: 'CASCADE' });
User.hasMany(EvalStrat, { foreignKey: 'userId', as: 'evalStrats', onDelete: 'CASCADE' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(CardColumnMovement, { foreignKey: 'userId', as: 'columnMovements' });

// Card associations
Card.hasOne(CardList, { foreignKey: 'cardId', as: 'details', onDelete: 'CASCADE' });
Card.hasMany(CardColumnMovement, { foreignKey: 'cardId', as: 'movements', onDelete: 'CASCADE' });
CardList.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// Learning strategy associations
LearningStrat.hasMany(CardList, { foreignKey: 'learningId', as: 'cards' });
LearningStrat.hasMany(QuestionStrat, { foreignKey: 'learningId', as: 'questions' });
CardList.belongsTo(LearningStrat, { foreignKey: 'learningId', as: 'strategy' });
QuestionStrat.belongsTo(LearningStrat, { foreignKey: 'learningId', as: 'strategy' });

// Question/Eval associations
QuestionStrat.hasMany(EvalStrat, { foreignKey: 'questId', as: 'evaluations' });
EvalStrat.belongsTo(QuestionStrat, { foreignKey: 'questId', as: 'question' });
EvalStrat.belongsTo(CardColumnMovement, { foreignKey: 'ccmId', as: 'movement' });
CardColumnMovement.hasMany(EvalStrat, { foreignKey: 'ccmId', as: 'evaluations' });
```

### 3. Add Custom Methods & Hooks

```javascript
// user.js - Password hashing (if not using separate token table)
hooks: {
  beforeCreate: async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 12);
    }
  },
  beforeUpdate: async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 12);
    }
  }
}

// cardList.js - Computed fields, validation
```

### 4. Handle JSON/JSONB Fields

```javascript
// question_strats.quest_llm_out -> JSONB
// eval_strats.eval_LLM_OUT -> JSONB
// notifications.data (if added) -> JSONB

questLlmOut: {
  type: DataTypes.JSONB,
  allowNull: true
}
```

---

## SSL Configuration (Production)

For cloud PostgreSQL (Supabase, Neon, Railway, etc.):

```bash
npx sequelize-auto \
  -h your-host.postgres.supabase.com \
  -d postgres \
  -u postgres \
  -p 5432 \
  -x "your-password" \
  -e postgres \
  -o src/models \
  -l esm \
  --camelCase \
  --dialectOptions.ssl.require=true \
  --dialectOptions.ssl.rejectUnauthorized=false
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

---

## Quick Test Commands

```bash
# 1. Test connection & list tables
npx sequelize-auto -h localhost -d Gamatutor -u postgres -p 5432 -x "DoNotEnter!" -e postgres --tables

# 2. Generate models (specific tables)
npm run db:generate

# 3. Generate ALL tables (if DB has more)
npm run db:generate:all

# 4. Verify output
ls -la src/models/
cat src/models/user.js  # Check first model
```

---

## Migration Gap Analysis

| QueryDb.sql Table | Current Implementation | Action Needed |
|-------------------|----------------------|---------------|
| `users` | ✅ `user.js` (different fields) | Align fields or migrate |
| `token` | ❌ Not implemented | Add if using DB token storage |
| `cards` | ✅ `card.js` (different structure) | Current has more fields |
| `learning_strats` | ❌ Not implemented | Add for Phase 2 |
| `card_list` | ❌ Merged into `cards` | Current simpler design |
| `card_column_movements` | ❌ Not implemented | Add for analytics |
| `question_strats` | ❌ Not implemented | Add for quests |
| `eval_strats` | ❌ Not implemented | Add for evaluations |
| `notifications` | ❌ Not implemented | Add for Phase 3 |
| `boards` | ✅ `board.js` | **Not in QueryDb.sql** |
| `columns` | ✅ `column.js` | **Not in QueryDb.sql** |
| `study_sessions` | ✅ `studySession.js` | **Not in QueryDb.sql** |
| `reflections` | ✅ `reflection.js` | **Not in QueryDb.sql** |

### Recommendation

**Current implementation** (boards, columns, cards, study_sessions, reflections) is a **simplified Kanban-focused design** that diverges from QueryDb.sql.

**Options:**
1. **Keep current** - Simpler, matches Phase 1 requirements, easier to maintain
2. **Migrate to QueryDb.sql** - More complex, supports learning strategies, evaluations, detailed tracking
3. **Hybrid** - Keep current Kanban core, add learning_strats, notifications from QueryDb.sql

For Phase 1 (Kanban SRL), **current implementation is sufficient**. QueryDb.sql tables can be added incrementally in Phase 2-3.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `password authentication failed` | Check username/password in `.env` |
| `database "Gamatutor" does not exist` | Create DB: `createdb -U postgres Gamatutor` |
| `connection refused` | Ensure PostgreSQL is running on port 5432 |
| `extension "pgcrypto" does not exist` | Run: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";` |
| `ENOENT: no such file or directory` | Create output dir: `mkdir -p src/models` |
| UUID not generating | Ensure `defaultValue: DataTypes.UUIDV4` in model |
| Models not loading | Check `src/models/index.js` exports all models |
| Foreign key errors | Verify table names match (case-sensitive in PG) |