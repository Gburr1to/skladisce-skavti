var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var articleSchema = new Schema({
	'name' : String,
	'description' : String,
	'qr' : String,
	'picture' : String
});

module.exports = mongoose.model('article', articleSchema);
