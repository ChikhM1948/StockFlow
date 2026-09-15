const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const { getDashboardSummary } = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(protect, requireActiveBrand, authorize('BRAND_ADMIN'));

router.get('/summary', getDashboardSummary);

module.exports = router;
