const mongoose = require('mongoose');

const dispatchItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot au moment du dispatch
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/**
 * Bon de Sortie : matérialise la sortie de marchandise du Stock Central
 * vers le stock d'un Distributeur.
 */
const dispatchSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },

    dispatchNumber: { type: String, required: true, unique: true }, // ex: BS-2026-0001

    distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // BRAND_ADMIN

    items: { type: [dispatchItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    signatures: {
      adminName: { type: String, default: '' },
      distributorName: { type: String, default: '' },
    },

    date: { type: Date, default: Date.now },

    pdfPath: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispatch', dispatchSchema);
