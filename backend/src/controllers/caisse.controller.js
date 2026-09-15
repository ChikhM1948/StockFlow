const mongoose = require('mongoose');
const User = require('../models/User');
const Sale = require('../models/Sale');
const Dispatch = require('../models/Dispatch');
const DistributorStock = require('../models/DistributorStock');
const { getStartOfToday, parseDateRangeQuery } = require('../utils/dateRange');

const ZERO_DISPATCH_TOTALS = { count: 0, totalAmount: 0 };
const ZERO_SALE_TOTALS = { count: 0, totalAmount: 0, amountPaid: 0 };

/**
 * Agrège un facet { daily: [...], global: [...], range?: [...] } (0 ou 1 doc
 * par branche) vers { daily: totals, global: totals, range?: totals }, avec
 * des totaux à 0 par défaut. `range` n'est présent que si une période
 * personnalisée (startDate/endDate) a été demandée.
 */
function readFacet(facetResult, zero, hasRange) {
  const pick = (branch) =>
    facetResult[branch][0]
      ? { count: facetResult[branch][0].count, totalAmount: facetResult[branch][0].totalAmount, amountPaid: facetResult[branch][0].amountPaid }
      : zero;

  const result = { daily: pick('daily'), global: pick('global') };
  if (hasRange) result.range = pick('range');
  return result;
}

/**
 * Construit les branches d'un $facet Mongo pour { daily, global, range? }
 * sur un champ `date`, à partir d'une plage optionnelle { start, end }.
 */
function buildCaisseFacetStages(range) {
  const startOfToday = getStartOfToday();
  const groupStage = { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' }, amountPaid: { $sum: '$amountPaid' } } };

  const stages = {
    daily: [{ $match: { date: { $gte: startOfToday } } }, groupStage],
    global: [groupStage],
  };

  if (range.start || range.end) {
    const dateMatch = {};
    if (range.start) dateMatch.$gte = range.start;
    if (range.end) dateMatch.$lte = range.end;
    stages.range = [{ $match: { date: dateMatch } }, groupStage];
  }

  return stages;
}

function parseDistributorFilter(distributorId) {
  if (!distributorId || !mongoose.Types.ObjectId.isValid(distributorId)) return null;
  return new mongoose.Types.ObjectId(distributorId);
}

/**
 * Caisse Stock (BRAND_ADMIN) : valeur des Bons de Sortie émis par le Stock
 * Central vers les distributeurs, journalière + globale (+ période et
 * distributeur si filtrés).
 *
 * GET /api/caisse/stock?startDate=&endDate=&distributorId=
 */
async function getStockCaisse(req, res) {
  const brandId = req.user.brand;
  const range = parseDateRangeQuery(req.query);
  const distributorId = parseDistributorFilter(req.query.distributorId);
  const hasRange = Boolean(range.start || range.end);

  const match = { brand: brandId };
  if (distributorId) match.distributor = distributorId;

  const [facet] = await Dispatch.aggregate([{ $match: match }, { $facet: buildCaisseFacetStages(range) }]);

  return res.json({ caisse: readFacet(facet, ZERO_DISPATCH_TOTALS, hasRange) });
}

/**
 * Caisse du Distributeur connecté : montant des ventes (encaissé + total
 * facturé), journalière + globale (+ période si filtrée).
 *
 * GET /api/caisse/me?startDate=&endDate=
 */
async function getMyCaisse(req, res) {
  const range = parseDateRangeQuery(req.query);
  const caisse = await computeDistributorCaisse(req.user.brand, req.user._id, range);
  return res.json({ caisse });
}

async function computeDistributorCaisse(brandId, distributorId, range = {}) {
  const hasRange = Boolean(range.start || range.end);

  const [facet] = await Sale.aggregate([
    { $match: { brand: brandId, distributor: new mongoose.Types.ObjectId(distributorId) } },
    { $facet: buildCaisseFacetStages(range) },
  ]);

  return readFacet(facet, ZERO_SALE_TOTALS, hasRange);
}

/**
 * Vue temps réel pour le BRAND_ADMIN : pour chaque distributeur de sa marque,
 * la valeur du stock qui lui a été confié et sa caisse (journalière/globale,
 * + période si filtrée). Filtrable par distributeur (distributorId).
 *
 * GET /api/caisse/distributors?startDate=&endDate=&distributorId=
 */
async function listDistributorsCaisse(req, res) {
  const brandId = req.user.brand;
  const range = parseDateRangeQuery(req.query);
  const distributorId = parseDistributorFilter(req.query.distributorId);
  const hasRange = Boolean(range.start || range.end);

  const userFilter = { brand: brandId, role: 'DISTRIBUTOR' };
  if (distributorId) userFilter._id = distributorId;

  const distributors = await User.find(userFilter).select('name email phone isActive').sort({ name: 1 });

  const salesMatch = { brand: brandId };
  if (distributorId) salesMatch.distributor = distributorId;

  const groupStage = {
    $group: { _id: '$distributor', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' }, amountPaid: { $sum: '$amountPaid' } },
  };
  const startOfToday = getStartOfToday();
  const facetStages = {
    daily: [{ $match: { date: { $gte: startOfToday } } }, groupStage],
    global: [groupStage],
  };
  if (hasRange) {
    const dateMatch = {};
    if (range.start) dateMatch.$gte = range.start;
    if (range.end) dateMatch.$lte = range.end;
    facetStages.range = [{ $match: { date: dateMatch } }, groupStage];
  }

  const [salesFacet] = await Sale.aggregate([{ $match: salesMatch }, { $facet: facetStages }]);

  const stockMatch = { brand: brandId };
  if (distributorId) stockMatch.distributor = distributorId;

  const stockAgg = await DistributorStock.aggregate([
    { $match: stockMatch },
    {
      $group: {
        _id: '$distributor',
        itemsCount: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$lastUnitPrice'] } },
      },
    },
  ]);

  const dailyMap = new Map(salesFacet.daily.map((d) => [String(d._id), d]));
  const globalMap = new Map(salesFacet.global.map((d) => [String(d._id), d]));
  const rangeMap = hasRange ? new Map(salesFacet.range.map((d) => [String(d._id), d])) : null;
  const stockMap = new Map(stockAgg.map((s) => [String(s._id), s]));
  const zeroStock = { itemsCount: 0, totalQuantity: 0, totalValue: 0 };

  const pickTotals = (entry) =>
    entry ? { count: entry.count, totalAmount: entry.totalAmount, amountPaid: entry.amountPaid } : ZERO_SALE_TOTALS;

  const overview = distributors.map((d) => {
    const key = String(d._id);
    const stock = stockMap.get(key);
    const caisse = {
      daily: pickTotals(dailyMap.get(key)),
      global: pickTotals(globalMap.get(key)),
    };
    if (hasRange) caisse.range = pickTotals(rangeMap.get(key));

    return {
      distributor: { _id: d._id, name: d.name, email: d.email, phone: d.phone, isActive: d.isActive },
      stock: stock
        ? { itemsCount: stock.itemsCount, totalQuantity: stock.totalQuantity, totalValue: stock.totalValue }
        : zeroStock,
      caisse,
    };
  });

  return res.json({ distributors: overview });
}

/**
 * Détail temps réel d'un distributeur pour le BRAND_ADMIN : son stock
 * (quantités attribuées) et ses dernières ventes, en plus de sa caisse.
 * Les ventes affichées peuvent être restreintes à une période (startDate/endDate).
 *
 * GET /api/caisse/distributors/:id?startDate=&endDate=
 */
async function getDistributorDetail(req, res) {
  const brandId = req.user.brand;
  const range = parseDateRangeQuery(req.query);
  const distributor = await User.findOne({ _id: req.params.id, brand: brandId, role: 'DISTRIBUTOR' }).select(
    'name email phone isActive'
  );
  if (!distributor) {
    return res.status(404).json({ message: 'Distributeur introuvable pour cette marque.' });
  }

  const salesFilter = { brand: brandId, distributor: distributor._id };
  if (range.start || range.end) {
    salesFilter.date = {};
    if (range.start) salesFilter.date.$gte = range.start;
    if (range.end) salesFilter.date.$lte = range.end;
  }

  const [stock, recentSales, caisse] = await Promise.all([
    DistributorStock.find({ brand: brandId, distributor: distributor._id }).sort({ productName: 1 }),
    Sale.find(salesFilter).sort({ createdAt: -1 }).limit(20),
    computeDistributorCaisse(brandId, distributor._id, range),
  ]);

  return res.json({ distributor, stock, recentSales, caisse });
}

module.exports = { getStockCaisse, getMyCaisse, listDistributorsCaisse, getDistributorDetail };
