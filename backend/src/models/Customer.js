const mongoose = require('mongoose');

/**
 * Client final d'un Distributeur (épicerie, grossiste, particulier...).
 * Permet de suivre l'historique d'achats et le solde dû d'une même personne
 * à travers plusieurs Sale, au lieu de ne garder que des infos inline par vente.
 */
const customerSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },

    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['EPICERIE', 'GROSSISTE', 'PARTICULIER', 'AUTRE'],
      default: 'AUTRE',
    },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true }
);

customerSchema.index({ brand: 1, phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
