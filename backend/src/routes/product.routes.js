const express = require('express');
const { protect, authorize, requireActiveBrand, requireCanAddStock } = require('../middleware/auth.middleware');
const {
  createProduct,
  listProducts,
  listLowStockProducts,
  updateLowStockThreshold,
} = require('../controllers/product.controller');

const router = express.Router();

router.use(protect, requireActiveBrand);

// Un DISTRIBUTOR autorisé (canAddStock) peut consulter le Stock Central
// pour choisir les articles à s'auto-attribuer.
router.get('/', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), requireCanAddStock, listProducts);

router.post('/', authorize('BRAND_ADMIN'), createProduct);
router.get('/low-stock', authorize('BRAND_ADMIN'), listLowStockProducts);
router.patch('/:id/threshold', authorize('BRAND_ADMIN'), updateLowStockThreshold);

module.exports = router;
