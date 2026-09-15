const mongoose = require('mongoose');

/**
 * Brand = la "marque blanche" d'un client (entreprise cliente).
 * Créée en état PENDING au moment où le Super Admin génère un AdminToken,
 * puis passée en ACTIVE lors de l'onboarding (redemption du token).
 */
const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    logoUrl: { type: String, default: null },

    // Thème dynamique de l'app pour cette marque
    theme: {
      primaryColor: { type: String, default: '#2563EB' },
      secondaryColor: { type: String, default: '#1E293B' },
    },

    // Infos affichées en pied de page des PDF (factures, bons de sortie...)
    invoiceFooter: {
      addressLine: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      taxId: { type: String, default: '' }, // NIF / RCCM / SIRET selon le pays
      customText: { type: String, default: '' },
    },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    token: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminToken', default: null },

    // Repris de AdminToken.maxDevices à la création : nombre d'appareils
    // pouvant se connecter simultanément avec les comptes de cette marque.
    maxDevices: { type: Number, min: 1, max: 8, default: 1 },

    status: {
      type: String,
      enum: ['PENDING', 'TRIAL', 'ACTIVE', 'SUSPENDED'],
      default: 'PENDING',
    },

    // Fin de l'essai gratuit (14 jours, sans Token ID). null si non applicable.
    trialEndsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/**
 * Vrai si la marque a accès à l'application : abonnement actif via Token ID,
 * ou essai gratuit encore en cours.
 */
brandSchema.methods.hasAccess = function hasAccess() {
  if (this.status === 'ACTIVE') return true;
  if (this.status === 'TRIAL') return !!this.trialEndsAt && this.trialEndsAt.getTime() > Date.now();
  return false;
};

module.exports = mongoose.model('Brand', brandSchema);
