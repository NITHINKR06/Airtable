const mongoose = require('mongoose');

// Condition schema for conditional logic
const conditionSchema = new mongoose.Schema({
    questionKey: {
        type: String,
        required: true
    },
    operator: {
        type: String,
        enum: ['equals', 'notEquals', 'contains'],
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { _id: false });

// Conditional rules schema
const conditionalRulesSchema = new mongoose.Schema({
    logic: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'AND'
    },
    conditions: [conditionSchema]
}, { _id: false });

// Question schema
const questionSchema = new mongoose.Schema({
    questionKey: {
        type: String,
        required: true
    },
    airtableFieldId: {
        type: String,
        required: true
    },
    airtableFieldName: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelects', 'multipleAttachments'],
        required: true
    },
    options: {
        type: [String],
        default: []
    },
    required: {
        type: Boolean,
        default: false
    },
    conditionalRules: {
        type: conditionalRulesSchema,
        default: null
    }
}, { _id: false });

// Main Form schema
const formSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    airtableBaseId: {
        type: String,
        required: true
    },
    airtableBaseName: {
        type: String,
        default: ''
    },
    airtableTableId: {
        type: String,
        required: true
    },
    airtableTableName: {
        type: String,
        default: ''
    },
    questions: [questionSchema],
    isPublished: {
        type: Boolean,
        default: false
    },
    webhookId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster lookups
formSchema.index({ owner: 1, createdAt: -1 });
formSchema.index({ airtableBaseId: 1, airtableTableId: 1 });

const Form = mongoose.model('Form', formSchema);

module.exports = Form;
