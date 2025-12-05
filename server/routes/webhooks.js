const express = require('express');
const Response = require('../models/Response');
const Form = require('../models/Form');
const { getWebhookPayloads } = require('../utils/airtable');

const router = express.Router();

/**
 * POST /webhooks/airtable
 * Handle Airtable webhook notifications
 */
router.post('/airtable', async (req, res) => {
    try {
        const { base, webhook, timestamp } = req.body;

        // Acknowledge receipt immediately (Airtable expects quick response)
        res.status(200).json({ received: true });

        // Process webhook asynchronously
        processWebhook(base?.id, webhook?.id).catch(err => {
            console.error('Error processing webhook:', err);
        });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Process webhook payloads from Airtable
 */
async function processWebhook(baseId, webhookId) {
    if (!baseId || !webhookId) {
        return;
    }

    // Find form with this webhook
    const form = await Form.findOne({
        airtableBaseId: baseId,
        webhookId: webhookId
    }).populate('owner');

    if (!form) {
        return;
    }

    try {
        // Get webhook payloads
        let cursor = null;
        let hasMore = true;

        while (hasMore) {
            const payloadData = await getWebhookPayloads(
                form.owner.accessToken,
                baseId,
                webhookId,
                cursor
            );

            // Process each payload
            for (const payload of payloadData.payloads || []) {
                await processPayload(form, payload);
            }

            cursor = payloadData.cursor;
            hasMore = payloadData.mightHaveMore;
        }
    } catch (error) {
        console.error('Error fetching webhook payloads:', error);
    }
}

/**
 * Process a single webhook payload
 */
async function processPayload(form, payload) {
    const { changedTablesById } = payload;

    if (!changedTablesById) return;

    // Get changes for our table
    const tableChanges = changedTablesById[form.airtableTableId];
    if (!tableChanges) return;

    // Handle created records (optional - these might be from our app)
    // We skip these as they're typically created by our form submission

    // Handle changed records
    if (tableChanges.changedRecordsById) {
        for (const [recordId, changes] of Object.entries(tableChanges.changedRecordsById)) {
            const response = await Response.findOne({ airtableRecordId: recordId });

            if (response) {
                // Update response with new data
                if (changes.current?.cellValuesByFieldId) {
                    // Merge updated fields into answers
                    // Note: We'd need to map field IDs back to question keys
                    response.updatedAt = new Date();
                    await response.save();
                }
            }
        }
    }

    // Handle destroyed records
    if (tableChanges.destroyedRecordIds) {
        for (const recordId of tableChanges.destroyedRecordIds) {
            const response = await Response.findOne({ airtableRecordId: recordId });

            if (response) {
                // Soft delete - mark as deleted in Airtable
                response.status = 'deletedInAirtable';
                await response.save();
            }
        }
    }
}

/**
 * GET /webhooks/airtable/health
 * Health check for webhook endpoint
 */
router.get('/airtable/health', (req, res) => {
    res.json({
        status: 'ok',
        endpoint: '/webhooks/airtable',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
