const DistributorStock = require('../models/DistributorStock');

/**
 * Stock attribué au distributeur connecté.
 * GET /api/distributor-stocks/me
 */
async function listMyStock(req, res) {
  const stocks = await DistributorStock.find({ distributor: req.user._id, quantity: { $gt: 0 } }).sort({
    productName: 1,
  });
  return res.json({ stocks });
}

/**
 * Vue Admin : lots de stock distribué (tous distributeurs confondus) dont la
 * quantité est descendue au niveau (ou en dessous) du seuil de stock faible.
 *
 * GET /api/distributor-stocks/low-stock
 */
async function listLowStockForBrand(req, res) {
  const stocks = await DistributorStock.find({
    brand: req.user.brand,
    $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
  })
    .populate('distributor', 'name email')
    .sort({ quantity: 1 });

  return res.json({ stocks });
}

module.exports = { listMyStock, listLowStockForBrand };
