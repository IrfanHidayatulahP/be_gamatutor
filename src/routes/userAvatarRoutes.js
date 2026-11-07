const express = require('express');
const { get, update } = require('../controllers/userAvatarController');
const { authenticate } = require('../middleware/auth');
const { uuidUserAvatarIdParamValidation, userAvatarValidation } = require('../middleware/validation');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.get('/', get);
router.put('/', writeLimiter, userAvatarValidation, update);

module.exports = router;