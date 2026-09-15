const mongoose = require('mongoose');
const DistributorStock = require('../models/DistributorStock');
const Sale = require('../models/Sale');
const Brand = require('../models/Brand');
const generateDocNumber = require('../utils/generateDocNumber');
const { generateInvoicePdf, generateDeliveryNotePdf } = require('../utils/pdfGenerator');
const { findOrCreateCustomer } = require('./customer.controller');

/**
 * Enregistre une vente réalisée par un Distributeur auprès d'un client final.
 *
 * Effectue en une transaction :
 *   1. Soustraction de la quantité vendue du Stock du Distributeur
 *   2. Création de la Sale
 * Puis génère la Facture + le Bon de Livraison en PDF.
 *
 * POST /api/sales
 * body: { customer: { name, type, phone, address }, items: [{ productId, quantity, unitPrice }], paymentStatus?, amountPaid? }
 */
async function createSale(req, res) {
  const { customer, items, paymentStatus, amountPaid } = req.body;
  const brandId = req.user.brand;
  const distributor = req.user; // DISTRIBUTOR connecté

  if (!customer?.name || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'customer.name et items[] sont requis.' });
  }

  const session = await mongoose.startSession();

  try {
    let sale;

    await session.withTransaction(async () => {
      const saleItems = [];
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
          throw new Error(`Stock insuffisant pour "${stock.productName}" (disponible: ${stock.quantity})`);
        }

        // 1. Déduction du stock du distributeur
        stock.quantity -= line.quantity;
        await stock.save({ session });

        const unitPrice = line.unitPrice ?? stock.lastUnitPrice;
        const itemTotal = line.quantity * unitPrice;
        totalAmount += itemTotal;

        saleItems.push({
          product: stock.product,
          name: stock.productName,
          unit: stock.unit,
          quantity: line.quantity,
          unitPrice,
          total: itemTotal,
        });
      }

      const saleNumber = await generateDocNumber(brandId, 'SALE');
      const customerDoc = await findOrCreateCustomer(brandId, customer, session);

      // 2. Création de la vente
      const created = await Sale.create(
        [
          {
            brand: brandId,
            saleNumber,
            distributor: distributor._id,
            customerId: customerDoc._id,
            customer,
            items: saleItems,
            totalAmount,
            paymentStatus: paymentStatus || 'PAID',
            amountPaid: amountPaid ?? totalAmount,
          },
        ],
        { session }
      );
      sale = created[0];
    });

    // Génération des PDF hors transaction
    const brand = await Brand.findById(brandId);
    const [invoicePath, deliveryNotePath] = await Promise.all([
      generateInvoicePdf(sale, brand, distributor),
      generateDeliveryNotePdf(sale, brand, distributor),
    ]);

    sale.documents.invoicePdfPath = invoicePath;
    sale.documents.deliveryNotePdfPath = deliveryNotePath;
    await sale.save();

    return res.status(201).json({ sale, invoicePath, deliveryNotePath });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Erreur lors de la création de la vente.' });
  } finally {
    session.endSession();
  }
}

async function downloadInvoicePdf(req, res) {
  const sale = await Sale.findOne({ _id: req.params.id, brand: req.user.brand });
  if (!sale || !sale.documents.invoicePdfPath) {
    return res.status(404).json({ message: 'Facture introuvable.' });
  }
  return res.download(sale.documents.invoicePdfPath);
}

async function downloadDeliveryNotePdf(req, res) {
  const sale = await Sale.findOne({ _id: req.params.id, brand: req.user.brand });
  if (!sale || !sale.documents.deliveryNotePdfPath) {
    return res.status(404).json({ message: 'Bon de livraison introuvable.' });
  }
  return res.download(sale.documents.deliveryNotePdfPath);
}

/**
 * GET /api/sales
 * BRAND_ADMIN voit toutes les ventes de sa marque, DISTRIBUTOR ne voit que les siennes.
 */
async function listSales(req, res) {
  const filter = { brand: req.user.brand };
  if (req.user.role === 'DISTRIBUTOR') filter.distributor = req.user._id;

  const sales = await Sale.find(filter).populate('distributor', 'name email').sort({ createdAt: -1 });
  return res.json({ sales });
}

/**
 * Enregistre un encaissement ultérieur sur une facture UNPAID/PARTIAL.
 *
 * POST /api/sales/:id/payments
 * body: { amount, note? }
 */
async function recordPayment(req, res) {
  const { amount, note } = req.body;
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Le montant doit être un nombre positif.' });
  }

  const filter = { _id: req.params.id, brand: req.user.brand };
  if (req.user.role === 'DISTRIBUTOR') filter.distributor = req.user._id;

  const sale = await Sale.findOne(filter);
  if (!sale) {
    return res.status(404).json({ message: 'Vente introuvable.' });
  }

  const balance = sale.totalAmount - sale.amountPaid;
  if (balance <= 0) {
    return res.status(400).json({ message: 'Cette facture est déjà entièrement payée.' });
  }
  if (parsedAmount > balance) {
    return res
      .status(400)
      .json({ message: `Le montant dépasse le solde restant (${balance.toFixed(2)}).` });
  }

  sale.payments.push({ amount: parsedAmount, note: note || '', recordedBy: req.user._id });
  sale.amountPaid += parsedAmount;
  sale.paymentStatus = sale.amountPaid >= sale.totalAmount ? 'PAID' : 'PARTIAL';

  await sale.save();

  return res.json({ sale });
}

module.exports = {
  createSale,
  downloadInvoicePdf,
  downloadDeliveryNotePdf,
  listSales,
  recordPayment,
};
