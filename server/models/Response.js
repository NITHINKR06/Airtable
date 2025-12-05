const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true,
        index: true
    },
    airtableRecordId: {
        type: String,
        required: true,
        index: true
    },
    answers: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'deletedInAirtable'],
        default: 'active'
    },
    submittedBy: {
        type: String,
        default: 'anonymous'
    }
}, {
    timestamps: true
});

// Compound index for efficient lookups
responseSchema.index({ formId: 1, createdAt: -1 });
responseSchema.index({ airtableRecordId: 1 }, { unique: true });

// Virtual for formatted answers preview
responseSchema.virtual('answersPreview').get(function () {
    const answers = this.answers || {};
    const keys = Object.keys(answers).slice(0, 3);
    const preview = keys.map(key => {
        const value = answers[key];
        if (typeof value === 'string' && value.length > 50) {
            return `${key}: ${value.substring(0, 50)}...`;
        }
        if (Array.isArray(value)) {
            return `${key}: [${value.length} items]`;
        }
        return `${key}: ${value}`;
    });
    return preview.join('; ');
});

// Ensure virtuals are included in JSON output
responseSchema.set('toJSON', { virtuals: true });
responseSchema.set('toObject', { virtuals: true });

const Response = mongoose.model('Response', responseSchema);

module.exports = Response;
