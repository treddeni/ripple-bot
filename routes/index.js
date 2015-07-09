var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  var absolutePath = path.join(path.join(__dirname.substring(0, __dirname.length - 6), 'views'),'crossIssuerBot.html');
  res.sendFile(absolutePath);
});

module.exports = router;
