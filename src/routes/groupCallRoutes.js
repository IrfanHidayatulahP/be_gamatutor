const express = require('express');
const { create, joinByTask, leave, end, getById, getParticipants, getHistory, updateSettings, updateParticipant, getByTaskId } = require('../controllers/groupCallController');
const { authenticate } = require('../middleware/auth');
const { uuidParamValidation, groupCallValidation, handleValidationErrors } = require('../middleware/validation');
const { param } = require('express-validator');

const router = express.Router();

router.use(authenticate);

const taskIdValidation = [
  param('taskId').isUUID().withMessage('Valid taskId required'),
  handleValidationErrors
];

const groupCallIdValidation = [
  param('groupCallId').isUUID().withMessage('Valid groupCallId required'),
  handleValidationErrors
];

// Create group call (requires taskId in body)
router.post('/', groupCallValidation, create);

// Join group call by taskId (body: { taskId })
router.post('/join', joinByTask);

// Get collaborative tasks (board feature)
router.get('/by-task/:taskId', taskIdValidation, getByTaskId);

// History
router.get('/', getHistory);

// Group call by ID
router.get('/:groupCallId', groupCallIdValidation, getById);
router.get('/:groupCallId/participants', groupCallIdValidation, getParticipants);

// Join/Leave/End by groupCallId
router.post('/:groupCallId/join', groupCallIdValidation, joinByTask); // Can also join by groupCallId if needed
router.post('/:groupCallId/leave', groupCallIdValidation, leave);
router.post('/:groupCallId/end', groupCallIdValidation, end);

// Settings
router.put('/:groupCallId/settings', groupCallIdValidation, updateSettings);
router.put('/:groupCallId/participants/:participantId', groupCallIdValidation, updateParticipant);

module.exports = router;