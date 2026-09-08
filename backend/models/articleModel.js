const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Ime artikla je obvezno'] 
    },
    description: { 
        type: String, 
        default: '' 
    },
    shelf: { 
        type: Schema.Types.ObjectId, 
        ref: 'shelf',
        default: null
    },
    qr: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    qrImage: { 
        type: String, 
        default: '' 
    },
    picture: { 
        type: String, 
        default: '' 
    },
    quantity: { 
        type: Number, 
        default: 1 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('article', articleSchema);
