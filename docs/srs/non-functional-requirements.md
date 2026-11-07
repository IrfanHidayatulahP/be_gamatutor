# Non-Functional Requirements - Gamatutor Backend

## 1. Performance Requirements

### 1.1 Response Time
| Metric | Target | Measurement |
|--------|--------|-------------|
| API p50 response time | < 200ms | All endpoints |
| API p95 response time | < 500ms | All endpoints |
| API p99 response time | < 1000ms | All endpoints |
| Database query p95 | < 100ms | Sequelize queries |
| LLM API calls | < 30s | External API timeout |

### 1.2 Throughput
| Metric | Target |
|--------|--------|
| Concurrent authenticated users | 1,000+ |
| Requests per second | 500+ |
| Database connections | Pool of 10 |

### 1.3 Resource Usage
| Resource | Limit |
|----------|-------|
| Memory per Node process | < 512MB |
| CPU per request (avg) | < 50ms |
| Database connection pool | 5-10 connections |

---

## 2. Security Requirements

### 2.1 Authentication & Authorization
| Requirement | Implementation |
|-------------|----------------|
| JWT-based authentication | RS256 or HS256, 7-day expiry |
| Token storage | Database with expiry tracking |
| Token rotation | Refresh revokes all old tokens |
| Password security | bcrypt, 12 rounds, min 6 max 16 chars |
| Role-based access | Middleware: authenticate + authorize('admin') |

### 2.2 Data Protection
| Requirement | Implementation |
|-------------|----------------|
| Passwords never in logs/response | User.toJSON() excludes sensitive fields |
| Reset tokens | UUID, 1-hour expiry, single-use |
| SQL injection prevention | Sequelize ORM parameterized queries |
| XSS prevention | Helmet headers, input validation |
| CORS | Configured for known origins |

### 2.3 API Security
| Requirement | Implementation |
|-------------|----------------|
| Rate limiting | Required for production (not yet implemented) |
| Request validation | express-validator on all endpoints |
| Error sanitization | No stack traces in production responses |
| Audit logging | UserActivityLog for all actions |

---

## 3. Scalability Requirements

### 3.1 Horizontal Scaling
- **Stateless API**: No session affinity required
- **Shared database**: PostgreSQL with connection pooling
- **Shared cache**: Redis for sessions (future)
- **Load balancer ready**: Health endpoint at `/health`

### 3.2 Database Scaling
- **Read replicas**: Supported for reporting queries
- **Partitioning**: Monthly evaluations by monthYear
- **Indexing**: On all FKs, frequently filtered columns
- **Connection pooling**: PgBouncer recommended for production

### 3.3 Background Processing
- **Cron jobs**: node-cron for monthly evaluations
- **Queue system**: Bull/Redis for async tasks (future)
- **LLM calls**: Async with timeout and retry logic

---

## 4. Reliability Requirements

### 4.1 Availability
| Metric | Target |
|--------|--------|
| Uptime | 99.9% (monthly) |
| Planned maintenance | < 4 hours/month |
| Recovery time (RTO) | < 30 minutes |
| Recovery point (RPO) | < 1 hour |

### 4.2 Error Handling
- **Centralized error handler**: All errors via errorHandler middleware
- **Structured errors**: AppError class with status codes
- **Validation errors**: Detailed field-level messages
- **Database errors**: Mapped to user-friendly messages
- **Logging**: Console (dev), structured logging (prod)

### 4.3 Data Integrity
- **Transactions**: For multi-table operations
- **Foreign keys**: Enforced at database level
- **Unique constraints**: Prevent duplicates
- **Check constraints**: Enum validation at DB level
- **Soft deletes**: Archive instead of hard delete

### 4.4 Disaster Recovery
- **Database backups**: Daily automated (infrastructure)
- **Point-in-time recovery**: WAL archiving
- **Migration strategy**: Sequelize migrations (production)
- **Rollback plan**: Migration down scripts

---

## 5. Maintainability Requirements

### 5.1 Code Organization
- **MVC pattern**: Clear separation of concerns
- **Modular routes**: One file per feature
- **Service layer**: Business logic separate from controllers
- **Model layer**: Sequelize models with associations

### 5.2 Code Quality
- **Validation middleware**: Reusable, composable validators
- **Error handling**: Consistent AppError usage
- **Environment config**: dotenv, no hardcoded secrets
- **Logging**: Morgan for HTTP, console for errors

### 5.3 Documentation
- **API docs**: Markdown per endpoint (this project)
- **Code comments**: JSDoc for complex functions
- **README**: Setup, run, test instructions
- **CHANGELOG**: Version history

### 5.4 Testing
- **Unit tests**: Jest for services
- **Integration tests**: Supertest for API endpoints
- **Coverage target**: > 80%
- **Test database**: Separate test DB

---

## 6. Usability Requirements

### 6.1 API Usability
- **Consistent naming**: kebab-case paths, camelCase JSON
- **Predictable responses**: Standard success/error formats
- **Pagination**: limit/offset on all list endpoints
- **Filtering**: Query parameters for common filters
- **Versioning**: Future /api/v1/ prefix

### 6.2 Developer Experience
- **Health check**: `/health` endpoint
- **Auto-sync (dev)**: sequelize.sync({alter: true})
- **Error messages**: Actionable, specific
- **Swagger/OpenAPI**: Future enhancement

---

## 7. Compliance Requirements

### 7.1 Data Privacy
- **Minimal data collection**: Only required fields
- **Right to deletion**: Archive endpoint (soft delete)
- **Data portability**: JSON export via API
- **Consent**: Explicit for email (future)

### 7.2 Educational Data
- **FERPA considerations**: Student data protection
- **Anonymization**: For research exports
- **Retention**: Configurable (not yet implemented)

---

## 8. Operational Requirements

### 8.1 Deployment
- **Container ready**: Dockerfile (future)
- **Environment variables**: All config via env
- **Database migration**: Sequelize CLI (production)
- **Health checks**: `/health` for orchestration

### 8.2 Monitoring
- **Application logs**: Structured JSON (future)
- **Metrics**: Response time, error rate, throughput
- **Alerting**: On error rate > 5%, latency > 1s
- **Database monitoring**: Slow queries, connections

### 8.3 Backup & Restore
- **Database**: Daily full, hourly incremental
- **Configuration**: Version controlled
- **Assets**: Avatar files backed up
- **Restore tested**: Quarterly

---

## 9. Technology Constraints

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18+ |
| ORM | Sequelize | 6.35+ |
| Database | PostgreSQL | 14+ |
| Auth | jsonwebtoken | 9.0+ |
| Password | bcryptjs | 2.4+ |
| Validation | express-validator | 7.0+ |
| Testing | Jest | 29.7+ |
| HTTP Testing | Supertest | 6.3+ |
| Cron | node-cron | 3.0+ |
| Security | helmet, cors | Latest |

---

## 10. Verification Methods

| Requirement Type | Verification Method |
|------------------|---------------------|
| Performance | Load testing (k6/Artillery) |
| Security | Penetration testing, dependency audit |
| Functional | Integration tests, manual testing |
| Reliability | Chaos engineering, failover testing |
| Maintainability | Code review, static analysis |
| Scalability | Stress testing, soak testing |

---

## 11. Trade-offs and Decisions

| Decision | Rationale |
|----------|-----------|
| JWT in DB vs stateless | Revocation support, audit trail |
| Soft deletes | Data integrity, recovery |
| Sequelize over raw SQL | Productivity, migration support |
| Express over Fastify | Ecosystem, team familiarity |
| No rate limiting (yet) | Dev simplicity, add for prod |
| Sync alter (dev) | Rapid iteration, not for prod |