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

    saleNumber: { type: String, required: true, unique: true }, // ex: FAC-2026-0001

    distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

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

    date: { type: Date, default: Date.now },

    documents: {
      invoicePdfPath: { type: String, default: null },
      deliveryNotePdfPath: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
