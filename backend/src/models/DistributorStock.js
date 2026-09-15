const mongoose = require('mongoose');

/**
 * Stock attribué à un distributeur pour un produit donné.
 * Incrémenté lors d'un Dispatch (Bon de Sortie), décrémenté lors d'une Sale.
 * Un seul document par couple (brand, distributor, product).
 */
const distributorStockSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

    productName: { type: String, required: true }, // snapshot pour affichage rapide
    unit: { type: String, required: true },

    quantity: { type: Number, required: true, min: 0, default: 0 },
    lastUnitPrice: { type: Number, default: 0 },
    // Snapshot du seuil de stock faible du Product au moment du dernier Dispatch
    lowStockThreshold: { type: Number, min: 0, default: 10 },
  },
  { timestamps: true }
);

distributorStockSchema.index({ brand: 1, distributor: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('DistributorStock', distributorStockSchema);
