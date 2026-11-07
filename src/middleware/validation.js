const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6, max: 16 }).withMessage('Password min 6, max 16 characters'),
    body('firstName').optional().trim().isLength({ max: 50 }),
    body('lastName').optional().trim().isLength({ max: 50 }),
    body('username').optional().trim().isLength({ min: 1, max: 50 }),
    handleValidationErrors
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    handleValidationErrors
];

const forgotPasswordValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    handleValidationErrors
];

const resetPasswordValidation = [
    body('resetToken').optional().isUUID().withMessage('Valid reset token required'),
    body('token').optional().isUUID().withMessage('Valid reset token required'),
    body('newPassword').isLength({ min: 6, max: 16 }).withMessage('Password min 6, max 16 characters'),
    handleValidationErrors
];

const updateProfileValidation = [
    body('firstName').optional().trim().isLength({ max: 50 }),
    body('lastName').optional().trim().isLength({ max: 50 }),
    body('username').optional().trim().isLength({ min: 3, max: 50 }),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    handleValidationErrors
];

const fcmTokenValidation = [
    body('fcmToken').notEmpty().withMessage('FCM token required'),
    body('platform').optional().isIn(['android', 'ios', 'web']).withMessage('Platform must be android, ios, or web'),
    handleValidationErrors
];

const cardValidation = (req, res, next) => {
    const schema = Joi.object({
        courseName: Joi.string().allow('', null),
        title: Joi.string().allow('', null),
        description: Joi.string().allow('', null),
        learningId: Joi.string().uuid().allow(null),
        priority: Joi.string().valid('low', 'medium', 'high', 'critical').allow(null),
        difficulty: Joi.string().valid('easy', 'medium', 'hard', 'expert').allow(null),
        deadline: Joi.string().allow(null, ''),
        startTime: Joi.string().allow(null, ''),
        endTime: Joi.string().allow(null, ''),
        url: Joi.string().allow('', null),
        subtasks: Joi.array().items(
            Joi.alternatives().try(
                Joi.string(),
                Joi.object({
                    subTitle: Joi.string().allow('', null),
                    startTimeList: Joi.string().allow(null, ''),
                    endTimeList: Joi.string().allow(null, ''),
                })
            )
        ).allow(null),
        collaborators: Joi.array().items(Joi.string()).allow(null),
    }).unknown(true); // Izinkan field tambahan dari board/kolom

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

const cardListValidation = (req, res, next) => {
    const schema = Joi.object({
        subTitle: Joi.string().allow('', null),
        startTimeList: Joi.string().allow(null, ''),
        endTimeList: Joi.string().allow(null, ''),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

const columnMovementValidation = [
    body('cardId').isUUID().withMessage('Valid card ID required'),
    body('fromColumn').optional().isString(),
    body('toColumn').optional().isString(),
    handleValidationErrors
];

const chatValidation = [
    body('friendId').isUUID().withMessage('Valid friend ID required'),
    body('messageChat').notEmpty().withMessage('Message required'),
    body('status').optional().isIn(['delivered', 'read']),
    handleValidationErrors
];

const friendshipValidation = [
    body('friendId').isUUID().withMessage('Valid friend ID required'),
    handleValidationErrors
];

const cardListCollabValidation = [
    body('userId').isUUID().withMessage('Valid user ID required'),
    body('role').optional().isIn(['owner', 'member']).withMessage('Role must be owner or member'),
    handleValidationErrors
];

const cardListChatValidation = [
    body('message').notEmpty().withMessage('Message required'),
    handleValidationErrors
];

const callValidation = [
    body('calleeId').isUUID().withMessage('Valid callee ID required'),
    body('type').optional().isIn(['audio']).withMessage('Call type must be audio (voice-only app)'),
    body('signalingData').optional().isObject(),
    handleValidationErrors
];

const groupCallValidation = [
    body('title').optional().trim().isLength({ max: 255 }),
    body('type').optional().isIn(['audio']).withMessage('Call type must be audio (voice-only app)'),
    body('scheduledAt').optional().isISO8601().withMessage('Valid scheduled date required'),
    body('maxParticipants').optional().isInt({ min: 2, max: 50 }).withMessage('Max participants 2-50'),
    body('settings').optional().isObject(),
    handleValidationErrors
];

const learningStratValidation = [
    body('keyCode').isIn(['rehearsal', 'organization', 'elaboration', 'time_management', 'help_seeking', 'metacognitive_self_regulation', 'critical_thinking']).withMessage('Valid key_code required'),
    body('learningStrategy').notEmpty().isIn(['rehearsal', 'organization', 'elaboration', 'time management', 'help seeking', 'metacognitive self regulation', 'critical_thinking']).withMessage('Learning strategy name required'),
    body('description').optional().isString(),
    handleValidationErrors
];

const learningStratValidationName = [
    param('learningStrategy')
    .notEmpty()
    .custom((value) => {
        const validStrategies = ['rehearsal', 'organization', 'elaboration', 'time management', 'help seeking', 'metacognitive self regulation', 'critical thinking'];
        if (!validStrategies.includes(value.toLowerCase())) {
            throw new Error('Valid learning strategy required');
        }
        return true;
    }),
];

const notificationValidation = [
    body('userId').isUUID().withMessage('Valid user ID required'),
    body('type').isIn(['push', 'smart_reminder', 'social_presence', 'encouragement']).withMessage('Valid notification type required'),
    body('title').optional().trim().isLength({ max: 255 }),
    body('message').notEmpty().withMessage('Message required'),
    handleValidationErrors
];

const llmPromptTemplateValidation = [
    body('templateName').notEmpty().withMessage('Template name required'),
    body('systemPrompt').notEmpty().withMessage('System prompt required'),
    body('version').optional().isInt({ min: 1 }),
    body('isActive').optional().isBoolean(),
    handleValidationErrors
];

const mslqStaticQuestionValidation = [
    body('category').notEmpty().withMessage('Category required'),
    body('questionText').notEmpty().withMessage('Question text required'),
    body('options').isObject().withMessage('Valid options object required'),
    handleValidationErrors
];

const userQuizResultValidation = [
    body('answersPayload').optional().isObject().withMessage('Answers payload must be object'),
    handleValidationErrors
];

const monthlyEvaluationValidation = [
    body('monthYear').matches(/^\d{4}-\d{2}$/).withMessage('Month-year format: YYYY-MM'),
    body('isSynchronized').isBoolean().withMessage('isSynchronized required'),
    body('requiresQuizRetake').optional().isBoolean(),
    body('detectedIssues').isObject().withMessage('Detected issues must be object'),
    body('llmFeedback').notEmpty().withMessage('LLM feedback required'),
    handleValidationErrors
];

const monthlyEvalReflectionValidation = [
    body('monthYear').matches(/^\d{4}-\d{2}$/).withMessage('Month-year format: YYYY-MM'),
    body('userReason').notEmpty().isString().withMessage('userReason required'),
    handleValidationErrors
];

const userActivityLogValidation = [
    body('activityType').notEmpty().withMessage('Activity type required'),
    body('refId').optional().isUUID(),
    body('metadata').optional().isObject(),
    handleValidationErrors
];

const llmRecommendationHistoryValidation = [
    body('triggerType').notEmpty().withMessage('Trigger type required'),
    body('inputContext').isObject().withMessage('Input context must be object'),
    body('llmOutput').isObject().withMessage('LLM output must be object'),
    handleValidationErrors
];

const avatarComponentValidation = [
    body('category').isIn(['head', 'hair', 'face', 'shirt', 'pants', 'special']).withMessage('Valid category required'),
    body('name').notEmpty().withMessage('Name required'),
    body('assetPath').notEmpty().withMessage('Asset path required'),
    handleValidationErrors
];

const userAvatarValidation = [
    body('hairId').optional().isUUID(),
    body('faceId').optional().isUUID(),
    body('shirtId').optional().isUUID(),
    body('pantsId').optional().isUUID(),
    body('specialId').optional().isUUID(),
    handleValidationErrors
];

const avatarUnlockValidation = [
    body('componentId').isUUID().withMessage('Valid component ID required'),
    handleValidationErrors
];

const uuidParamValidation = [
    param('id').isUUID().withMessage('Valid UUID required'),
    handleValidationErrors
];

const uuidCardIdParamValidation = [
    param('cardId').isUUID().withMessage('Valid card ID required'),
    handleValidationErrors
];

const uuidLearningIdParamValidation = [
    param('learningId').isUUID().withMessage('Valid learning strategy ID required'),
    handleValidationErrors
];

const uuidCcmIdParamValidation = [
    param('ccmId').isUUID().withMessage('Valid column movement ID required'),
    handleValidationErrors
];

const uuidChatIdParamValidation = [
    param('chatId').isUUID().withMessage('Valid chat ID required'),
    handleValidationErrors
];

const uuidFriendshipIdParamValidation = [
    param('fsId').isUUID().withMessage('Valid friendship ID required'),
    handleValidationErrors
];

const uuidNotifIdParamValidation = [
    param('notifId').isUUID().withMessage('Valid notification ID required'),
    handleValidationErrors
];

const uuidUserIdParamValidation = [
    param('userId').isUUID().withMessage('Valid user ID required'),
    handleValidationErrors
];

const uuidLlmPromptTemplateIdParamValidation = [
    param('id').isUUID().withMessage('Valid template ID required'),
    handleValidationErrors
];

const uuidMslqQuestionIdParamValidation = [
    param('id').isUUID().withMessage('Valid MSLQ question ID required'),
    handleValidationErrors
];

const uuidQuizResultIdParamValidation = [
    param('id').isUUID().withMessage('Valid quiz result ID required'),
    handleValidationErrors
];

const uuidMonthlyEvalIdParamValidation = [
    param('id').isUUID().withMessage('Valid monthly evaluation ID required'),
    handleValidationErrors
];

const uuidCollabIdParamValidation = [
    param('id').isUUID().withMessage('Valid collaboration ID required'),
    handleValidationErrors
];

const uuidChatMsgIdParamValidation = [
    param('id').isUUID().withMessage('Valid chat message ID required'),
    handleValidationErrors
];

const uuidActivityLogIdParamValidation = [
    param('id').isUUID().withMessage('Valid activity log ID required'),
    handleValidationErrors
];

const uuidLlmRecIdParamValidation = [
    param('id').isUUID().withMessage('Valid recommendation history ID required'),
    handleValidationErrors
];

const uuidAvatarComponentIdParamValidation = [
    param('id').isUUID().withMessage('Valid avatar component ID required'),
    handleValidationErrors
];

const uuidUserAvatarIdParamValidation = [
    param('userId').isUUID().withMessage('Valid user ID required'),
    handleValidationErrors
];

const uuidAvatarUnlockIdParamValidation = [
    param('id').isUUID().withMessage('Valid avatar unlock ID required'),
    handleValidationErrors
];

const uuidGroupCallIdParamValidation = [
    param('groupCallId').isUUID().withMessage('Valid group call ID required'),
    handleValidationErrors
];

const uuidGroupCallParticipantIdParamValidation = [
    param('participantId').isUUID().withMessage('Valid participant ID required'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    updateProfileValidation,
    fcmTokenValidation,
    cardValidation,
    cardListValidation,
    columnMovementValidation,
    chatValidation,
    friendshipValidation,
    cardListCollabValidation,
    cardListChatValidation,
    callValidation,
    groupCallValidation,
    learningStratValidation,
    learningStratValidationName,
    notificationValidation,
    llmPromptTemplateValidation,
    mslqStaticQuestionValidation,
    userQuizResultValidation,
    monthlyEvaluationValidation,
    monthlyEvalReflectionValidation,
    userActivityLogValidation,
    llmRecommendationHistoryValidation,
    avatarComponentValidation,
    userAvatarValidation,
    avatarUnlockValidation,
    uuidParamValidation,
    uuidCardIdParamValidation,
    uuidLearningIdParamValidation,
    uuidCcmIdParamValidation,
    uuidChatIdParamValidation,
    uuidFriendshipIdParamValidation,
    uuidNotifIdParamValidation,
    uuidUserIdParamValidation,
    uuidLlmPromptTemplateIdParamValidation,
    uuidMslqQuestionIdParamValidation,
    uuidQuizResultIdParamValidation,
    uuidMonthlyEvalIdParamValidation,
    uuidCollabIdParamValidation,
    uuidChatMsgIdParamValidation,
    uuidActivityLogIdParamValidation,
    uuidLlmRecIdParamValidation,
    uuidAvatarComponentIdParamValidation,
    uuidUserAvatarIdParamValidation,
    uuidAvatarUnlockIdParamValidation,
    uuidGroupCallIdParamValidation,
    uuidGroupCallParticipantIdParamValidation
};