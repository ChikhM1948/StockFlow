const Product = require('../models/Product');

/**
 * Crée un article du Stock Central.
 * Les champs custom sont passés en tableau clé/valeur libre.
 *
 * POST /api/products
 * body: { name, quantity, unit, price, lowStockThreshold?, customFields?: [{ key, value }] }
 */
async function createProduct(req, res) {
  const { name, quantity, unit, price, lowStockThreshold, customFields } = req.body;

  if (!name || quantity == null || !unit || price == null) {
    return res.status(400).json({ message: 'name, quantity, unit et price sont requis.' });
  }

  const product = await Product.create({
    brand: req.user.brand,
    name,
    quantity,
    unit,
    price,
    lowStockThreshold: lowStockThreshold != null ? lowStockThreshold : undefined,
    customFields: customFields || [],
  });

  return res.status(201).json({ product });
}

/**
 * GET /api/products
 */
async function listProducts(req, res) {
  const products = await Product.find({ brand: req.user.brand, isActive: true }).sort({ createdAt: -1 });
  return res.json({ products });
}

/**
 * Articles du Stock Central dont la quantité est descendue au niveau (ou
 * en dessous) de leur seuil de stock faible.
 *
 * GET /api/products/low-stock
 */
async function listLowStockProducts(req, res) {
  const products = await Product.find({
    brand: req.user.brand,
    isActive: true,
    $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
  }).sort({ quantity: 1 });

  return res.json({ products });
}

/**
 * Met à jour le seuil de stock faible d'un article.
 *
 * PATCH /api/products/:id/threshold
 * body: { lowStockThreshold }
 */
async function updateLowStockThreshold(req, res) {
  const { lowStockThreshold } = req.body;

  if (lowStockThreshold == null || lowStockThreshold < 0) {
    return res.status(400).json({ message: 'lowStockThreshold doit être un nombre positif.' });
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, brand: req.user.brand },
    { lowStockThreshold },
    { new: true }
  );

  if (!product) {
    return res.status(404).json({ message: 'Article introuvable.' });
  }

  return res.json({ product });
}

module.exports = { createProduct, listProducts, listLowStockProducts, updateLowStockThreshold };
