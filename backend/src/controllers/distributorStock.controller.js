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

module.exports = { listMyStock };
