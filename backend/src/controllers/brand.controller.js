const Brand = require('../models/Brand');

/**
 * Récupère la marque de l'utilisateur connecté (BRAND_ADMIN ou DISTRIBUTOR).
 * Utilisé par l'app mobile pour appliquer le thème dynamique (couleur, logo).
 * GET /api/brands/me
 */
async function getMyBrand(req, res) {
  const brand = await Brand.findById(req.user.brand);
  if (!brand) return res.status(404).json({ message: 'Marque introuvable.' });
  return res.json({ brand });
}

/**
 * Personnalisation Marque Blanche par le BRAND_ADMIN.
 * PATCH /api/brands/me
 * body: { name?, logoUrl?, theme?: { primaryColor?, secondaryColor? }, invoiceFooter?: {...} }
 */
async function updateMyBrand(req, res) {
  const brand = await Brand.findById(req.user.brand);
  if (!brand) return res.status(404).json({ message: 'Marque introuvable.' });

  const { name, logoUrl, theme, invoiceFooter } = req.body;

  if (name !== undefined) brand.name = name;
  if (logoUrl !== undefined) brand.logoUrl = logoUrl;
  if (theme?.primaryColor !== undefined) brand.theme.primaryColor = theme.primaryColor;
  if (theme?.secondaryColor !== undefined) brand.theme.secondaryColor = theme.secondaryColor;

  if (invoiceFooter) {
    Object.entries(invoiceFooter).forEach(([key, value]) => {
      if (value !== undefined && key in brand.invoiceFooter) {
        brand.invoiceFooter[key] = value;
      }
    });
  }

  await brand.save();
  return res.json({ brand });
}

module.exports = { getMyBrand, updateMyBrand };
