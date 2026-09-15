const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { getMyBrand, updateMyBrand } = require('../controllers/brand.controller');

const router = express.Router();

router.use(protect);

router.get('/me', getMyBrand); // BRAND_ADMIN et DISTRIBUTOR (thème de l'app)
router.patch('/me', authorize('BRAND_ADMIN'), updateMyBrand);

module.exports = router;
