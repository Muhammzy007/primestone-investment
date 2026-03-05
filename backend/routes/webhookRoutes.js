const express = require('express');
const router = express.Router();

// Webhook for TronGrid
router.post('/tron', async (req, res) => {
    try {
        const { txID, contractRet } = req.body;
        console.log('Tron webhook received:', { txID, contractRet });
        res.status(200).json({ received: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook for BSCScan
router.post('/bsc', async (req, res) => {
    try {
        const { txHash, status } = req.body;
        console.log('BSC webhook received:', { txHash, status });
        res.status(200).json({ received: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
