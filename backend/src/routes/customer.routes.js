const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const { listCustomers, getCustomerDetail } = require('../controllers/customer.controller');

const router = express.Router();

router.use(protect, requireActiveBrand);

router.get('/', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), listCustomers);
router.get('/:id', authorize('BRAND_ADMIN', 'DISTRIBUTOR'), getCustomerDetail);

module.exports = router;
