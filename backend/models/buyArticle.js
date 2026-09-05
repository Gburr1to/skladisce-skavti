var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var buyArticleSchema = new Schema({
	'name' : String,
	'person' : String,
	'isPurchased' : Boolean
});

module.exports = mongoose.model('buyArticle', buyArticleSchema);
