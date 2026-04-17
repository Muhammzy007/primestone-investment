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
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));

// Routes - mount at both /api and root
const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');

// Mount at /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);

// Also mount at root for direct access (for testing)
app.use('/auth', authRoutes);
app.use('/investments', investmentRoutes);

// Health check at both locations
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
