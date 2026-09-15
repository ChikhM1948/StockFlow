const User = require('../models/User');
const Brand = require('../models/Brand');
const AdminToken = require('../models/AdminToken');
const generateAuthToken = require('../utils/generateAuthToken');

const TRIAL_DURATION_DAYS = 14;

/**
 * Démarrage d'un essai gratuit de 14 jours, sans Token ID.
 * Crée une marque en statut TRIAL et son compte BRAND_ADMIN.
 * À l'expiration, l'accès aux routes métier est bloqué (voir
 * middleware/auth.middleware.js#requireActiveBrand) jusqu'à ce qu'un
 * Token ID (obtenu à l'achat) soit soumis via POST /api/auth/activate.
 *
 * POST /api/auth/trial
 * body: { companyName, name, email, password }
 */
async function startTrial(req, res) {
  const { companyName, name, email, password } = req.body;

  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ message: 'companyName, name, email et password sont requis.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const brand = await Brand.create({ name: companyName, status: 'TRIAL', trialEndsAt });

  const user = await User.create({
    name,
    email,
    password,
    role: 'BRAND_ADMIN',
    brand: brand._id,
  });

  brand.owner = user._id;
  await brand.save();

  const authToken = generateAuthToken(user);

  return res.status(201).json({
    message: `Essai gratuit de ${TRIAL_DURATION_DAYS} jours activé.`,
    authToken,
    user: user.toSafeJSON(),
    brand,
  });
}

/**
 * Active l'abonnement d'une marque déjà existante (essai en cours ou terminé)
 * via un Token ID obtenu à l'achat. Contrairement à /auth/onboard, ne crée
 * pas de nouveau compte : rattache le token à la marque de l'admin connecté.
 *
 * POST /api/auth/activate
 * body: { tokenId }
 */
async function activateBrand(req, res) {
  const { tokenId } = req.body;

  if (!tokenId) {
    return res.status(400).json({ message: 'tokenId est requis.' });
  }
  if (req.user.role !== 'BRAND_ADMIN') {
    return res.status(403).json({ message: 'Seul un administrateur de marque peut activer un abonnement.' });
  }

  const token = await AdminToken.findOne({ tokenId: tokenId.trim().toUpperCase() });
  if (!token) {
    return res.status(404).json({ message: 'Token ID inconnu.' });
  }
  if (!token.isValid()) {
    return res.status(400).json({ message: `Ce token n'est plus utilisable (statut: ${token.status}).` });
  }

  const brand = await Brand.findById(req.user.brand);
  if (!brand) {
    return res.status(404).json({ message: 'Marque introuvable.' });
  }

  brand.status = 'ACTIVE';
  brand.trialEndsAt = null;
  brand.token = token._id;
  await brand.save();

  token.status = 'USED';
  token.redeemedBy = req.user._id;
  token.redeemedAt = new Date();
  await token.save();

  return res.json({ message: 'Abonnement activé avec succès.', brand });
}

/**
 * Onboarding Marque Blanche.
 * L'utilisateur entre le Token ID reçu du Super Admin : s'il est valide,
 * un compte BRAND_ADMIN est créé et rattaché à la marque liée au token.
 *
 * POST /api/auth/onboard
 * body: { tokenId, name, email, password }
 */
async function onboardBrandAdmin(req, res) {
  const { tokenId, name, email, password } = req.body;

  if (!tokenId || !name || !email || !password) {
    return res.status(400).json({ message: 'tokenId, name, email et password sont requis.' });
  }

  const token = await AdminToken.findOne({ tokenId: tokenId.trim().toUpperCase() }).populate('brand');

  if (!token) {
    return res.status(404).json({ message: 'Token ID inconnu.' });
  }
  if (!token.isValid()) {
    return res.status(400).json({ message: `Ce token n'est plus utilisable (statut: ${token.status}).` });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
  }

  const brand = token.brand;

  // Création du compte Admin rattaché à la marque du token
  const user = await User.create({
    name,
    email,
    password,
    role: 'BRAND_ADMIN',
    brand: brand._id,
  });

  // Activation de la marque + rattachement du propriétaire
  brand.owner = user._id;
  brand.status = 'ACTIVE';
  await brand.save();

  // Consommation du token (usage unique)
  token.status = 'USED';
  token.redeemedBy = user._id;
  token.redeemedAt = new Date();
  await token.save();

  const authToken = generateAuthToken(user);

  return res.status(201).json({
    message: 'Marque activée avec succès.',
    authToken,
    user: user.toSafeJSON(),
    brand,
  });
}

/**
 * BRAND_ADMIN crée un compte Distributeur rattaché à sa propre marque.
 * POST /api/auth/distributors
 */
async function createDistributor(req, res) {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email et password sont requis.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
  }

  const distributor = await User.create({
    name,
    email,
    password,
    phone,
    role: 'DISTRIBUTOR',
    brand: req.user.brand, // rattaché à la marque de l'admin connecté
  });

  return res.status(201).json({ user: distributor.toSafeJSON() });
}

/**
 * Connexion (Super Admin, Brand Admin, Distributeur).
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email et password sont requis.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Identifiants invalides.' });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return res.status(401).json({ message: 'Identifiants invalides.' });
  }

  const authToken = generateAuthToken(user);
  return res.json({ authToken, user: user.toSafeJSON() });
}

/**
 * Profil de l'utilisateur connecté.
 * GET /api/auth/me
 */
async function me(req, res) {
  const brand = req.user.brand ? await Brand.findById(req.user.brand) : null;
  return res.json({ user: req.user.toSafeJSON(), brand });
}

/**
 * BRAND_ADMIN liste les distributeurs de sa marque.
 * GET /api/auth/distributors
 */
async function listDistributors(req, res) {
  const distributors = await User.find({ brand: req.user.brand, role: 'DISTRIBUTOR' }).sort({ createdAt: -1 });
  return res.json({ distributors: distributors.map((d) => d.toSafeJSON()) });
}

module.exports = {
  onboardBrandAdmin,
  startTrial,
  activateBrand,
  createDistributor,
  listDistributors,
  login,
  me,
};
