var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var closetSchema = new Schema({
	'name' : String,
	'location' : String,
	'picture' : String
});

module.exports = mongoose.model('closet', closetSchema);
