const mongoose = require('mongoose');

/**
 * Dépense de la marque (loyer, salaires, carburant...), saisie par le
 * BRAND_ADMIN. Sert à calculer une caisse nette (ventes - dépenses),
 * la caisse existante ne suivant jusqu'ici que le chiffre d'affaires.
 */
const expenseSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },

    category: {
      type: String,
      enum: ['LOYER', 'SALAIRE', 'CARBURANT', 'FOURNITURES', 'AUTRE'],
      default: 'AUTRE',
    },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ brand: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
