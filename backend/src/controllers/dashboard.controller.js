const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const DistributorStock = require('../models/DistributorStock');
const { parseDateRangeQuery } = require('../utils/dateRange');

const DEFAULT_TREND_DAYS = 30;

function defaultRangeStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (DEFAULT_TREND_DAYS - 1));
  return d;
}

/**
 * Tableau de bord du BRAND_ADMIN : meilleures ventes, tendance de chiffre
 * d'affaires, valorisation du stock (central + distribué) et compteur de
 * stock faible, sur une période (30 derniers jours par défaut).
 *
 * GET /api/dashboard/summary?startDate=&endDate=
 */
async function getDashboardSummary(req, res) {
  const brandId = req.user.brand;
  const range = parseDateRangeQuery(req.query);
  const start = range.start || defaultRangeStart();
  const end = range.end || new Date();

  const salesMatch = { brand: brandId, date: { $gte: start, $lte: end } };

  const [bestSellers, revenueTrend, centralValuation, distributedValuationAgg, lowStockProductsCount, lowStockDistributorStockCount] =
    await Promise.all([
      Sale.aggregate([
        { $match: salesMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            unit: { $first: '$items.unit' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      Sale.aggregate([
        { $match: salesMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Product.aggregate([
        { $match: { brand: brandId, isActive: true } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', '$price'] } } } },
      ]),
      DistributorStock.aggregate([
        { $match: { brand: brandId } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', '$lastUnitPrice'] } } } },
      ]),
      Product.countDocuments({ brand: brandId, isActive: true, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }),
      DistributorStock.countDocuments({ brand: brandId, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }),
    ]);

  const central = centralValuation[0]?.totalValue || 0;
  const distributed = distributedValuationAgg[0]?.totalValue || 0;

  return res.json({
    range: { startDate: start, endDate: end },
    bestSellers: bestSellers.map((b) => ({
      productId: b._id,
      name: b.name,
      unit: b.unit,
      quantity: b.quantity,
      revenue: b.revenue,
    })),
    revenueTrend: revenueTrend.map((r) => ({ date: r._id, count: r.count, totalAmount: r.totalAmount })),
    stockValuation: { central, distributed, total: central + distributed },
    lowStock: { products: lowStockProductsCount, distributorStockLines: lowStockDistributorStockCount },
  });
}

module.exports = { getDashboardSummary };
