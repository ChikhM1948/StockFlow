const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const { listMyStock, listLowStockForBrand } = require('../controllers/distributorStock.controller');

const router = express.Router();

router.get('/me', protect, requireActiveBrand, authorize('DISTRIBUTOR'), listMyStock);
router.get('/low-stock', protect, requireActiveBrand, authorize('BRAND_ADMIN'), listLowStockForBrand);

module.exports = router;
