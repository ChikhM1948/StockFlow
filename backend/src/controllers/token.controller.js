const AdminToken = require('../models/AdminToken');
const Brand = require('../models/Brand');

/**
 * SUPER_ADMIN génère un Token ID lié à une nouvelle marque cliente (en attente).
 * POST /api/super-admin/tokens
 * body: { companyName, expiresAt? }
 */
async function createToken(req, res) {
  const { companyName, expiresAt } = req.body;

  if (!companyName) {
    return res.status(400).json({ message: 'companyName est requis.' });
  }

  const brand = await Brand.create({ name: companyName, status: 'PENDING' });

  const tokenId = AdminToken.generateTokenId();
  const token = await AdminToken.create({
    tokenId,
    companyName,
    brand: brand._id,
    createdBy: req.user._id,
    expiresAt: expiresAt || null,
  });

  brand.token = token._id;
  await brand.save();

  return res.status(201).json({ token });
}

/**
 * SUPER_ADMIN liste tous les tokens émis.
 * GET /api/super-admin/tokens
 */
async function listTokens(req, res) {
  const tokens = await AdminToken.find().populate('brand').sort({ createdAt: -1 });
  return res.json({ tokens });
}

/**
 * SUPER_ADMIN révoque un token non utilisé.
 * PATCH /api/super-admin/tokens/:id/revoke
 */
async function revokeToken(req, res) {
  const token = await AdminToken.findById(req.params.id);
  if (!token) return res.status(404).json({ message: 'Token introuvable.' });
  if (token.status === 'USED') {
    return res.status(400).json({ message: 'Un token déjà utilisé ne peut pas être révoqué.' });
  }
  token.status = 'REVOKED';
  await token.save();
  return res.json({ token });
}

module.exports = { createToken, listTokens, revokeToken };
