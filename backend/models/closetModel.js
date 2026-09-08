const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const closetSchema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Ime omare je obvezno'] 
    },
    location: { 
        type: String, 
        default: '' 
    },
    picture: { 
        type: String, 
        default: '' 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('closet', closetSchema);
