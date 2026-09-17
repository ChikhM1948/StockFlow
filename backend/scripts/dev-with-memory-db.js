/**
 * Lance un MongoDB éphémère en mémoire (replica set à 1 nœud, requis pour les
 * transactions utilisées par dispatch.controller.js / sale.controller.js),
 * puis démarre le serveur Express dessus. Pratique pour développer/tester
 * sans installer MongoDB ni avoir besoin de droits root.
 *
 * ⚠️ Les données sont perdues à l'arrêt du process. Pour de la persistance,
 * pointer MONGO_URI (dans .env) vers un vrai MongoDB (local ou Atlas) et
 * lancer `npm run dev`/`npm start` directement à la place.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

/**
 * La base mémoire repart de zéro à chaque lancement, donc aucun SUPER_ADMIN
 * n'existe jamais au démarrage (seedSuperAdmin.js ne peut pas cibler cette
 * instance éphémère). On en crée un par défaut ici pour pouvoir se connecter
 * immédiatement en dev.
 */
async function seedDefaultSuperAdmin() {
  const email = (process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || 'admin123';
  const name = process.env.SEED_SUPER_ADMIN_NAME || 'Super Admin';

  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({ name, email, password, role: 'SUPER_ADMIN' });
  }

  console.log('[Seed] SUPER_ADMIN prêt ->', email, '/', password);
}

async function main() {
  console.log('[MongoDB Memory Server] Téléchargement/démarrage en cours (peut prendre une minute la première fois)...');

  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri('stock-alimentaire');

  process.env.MONGO_URI = uri;
  console.log(`[MongoDB Memory Server] Prêt -> ${uri}`);

  process.on('SIGINT', async () => {
    await replSet.stop();
    process.exit(0);
  });

  await connectDB();
  await seedDefaultSuperAdmin();
  await mongoose.disconnect();

  require('../server');
}

main().catch((err) => {
  console.error('[MongoDB Memory Server] Échec du démarrage:', err);
  process.exit(1);
});
