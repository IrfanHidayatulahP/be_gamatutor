const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cardRoutes = require('./routes/cardRoutes');
const cardListRoutes = require('./routes/cardListRoutes');
const columnMovementRoutes = require('./routes/columnMovementRoutes');
const learningStratRoutes = require('./routes/learningStratRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const friendshipRoutes = require('./routes/friendshipRoutes');
const llmPromptTemplateRoutes = require('./routes/llmPromptTemplateRoutes');
const mslqStaticQuestionRoutes = require('./routes/mslqStaticQuestionRoutes');
const userQuizResultRoutes = require('./routes/userQuizResultRoutes');
const monthlyEvaluationRoutes = require('./routes/monthlyEvaluationRoutes');
const cardListCollabRoutes = require('./routes/cardListCollabRoutes');
const cardListChatRoutes = require('./routes/cardListChatRoutes');
const userActivityLogRoutes = require('./routes/userActivityLogRoutes');
const llmRecommendationHistoryRoutes = require('./routes/llmRecommendationHistoryRoutes');
const userAvatarRoutes = require('./routes/userAvatarRoutes');
const llmRoutes = require('./routes/llmRouters');

const llmMicroGoalRoutes = require('./routes/llmMicroGoalRoutes');

const boardRoutes = require('./routes/boardRoutes');
const progressRoutes = require('./routes/progressRoutes');
const groupCallRoutes = require('./routes/groupCallRoutes');
const callRoutes = require('./routes/callRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/cards/:cardId/list', cardListRoutes);
app.use('/api/learning-strats', learningStratRoutes);
app.use('/api/column-movements', columnMovementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/llm-prompt-templates', llmPromptTemplateRoutes);
app.use('/api/mslq-static-questions', mslqStaticQuestionRoutes);
app.use('/api/user-quiz-results', userQuizResultRoutes);
app.use('/api/monthly-evaluations', monthlyEvaluationRoutes);
app.use('/api/card-list-collab', cardListCollabRoutes);
app.use('/api/card-list-chat', cardListChatRoutes);
app.use('/api/llm-recommendation-histories', llmRecommendationHistoryRoutes);
app.use('/api/user-avatar', userAvatarRoutes);
app.use('/api/llmRekomen', llmRoutes);

app.use('/api/user-activity-logs', userActivityLogRoutes);
app.use('/api/activity-logs', userActivityLogRoutes);

app.use('/api/llmMicro', llmMicroGoalRoutes);

app.use('/api/board', boardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/group-calls', groupCallRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/calls', webhookRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;