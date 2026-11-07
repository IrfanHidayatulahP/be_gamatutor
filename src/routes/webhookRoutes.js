const express = require('express');
const { webhookHandler } = require('../controllers/webhookController');

const router = express.Router();

// LiveKit webhook endpoint - NO authentication middleware (LiveKit signs requests)
router.post('/webhook', webhookHandler);

module.exports = router;