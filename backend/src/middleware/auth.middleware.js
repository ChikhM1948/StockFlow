const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

module.exports = { protect, authorize };
