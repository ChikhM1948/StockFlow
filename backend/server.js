require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[Server] Écoute sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('[MongoDB] Échec de connexion:', err.message);
    process.exit(1);
  });
