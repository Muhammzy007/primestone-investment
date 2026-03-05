const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, generateToken, validatePassword } = require('../middleware/auth');

// Register new user
router.post('/register',
    [
        body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
        body('email').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { username, email, password } = req.body;

            // Check if user exists
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

            // Validate password strength
            const passwordCheck = validatePassword(password);
            if (!passwordCheck.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: passwordCheck.errors
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const [result] = await pool.execute(
                `INSERT INTO users (username, email, password_hash, role, email_verified) 
                 VALUES (?, ?, ?, 'user', FALSE)`,
                [username, email, hashedPassword]
            );

            // Generate token
            const token = generateToken(result.insertId);

            res.status(201).json({
                success: true,
                data: {
                    token,
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
            res.status(500).json({ success: false, error: 'Registration failed' });
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { email, password } = req.body;

            // Get user
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

            // Check if active
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    error: 'Account is deactivated. Contact admin.'
                });
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            // Generate token
            const token = generateToken(user.id);

            // Update last login
            await pool.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );

            res.json({
                success: true,
                data: {
                    token,
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
            res.status(500).json({ success: false, error: 'Login failed' });
        }
    }
);

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
});

module.exports = router;
