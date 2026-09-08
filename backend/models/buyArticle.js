const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const buyArticleSchema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Naziv artikla za nakup je obvezen'] 
    },
    person: { 
        type: String, 
        default: '' // Plaintext ime osebe, ki predlaga ali kupuje
    },
    isPurchased: { 
        type: Boolean, 
        default: false 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('buyArticle', buyArticleSchema);
