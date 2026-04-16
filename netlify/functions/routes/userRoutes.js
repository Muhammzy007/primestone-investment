const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user's wallets
router.get('/wallets', authenticateToken, async (req, res) => {
    try {
        const [wallets] = await pool.execute(
            `SELECT * FROM user_wallets WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
            [req.user.id]
        );
        
        res.json({
            success: true,
            data: wallets
        });
    } catch (error) {
        console.error('Error fetching wallets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch wallets'
        });
    }
});

// Add new wallet
router.post('/wallets',
    authenticateToken,
    [
        body('address').notEmpty().withMessage('Wallet address required'),
        body('chain').isIn(['TRC20', 'BEP20']).withMessage('Valid chain required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { address, chain, isDefault } = req.body;
            
            // Check if wallet already exists
            const [existing] = await pool.execute(
                `SELECT id FROM user_wallets WHERE user_id = ? AND wallet_address = ?`,
                [req.user.id, address]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Wallet already exists'
                });
            }

            // If setting as default, remove default from others
            if (isDefault) {
                await pool.execute(
                    `UPDATE user_wallets SET is_default = FALSE WHERE user_id = ?`,
                    [req.user.id]
                );
            }

            // Insert new wallet
            const [result] = await pool.execute(
                `INSERT INTO user_wallets (user_id, wallet_address, chain, is_default) 
                 VALUES (?, ?, ?, ?)`,
                [req.user.id, address, chain, isDefault || false]
            );

            res.status(201).json({
                success: true,
                data: {
                    id: result.insertId,
                    address,
                    chain,
                    isDefault: isDefault || false
                }
            });

        } catch (error) {
            console.error('Error adding wallet:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add wallet'
            });
        }
    }
);

// Set default wallet
router.put('/wallets/:id/default', authenticateToken, async (req, res) => {
    try {
        const walletId = req.params.id;

        // Verify wallet belongs to user
        const [wallet] = await pool.execute(
            `SELECT id FROM user_wallets WHERE id = ? AND user_id = ?`,
            [walletId, req.user.id]
        );

        if (wallet.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        // Remove default from all user's wallets
        await pool.execute(
            `UPDATE user_wallets SET is_default = FALSE WHERE user_id = ?`,
            [req.user.id]
        );

        // Set this wallet as default
        await pool.execute(
            `UPDATE user_wallets SET is_default = TRUE WHERE id = ?`,
            [walletId]
        );

        res.json({
            success: true,
            message: 'Default wallet updated'
        });

    } catch (error) {
        console.error('Error setting default wallet:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to set default wallet'
        });
    }
});

// Delete wallet
router.delete('/wallets/:id', authenticateToken, async (req, res) => {
    try {
        const walletId = req.params.id;

        // Check if wallet is default
        const [wallet] = await pool.execute(
            `SELECT is_default FROM user_wallets WHERE id = ? AND user_id = ?`,
            [walletId, req.user.id]
        );

        if (wallet.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        // Delete wallet
        await pool.execute(
            `DELETE FROM user_wallets WHERE id = ? AND user_id = ?`,
            [walletId, req.user.id]
        );

        res.json({
            success: true,
            message: 'Wallet deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting wallet:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete wallet'
        });
    }
});

// Update user profile
router.put('/profile',
    authenticateToken,
    [
        body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
        body('email').optional().isEmail().withMessage('Valid email required'),
        body('phone').optional()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { username, email, phone } = req.body;
            const updates = [];
            const params = [];

            if (username) {
                // Check if username is taken
                const [existing] = await pool.execute(
                    `SELECT id FROM users WHERE username = ? AND id != ?`,
                    [username, req.user.id]
                );
                if (existing.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Username already taken'
                    });
                }
                updates.push('username = ?');
                params.push(username);
            }

            if (email) {
                // Check if email is taken
                const [existing] = await pool.execute(
                    `SELECT id FROM users WHERE email = ? AND id != ?`,
                    [email, req.user.id]
                );
                if (existing.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Email already registered'
                    });
                }
                updates.push('email = ?');
                params.push(email);
            }

            if (phone !== undefined) {
                updates.push('phone = ?');
                params.push(phone);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No updates provided'
                });
            }

            params.push(req.user.id);
            await pool.execute(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            // Get updated user
            const [user] = await pool.execute(
                `SELECT id, username, email, phone, role FROM users WHERE id = ?`,
                [req.user.id]
            );

            res.json({
                success: true,
                data: user[0]
            });

        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update profile'
            });
        }
    }
);

// Change password
router.post('/change-password',
    authenticateToken,
    [
        body('currentPassword').notEmpty().withMessage('Current password required'),
        body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { currentPassword, newPassword } = req.body;

            // Get user with password
            const [users] = await pool.execute(
                `SELECT password_hash FROM users WHERE id = ?`,
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Verify current password
            const validPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await pool.execute(
                `UPDATE users SET password_hash = ? WHERE id = ?`,
                [hashedPassword, req.user.id]
            );

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to change password'
            });
        }
    }
);

module.exports = router;
