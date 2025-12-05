const express = require('express');
const router = express.Router();
const Response = require('../models/Response');

/**
 * Airtable webhook handler
 * Handles events when Airtable records are updated or deleted
 */
router.post('/airtable', async (req, res) => {
  try {
    const { event } = req.body;

    // Verify webhook (in production, verify signature)
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const { base, webhook } = event;

    // Handle different event types
    if (webhook && webhook.payload) {
      const { base: { id: baseId }, tables } = webhook.payload;

      // Process each table
      for (const table of tables) {
        const { id: tableId, changedRecordsById, destroyedRecordIds } = table;

        // Handle updated records
        if (changedRecordsById && Object.keys(changedRecordsById).length > 0) {
          for (const recordId of Object.keys(changedRecordsById)) {
            const record = changedRecordsById[recordId];
            
            // Find response by Airtable record ID
            const response = await Response.findOne({ airtableRecordId: recordId });
            
            if (response) {
              // Update the response in database
              // Note: We don't have the full answer data from webhook,
              // so we might need to fetch it from Airtable or just update metadata
              response.updatedAt = new Date();
              response.deletedInAirtable = false;
              await response.save();
            }
          }
        }

        // Handle deleted records
        if (destroyedRecordIds && destroyedRecordIds.length > 0) {
          for (const recordId of destroyedRecordIds) {
            const response = await Response.findOne({ airtableRecordId: recordId });
            
            if (response) {
              // Mark as deleted, don't hard delete
              response.deletedInAirtable = true;
              await response.save();
            }
          }
        }
      }
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed', details: error.message });
  }
});

module.exports = router;

