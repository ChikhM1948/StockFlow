const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { createToken, listTokens, revokeToken } = require('../controllers/token.controller');

const router = express.Router();

router.use(protect, authorize('SUPER_ADMIN'));

router.post('/', createToken);
router.get('/', listTokens);
router.patch('/:id/revoke', revokeToken);

module.exports = router;
