const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { createProduct, listProducts } = require('../controllers/product.controller');

const router = express.Router();

router.use(protect, authorize('BRAND_ADMIN'));

router.post('/', createProduct);
router.get('/', listProducts);

module.exports = router;
