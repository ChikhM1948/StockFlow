const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'generated', 'pdf');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function formatMoney(n) {
  return Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR');
}

/**
 * Le logo envoyé depuis l'app mobile est une data-URI base64 (expo-image-picker).
 * On accepte aussi un chemin fichier local pour usage backend/scripts.
 * Les URLs http(s) distantes ne sont pas supportées (pdfkit ne fait pas de fetch async ici).
 */
function resolveLogoSource(logoUrl) {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('data:')) {
    const base64 = logoUrl.split(',')[1];
    return base64 ? Buffer.from(base64, 'base64') : null;
  }
  if (fs.existsSync(logoUrl)) return logoUrl;
  return null;
}

/**
 * Dessine l'en-tête aux couleurs de la marque blanche (logo + nom + titre du doc).
 */
function drawBrandHeader(doc, brand, title) {
  const primaryColor = brand?.theme?.primaryColor || '#2563EB';

  doc.rect(0, 0, doc.page.width, 90).fill(primaryColor);

  const logoSource = resolveLogoSource(brand?.logoUrl);
  if (logoSource) {
    try {
      doc.image(logoSource, 40, 20, { height: 50 });
    } catch (err) {
      // logo illisible : on ignore silencieusement, le nom textuel suffit
    }
  }

  doc
    .fillColor('#FFFFFF')
    .fontSize(18)
    .text(brand?.name || 'Marque', 110, 30, { continued: false });

  doc
    .fillColor('#FFFFFF')
    .fontSize(14)
    .text(title, 0, 35, { align: 'right', width: doc.page.width - 40 });

  doc.fillColor('#000000');
  doc.moveDown(4);
}

/**
 * Dessine le pied de page (infos légales de la marque).
 */
function drawFooter(doc, brand) {
  const footer = brand?.invoiceFooter || {};
  const y = doc.page.height - 70;

  doc
    .fontSize(8)
    .fillColor('#666666')
    .text(
      [footer.addressLine, footer.phone, footer.email, footer.taxId, footer.customText]
        .filter(Boolean)
        .join('  |  '),
      40,
      y,
      { align: 'center', width: doc.page.width - 80 }
    );
  doc.fillColor('#000000');
}

function drawItemsTable(doc, items, { unitLabel = 'P.U.' } = {}) {
  const startX = 40;
  let y = doc.y + 10;
  const colWidths = [220, 70, 70, 90, 90];
  const headers = ['Article', 'Qté', 'Unité', unitLabel, 'Total'];

  doc.fontSize(10).font('Helvetica-Bold');
  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x, y, { width: colWidths[i] });
    x += colWidths[i];
  });
  y += 18;
  doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
  y += 6;

  doc.font('Helvetica');
  items.forEach((item) => {
    const total = item.total != null ? item.total : item.quantity * item.unitPrice;
    x = startX;
    const row = [item.name, String(item.quantity), item.unit, formatMoney(item.unitPrice), formatMoney(total)];
    row.forEach((val, i) => {
      doc.text(val, x, y, { width: colWidths[i] });
      x += colWidths[i];
    });
    y += 18;

    if (y > doc.page.height - 130) {
      doc.addPage();
      y = 40;
    }
  });

  doc.y = y + 10;
  doc.moveTo(startX, doc.y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), doc.y).stroke();
  doc.moveDown(0.5);
}

/**
 * Génère le PDF d'un Bon de Sortie (Stock Central -> Distributeur).
 * Retourne le chemin absolu du fichier écrit sur disque.
 */
function generateDispatchPdf(dispatch, brand, distributor) {
  const fileName = `${dispatch.dispatchNumber}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  drawBrandHeader(doc, brand, 'BON DE SORTIE');

  doc.fontSize(11).fillColor('#000000');
  doc.text(`N° : ${dispatch.dispatchNumber}`);
  doc.text(`Date : ${formatDate(dispatch.date)}`);
  doc.text(`Distributeur : ${distributor?.name || ''}`);
  doc.moveDown();

  drawItemsTable(doc, dispatch.items, { unitLabel: 'P.U.' });

  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(12).text(`Total : ${formatMoney(dispatch.totalAmount)}`, { align: 'right' });

  doc.moveDown(3);
  const sigY = doc.y;
  doc.font('Helvetica').fontSize(10);
  doc.text('Signature Admin :', 40, sigY);
  doc.text(dispatch.signatures?.adminName || '_____________________', 40, sigY + 30);
  doc.text('Signature Distributeur :', 320, sigY);
  doc.text(dispatch.signatures?.distributorName || '_____________________', 320, sigY + 30);

  drawFooter(doc, brand);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

/**
 * Génère le PDF d'une Facture (vente Distributeur -> Client).
 */
function generateInvoicePdf(sale, brand, distributor) {
  const fileName = `${sale.saleNumber}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  drawBrandHeader(doc, brand, 'FACTURE');

  doc.fontSize(11).fillColor('#000000');
  doc.text(`N° : ${sale.saleNumber}`);
  doc.text(`Date : ${formatDate(sale.date)}`);
  doc.text(`Vendeur (Distributeur) : ${distributor?.name || ''}`);
  doc.moveDown(0.5);
  doc.text(`Client : ${sale.customer.name} (${sale.customer.type})`);
  if (sale.customer.phone) doc.text(`Tél. client : ${sale.customer.phone}`);
  if (sale.customer.address) doc.text(`Adresse client : ${sale.customer.address}`);
  doc.moveDown();

  drawItemsTable(doc, sale.items, { unitLabel: 'Prix vente' });

  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(12).text(`Total : ${formatMoney(sale.totalAmount)}`, { align: 'right' });
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Statut paiement : ${sale.paymentStatus}`, { align: 'right' });

  doc.moveDown(3);
  const sigY = doc.y;
  doc.font('Helvetica-Bold').fontSize(10).text('Bon pour accord', 320, sigY);
  doc.font('Helvetica').text('Date et signature du client :', 320, sigY + 15);
  doc.text('_____________________', 320, sigY + 45);

  drawFooter(doc, brand);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

/**
 * Génère le PDF du Bon de Livraison associé à une vente.
 */
function generateDeliveryNotePdf(sale, brand, distributor) {
  const fileName = `${sale.saleNumber}-BL.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  drawBrandHeader(doc, brand, 'BON DE LIVRAISON');

  doc.fontSize(11).fillColor('#000000');
  doc.text(`Réf. facture : ${sale.saleNumber}`);
  doc.text(`Date : ${formatDate(sale.date)}`);
  doc.text(`Livré par : ${distributor?.name || ''}`);
  doc.text(`Destinataire : ${sale.customer.name}`);
  if (sale.customer.address) doc.text(`Adresse : ${sale.customer.address}`);
  doc.moveDown();

  drawItemsTable(doc, sale.items, { unitLabel: 'P.U.' });

  doc.moveDown(3);
  const sigY = doc.y;
  doc.font('Helvetica').fontSize(10);
  doc.text('Signature Livreur :', 40, sigY);
  doc.text('_____________________', 40, sigY + 30);
  doc.text('Signature Client :', 320, sigY);
  doc.text('_____________________', 320, sigY + 30);

  drawFooter(doc, brand);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

/**
 * Génère le PDF d'un Bon de Retour (Distributeur -> Stock Central).
 */
function generateReturnPdf(retour, brand, distributor) {
  const fileName = `${retour.returnNumber}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  drawBrandHeader(doc, brand, 'BON DE RETOUR');

  doc.fontSize(11).fillColor('#000000');
  doc.text(`N° : ${retour.returnNumber}`);
  doc.text(`Date : ${formatDate(retour.date)}`);
  doc.text(`Distributeur : ${distributor?.name || ''}`);
  doc.text(`Motif : ${retour.reason}`);
  if (retour.note) doc.text(`Note : ${retour.note}`);
  doc.moveDown();

  drawItemsTable(doc, retour.items, { unitLabel: 'P.U.' });

  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(12).text(`Total : ${formatMoney(retour.totalAmount)}`, { align: 'right' });

  doc.moveDown(3);
  const sigY = doc.y;
  doc.font('Helvetica').fontSize(10);
  doc.text('Signature Distributeur :', 40, sigY);
  doc.text('_____________________', 40, sigY + 30);
  doc.text('Signature Admin :', 320, sigY);
  doc.text('_____________________', 320, sigY + 30);

  drawFooter(doc, brand);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = {
  generateDispatchPdf,
  generateInvoicePdf,
  generateDeliveryNotePdf,
  generateReturnPdf,
};
