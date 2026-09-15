const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Récupère le Customer correspondant à un client saisi sur une vente, ou le
 * crée. Dédoublonnage par téléphone si renseigné, sinon par nom (insensible
 * à la casse) - même logique que l'ancien regroupement ad hoc de
 * getCustomerBalances, mais persistée en une entité réelle.
 *
 * Appelée depuis createSale, potentiellement dans une transaction (session).
 */
async function findOrCreateCustomer(brandId, customerInput, session) {
  const name = (customerInput.name || '').trim();
  const phone = (customerInput.phone || '').trim();
  const type = customerInput.type || 'AUTRE';
  const address = customerInput.address || '';

  const query = phone
    ? { brand: brandId, phone }
    : { brand: brandId, phone: '', name: { $regex: `^${escapeRegExp(name)}$`, $options: 'i' } };

  let customer = await Customer.findOne(query).session(session || null);

  if (!customer) {
    const created = await Customer.create([{ brand: brandId, name, type, phone, address }], { session });
    customer = created[0];
  } else if (address && address !== customer.address) {
    customer.address = address;
    await customer.save({ session });
  }

  return customer;
}

/**
 * GET /api/customers
 * BRAND_ADMIN voit tous les clients de sa marque, DISTRIBUTOR ne voit que
 * les clients auxquels il a vendu.
 */
async function listCustomers(req, res) {
  const brandId = req.user.brand;

  const salesMatch = { brand: brandId, customerId: { $ne: null } };
  if (req.user.role === 'DISTRIBUTOR') salesMatch.distributor = req.user._id;

  const [customers, salesAgg] = await Promise.all([
    Customer.find({ brand: brandId }).sort({ name: 1 }),
    Sale.aggregate([
      { $match: salesMatch },
      {
        $group: {
          _id: '$customerId',
          salesCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          amountPaid: { $sum: '$amountPaid' },
          lastSaleDate: { $max: '$date' },
        },
      },
    ]),
  ]);

  const statsMap = new Map(salesAgg.map((s) => [String(s._id), s]));

  let result = customers
    .filter((c) => req.user.role !== 'DISTRIBUTOR' || statsMap.has(String(c._id)))
    .map((c) => {
      const stats = statsMap.get(String(c._id)) || { salesCount: 0, totalAmount: 0, amountPaid: 0, lastSaleDate: null };
      return {
        customer: c,
        salesCount: stats.salesCount,
        totalAmount: stats.totalAmount,
        amountPaid: stats.amountPaid,
        balance: stats.totalAmount - stats.amountPaid,
        lastSaleDate: stats.lastSaleDate,
      };
    });

  result.sort((a, b) => b.balance - a.balance);

  return res.json({ customers: result });
}

/**
 * GET /api/customers/:id
 * Historique d'achats complet + solde d'un client (brand-scopé, restreint
 * aux ventes du distributeur connecté si role DISTRIBUTOR).
 */
async function getCustomerDetail(req, res) {
  const brandId = req.user.brand;
  const customer = await Customer.findOne({ _id: req.params.id, brand: brandId });
  if (!customer) {
    return res.status(404).json({ message: 'Client introuvable pour cette marque.' });
  }

  const salesFilter = { brand: brandId, customerId: customer._id };
  if (req.user.role === 'DISTRIBUTOR') salesFilter.distributor = req.user._id;

  const sales = await Sale.find(salesFilter).sort({ date: -1 });

  const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const amountPaid = sales.reduce((sum, s) => sum + s.amountPaid, 0);

  return res.json({
    customer,
    sales,
    balance: { totalAmount, amountPaid, balance: totalAmount - amountPaid },
  });
}

module.exports = { findOrCreateCustomer, listCustomers, getCustomerDetail };
