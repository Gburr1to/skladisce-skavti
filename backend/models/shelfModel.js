var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var shelfSchema = new Schema({
	'name' : String,
	'location' : String,
	'picture' : String,
	'articles': [
		{
			_id:
		}
	]
});

module.exports = mongoose.model('shelf', shelfSchema);
