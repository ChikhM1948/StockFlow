const mongoose = require('mongoose');

/**
 * Un appareil ayant ouvert une session pour une marque donnée.
 * Sert à faire respecter la limite d'appareils (AdminToken.maxDevices /
 * Brand.maxDevices) choisie par le Super Admin à la génération du token.
 */
const deviceSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    deviceId: { type: String, required: true, trim: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

deviceSchema.index({ brand: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);
