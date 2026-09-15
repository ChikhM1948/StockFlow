const Counter = require('../models/Counter');

const PREFIXES = {
  DISPATCH: 'BS', // Bon de Sortie
  SALE: 'FAC', // Facture
  RETURN: 'BR', // Bon de Retour
};

/**
 * Génère un numéro de document séquentiel et unique par marque/année/type,
 * ex: "BS-2026-0001", "FAC-2026-0034".
 * Utilise findOneAndUpdate + $inc : atomique, sans race condition même
 * en cas de créations concurrentes.
 */
async function generateDocNumber(brandId, type) {
  const year = new Date().getFullYear();
  const counterId = `${brandId}_${type}_${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const prefix = PREFIXES[type];
  const padded = String(counter.seq).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

module.exports = generateDocNumber;
