const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const pool = require('./config/database');

// Import routes
let authRoutes, investmentRoutes, paymentRoutes, withdrawalRoutes, adminRoutes, webhookRoutes;

try { authRoutes = require('./routes/authRoutes'); } catch (e) { console.log('⚠️ authRoutes not loaded'); }
try { investmentRoutes = require('./routes/investmentRoutes'); } catch (e) { console.log('⚠️ investmentRoutes not loaded'); }
try { paymentRoutes = require('./routes/paymentRoutes'); } catch (e) { console.log('⚠️ paymentRoutes not loaded'); }
try { withdrawalRoutes = require('./routes/withdrawalRoutes'); } catch (e) { console.log('⚠️ withdrawalRoutes not loaded'); }
try { adminRoutes = require('./routes/adminRoutes'); } catch (e) { console.log('⚠️ adminRoutes not loaded'); }
try { webhookRoutes = require('./routes/webhookRoutes'); } catch (e) { console.log('⚠️ webhookRoutes not loaded'); }

// Import services
let blockchainService, yieldService;

try { blockchainService = require('./services/blockchainVerificationService'); } catch (e) { console.log('⚠️ blockchainService not loaded'); }
try { yieldService = require('./services/yieldService'); } catch (e) { console.log('⚠️ yieldService not loaded'); }

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://api.qrserver.com"],
            connectSrc: ["'self'", "https://api.trongrid.io", "https://api.bscscan.com"],
        },
    },
}));

app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// API Routes
if (authRoutes) app.use('/api/auth', authRoutes);
if (investmentRoutes) app.use('/api/investments', investmentRoutes);
if (paymentRoutes) app.use('/api/payments', paymentRoutes);
if (withdrawalRoutes) app.use('/api/withdrawalRoutes', withdrawalRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (webhookRoutes) app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        routes: {
            auth: !!authRoutes,
            investments: !!investmentRoutes,
            payments: !!paymentRoutes,
            withdrawals: !!withdrawalRoutes,
            admin: !!adminRoutes,
            webhooks: !!webhookRoutes
        }
    });
});

// 🚀 IMPORTANT: Serve React frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Any route not starting with /api will serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Update yields every 6 hours
cron.schedule('0 */6 * * *', async () => {
    console.log('Updating investment yields...');
    try {
        if (yieldService) {
            const result = await yieldService.updateAllYields();
            console.log(`Yield update complete: ${result.updated} updated, ${result.completed} completed`);
        }
    } catch (error) {
        console.error('Error updating yields:', error);
    }
});

// Verify pending transactions every 15 minutes
cron.schedule('*/15 * * * *', async () => {
    console.log('Verifying pending transactions...');
    try {
        if (blockchainService) {
            await blockchainService.verifyAllPendingTransactions();
        }
    } catch (error) {
        console.error('Error verifying transactions:', error);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║     🏦 PrimeStone Investment Platform                    ║
    ║     🔌 Server running on port ${PORT}                      ║
    ║     🌐 Website: http://localhost:${PORT}                  ║
    ║     🌐 API: http://localhost:${PORT}/api                  ║
    ║     💊 Health: http://localhost:${PORT}/api/health        ║
    ║                                                          ║
    ║     ✅ Frontend & Backend combined!                      ║
    ║     📈 6-Month Yield Period                              ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});
