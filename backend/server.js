const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting on Render
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://*.netlify.app', 'https://primestone-api.onrender.com'],
  credentials: true
}));
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));

// Routes
const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
