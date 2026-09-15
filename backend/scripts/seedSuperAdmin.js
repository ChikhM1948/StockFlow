/**
 * Bootstrap : crée le tout premier compte SUPER_ADMIN.
 * Nécessaire car aucune route publique ne permet de créer ce rôle
 * (createToken/listTokens sont protégées par authorize('SUPER_ADMIN')).
 *
 * Usage: node scripts/seedSuperAdmin.js <name> <email> <password>
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

async function run() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error('Usage: node scripts/seedSuperAdmin.js <name> <email> <password>');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error('Un utilisateur avec cet email existe déjà.');
    process.exit(1);
  }

  const user = await User.create({ name, email, password, role: 'SUPER_ADMIN' });
  console.log('SUPER_ADMIN créé:', user.email);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
