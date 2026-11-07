const express = require('express');
const { create, getAll, getById, getByCategory, update, remove } = require('../controllers/mslqStaticQuestionController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidMslqQuestionIdParamValidation, mslqStaticQuestionValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

// Endpoint yang bisa diakses oleh semua user yang sudah login (Mahasiswa & Admin) untuk mengambil soal kuis
router.get('/', getAll);
router.get('/category/:category', getByCategory);
router.get('/:id', uuidMslqQuestionIdParamValidation, getById);

// Endpoint manajemen soal (Hanya Admin yang bisa membuat, mengubah, atau menghapus)
router.post('/', authorize('admin'), mslqStaticQuestionValidation, create);
router.put('/:id', authorize('admin'), uuidMslqQuestionIdParamValidation, mslqStaticQuestionValidation, update);
router.delete('/:id', authorize('admin'), uuidMslqQuestionIdParamValidation, remove);

module.exports = router;