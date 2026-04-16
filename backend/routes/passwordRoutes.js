const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const EmailService = require('../services/emailService');

const emailService = new EmailService();

// Request password reset
router.post('/forgot-password',
    [
        body('email').isEmail().withMessage('Valid email required')
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
            const { email } = req.body;

            const [users] = await pool.execute(
                'SELECT id, username FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.json({
                    success: true,
                    message: 'If an account exists with this email, you will receive a reset link.'
                });
            }

            const user = users[0];
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            
            // Use UTC time for expiration (1 hour from now in UTC)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
            
            // Store in UTC
            await pool.execute(
                `UPDATE users 
                 SET reset_token = ?, 
                     reset_expires = ? 
                 WHERE id = ?`,
                [resetTokenHash, expiresAt.toISOString().slice(0, 19).replace('T', ' '), user.id]
            );

            console.log('Token stored, expires at (UTC):', expiresAt.toISOString());

            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

            console.log('📧 Generated reset link:', resetLink);

            const emailResult = await emailService.sendPasswordResetEmail(
                email,
                user.username,
                resetLink
            );

            if (emailResult.success) {
                console.log(`✅ Password reset email sent to ${email}`);
                return res.json({
                    success: true,
                    message: 'Password reset link has been sent to your email.'
                });
            } else {
                console.error('❌ Failed to send email:', emailResult.error);
                return res.json({
                    success: true,
                    message: 'If an account exists with this email, you will receive a reset link.'
                });
            }

        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process request'
            });
        }
    }
);

// Verify reset token
router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;

        console.log('🔍 Verifying token:', token);

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token required'
            });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        console.log('🔍 Token hash computed:', tokenHash);

        // Get current UTC time
        const now = new Date();
        const utcNow = now.toISOString().slice(0, 19).replace('T', ' ');
        
        console.log('Current UTC time:', utcNow);

        // Check if token exists and is not expired
        const [users] = await pool.execute(
            `SELECT id, email, reset_expires 
             FROM users 
             WHERE reset_token = ?`,
            [tokenHash]
        );

        console.log('🔍 Users found with token:', users.length);

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid token'
            });
        }

        const user = users[0];
        const expiresAt = new Date(user.reset_expires + ' UTC');
        
        console.log('Token expires at (UTC):', expiresAt.toISOString());
        console.log('Current time (UTC):', now.toISOString());
        console.log('Is expired?', now > expiresAt);

        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                error: 'Token has expired'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid'
        });

    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify token'
        });
    }
});

// Reset password
router.post('/reset-password',
    [
        body('token').notEmpty().withMessage('Token required'),
        body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
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
            const { token, newPassword } = req.body;

            console.log('🔑 Resetting password with token:', token);

            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

            // Get current UTC time
            const now = new Date();
            const utcNow = now.toISOString().slice(0, 19).replace('T', ' ');

            // Check token validity
            const [users] = await pool.execute(
                `SELECT id, email, username, reset_expires 
                 FROM users 
                 WHERE reset_token = ?`,
                [tokenHash]
            );

            console.log('🔑 Users found:', users.length);

            if (users.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid token'
                });
            }

            const user = users[0];
            const expiresAt = new Date(user.reset_expires + ' UTC');

            if (now > expiresAt) {
                return res.status(400).json({
                    success: false,
                    error: 'Token has expired'
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await pool.execute(
                `UPDATE users
                 SET password_hash = ?, reset_token = NULL, reset_expires = NULL
                 WHERE id = ?`,
                [hashedPassword, user.id]
            );

            console.log(`✅ Password reset successful for user: ${user.email}`);

            res.json({
                success: true,
                message: 'Password reset successful'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reset password'
            });
        }
    }
);

module.exports = router;
