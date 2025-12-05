const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    airtableUserId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: ''
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    tokenExpiry: {
        type: Date,
        required: true
    },
    scopes: {
        type: [String],
        default: []
    },
    loginTimestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to check if token is expired
userSchema.methods.isTokenExpired = function () {
    return new Date() >= this.tokenExpiry;
};

// Method to update tokens
userSchema.methods.updateTokens = async function (accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
