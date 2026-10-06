const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Configuration model for KeyHolders management security settings.
 * Stores administrator password and recovery email.
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('keyHolderConfig', keyHolderConfigSchema);
