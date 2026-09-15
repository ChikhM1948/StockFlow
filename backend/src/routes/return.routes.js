const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const { createReturn, downloadReturnPdf, listReturns } = require('../controllers/return.controller');

const router = express.Router();

router.use(protect, requireActiveBrand);

router.post('/', authorize('DISTRIBUTOR'), createReturn);
router.get('/', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), listReturns);
router.get('/:id/pdf', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), downloadReturnPdf);

module.exports = router;
