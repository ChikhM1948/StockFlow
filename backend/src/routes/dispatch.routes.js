const express = require('express');
const { protect, authorize, requireActiveBrand, requireCanAddStock } = require('../middleware/auth.middleware');
const { createDispatch, addOwnStock, downloadDispatchPdf, listDispatches } = require('../controllers/dispatch.controller');

const router = express.Router();

router.use(protect, requireActiveBrand);

router.post('/', authorize('BRAND_ADMIN'), createDispatch);
router.post('/self', authorize('DISTRIBUTOR'), requireCanAddStock, addOwnStock);
router.get('/', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), listDispatches);
router.get('/:id/pdf', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), downloadDispatchPdf);

module.exports = router;
