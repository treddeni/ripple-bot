var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var crossIssuer = require('./src/crossIssuer');
var offerbook = require('./src/offerbook');
var eventManager = require('./src/eventManager');

var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

process.on('uncaughtException', function(err)
{
  console.log('Caught exception: ' + err);
  crossIssuer.start();
});

crossIssuer.start();

setInterval(function()
{
	io.emit('spreads', crossIssuer.getMaxIssuer1Bid(), crossIssuer.getMinIssuer1Ask(), crossIssuer.getMaxIssuer2Bid(), crossIssuer.getMinIssuer2Ask());
	io.emit('offers', offerbook.getIssuer1BidData(), offerbook.getIssuer1AskData(), offerbook.getIssuer2BidData(), offerbook.getIssuer2AskData());
}, 2000);

eventManager.emitter.on('profits', function(forwardProfit, backwardProfit)
{
	io.emit('profits', forwardProfit, backwardProfit);
});

eventManager.emitter.on('balances', function(issuer1Balance, issuer2Balance, xrpBalance)
{
	io.emit('balances', issuer1Balance, issuer2Balance, xrpBalance);
});

eventManager.emitter.on('trade', function(tradeSize, rate1, rate2) { io.emit('trade', tradeSize, rate1, rate2); } );

eventManager.emitter.on('spreads', function(maxIssuer1Bid, minIssuer1Ask, maxIssuer2Bid, minIssuer2Ask)
{
	io.emit('spreads', maxIssuer1Bid, minIssuer1Ask, maxIssuer2Bid, minIssuer2Ask);
});

/*io.on('connection', function(socket){
  socket.on('forwardTradeButtonClick', function(size){
      crossIssuer.makeForwardTrade(size);
  });
  socket.on('backwardTradeButtonClick', function(size){
      crossIssuer.makeBackwardTrade(size);
  });
});*/

server.listen(process.argv[3]);

module.exports = app;
