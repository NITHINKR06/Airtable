const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getBases, getBaseSchema, getTableFields } = require('../utils/airtable');

const router = express.Router();

/**
 * GET /api/airtable/bases
 * List all bases accessible to the user
 */
router.get('/bases', authenticate, async (req, res) => {
    try {
        const bases = await getBases(req.user.accessToken);

        res.json({
            bases: bases.map(base => ({
                id: base.id,
                name: base.name,
                permissionLevel: base.permissionLevel
            }))
        });
    } catch (error) {
        console.error('Get bases error:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({
                error: { message: 'Airtable authorization expired. Please log in again.' }
            });
        }

        res.status(500).json({
            error: { message: 'Failed to fetch Airtable bases' }
        });
    }
});

/**
 * GET /api/airtable/bases/:baseId/tables
 * List all tables in a base
 */
router.get('/bases/:baseId/tables', authenticate, async (req, res) => {
    try {
        const { baseId } = req.params;
        const tables = await getBaseSchema(req.user.accessToken, baseId);

        res.json({
            tables: tables.map(table => ({
                id: table.id,
                name: table.name,
                description: table.description || '',
                primaryFieldId: table.primaryFieldId
            }))
        });
    } catch (error) {
        console.error('Get tables error:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({
                error: { message: 'Airtable authorization expired. Please log in again.' }
            });
        }
        if (error.response?.status === 404) {
            return res.status(404).json({
                error: { message: 'Base not found' }
            });
        }

        res.status(500).json({
            error: { message: 'Failed to fetch tables' }
        });
    }
});

/**
 * GET /api/airtable/bases/:baseId/tables/:tableId/fields
 * Get all supported fields from a table
 */
router.get('/bases/:baseId/tables/:tableId/fields', authenticate, async (req, res) => {
    try {
        const { baseId, tableId } = req.params;
        const fields = await getTableFields(req.user.accessToken, baseId, tableId);

        res.json({ fields });
    } catch (error) {
        console.error('Get fields error:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({
                error: { message: 'Airtable authorization expired. Please log in again.' }
            });
        }
        if (error.response?.status === 404 || error.message?.includes('not found')) {
            return res.status(404).json({
                error: { message: 'Table not found' }
            });
        }

        res.status(500).json({
            error: { message: 'Failed to fetch fields' }
        });
    }
});

module.exports = router;
