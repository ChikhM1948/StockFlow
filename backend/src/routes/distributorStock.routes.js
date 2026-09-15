const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const { listMyStock } = require('../controllers/distributorStock.controller');

const router = express.Router();

router.get('/me', protect, requireActiveBrand, authorize('DISTRIBUTOR'), listMyStock);

module.exports = router;
