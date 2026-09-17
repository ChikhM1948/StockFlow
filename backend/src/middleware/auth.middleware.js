const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Brand = require('../models/Brand');

/**
 * Vérifie le JWT et attache req.user (document Mongoose complet, sans password).
 */
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Compte introuvable ou désactivé.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

/**
 * Restreint l'accès à certains rôles.
 * Usage: authorize('BRAND_ADMIN', 'SUPER_ADMIN')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé pour ce rôle." });
    }
    next();
  };
}

/**
 * Bloque l'accès aux routes métier si l'essai gratuit (14 jours) est terminé
 * et qu'aucun abonnement n'a été activé (Token ID). Le SUPER_ADMIN n'a pas
 * de marque et n'est jamais concerné.
 * À appliquer après `protect` sur les routes métier (produits, ventes,
 * dispatches, caisse...). Ne pas l'appliquer sur /auth/me ou /auth/activate,
 * qui doivent rester accessibles pour que l'utilisateur puisse voir son
 * statut et soumettre un Token ID.
 */
async function requireActiveBrand(req, res, next) {
  if (!req.user.brand) return next(); // SUPER_ADMIN

  const brand = await Brand.findById(req.user.brand);
  if (!brand) {
    return res.status(404).json({ message: 'Marque introuvable.' });
  }

  if (!brand.hasAccess()) {
    return res.status(402).json({
      code: 'SUBSCRIPTION_REQUIRED',
      message: "Votre période d'essai gratuit est terminée. Entrez un Token ID pour continuer.",
    });
  }

  req.brand = brand;
  next();
}

/**
 * Bloque l'auto-attribution de stock par un distributeur si le BRAND_ADMIN
 * ne lui en a pas explicitement donné la permission (User.canAddStock).
 * Sans effet pour les autres rôles.
 */
function requireCanAddStock(req, res, next) {
  if (req.user.role === 'DISTRIBUTOR' && !req.user.canAddStock) {
    return res.status(403).json({
      message: "Vous n'avez pas la permission d'ajouter du stock. Contactez votre administrateur.",
    });
  }
  next();
}

module.exports = { protect, authorize, requireActiveBrand, requireCanAddStock };
