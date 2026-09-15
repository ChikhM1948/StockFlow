const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot au moment du retour
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/**
 * Bon de Retour : matérialise le retour de marchandise invendue ou
 * endommagée du stock d'un Distributeur vers le Stock Central.
 * Inverse du Dispatch : décrémente DistributorStock, incrémente Product.
 */
const returnSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },

    returnNumber: { type: String, required: true }, // ex: BR-2026-0001 (unique par marque, cf. index composé ci-dessous)

    distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    items: { type: [returnItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    reason: {
      type: String,
      enum: ['UNSOLD', 'DAMAGED', 'OTHER'],
      required: true,
    },
    note: { type: String, default: '' },

    date: { type: Date, default: Date.now },

    pdfPath: { type: String, default: null },
  },
  { timestamps: true }
);

// returnNumber est généré par marque (cf. generateDocNumber), donc unique
// seulement par marque, pas globalement.
returnSchema.index({ brand: 1, returnNumber: 1 }, { unique: true });

module.exports = mongoose.model('Return', returnSchema);
