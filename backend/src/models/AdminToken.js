const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Token de marque blanche généré par le Super Admin.
 * Un onboarding réussi (POST /api/auth/onboard) consomme ce token
 * et rattache l'utilisateur + le Brand créé en PENDING.
 */
const adminTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    companyName: { type: String, required: true, trim: true },

    // Nombre d'appareils pouvant se connecter simultanément pour cette marque cliente
    maxDevices: { type: Number, min: 1, max: 8, default: 1 },

    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },

    status: {
      type: String,
      enum: ['PENDING', 'USED', 'REVOKED'],
      default: 'PENDING',
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    redeemedAt: { type: Date, default: null },

    expiresAt: { type: Date, default: null }, // null = pas d'expiration
  },
  { timestamps: true }
);

/**
 * Génère un identifiant de token lisible et difficile à deviner,
 * ex: "BRD-8F3A-91C2-4D7E"
 */
adminTokenSchema.statics.generateTokenId = function generateTokenId() {
  const block = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BRD-${block()}-${block()}-${block()}`;
};

adminTokenSchema.methods.isValid = function isValid() {
  if (this.status !== 'PENDING') return false;
  if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return false;
  return true;
};

module.exports = mongoose.model('AdminToken', adminTokenSchema);
