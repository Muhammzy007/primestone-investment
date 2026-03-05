const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Authenticate token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists and is active
        const [users] = await pool.execute(
            'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        console.error('Auth error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};

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

        // Verify admin still has admin role in database
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

// Optional authentication (doesn't require token, but attaches user if present)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                const [users] = await pool.execute(
                    'SELECT id, username, email, role FROM users WHERE id = ? AND is_active = 1',
                    [decoded.userId]
                );

                if (users.length > 0) {
                    req.user = users[0];
                }
            } catch (error) {
                // Ignore token errors for optional auth
                console.log('Optional auth token invalid:', error.message);
            }
        }
        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        next();
    }
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw error;
    }
};

// Rate limiting for auth attempts (can be used with express-rate-limit)
const authRateLimiter = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    skipSuccessfulRequests: true,
    message: {
        success: false,
        error: 'Too many authentication attempts. Please try again later.'
    }
};

// Check if user has permission to access resource
const hasPermission = (resourceUserId) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Admin can access any resource
        if (req.user.role === 'admin') {
            return next();
        }

        // Users can only access their own resources
        if (req.user.id !== parseInt(resourceUserId)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        next();
    };
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

// Extract token from request
const extractToken = (req) => {
    const authHeader = req.headers['authorization'];
    return authHeader && authHeader.split(' ')[1];
};

// Logout handler (blacklist token - implement with Redis in production)
const blacklistedTokens = new Set();

const logout = (token) => {
    blacklistedTokens.add(token);
    // In production, use Redis with expiration
};

const isTokenBlacklisted = (token) => {
    return blacklistedTokens.has(token);
};

// Middleware to check blacklisted tokens
const checkBlacklist = (req, res, next) => {
    const token = extractToken(req);
    if (token && isTokenBlacklisted(token)) {
        return res.status(401).json({
            success: false,
            error: 'Token has been invalidated'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    isAdmin,
    optionalAuth,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken,
    authRateLimiter,
    hasPermission,
    validatePassword,
    logout,
    checkBlacklist
};
