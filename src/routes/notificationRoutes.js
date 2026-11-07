// const express = require('express');
// const { create, getAll, getById, read, click, readAll, update, remove } = require('../controllers/notificationController');
// const { notificationValidation, uuidNotifIdParamValidation } = require('../middleware/validation');
// const { authenticate } = require('../middleware/auth');

// const router = express.Router();

// router.use(authenticate);

// router.post('/', notificationValidation, create);
// router.get('/', getAll);
// router.get('/:notifId', uuidNotifIdParamValidation, getById);
// router.put('/:notifId/read', uuidNotifIdParamValidation, read);
// router.put('/:notifId/click', uuidNotifIdParamValidation, click);
// router.put('/read-all', readAll);
// router.put('/:notifId', uuidNotifIdParamValidation, notificationValidation, update);
// router.delete('/:notifId', uuidNotifIdParamValidation, remove);

// module.exports = router;

const express = require('express');
const { create, getAll, getById, read, click, readAll, update, remove, actionNotification } = require('../controllers/notificationController');
const { notificationValidation, uuidNotifIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', notificationValidation, create);
router.get('/', getAll);
router.get('/:notifId', uuidNotifIdParamValidation, getById);
router.put('/:notifId/read', uuidNotifIdParamValidation, read);
router.put('/:notifId/click', uuidNotifIdParamValidation, click);
router.put('/:notifId/action', uuidNotifIdParamValidation, actionNotification);
router.put('/read-all', readAll);
router.put('/:notifId', uuidNotifIdParamValidation, notificationValidation, update);
router.delete('/:notifId', uuidNotifIdParamValidation, remove);

module.exports = router;