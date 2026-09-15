const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const { createSale, downloadInvoicePdf, downloadDeliveryNotePdf, listSales } = require('../controllers/sale.controller');

const router = express.Router();

router.use(protect, requireActiveBrand);

router.post('/', authorize('DISTRIBUTOR'), createSale);
router.get('/', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), listSales);
router.get('/:id/invoice', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), downloadInvoicePdf);
router.get('/:id/delivery-note', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), downloadDeliveryNotePdf);

module.exports = router;
