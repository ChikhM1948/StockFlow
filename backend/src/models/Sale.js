const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/**
 * Vente réalisée par un Distributeur auprès d'un client final
 * (épicerie, grossiste, particulier...). Génère Facture + Bon de Livraison.
 */
const saleSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },

    saleNumber: { type: String, required: true }, // ex: FAC-2026-0001 (unique par marque, cf. index composé ci-dessous)

    distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Référence vers l'entité Customer (historique/solde inter-ventes),
    // en plus du snapshot ci-dessous utilisé tel quel par la Facture PDF.
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },

    customer: {
      name: { type: String, required: true, trim: true },
      type: {
        type: String,
        enum: ['EPICERIE', 'GROSSISTE', 'PARTICULIER', 'AUTRE'],
        default: 'AUTRE',
      },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
    },

    items: { type: [saleItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    paymentStatus: {
      type: String,
      enum: ['PAID', 'UNPAID', 'PARTIAL'],
      default: 'PAID',
    },
    amountPaid: { type: Number, default: 0 },

    // Historique des encaissements ultérieurs à la création de la vente
    // (paiement initial inclus dans amountPaid à la création, cf. createSale).
    payments: {
      type: [
        {
          amount: { type: Number, required: true, min: 0.01 },
          date: { type: Date, default: Date.now },
          note: { type: String, default: '' },
          recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
      ],
      default: [],
    },

    date: { type: Date, default: Date.now },

    documents: {
      invoicePdfPath: { type: String, default: null },
      deliveryNotePdfPath: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// saleNumber est généré par marque (cf. generateDocNumber), donc unique
// seulement par marque, pas globalement : deux marques ont chacune leur "FAC-2026-0001".
saleSchema.index({ brand: 1, saleNumber: 1 }, { unique: true });

module.exports = mongoose.model('Sale', saleSchema);
