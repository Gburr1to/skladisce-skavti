const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Model za posamezno lokacijo skladišča
 */
const warehouseSchema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Ime skladišča je obvezno'],
        trim: true
    },
    location: { 
        type: String, 
        default: '',
        trim: true
    },
    description: { 
        type: String, 
        default: '',
        trim: true
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('warehouse', warehouseSchema);
