const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI manquant : définissez-le dans le fichier .env');
  }
  await mongoose.connect(uri);
  console.log('[MongoDB] Connecté');
}

module.exports = connectDB;
