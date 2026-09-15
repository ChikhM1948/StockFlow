const mongoose = require('mongoose');

/**
 * Compteur atomique utilisé pour générer les numéros de document
 * (Bon de Sortie, Facture) sans collision, même sous accès concurrent.
 * _id ex: "64f...brandId_DISPATCH_2026"
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
