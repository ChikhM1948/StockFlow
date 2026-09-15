const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const {
  getStockCaisse,
  getMyCaisse,
  listDistributorsCaisse,
  getDistributorDetail,
} = require('../controllers/caisse.controller');

const router = express.Router();

router.use(protect, requireActiveBrand);

router.get('/stock', authorize('BRAND_ADMIN'), getStockCaisse);
router.get('/me', authorize('DISTRIBUTOR'), getMyCaisse);
router.get('/distributors', authorize('BRAND_ADMIN'), listDistributorsCaisse);
router.get('/distributors/:id', authorize('BRAND_ADMIN'), getDistributorDetail);

module.exports = router;
