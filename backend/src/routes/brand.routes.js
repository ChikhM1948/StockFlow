const express = require('express');
const { protect, authorize, requireActiveBrand } = require('../middleware/auth.middleware');
const { getMyBrand, updateMyBrand } = require('../controllers/brand.controller');

const router = express.Router();

router.use(protect);

// Pas de requireActiveBrand ici : la marque doit rester lisible (statut, thème)
// même après expiration de l'essai, pour afficher l'écran d'activation.
router.get('/me', getMyBrand); // BRAND_ADMIN et DISTRIBUTOR (thème de l'app)
router.patch('/me', requireActiveBrand, authorize('BRAND_ADMIN'), updateMyBrand);

module.exports = router;
