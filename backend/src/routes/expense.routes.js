const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const { createExpense, listExpenses, deleteExpense } = require('../controllers/expense.controller');

const router = express.Router();

router.use(protect, requireActiveBrand, authorize('BRAND_ADMIN'));

router.post('/', createExpense);
router.get('/', listExpenses);
router.delete('/:id', deleteExpense);

module.exports = router;
