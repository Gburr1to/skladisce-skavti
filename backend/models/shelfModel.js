const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shelfSchema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Ime police je obvezno'] 
    },
    description: { 
        type: String, 
        default: '' 
    },
    location: { 
        type: String, 
        default: '' 
    },
    picture: { 
        type: String, 
        default: '' 
    },
    closet: { 
        type: Schema.Types.ObjectId, 
        ref: 'closet',
        default: null
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('shelf', shelfSchema);
