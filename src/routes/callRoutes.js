const express = require('express');
const { initiate, answer, reject, end, cancel, getById, getHistory, updateSignaling, initiateLiveKit, acceptLiveKit, rejectLiveKit } = require('../controllers/callController');
const { authenticate } = require('../middleware/auth');
const { uuidParamValidation, callValidation, handleValidationErrors } = require('../middleware/validation');
const { param } = require('express-validator');

const router = express.Router();

router.use(authenticate);

const callIdValidation = [
  param('callId').isUUID().withMessage('Valid call ID required'),
  handleValidationErrors
];

router.post('/', callValidation, initiate);
router.post('/initiate', callValidation, initiateLiveKit);
router.get('/', getHistory);
router.get('/:callId', callIdValidation, getById);
router.put('/:callId/answer', callIdValidation, answer);
router.put('/:callId/reject', callIdValidation, reject);
router.put('/:callId/end', callIdValidation, end);
router.post('/:callId/end', callIdValidation, end);  // ADD POST alias for frontend compatibility
router.put('/:callId/cancel', callIdValidation, cancel);
router.put('/:callId/signaling', callIdValidation, updateSignaling);

// LiveKit audio call accept/reject (no signalingData needed)
router.post('/:callId/accept', callIdValidation, acceptLiveKit);
router.post('/:callId/reject-livekit', callIdValidation, rejectLiveKit);

module.exports = router;