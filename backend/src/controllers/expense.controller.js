const Expense = require('../models/Expense');
const { parseDateRangeQuery } = require('../utils/dateRange');

const CATEGORIES = ['LOYER', 'SALAIRE', 'CARBURANT', 'FOURNITURES', 'AUTRE'];

/**
 * POST /api/expenses
 * body: { category, label, amount, date? }
 */
async function createExpense(req, res) {
  const { category, label, amount, date } = req.body;

  if (!label || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'label et amount (positif) sont requis.' });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `category doit être l'une de: ${CATEGORIES.join(', ')}.` });
  }

  const expense = await Expense.create({
    brand: req.user.brand,
    category: category || 'AUTRE',
    label,
    amount: Number(amount),
    date: date ? new Date(date) : undefined,
    createdBy: req.user._id,
  });

  return res.status(201).json({ expense });
}

/**
 * GET /api/expenses?startDate=&endDate=&category=
 */
async function listExpenses(req, res) {
  const range = parseDateRangeQuery(req.query);
  const filter = { brand: req.user.brand };
  if (req.query.category) filter.category = req.query.category;
  if (range.start || range.end) {
    filter.date = {};
    if (range.start) filter.date.$gte = range.start;
    if (range.end) filter.date.$lte = range.end;
  }

  const expenses = await Expense.find(filter).sort({ date: -1 });
  return res.json({ expenses });
}

/**
 * DELETE /api/expenses/:id
 */
async function deleteExpense(req, res) {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, brand: req.user.brand });
  if (!expense) {
    return res.status(404).json({ message: 'Dépense introuvable.' });
  }
  return res.json({ message: 'Dépense supprimée.' });
}

module.exports = { createExpense, listExpenses, deleteExpense };
