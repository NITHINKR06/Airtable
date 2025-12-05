const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getBases, getTables, getFields, isSupportedFieldType, mapFieldType } = require('../utils/airtable');

// Middleware to ensure user is authenticated
async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all bases for authenticated user
 */
router.get('/bases', requireAuth, async (req, res) => {
  try {
    const bases = await getBases(req.user.accessToken);
    res.json(bases);
  } catch (error) {
    console.error('Error fetching bases:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch bases', details: error.message });
  }
});

/**
 * Get all tables in a base
 */
router.get('/bases/:baseId/tables', requireAuth, async (req, res) => {
  try {
    const { baseId } = req.params;
    const tables = await getTables(req.user.accessToken, baseId);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch tables', details: error.message });
  }
});

/**
 * Get all fields in a table (only supported types)
 */
router.get('/bases/:baseId/tables/:tableId/fields', requireAuth, async (req, res) => {
  try {
    const { baseId, tableId } = req.params;
    const fields = await getFields(req.user.accessToken, baseId, tableId);
    
    // Filter to only supported field types
    const supportedFields = fields
      .filter(field => isSupportedFieldType(field.type))
      .map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        options: field.options || {}
      }));

    res.json(supportedFields);
  } catch (error) {
    console.error('Error fetching fields:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch fields', details: error.message });
  }
});

module.exports = router;

