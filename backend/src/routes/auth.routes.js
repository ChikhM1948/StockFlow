const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const {
  onboardBrandAdmin,
  startTrial,
  activateBrand,
  createDistributor,
  listDistributors,
  updateDistributorPermissions,
  login,
  me,
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/onboard', onboardBrandAdmin); // validation du Token ID -> création BRAND_ADMIN
router.post('/trial', startTrial); // essai gratuit 14 jours, sans Token ID
router.post('/login', login);
router.get('/me', protect, me);
router.post('/activate', protect, activateBrand); // soumission du Token ID acheté -> passe la marque en ACTIVE
router.post('/distributors', protect, requireActiveBrand, authorize('BRAND_ADMIN'), createDistributor);
router.get('/distributors', protect, requireActiveBrand, authorize('BRAND_ADMIN'), listDistributors);
router.patch(
  '/distributors/:id/permissions',
  protect,
  requireActiveBrand,
  authorize('BRAND_ADMIN'),
  updateDistributorPermissions
);

module.exports = router;
