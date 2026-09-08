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
    picture: { 
        type: String, 
        default: '' 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', userSchema);
