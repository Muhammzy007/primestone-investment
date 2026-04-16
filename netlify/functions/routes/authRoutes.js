const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { 
    authenticateToken, 
    generateAccessToken,
    generateRefreshToken,
    refreshToken,
    logout,
    validatePassword 
} = require('../middleware/auth');

const EmailService = require('../services/emailService');
const emailService = new EmailService();

// Register new user
router.post('/register',
    [
        body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
        body('email').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    error: errors.array()[0].msg 
                });
            }

            const { username, email, password } = req.body;

            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ? OR username = ?',
                [email, username]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'User with this email or username already exists'
                });
            }

            const passwordCheck = validatePassword(password);
            if (!passwordCheck.isValid) {
                return res.status(400).json({
                    success: false,
                    error: passwordCheck.errors[0]
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await pool.execute(
                `INSERT INTO users (username, email, password_hash, role, email_verified)
                 VALUES (?, ?, ?, 'user', FALSE)`,
                [username, email, hashedPassword]
            );

            const accessToken = generateAccessToken(result.insertId);
            const refreshToken = generateRefreshToken(result.insertId);

            // Send welcome email (with better error handling)
            try {
                console.log(`📧 Attempting to send welcome email to ${email}...`);
                const emailResult = await emailService.sendWelcomeEmail(email, username);
                
                if (emailResult.success) {
                    console.log(`✅ Welcome email sent successfully to ${email}`);
                } else {
                    console.error(`❌ Failed to send welcome email to ${email}:`, emailResult.error);
                }
            } catch (emailErr) {
                console.error(`❌ Exception sending welcome email to ${email}:`, emailErr.message);
                // Don't fail registration if email fails
            }

            return res.status(201).json({
                success: true,
                data: {
                    accessToken,
                    refreshToken,
                    expiresIn: 30 * 60 * 1000,
                    user: {
                        id: result.insertId,
                        username,
                        email,
                        role: 'user'
                    }
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Registration failed. Please try again.' 
            });
        }
    }
);

// Login user
router.post('/login',
    [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    error: errors.array()[0].msg 
                });
            }

            const { email, password } = req.body;

            const [users] = await pool.execute(
                'SELECT id, username, email, password_hash, role, is_active FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            const user = users[0];

            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    error: 'Account is deactivated. Contact admin.'
                });
            }

            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            await pool.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );

            return res.json({
                success: true,
                data: {
                    accessToken,
                    refreshToken,
                    expiresIn: 30 * 60 * 1000,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Login failed. Please try again.' 
            });
        }
    }
);

// Refresh token endpoint
router.post('/refresh', refreshToken);

// Logout endpoint
router.post('/logout', logout);

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        return res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch user' 
        });
    }
});

module.exports = router;
