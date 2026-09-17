const mongoose = require('mongoose');
const Product = require('../models/Product');
const DistributorStock = require('../models/DistributorStock');
const Dispatch = require('../models/Dispatch');
const User = require('../models/User');
const Brand = require('../models/Brand');
const generateDocNumber = require('../utils/generateDocNumber');
const { generateDispatchPdf } = require('../utils/pdfGenerator');

/**
 * Attribue des produits du Stock Central à un Distributeur et génère le
 * Bon de Sortie correspondant.
 *
 * Effectue en une transaction :
 *   1. Déduction de la quantité dans le Stock Central (Product)
 *   2. Incrémentation du Stock du Distributeur (DistributorStock)
 *   3. Création du Dispatch + génération du PDF "Bon de Sortie"
 *
 * Utilisé à la fois par le BRAND_ADMIN (createDispatch, distributeur au
 * choix) et par le DISTRIBUTOR autorisé à s'auto-attribuer du stock
 * (addOwnStock, distributeur = lui-même).
 */
async function performDispatch({ brandId, distributor, issuedById, items, signatures }) {
  const session = await mongoose.startSession();

  try {
    let dispatch;

    await session.withTransaction(async () => {
      const dispatchItems = [];
      let totalAmount = 0;

      for (const line of items) {
        const product = await Product.findOne({ _id: line.productId, brand: brandId }).session(session);
        if (!product) {
          throw new Error(`Produit introuvable: ${line.productId}`);
        }
        if (product.quantity < line.quantity) {
          throw new Error(`Stock insuffisant pour "${product.name}" (disponible: ${product.quantity})`);
        }

        // 1. Déduction du Stock Central
        product.quantity -= line.quantity;
        await product.save({ session });

        // 2. Incrémentation du Stock du Distributeur
        await DistributorStock.findOneAndUpdate(
          { brand: brandId, distributor: distributor._id, product: product._id },
          {
            $inc: { quantity: line.quantity },
            $set: {
              productName: product.name,
              unit: product.unit,
              lastUnitPrice: product.price,
              lowStockThreshold: product.lowStockThreshold,
            },
          },
          { upsert: true, session }
        );

        const itemTotal = line.quantity * product.price;
        totalAmount += itemTotal;

        dispatchItems.push({
          product: product._id,
          name: product.name,
          unit: product.unit,
          quantity: line.quantity,
          unitPrice: product.price,
        });
      }

      const dispatchNumber = await generateDocNumber(brandId, 'DISPATCH');

      // 3. Création du Bon de Sortie
      const created = await Dispatch.create(
        [
          {
            brand: brandId,
            dispatchNumber,
            distributor: distributor._id,
            issuedBy: issuedById,
            items: dispatchItems,
            totalAmount,
            signatures: signatures || {},
          },
        ],
        { session }
      );
      dispatch = created[0];
    });

    // Génération du PDF hors transaction (I/O disque, pas de rollback nécessaire)
    const brand = await Brand.findById(brandId);
    const pdfPath = await generateDispatchPdf(dispatch, brand, distributor);
    dispatch.pdfPath = pdfPath;
    await dispatch.save();

    return { dispatch, pdfPath };
  } finally {
    session.endSession();
  }
}

/**
 * Crée un Bon de Sortie : le BRAND_ADMIN attribue des produits du Stock
 * Central à un Distributeur.
 *
 * POST /api/dispatches
 * body: { distributorId, items: [{ productId, quantity }], signatures? }
 */
async function createDispatch(req, res) {
  const { distributorId, items, signatures } = req.body;
  const brandId = req.user.brand;

  if (!distributorId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'distributorId et items[] sont requis.' });
  }

  const distributor = await User.findOne({ _id: distributorId, brand: brandId, role: 'DISTRIBUTOR' });
  if (!distributor) {
    return res.status(404).json({ message: 'Distributeur introuvable pour cette marque.' });
  }

  try {
    const { dispatch, pdfPath } = await performDispatch({
      brandId,
      distributor,
      issuedById: req.user._id,
      items,
      signatures,
    });
    return res.status(201).json({ dispatch, pdfPath });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Erreur lors de la création du Bon de Sortie.' });
  }
}

/**
 * Auto-attribution de stock par un DISTRIBUTOR autorisé (User.canAddStock) :
 * même effet qu'un Bon de Sortie créé par l'admin, mais le distributeur est
 * à la fois émetteur et destinataire.
 *
 * POST /api/dispatches/self
 * body: { items: [{ productId, quantity }] }
 */
async function addOwnStock(req, res) {
  const { items } = req.body;
  const brandId = req.user.brand;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items[] est requis.' });
  }

  try {
    const { dispatch, pdfPath } = await performDispatch({
      brandId,
      distributor: req.user,
      issuedById: req.user._id,
      items,
    });
    return res.status(201).json({ dispatch, pdfPath });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Erreur lors de l'ajout de stock." });
  }
}

/**
 * GET /api/dispatches/:id/pdf -> télécharge le PDF du Bon de Sortie
 */
async function downloadDispatchPdf(req, res) {
  const dispatch = await Dispatch.findOne({ _id: req.params.id, brand: req.user.brand });
  if (!dispatch || !dispatch.pdfPath) {
    return res.status(404).json({ message: 'Bon de Sortie ou PDF introuvable.' });
  }
  return res.download(dispatch.pdfPath);
}

/**
 * GET /api/dispatches
 * BRAND_ADMIN voit tous les Bons de Sortie de sa marque, DISTRIBUTOR ne voit que les siens.
 */
async function listDispatches(req, res) {
  const filter = { brand: req.user.brand };
  if (req.user.role === 'DISTRIBUTOR') filter.distributor = req.user._id;

  const dispatches = await Dispatch.find(filter).populate('distributor', 'name email').sort({ createdAt: -1 });
  return res.json({ dispatches });
}

module.exports = { createDispatch, addOwnStock, downloadDispatchPdf, listDispatches };
