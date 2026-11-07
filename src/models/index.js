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
const UserAvatar = require('./userAvatar')(sequelize, DataTypes);

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

// C. STRATEGI BELAJAR & CARD MANAGEMENT
// Card -> CardList (1:1)
Card.hasMany(CardList, { foreignKey: 'cardId', as: 'cardList' });
CardList.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// Card -> LearningStrat (M:1)
Card.belongsTo(LearningStrat, { foreignKey: 'learningId', as: 'learningStrat' });
LearningStrat.hasMany(Card, { foreignKey: 'learningId', as: 'cards' });

// Card -> ColumnMovement (1:M)
Card.hasMany(ColumnMovement, { foreignKey: 'cardId', as: 'columnMovements' });
ColumnMovement.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// Card -> CardListCollab (1:M)
Card.hasMany(CardListCollab, { foreignKey: 'cardId', as: 'collaborations' });
CardListCollab.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// D. KOLABORASI, CHAT & SOSIAL
// Chat -> User (1:M) - as friend/recipient
Chat.belongsTo(User, { foreignKey: 'friendId', as: 'recipient' });
User.hasMany(Chat, { foreignKey: 'friendId', as: 'receivedChats' });

// CardListCollab -> CardListChat (1:M)
CardListCollab.hasMany(CardListChat, { foreignKey: 'collabId', as: 'chats' });
CardListChat.belongsTo(CardListCollab, { foreignKey: 'collabId', as: 'collab' });

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
  UserAvatar,
  sequelize
};