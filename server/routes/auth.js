const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const {
    exchangeCodeForToken,
    getCurrentUser,
    refreshAccessToken
} = require('../utils/airtable');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Store PKCE verifiers temporarily (in production, use Redis or similar)
const codeVerifiers = new Map();

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64url');
    return { verifier, challenge };
}

/**
 * GET /api/auth/login
 * Redirect to Airtable OAuth authorization
 */
router.get('/login', (req, res) => {
    try {
        const { verifier, challenge } = generatePKCE();
        const state = crypto.randomBytes(16).toString('hex');

        // Store verifier for callback
        codeVerifiers.set(state, {
            verifier,
            createdAt: Date.now()
        });

        // Clean up old verifiers (older than 10 minutes)
        const TEN_MINUTES = 10 * 60 * 1000;
        for (const [key, value] of codeVerifiers.entries()) {
            if (Date.now() - value.createdAt > TEN_MINUTES) {
                codeVerifiers.delete(key);
            }
        }

        // Build authorization URL - use only scopes that are enabled in Airtable OAuth app
        const scopes = 'data.records:read data.records:write schema.bases:read schema.bases:write user.email:read';

        const baseUrl = 'https://airtable.com/oauth2/v1/authorize';
        const params = new URLSearchParams();
        params.append('client_id', process.env.AIRTABLE_CLIENT_ID);
        params.append('redirect_uri', process.env.AIRTABLE_REDIRECT_URI);
        params.append('response_type', 'code');
        params.append('state', state);
        params.append('code_challenge', challenge);
        params.append('code_challenge_method', 'S256');
        params.append('scope', scopes);

        const authUrl = `${baseUrl}?${params.toString()}`;

        res.redirect(authUrl);
    } catch (error) {
        console.error('Login error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
});

/**
 * GET /api/auth/callback
 * Handle OAuth callback from Airtable
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            console.error('OAuth error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=${error}`);
        }

        if (!code || !state) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_params`);
        }

        // Get stored verifier
        const storedData = codeVerifiers.get(state);
        if (!storedData) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
        }

        const { verifier } = storedData;
        codeVerifiers.delete(state);

        // Exchange code for tokens
        const tokenData = await exchangeCodeForToken(code, verifier);

        // Get user info from Airtable
        const airtableUser = await getCurrentUser(tokenData.access_token);

        // Calculate token expiry
        const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

        // Create or update user in database
        let user = await User.findOne({ airtableUserId: airtableUser.id });

        if (user) {
            // Update existing user
            user.accessToken = tokenData.access_token;
            user.refreshToken = tokenData.refresh_token;
            user.tokenExpiry = tokenExpiry;
            user.scopes = tokenData.scope?.split(' ') || [];
            user.loginTimestamp = new Date();
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                airtableUserId: airtableUser.id,
                email: airtableUser.email || '',
                name: airtableUser.email?.split('@')[0] || 'User',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiry: tokenExpiry,
                scopes: tokenData.scope?.split(' ') || [],
                loginTimestamp: new Date()
            });
        }

        // Create JWT for our app
        const jwtToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Set cookie and redirect to frontend
        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${jwtToken}`);
    } catch (error) {
        console.error('Callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_failed`);
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                airtableUserId: req.user.airtableUserId,
                email: req.user.email,
                name: req.user.name,
                loginTimestamp: req.user.loginTimestamp
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: { message: 'Failed to get user info' } });
    }
});

/**
 * POST /api/auth/logout
 * Log out user
 */
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', authenticate, async (req, res) => {
    try {
        const tokenData = await refreshAccessToken(req.user.refreshToken);

        await req.user.updateTokens(
            tokenData.access_token,
            tokenData.refresh_token || req.user.refreshToken,
            tokenData.expires_in
        );

        res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: { message: 'Failed to refresh token' } });
    }
});

module.exports = router;
