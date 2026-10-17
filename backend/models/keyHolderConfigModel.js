const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Configuration model for KeyHolders management security settings.
 * Stores administrator password, recovery email and temporary reset verification codes.
 */
const keyHolderConfigSchema = new Schema({
    password: {
        type: String,
        default: ''
    },
    recoveryEmail: {
        type: String,
        default: '',
        trim: true,
        lowercase: true
    },
    isConfigured: {
        type: Boolean,
        default: false
    },
    resetCode: {
        type: String,
        default: null
    },
    resetCodeExpiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('keyHolderConfig', keyHolderConfigSchema);
