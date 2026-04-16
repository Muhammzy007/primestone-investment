const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// In-memory store for refresh tokens (cleared when server restarts)
// This ensures tokens don't persist beyond server session
const refreshTokenStore = new Map(); // Maps refreshToken -> { userId, expiresAt }

// Authenticate access token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
                code: 'NO_TOKEN'
            });
        }

        try {
            // Verify the access token
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE
            });

            // Check if token type is 'access'
            if (decoded.type !== 'access') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token type',
                    code: 'INVALID_TOKEN_TYPE'
                });
            }

            // Check database for user
            const [users] = await pool.execute(
                'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const user = users[0];

            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    error: 'Account is deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                });
            }

            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };

            next();

        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Access token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }
            throw jwtError;
        }

    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Generate access token (30-minute lifespan)
const generateAccessToken = (userId) => {
    return jwt.sign(
        { 
            userId,
            type: 'access',
            iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRE || '30m',
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE
        }
    );
};

// Generate refresh token (ALSO 30-minute lifespan - browser session only)
const generateRefreshToken = (userId) => {
    const expiresIn = process.env.JWT_REFRESH_EXPIRE || '30m';
    
    const refreshToken = jwt.sign(
        {
            userId,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        {
            expiresIn: expiresIn,
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE
        }
    );

    // Calculate expiration time in milliseconds
    let expiresInMs;
    if (expiresIn.endsWith('m')) {
        expiresInMs = parseInt(expiresIn) * 60 * 1000;
    } else if (expiresIn.endsWith('h')) {
        expiresInMs = parseInt(expiresIn) * 60 * 60 * 1000;
    } else if (expiresIn.endsWith('d')) {
        expiresInMs = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
    } else {
        expiresInMs = 30 * 60 * 1000; // Default 30 minutes
    }

    // Store in memory (not persistent - cleared on server restart)
    refreshTokenStore.set(refreshToken, {
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + expiresInMs
    });

    return refreshToken;
};

// Refresh token endpoint handler
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token required',
                code: 'REFRESH_TOKEN_REQUIRED'
            });
        }

        // Check if refresh token exists in memory store
        if (!refreshTokenStore.has(refreshToken)) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }

        const tokenData = refreshTokenStore.get(refreshToken);
        
        // Check if token has expired in our store
        if (tokenData.expiresAt <= Date.now()) {
            refreshTokenStore.delete(refreshToken);
            return res.status(401).json({
                success: false,
                error: 'Refresh token expired',
                code: 'REFRESH_EXPIRED'
            });
        }

        // Verify the refresh token JWT
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, {
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE
            });
        } catch (error) {
            // Remove invalid token from store
            refreshTokenStore.delete(refreshToken);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Refresh token expired',
                    code: 'REFRESH_EXPIRED'
                });
            }
            throw error;
        }

        // Verify token type
        if (decoded.type !== 'refresh') {
            refreshTokenStore.delete(refreshToken);
            return res.status(403).json({
                success: false,
                error: 'Invalid token type',
                code: 'INVALID_TOKEN_TYPE'
            });
        }

        // Verify user still exists and is active
        const [users] = await pool.execute(
            'SELECT id, role, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].is_active) {
            refreshTokenStore.delete(refreshToken);
            return res.status(403).json({
                success: false,
                error: 'User account invalid',
                code: 'USER_INVALID'
            });
        }

        // Remove old refresh token (one-time use)
        refreshTokenStore.delete(refreshToken);

        // Generate new tokens (both with 30-minute expiry)
        const newAccessToken = generateAccessToken(decoded.userId);
        const newRefreshToken = generateRefreshToken(decoded.userId);

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: 30 * 60 * 1000 // 30 minutes in milliseconds
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            error: 'Token refresh failed',
            code: 'REFRESH_FAILED'
        });
    }
};

// Logout - remove refresh token
const logout = (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken && refreshTokenStore.has(refreshToken)) {
        refreshTokenStore.delete(refreshToken);
    }

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Clean up expired refresh tokens periodically
const cleanupExpiredTokens = () => {
    const now = Date.now();
    let count = 0;
    for (const [token, data] of refreshTokenStore.entries()) {
        if (data.expiresAt <= now) {
            refreshTokenStore.delete(token);
            count++;
        }
    }
    if (count > 0) {
        console.log(`🧹 Cleaned up ${count} expired refresh tokens`);
    }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

// Admin check middleware
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        // Double-check in database
        const [users] = await pool.execute(
            'SELECT role FROM users WHERE id = ? AND role = "admin"',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Admin privileges revoked'
            });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Admin verification failed'
        });
    }
};

// Validate password strength
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    authenticateToken,
    isAdmin,
    generateAccessToken,
    generateRefreshToken,
    refreshToken,
    logout,
    validatePassword
};
