const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { 
        type: String, 
        required: [true, 'Uporabniško ime je obvezno'],
        unique: true 
    },
    password: { 
        type: String, 
        required: [true, 'Geslo je obvezno'] 
    },
    email: {
        type: String,
        default: ''
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

module.exports = mongoose.model('User', userSchema);
