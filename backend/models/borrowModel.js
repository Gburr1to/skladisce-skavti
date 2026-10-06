const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Model za beleženje izposoje artiklov.
 * Direktna referenca na ID artikla s števcem izposojene količine.
 */
const borrowSchema = new Schema({
    article: { 
        type: Schema.Types.ObjectId, 
        ref: 'article', 
        required: [true, 'Referenca na artikel je obvezna'] 
    },
    articleName: {
        type: String,
        default: ''
    },
    quantity: { 
        type: Number, 
        required: [true, 'Količina je obvezna'],
        min: [1, 'Količina mora biti vsaj 1'],
        default: 1 
    },
    person: { 
        type: String, 
        required: [true, 'Ime prevzemnika je obvezno'],
        trim: true
    },
    purpose: { 
        type: String, 
        default: '',
        trim: true
    },
    borrowDate: { 
        type: Date, 
        default: Date.now 
    },
    returnDate: { 
        type: Date,
        default: null
    },
    status: { 
        type: String, 
        enum: ['active', 'returned'], 
        default: 'active' 
    },
    returnedAt: { 
        type: Date,
        default: null
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('borrow', borrowSchema);
