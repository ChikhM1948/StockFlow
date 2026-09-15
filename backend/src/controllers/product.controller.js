const Product = require('../models/Product');

/**
 * Crée un article du Stock Central.
 * Les champs custom sont passés en tableau clé/valeur libre.
 *
 * POST /api/products
 * body: { name, quantity, unit, price, customFields?: [{ key, value }] }
 */
async function createProduct(req, res) {
  const { name, quantity, unit, price, customFields } = req.body;

  if (!name || quantity == null || !unit || price == null) {
    return res.status(400).json({ message: 'name, quantity, unit et price sont requis.' });
  }

  const product = await Product.create({
    brand: req.user.brand,
    name,
    quantity,
    unit,
    price,
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

module.exports = { createProduct, listProducts };
