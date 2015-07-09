var issuers = require('../src/issuers');

var makeTrades = true;							//if false, then no trades will be placed, but it will show the trades that would have been made

var issuer_1 		= 'bitstamp';
var issuer_2 		= 'snapswap';
var currency 		= 'USD';
var minTradeSize	= 2.00;  					//in specified currency
var maxTradeSize 	= 5.0;   					//as a percentage of the total balance at both issuers
var epsilon 		= 0.001;					//in XRP
var tradeSizeCap	= 30.0;						//hard cap on the max amount that can be traded at one time, in specified currency

var minOfferSize	= 0.0001;					//offers smaller than this will be ignored, in specified currency (used to filter bad offers out)

//Currently, you must have 9 balance bins and 10 profit thresholds
var balanceBins		= [   0.1, 0.2,  0.3,  0.4,  0.5,  0.6, 0.7, 0.8, 0.9  ];
var forwardProfit  	= [0.01, 0.02, 0.05, 0.05, 0.05, 0.05, 0.1, 0.1, 0.2, 1.0];	//in %
var backwardProfit  = [0.01, 0.02, 0.05, 0.05, 0.05, 0.05, 0.1, 0.1, 0.2, 1.0];	//in %

var logFile = 'crossIssuerBitstampSnapswap.txt';

var issuer1 = issuers.getIssuer(issuer_1);
var issuer2 = issuers.getIssuer(issuer_2);

exports.issuer1 = issuer1;
exports.issuer2 = issuer2;
exports.currency = currency;
exports.minTradeSize = minTradeSize;
exports.maxTradeSize = maxTradeSize;
exports.epsilon = epsilon;
exports.balanceBins = balanceBins;
exports.forwardProfit = forwardProfit;
exports.backwardProfit = backwardProfit;
exports.logFile = logFile;
exports.minOfferSize = minOfferSize;
exports.tradeSizeCap = tradeSizeCap;
exports.makeTrades = makeTrades;


