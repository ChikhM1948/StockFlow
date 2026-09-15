/**
 * Backfill ponctuel : crée une entité Customer pour chaque client déjà
 * présent (en inline) sur les Sale existantes, et lie ces Sale à
 * l'entité créée via customerId. Idempotent : les ventes déjà liées
 * (customerId défini) sont ignorées, et le dédoublonnage réutilise la même
 * clé que findOrCreateCustomer (téléphone si renseigné, sinon nom
 * insensible à la casse).
 *
 * Usage: node scripts/backfillCustomers.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Sale = require('../src/models/Sale');
const { findOrCreateCustomer } = require('../src/controllers/customer.controller');

async function run() {
  await connectDB();

  const sales = await Sale.find({ customerId: null }).sort({ date: 1 });
  console.log(`${sales.length} vente(s) sans customerId trouvée(s).`);

  let created = 0;
  let linked = 0;

  for (const sale of sales) {
    const before = await findOrCreateCustomer(sale.brand, sale.customer);
    sale.customerId = before._id;
    await sale.save();
    linked += 1;
  }

  const distinctCustomers = await mongoose.model('Customer').countDocuments();
  created = distinctCustomers;

  console.log(`${linked} vente(s) liée(s) à un client.`);
  console.log(`${created} client(s) au total en base après backfill.`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
