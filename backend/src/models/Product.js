const mongoose = require('mongoose');

/**
 * Champ libre clé/valeur permettant à l'Admin d'étendre la fiche produit
 * sans migration de schéma (ex: "Date de péremption", "Numéro de lot"...).
 */
const customFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },

    // Champs fixes
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, trim: true }, // kg, L, carton, sac...
    price: { type: Number, required: true, min: 0 },

    // Seuil sous lequel l'article est signalé en stock faible (badge Admin)
    lowStockThreshold: { type: Number, min: 0, default: 10 },

    // Champs dynamiques définis par l'Admin
    customFields: { type: [customFieldSchema], default: [] },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ brand: 1, name: 1 });

module.exports = mongoose.model('Product', productSchema);
