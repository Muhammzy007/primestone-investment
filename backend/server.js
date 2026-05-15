const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(cors({
  origin: ['http://localhost:3000', 'https://primestone-investment.netlify.app', 'https://primestone-api.onrender.com'],
  credentials: true
}));
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));

// Routes
const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Register all routes
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health: https://primestone-api.onrender.com/api/health`);
  console.log(`🔐 Auth: https://primestone-api.onrender.com/api/auth`);
  console.log(`👑 Admin: https://primestone-api.onrender.com/api/admin`);
});

module.exports = app;
