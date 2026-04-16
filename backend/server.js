const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const { pool } = require('./config/database');
const CleanupService = require('./services/cleanupService');

// Import routes
let authRoutes, investmentRoutes, paymentRoutes, withdrawalRoutes, adminRoutes, webhookRoutes, userRoutes, passwordRoutes;

try {
  authRoutes = require('./routes/authRoutes');
  console.log('✅ authRoutes loaded');
} catch (e) { console.log('⚠️ authRoutes not loaded', e.message); }

try {
  investmentRoutes = require('./routes/investmentRoutes');
  console.log('✅ investmentRoutes loaded');
} catch (e) { console.log('⚠️ investmentRoutes not loaded', e.message); }

try {
  paymentRoutes = require('./routes/paymentRoutes');
  console.log('✅ paymentRoutes loaded');
} catch (e) { console.log('⚠️ paymentRoutes not loaded', e.message); }

try {
  withdrawalRoutes = require('./routes/withdrawalRoutes');
  console.log('✅ withdrawalRoutes loaded');
} catch (e) { console.log('⚠️ withdrawalRoutes not loaded', e.message); }

try {
  adminRoutes = require('./routes/adminRoutes');
  console.log('✅ adminRoutes loaded');
} catch (e) { console.log('⚠️ adminRoutes not loaded', e.message); }

try {
  webhookRoutes = require('./routes/webhookRoutes');
  console.log('✅ webhookRoutes loaded');
} catch (e) { console.log('⚠️ webhookRoutes not loaded', e.message); }

try {
  userRoutes = require('./routes/userRoutes');
  console.log('✅ userRoutes loaded');
} catch (e) { console.log('⚠️ userRoutes not loaded', e.message); }

try {
  passwordRoutes = require('./routes/passwordRoutes');
  console.log('✅ passwordRoutes loaded');
} catch (e) { console.log('⚠️ passwordRoutes not loaded', e.message); }

// Import services
let blockchainService, yieldService, emailService;

try {
  const BlockchainService = require('./services/blockchainVerificationService');
  blockchainService = new BlockchainService();
  console.log('✅ Blockchain service loaded');
} catch (e) { console.log('⚠️ blockchainService not loaded', e.message); }

try {
  const YieldService = require('./services/yieldService');
  yieldService = new YieldService();
  console.log('✅ Yield service loaded');
} catch (e) { console.log('⚠️ yieldService not loaded', e.message); }

try {
  const EmailService = require('./services/emailService');
  emailService = new EmailService();
  console.log('✅ Email service loaded');
} catch (e) { console.log('⚠️ emailService not loaded', e.message); }

const app = express();

// FIXED: More permissive CORS for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

// API Routes
if (authRoutes) app.use('/api/auth', authRoutes);
if (investmentRoutes) app.use('/api/investments', investmentRoutes);
if (paymentRoutes) app.use('/api/payments', paymentRoutes);
if (withdrawalRoutes) app.use('/api/withdrawals', withdrawalRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (webhookRoutes) app.use('/api/webhooks', webhookRoutes);
if (userRoutes) app.use('/api/user', userRoutes);
if (passwordRoutes) app.use('/api/password', passwordRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      blockchain: !!blockchainService,
      yield: !!yieldService,
      email: !!emailService
    },
    routes: {
      auth: !!authRoutes,
      investments: !!investmentRoutes,
      payments: !!paymentRoutes,
      withdrawals: !!withdrawalRoutes,
      admin: !!adminRoutes,
      webhooks: !!webhookRoutes,
      user: !!userRoutes,
      password: !!passwordRoutes
    }
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// For any route not matching static files or API, serve the React app
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Initialize cleanup service
const cleanupService = new CleanupService();

// Run cleanup every hour
cron.schedule('0 * * * *', async () => {
  console.log('🧹 Running scheduled cleanup...');
  try {
    const result = await cleanupService.cleanupPendingTransactions();
    console.log('✅ Cleanup result:', result);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
});

// Update yields every 6 hours
if (yieldService) {
  cron.schedule('0 */6 * * *', async () => {
    console.log('📈 Updating investment yields...');
    try {
      const result = await yieldService.updateAllYields();
      console.log(`✅ Yield update complete: ${result.updated} updated, ${result.completed} completed`);
    } catch (error) {
      console.error('❌ Error updating yields:', error);
    }
  });
}

// Verify pending transactions every 5 minutes
if (blockchainService) {
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Running automatic transaction verification...');
    try {
      const verified = await blockchainService.verifyAllPendingTransactions();
      console.log(`✅ Auto-verification complete: ${verified} transactions verified`);
    } catch (error) {
      console.error('❌ Auto-verification error:', error);
    }
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🏦 PrimeStone Investment Platform                      ║
║   🔌 Server running on port ${PORT}                      ║
║   🌐 Website: http://localhost:${PORT}                   ║
║   🌐 API: http://localhost:${PORT}/api                   ║
║   💊 Health: http://localhost:${PORT}/api/health         ║
║                                                          ║
║   🧹 Cleanup: Every hour                                 ║
║   📈 Yields: Every 6 hours                               ║
║   🔍 Verification: Every 5 minutes                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
