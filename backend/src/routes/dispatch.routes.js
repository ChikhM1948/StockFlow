const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { createDispatch, downloadDispatchPdf, listDispatches } = require('../controllers/dispatch.controller');

const router = express.Router();

router.use(protect);

router.post('/', authorize('BRAND_ADMIN'), createDispatch);
router.get('/', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), listDispatches);
router.get('/:id/pdf', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), downloadDispatchPdf);

module.exports = router;
