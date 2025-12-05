const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Form = require('../models/Form');
const Response = require('../models/Response');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
    createRecord,
    SUPPORTED_FIELD_TYPES,
    createWebhook
} = require('../utils/airtable');
const { shouldShowQuestion } = require('../utils/conditionalLogic');

const router = express.Router();

/**
 * POST /api/forms
 * Create a new form
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            name,
            description,
            airtableBaseId,
            airtableBaseName,
            airtableTableId,
            airtableTableName,
            questions
        } = req.body;

        // Validate required fields
        if (!name || !airtableBaseId || !airtableTableId || !questions?.length) {
            return res.status(400).json({
                error: { message: 'Missing required fields: name, airtableBaseId, airtableTableId, questions' }
            });
        }

        // Validate question types
        for (const question of questions) {
            if (!SUPPORTED_FIELD_TYPES.includes(question.type)) {
                return res.status(400).json({
                    error: {
                        message: `Unsupported field type: ${question.type}. Supported types: ${SUPPORTED_FIELD_TYPES.join(', ')}`
                    }
                });
            }

            // Generate questionKey if not provided
            if (!question.questionKey) {
                question.questionKey = uuidv4();
            }
        }

        // Create form
        const form = await Form.create({
            owner: req.user._id,
            name,
            description: description || '',
            airtableBaseId,
            airtableBaseName: airtableBaseName || '',
            airtableTableId,
            airtableTableName: airtableTableName || '',
            questions
        });

        res.status(201).json({ form });
    } catch (error) {
        console.error('Create form error:', error);
        res.status(500).json({ error: { message: 'Failed to create form' } });
    }
});

/**
 * GET /api/forms
 * List all forms for the authenticated user
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const forms = await Form.find({ owner: req.user._id })
            .select('-questions')
            .sort({ createdAt: -1 });

        res.json({ forms });
    } catch (error) {
        console.error('List forms error:', error);
        res.status(500).json({ error: { message: 'Failed to fetch forms' } });
    }
});

/**
 * GET /api/forms/:formId
 * Get a single form by ID
 */
router.get('/:formId', optionalAuth, async (req, res) => {
    try {
        const { formId } = req.params;
        const form = await Form.findById(formId);

        if (!form) {
            return res.status(404).json({ error: { message: 'Form not found' } });
        }

        // If user is authenticated, check ownership for full access
        // Otherwise, return public form data (for form filling)
        const isOwner = req.user && form.owner.toString() === req.user._id.toString();

        res.json({
            form,
            isOwner
        });
    } catch (error) {
        console.error('Get form error:', error);
        res.status(500).json({ error: { message: 'Failed to fetch form' } });
    }
});

/**
 * PUT /api/forms/:formId
 * Update a form
 */
router.put('/:formId', authenticate, async (req, res) => {
    try {
        const { formId } = req.params;
        const form = await Form.findById(formId);

        if (!form) {
            return res.status(404).json({ error: { message: 'Form not found' } });
        }

        // Check ownership
        if (form.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: { message: 'Not authorized to update this form' } });
        }

        const { name, description, questions, isPublished } = req.body;

        // Validate question types if questions are being updated
        if (questions) {
            for (const question of questions) {
                if (!SUPPORTED_FIELD_TYPES.includes(question.type)) {
                    return res.status(400).json({
                        error: {
                            message: `Unsupported field type: ${question.type}`
                        }
                    });
                }
                if (!question.questionKey) {
                    question.questionKey = uuidv4();
                }
            }
            form.questions = questions;
        }

        if (name !== undefined) form.name = name;
        if (description !== undefined) form.description = description;
        if (isPublished !== undefined) form.isPublished = isPublished;

        await form.save();

        res.json({ form });
    } catch (error) {
        console.error('Update form error:', error);
        res.status(500).json({ error: { message: 'Failed to update form' } });
    }
});

/**
 * DELETE /api/forms/:formId
 * Delete a form
 */
router.delete('/:formId', authenticate, async (req, res) => {
    try {
        const { formId } = req.params;
        const form = await Form.findById(formId);

        if (!form) {
            return res.status(404).json({ error: { message: 'Form not found' } });
        }

        // Check ownership
        if (form.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: { message: 'Not authorized to delete this form' } });
        }

        await Form.findByIdAndDelete(formId);

        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        console.error('Delete form error:', error);
        res.status(500).json({ error: { message: 'Failed to delete form' } });
    }
});

/**
 * POST /api/forms/:formId/submit
 * Submit a form response
 */
router.post('/:formId/submit', async (req, res) => {
    try {
        const { formId } = req.params;
        const { answers } = req.body;

        // Get form
        const form = await Form.findById(formId).populate('owner');

        if (!form) {
            return res.status(404).json({ error: { message: 'Form not found' } });
        }

        // Validate answers
        const errors = [];
        const airtableFields = {};

        for (const question of form.questions) {
            const answer = answers[question.questionKey];

            // Check if question should be shown (for validation)
            const shouldShow = shouldShowQuestion(question.conditionalRules, answers);

            if (!shouldShow) {
                // Skip validation for hidden questions
                continue;
            }

            // Check required fields
            if (question.required) {
                if (answer === undefined || answer === null || answer === '' ||
                    (Array.isArray(answer) && answer.length === 0)) {
                    errors.push(`"${question.label}" is required`);
                    continue;
                }
            }

            // Skip if no answer and not required
            if (answer === undefined || answer === null) {
                continue;
            }

            // Validate based on type
            switch (question.type) {
                case 'singleSelect':
                    if (question.options?.length && !question.options.includes(answer)) {
                        errors.push(`Invalid option for "${question.label}"`);
                    }
                    break;

                case 'multipleSelects':
                    if (!Array.isArray(answer)) {
                        errors.push(`"${question.label}" must be an array`);
                    } else if (question.options?.length) {
                        const invalidOptions = answer.filter(a => !question.options.includes(a));
                        if (invalidOptions.length) {
                            errors.push(`Invalid options for "${question.label}": ${invalidOptions.join(', ')}`);
                        }
                    }
                    break;

                case 'multipleAttachments':
                    if (!Array.isArray(answer)) {
                        errors.push(`"${question.label}" must be an array of attachments`);
                    }
                    break;
            }

            // Map to Airtable field name
            if (answer !== undefined && answer !== null && answer !== '') {
                airtableFields[question.airtableFieldName] = answer;
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: {
                    message: 'Validation failed',
                    details: errors
                }
            });
        }

        // Create record in Airtable
        const airtableRecord = await createRecord(
            form.owner.accessToken,
            form.airtableBaseId,
            form.airtableTableId,
            airtableFields
        );

        // Save response to database
        const response = await Response.create({
            formId: form._id,
            airtableRecordId: airtableRecord.id,
            answers,
            status: 'active'
        });

        res.status(201).json({
            message: 'Form submitted successfully',
            response: {
                id: response._id,
                airtableRecordId: response.airtableRecordId,
                createdAt: response.createdAt
            }
        });
    } catch (error) {
        console.error('Submit form error:', error);

        if (error.response?.status === 401) {
            return res.status(401).json({
                error: { message: 'Form owner\'s Airtable authorization has expired' }
            });
        }
        if (error.response?.status === 422) {
            return res.status(400).json({
                error: {
                    message: 'Airtable validation error',
                    details: error.response.data?.error?.message
                }
            });
        }

        res.status(500).json({ error: { message: 'Failed to submit form' } });
    }
});

/**
 * GET /api/forms/:formId/responses
 * List all responses for a form
 */
router.get('/:formId/responses', authenticate, async (req, res) => {
    try {
        const { formId } = req.params;

        // Verify form exists and user owns it
        const form = await Form.findById(formId);

        if (!form) {
            return res.status(404).json({ error: { message: 'Form not found' } });
        }

        if (form.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: { message: 'Not authorized to view responses' } });
        }

        // Get responses
        const responses = await Response.find({ formId })
            .sort({ createdAt: -1 });

        res.json({
            responses: responses.map(r => ({
                id: r._id,
                airtableRecordId: r.airtableRecordId,
                answers: r.answers,
                answersPreview: r.answersPreview,
                status: r.status,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt
            }))
        });
    } catch (error) {
        console.error('Get responses error:', error);
        res.status(500).json({ error: { message: 'Failed to fetch responses' } });
    }
});

/**
 * POST /api/forms/:formId/webhook
 * Create webhook for form's Airtable table
 */
router.post('/:formId/webhook', authenticate, async (req, res) => {
    try {
        const { formId } = req.params;
        const form = await Form.findById(formId);

        if (!form) {
            return res.status(404).json({ error: { message: 'Form not found' } });
        }

        if (form.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: { message: 'Not authorized' } });
        }

        // Create webhook
        const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/webhooks/airtable`;

        const webhook = await createWebhook(
            req.user.accessToken,
            form.airtableBaseId,
            webhookUrl,
            form.airtableTableId
        );

        // Save webhook ID to form
        form.webhookId = webhook.id;
        await form.save();

        res.json({
            message: 'Webhook created successfully',
            webhookId: webhook.id
        });
    } catch (error) {
        console.error('Create webhook error:', error);
        res.status(500).json({ error: { message: 'Failed to create webhook' } });
    }
});

module.exports = router;
