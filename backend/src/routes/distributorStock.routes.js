const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { listMyStock } = require('../controllers/distributorStock.controller');

const router = express.Router();

router.get('/me', protect, authorize('DISTRIBUTOR'), listMyStock);

module.exports = router;
