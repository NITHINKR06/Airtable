const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const { getUserInfo } = require('../utils/airtable');

// Airtable OAuth configuration
const AIRTABLE_CLIENT_ID = process.env.AIRTABLE_CLIENT_ID;
const AIRTABLE_CLIENT_SECRET = process.env.AIRTABLE_CLIENT_SECRET;
const AIRTABLE_REDIRECT_URI = process.env.AIRTABLE_REDIRECT_URI || 'http://localhost:5000/api/auth/airtable/callback';

/**
 * Initiate OAuth flow - redirect to Airtable
 */
router.get('/airtable', (req, res) => {
  // Validate OAuth configuration
  if (!AIRTABLE_CLIENT_ID) {
    console.error('AIRTABLE_CLIENT_ID is not set');
    return res.status(500).json({ error: 'OAuth configuration error: Client ID is missing' });
  }
  
  if (!AIRTABLE_REDIRECT_URI) {
    console.error('AIRTABLE_REDIRECT_URI is not set');
    return res.status(500).json({ error: 'OAuth configuration error: Redirect URI is missing' });
  }
  
  // Generate a secure state token (using base64url encoding for better compatibility)
  const state = crypto.randomBytes(16).toString('base64url');
  req.session.oauthState = state;
  
  // Generate PKCE code verifier and challenge
  // Code verifier: random URL-safe string, 43-128 characters
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  // Code challenge: SHA256 hash of verifier, base64url encoded
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  // Store code verifier in session for later use
  req.session.codeVerifier = codeVerifier;
  
  // Save session before redirect
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ error: 'Failed to initialize session' });
    }
    
    // Build OAuth URL using URLSearchParams for proper encoding
    const params = new URLSearchParams({
      client_id: AIRTABLE_CLIENT_ID,
      redirect_uri: AIRTABLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'data.records:read data.records:write schema.bases:read schema.bases:write',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const authUrl = `https://airtable.com/oauth2/v1/authorize?${params.toString()}`;
    
    console.log('Redirecting to Airtable OAuth with PKCE');
    console.log('State token:', state);
    console.log('Redirect URI:', AIRTABLE_REDIRECT_URI);
    
    res.redirect(authUrl);
  });
});

/**
 * OAuth callback - handle authorization code
 */
router.get('/airtable/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors from Airtable first
    if (error) {
      console.error('OAuth error from Airtable:', error, error_description);
      console.error('Request query:', req.query);
      console.error('Session state:', req.session.oauthState);
      console.error('Session ID:', req.sessionID);
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/?error=${encodeURIComponent(error_description || error)}`);
    }

    // Check if code is present
    if (!code) {
      console.error('No authorization code received');
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/?error=${encodeURIComponent('No authorization code received')}`);
    }

    // Verify state
    if (!state || !req.session.oauthState) {
      console.error('State validation failed:', { 
        receivedState: state, 
        sessionState: req.session.oauthState,
        sessionId: req.sessionID 
      });
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/?error=${encodeURIComponent('Invalid or missing state parameter')}`);
    }

    if (state !== req.session.oauthState) {
      console.error('State mismatch:', { 
        receivedState: state, 
        sessionState: req.session.oauthState,
        sessionId: req.sessionID 
      });
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/?error=${encodeURIComponent('State parameter mismatch')}`);
    }

    // Verify code verifier exists in session
    if (!req.session.codeVerifier) {
      console.error('Code verifier not found in session');
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/?error=${encodeURIComponent('PKCE code verifier missing')}`);
    }

    // Exchange code for access token with PKCE
    const params = new URLSearchParams();
    params.append('client_id', AIRTABLE_CLIENT_ID);
    params.append('client_secret', AIRTABLE_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', AIRTABLE_REDIRECT_URI);
    params.append('code_verifier', req.session.codeVerifier);

    const tokenResponse = await axios.post('https://airtable.com/oauth2/v1/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Clear PKCE code verifier from session (no longer needed)
    delete req.session.codeVerifier;
    delete req.session.oauthState;

    // Get user info from Airtable
    const userInfo = await getUserInfo(access_token);

    // Save or update user in database
    const user = await User.findOneAndUpdate(
      { airtableUserId: userInfo.id },
      {
        airtableUserId: userInfo.id,
        email: userInfo.email || '',
        name: userInfo.name || '',
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        loginTimestamp: new Date()
      },
      { upsert: true, new: true }
    );

    // Store user in session
    req.session.userId = user._id.toString();
    req.session.accessToken = access_token;

    // Redirect to frontend
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

/**
 * Get current user
 */
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId).select('-accessToken -refreshToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

/**
 * Get access token for API calls (for authenticated requests)
 */
router.get('/token', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return token (in production, use a more secure method)
    res.json({ accessToken: user.accessToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

