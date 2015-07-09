var fs = require('fs');
var config = require('../configs/' + process.argv[2]);

function log(s)
{
	console.log(s);
	fs.appendFile('logs/' + config.logFile, s + '\r\n', encoding='utf8', function (err) { } );
}

exports.log = log;