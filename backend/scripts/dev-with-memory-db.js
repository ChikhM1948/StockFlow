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
const { MongoMemoryReplSet } = require('mongodb-memory-server');

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

  require('../server');
}

main().catch((err) => {
  console.error('[MongoDB Memory Server] Échec du démarrage:', err);
  process.exit(1);
});
