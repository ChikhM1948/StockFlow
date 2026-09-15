const mongoose = require('mongoose');
const Product = require('../models/Product');
const DistributorStock = require('../models/DistributorStock');
const Return = require('../models/Return');
const Brand = require('../models/Brand');
const generateDocNumber = require('../utils/generateDocNumber');
const { generateReturnPdf } = require('../utils/pdfGenerator');

/**
 * Crée un Bon de Retour : le DISTRIBUTOR connecté renvoie des produits
 * invendus/endommagés de son stock vers le Stock Central.
 *
 * Effectue en une transaction :
 *   1. Déduction de la quantité dans le Stock du Distributeur (DistributorStock)
 *   2. Incrémentation du Stock Central (Product)
 *   3. Création du Return + génération du PDF "Bon de Retour"
 *
 * POST /api/returns
 * body: { items: [{ productId, quantity }], reason, note? }
 */
async function createReturn(req, res) {
  const { items, reason, note } = req.body;
  const brandId = req.user.brand;
  const distributor = req.user; // DISTRIBUTOR connecté

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items[] est requis.' });
  }
  if (!['UNSOLD', 'DAMAGED', 'OTHER'].includes(reason)) {
    return res.status(400).json({ message: 'reason doit être UNSOLD, DAMAGED ou OTHER.' });
  }

  const session = await mongoose.startSession();

  try {
    let retour;

    await session.withTransaction(async () => {
      const returnItems = [];
      let totalAmount = 0;

      for (const line of items) {
        const stock = await DistributorStock.findOne({
          brand: brandId,
          distributor: distributor._id,
          product: line.productId,
        }).session(session);

        if (!stock) {
          throw new Error(`Aucun stock attribué pour le produit: ${line.productId}`);
        }
        if (stock.quantity < line.quantity) {
          throw new Error(`Quantité à retourner supérieure au stock détenu pour "${stock.productName}" (disponible: ${stock.quantity})`);
        }

        // 1. Déduction du Stock du Distributeur
        stock.quantity -= line.quantity;
        await stock.save({ session });

        // 2. Réincrémentation du Stock Central
        const product = await Product.findOne({ _id: stock.product, brand: brandId }).session(session);
        if (!product) {
          throw new Error(`Produit introuvable: ${stock.product}`);
        }
        product.quantity += line.quantity;
        await product.save({ session });

        const unitPrice = stock.lastUnitPrice;
        const itemTotal = line.quantity * unitPrice;
        totalAmount += itemTotal;

        returnItems.push({
          product: stock.product,
          name: stock.productName,
          unit: stock.unit,
          quantity: line.quantity,
          unitPrice,
        });
      }

      const returnNumber = await generateDocNumber(brandId, 'RETURN');

      // 3. Création du Bon de Retour
      const created = await Return.create(
        [
          {
            brand: brandId,
            returnNumber,
            distributor: distributor._id,
            items: returnItems,
            totalAmount,
            reason,
            note: note || '',
          },
        ],
        { session }
      );
      retour = created[0];
    });

    // Génération du PDF hors transaction (I/O disque, pas de rollback nécessaire)
    const brand = await Brand.findById(brandId);
    const pdfPath = await generateReturnPdf(retour, brand, distributor);
    retour.pdfPath = pdfPath;
    await retour.save();

    return res.status(201).json({ retour, pdfPath });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Erreur lors de la création du Bon de Retour.' });
  } finally {
    session.endSession();
  }
}

/**
 * GET /api/returns/:id/pdf -> télécharge le PDF du Bon de Retour
 */
async function downloadReturnPdf(req, res) {
  const retour = await Return.findOne({ _id: req.params.id, brand: req.user.brand });
  if (!retour || !retour.pdfPath) {
    return res.status(404).json({ message: 'Bon de Retour ou PDF introuvable.' });
  }
  return res.download(retour.pdfPath);
}

/**
 * GET /api/returns
 * BRAND_ADMIN voit tous les retours de sa marque, DISTRIBUTOR ne voit que les siens.
 */
async function listReturns(req, res) {
  const filter = { brand: req.user.brand };
  if (req.user.role === 'DISTRIBUTOR') filter.distributor = req.user._id;

  const returns = await Return.find(filter).populate('distributor', 'name email').sort({ createdAt: -1 });
  return res.json({ returns });
}

module.exports = { createReturn, downloadReturnPdf, listReturns };
