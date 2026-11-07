const express = require('express');
const { getBoardData, getColumns, getCollaborativeTasks } = require('../controllers/boardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Place before '/' to avoid route shadowing
router.get('/collaborative-tasks', getCollaborativeTasks);
router.get('/', getBoardData);
router.get('/columns', getColumns);

module.exports = router;