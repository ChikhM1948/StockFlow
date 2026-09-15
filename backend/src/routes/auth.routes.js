const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  onboardBrandAdmin,
  createDistributor,
  listDistributors,
  login,
  me,
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/onboard', onboardBrandAdmin); // validation du Token ID -> création BRAND_ADMIN
router.post('/login', login);
router.get('/me', protect, me);
router.post('/distributors', protect, authorize('BRAND_ADMIN'), createDistributor);
router.get('/distributors', protect, authorize('BRAND_ADMIN'), listDistributors);

module.exports = router;
