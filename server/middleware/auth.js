const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { refreshAccessToken } = require('../utils/airtable');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header or cookie
        let token = req.headers.authorization?.replace('Bearer ', '');

        if (!token && req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                error: { message: 'Authentication required. Please log in.' }
            });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: { message: 'User not found. Please log in again.' }
            });
        }

        // Check if Airtable token is expired and refresh if needed
        if (user.isTokenExpired()) {
            try {
                const tokenData = await refreshAccessToken(user.refreshToken);
                await user.updateTokens(
                    tokenData.access_token,
                    tokenData.refresh_token || user.refreshToken,
                    tokenData.expires_in
                );
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError.message);
                return res.status(401).json({
                    error: { message: 'Session expired. Please log in again.' }
                });
            }
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: { message: 'Invalid token. Please log in again.' }
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: { message: 'Token expired. Please log in again.' }
            });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            error: { message: 'Authentication error' }
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token exists, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.replace('Bearer ', '');

        if (!token && req.cookies?.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Ignore errors for optional auth, just continue without user
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuth
};
