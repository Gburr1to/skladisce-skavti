const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const keyHolderSchema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Ime imetnika ključa je obvezno'],
        unique: true 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('keyHolder', keyHolderSchema);
