const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Form = require('../models/Form');
const Response = require('../models/Response');
const { createRecord, updateRecord } = require('../utils/airtable');
const { shouldShowQuestion } = require('../utils/conditionalLogic');

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
 * Create a new form
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { airtableBaseId, airtableTableId, formName, questions } = req.body;

    if (!airtableBaseId || !airtableTableId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const form = new Form({
      owner: req.user._id,
      airtableBaseId,
      airtableTableId,
      formName: formName || 'Untitled Form',
      questions
    });

    await form.save();
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all forms for authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const forms = await Form.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific form by ID
 */
router.get('/:formId', async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId).populate('owner', 'email name');
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update a form
 */
router.put('/:formId', requireAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { formName, questions } = req.body;
    if (formName) form.formName = formName;
    if (questions) form.questions = questions;

    await form.save();
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a form
 */
router.delete('/:formId', requireAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Form.deleteOne({ _id: req.params.formId });
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit form response
 */
router.post('/:formId/submit', async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Get user to access Airtable token
    const user = await User.findById(form.owner);
    if (!user) {
      return res.status(404).json({ error: 'Form owner not found' });
    }

    // Validate required fields
    for (const question of form.questions) {
      if (question.required) {
        const answer = answers[question.questionKey];
        if (answer === undefined || answer === null || answer === '') {
          return res.status(400).json({ 
            error: `Required field missing: ${question.label}`,
            field: question.questionKey
          });
        }
      }

      // Validate single-select choices
      if (question.type === 'singleSelect' && answers[question.questionKey]) {
        const answer = answers[question.questionKey];
        if (!question.options.includes(answer)) {
          return res.status(400).json({ 
            error: `Invalid choice for ${question.label}`,
            field: question.questionKey
          });
        }
      }

      // Validate multi-select array options
      if (question.type === 'multipleSelects' && answers[question.questionKey]) {
        const answerArray = Array.isArray(answers[question.questionKey]) 
          ? answers[question.questionKey] 
          : [answers[question.questionKey]];
        
        const invalidChoices = answerArray.filter(choice => !question.options.includes(choice));
        if (invalidChoices.length > 0) {
          return res.status(400).json({ 
            error: `Invalid choices for ${question.label}`,
            field: question.questionKey
          });
        }
      }
    }

    // Prepare Airtable fields
    const airtableFields = {};
    for (const question of form.questions) {
      const answer = answers[question.questionKey];
      if (answer !== undefined && answer !== null) {
        airtableFields[question.airtableFieldId] = answer;
      }
    }

    // Create record in Airtable
    const airtableResponse = await createRecord(
      user.accessToken,
      form.airtableBaseId,
      form.airtableTableId,
      airtableFields
    );

    const airtableRecordId = airtableResponse.records[0].id;

    // Save response in MongoDB
    const response = new Response({
      formId: form._id,
      airtableRecordId,
      answers
    });

    await response.save();

    res.status(201).json({
      responseId: response._id,
      airtableRecordId,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    console.error('Form submission error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to submit form', details: error.message });
  }
});

/**
 * Get all responses for a form
 */
router.get('/:formId/responses', requireAuth, async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check if user owns the form
    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const responses = await Response.find({ 
      formId: form._id,
      deletedInAirtable: false 
    }).sort({ createdAt: -1 });

    // Format responses for display
    const formattedResponses = responses.map(response => ({
      id: response._id,
      airtableRecordId: response.airtableRecordId,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      status: response.deletedInAirtable ? 'deleted' : 'active',
      answers: response.answers
    }));

    res.json(formattedResponses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get form with conditional logic evaluation
 * This endpoint can be used to get visible questions based on current answers
 */
router.post('/:formId/evaluate', async (req, res) => {
  try {
    const { formId } = req.params;
    const { answersSoFar = {} } = req.body;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Evaluate which questions should be shown
    const visibleQuestions = form.questions.filter(question => {
      return shouldShowQuestion(question.conditionalRules, answersSoFar);
    });

    res.json({
      formId: form._id,
      formName: form.formName,
      visibleQuestions,
      allQuestions: form.questions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

