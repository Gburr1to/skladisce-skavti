const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Model for physical warehouse key holders.
 */
const keyHolderSchema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Ime imetnika ključa je obvezno'],
        trim: true
    },
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: 'warehouse',
        default: null
    },
    note: {
        type: String,
        default: '',
        trim: true
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('keyHolder', keyHolderSchema);
