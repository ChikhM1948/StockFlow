require('express-async-errors'); // permet aux erreurs async des controllers de remonter au error handler
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const tokenRoutes = require('./routes/token.routes');
const productRoutes = require('./routes/product.routes');
const dispatchRoutes = require('./routes/dispatch.routes');
const saleRoutes = require('./routes/sale.routes');
const brandRoutes = require('./routes/brand.routes');
const distributorStockRoutes = require('./routes/distributorStock.routes');
const caisseRoutes = require('./routes/caisse.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' })); // le logo de marque peut être envoyé en base64

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/super-admin/tokens', tokenRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/distributor-stocks', distributorStockRoutes);
app.use('/api/caisse', caisseRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: 'Route introuvable.' }));

// Handler d'erreurs global
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur.' });
});

module.exports = app;
