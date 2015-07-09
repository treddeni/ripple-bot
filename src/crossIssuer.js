var Remote = require('ripple-lib').Remote;
var Amount = require('ripple-lib').Amount;
var Seed = require('ripple-lib').Seed;

var offerbook = require('./offerbook');
var eventManager = require('./eventManager');
var account = require('./account');
var login = require('./login');
var utils = require('../public/javascripts/utils');
var config = require('../configs/' + process.argv[2]);
var logger = require('./logger');

var lockout = false;
var lockoutCount = 0;
var deadCount = 0;

var issuer1Balance = null;
var issuer2Balance = null;
var xrpBalance = null;

var forwardProfit = null;
var backwardProfit = null;

var previousSnapshot =
{
    populate : function(snapshot)
    {
		this.maxIssuer1Bid = snapshot.maxIssuer1Bid;
		this.minIssuer1Ask = snapshot.minIssuer1Ask;
		this.maxIssuer2Bid = snapshot.maxIssuer2Bid;
		this.minIssuer2Ask = snapshot.minIssuer2Ask;
		this.maxIssuer1BidOfferTakerPays = snapshot.maxIssuer1BidOfferTakerPays;
		this.maxIssuer2BidOfferTakerPays = snapshot.maxIssuer2BidOfferTakerPays;
		this.minIssuer1AskOfferTakerGets = snapshot.minIssuer1AskOfferTakerGets;
		this.minIssuer2AskOfferTakerGets = snapshot.minIssuer2AskOfferTakerGets;
	}
};

var newSnapshot =
{
	maxIssuer1Bid : null,
	minIssuer1Ask : null,
	maxIssuer2Bid : null,
	minIssuer2Ask : null,
	maxIssuer1BidOfferTakerPays : null,
	maxIssuer2BidOfferTakerPays : null,
	minIssuer1AskOfferTakerGets : null,
    minIssuer2AskOfferTakerGets : null,
    isReady : function()
    {
		if( newSnapshot.maxIssuer1Bid != null &&
			newSnapshot.minIssuer1Ask != null &&
			newSnapshot.maxIssuer2Bid != null &&
			newSnapshot.minIssuer2Ask != null &&
			newSnapshot.maxIssuer1BidOfferTakerPays != null &&
			newSnapshot.maxIssuer2BidOfferTakerPays != null &&
			newSnapshot.minIssuer1AskOfferTakerGets != null &&
			newSnapshot.minIssuer2AskOfferTakerGets != null)
		{
			return true;
		}
		else
		{
			return false;
		}
	},
	clear : function()
	{
		newSnapshot.maxIssuer1Bid = null;
		newSnapshot.minIssuer1Ask = null;
		newSnapshot.maxIssuer2Bid = null;
		newSnapshot.minIssuer2Ask = null;
		newSnapshot.maxIssuer1BidOfferTakerPays = null;
		newSnapshot.maxIssuer2BidOfferTakerPays = null;
		newSnapshot.minIssuer1AskOfferTakerGets = null;
    	newSnapshot.minIssuer2AskOfferTakerGets = null;
	}
};

function createOffers(issuer1, rate1, amount1, issuer2, rate2, amount2)
{
	var buy_string1;
	var sell_string1;
	var buy_string2;
	var sell_string2;
	var pays1;
	var gets1;
	var pays2;
	var gets2;
	var tx1_submitted = false;
	var tx2_submitted = false;

	pays1 = amount1;
	gets1 = amount1 * rate1;
	buy_string1 = pays1 + '/' + config.currency + '/' + issuer1;
	sell_string1 = Amount.from_human(gets1 + 'XRP');

	pays2 = amount2 * rate2;
	gets2 = amount2;
	buy_string2 = Amount.from_human(pays2 + 'XRP');
	sell_string2 = gets2 + '/' + config.currency + '/' + issuer2;

	var remote = new Remote({
		//trace:			true,
		trusted:        true,
		local_signing:  true,
		local_fee:      true,
		fee_cushion:     1.5,
		servers: [{host: 's1.ripple.com', port: 443, secure: true}]
	});

	remote.connect(function()
	{
		remote.set_secret(login.address, login.secret);

		var transaction1 = remote.transaction();

		transaction1.setFlags(0x80020000);  //immediate/cancel and fully canonical
		transaction1.offer_create({from: login.address, buy: buy_string1, sell: sell_string1 });

		transaction1.on('resubmitted', function() { logger.log('resubmitting offer 1'); });

		transaction1.submit(function(err, res)
		{
			logger.log('submitting offer');

			if(err)
			{
				logger.log('error');
				//throw err;
			}
			else
			{
				logger.log('success');
			}

			tx1_submitted = true;
			if(tx2_submitted == true) { remote.disconnect(); }
		});

		var transaction2 = remote.transaction();

		transaction2.setFlags(0x80020000);  //immediate/cancel and fully canonical
		transaction2.offer_create({from: login.address, buy: buy_string2, sell: sell_string2 });

		transaction2.on('resubmitted', function() { logger.log('resubmitting offer 2'); });

		transaction2.submit(function(err, res)
		{
			logger.log('submitting offer');

			if(err)
			{
				logger.log('error');
			}
			else
			{
				logger.log('success');
			}

			tx2_submitted = true;
			if(tx1_submitted == true) { remote.disconnect(); }
		});
	});
}

function makeForwardTrade(amount, s)
{
	var tradeSize = amount;

	if(tradeSize > s.minIssuer1AskOfferTakerGets)
	{
		tradeSize = s.minIssuer1AskOfferTakerGets;
	}

	if(tradeSize > s.maxIssuer2BidOfferTakerPays)
	{
		tradeSize = s.maxIssuer2BidOfferTakerPays;
	}

	var rate1 = s.minIssuer1Ask + config.epsilon;
	var rate2 = s.maxIssuer2Bid - config.epsilon;

	if(tradeSize > config.minTradeSize && tradeSize < config.tradeSizeCap && lockout == false)
	{
		lockout = true;

		if(config.makeTrades)
		{
			createOffers(config.issuer1, rate1, tradeSize, config.issuer2, rate2, tradeSize);
		}
		eventManager.emitter.emit('trade', tradeSize, rate1, rate2);
		logger.log('make forward trade buy issuer 1 at ' + rate1 + '  sell issuer 2 at ' + rate2 + '  tradeSize: ' + tradeSize);
	}
}

function makeBackwardTrade(amount, s)
{
	var tradeSize = amount;

	if(tradeSize > s.minIssuer2AskOfferTakerGets)
	{
		tradeSize = s.minIssuer2AskOfferTakerGets;
	}

	if(tradeSize > s.maxIssuer1BidOfferTakerPays)
	{
		tradeSize = s.maxIssuer1BidOfferTakerPays;
	}

	var rate1 = s.maxIssuer1Bid - config.epsilon;
	var rate2 = s.minIssuer2Ask + config.epsilon;

	if(tradeSize > config.minTradeSize && tradeSize < config.tradeSizeCap && lockout == false)
	{
		lockout = true;

		if(config.makeTrades)
		{
			createOffers(config.issuer2, rate2, tradeSize, config.issuer1, rate1, tradeSize);
		}
		eventManager.emitter.emit('trade', tradeSize, rate1, rate2);
		logger.log('make backward trade buy issuer 2 at ' + rate2 + '  sell issuer 1 at ' + rate1 + '  tradeSize: ' + tradeSize);
	}
}

function getMaxIssuer1Bid() { return previousSnapshot.maxIssuer1Bid; }
function getMinIssuer1Ask() { return previousSnapshot.minIssuer1Ask; }
function getMaxIssuer2Bid() { return previousSnapshot.maxIssuer2Bid; }
function getMinIssuer2Ask() { return previousSnapshot.minIssuer2Ask; }

eventManager.emitter.on('requestBalancesComplete', function(issuer1Bal, issuer2Bal, xrpBal)
{
	eventManager.emitter.emit('balances', issuer1Bal, issuer2Bal, xrpBal);

	issuer1Balance = issuer1Bal;
	issuer2Balance = issuer2Bal;
	xrpBalance = xrpBal;
});

eventManager.emitter.on('requestBidsAsksComplete', function(max1Bid, min1Ask, max2Bid, min2Ask, max1BidPays, max2BidPays, min1AskGets, min2AskGets)
{
	eventManager.emitter.emit('spreads', max1Bid, min1Ask, max2Bid, min2Ask);

	newSnapshot.maxIssuer1Bid = max1Bid;
	newSnapshot.minIssuer1Ask = min1Ask;
	newSnapshot.maxIssuer2Bid = max2Bid;
	newSnapshot.minIssuer2Ask = min2Ask;
	newSnapshot.maxIssuer1BidOfferTakerPays = max1BidPays;
	newSnapshot.maxIssuer2BidOfferTakerPays = max2BidPays;
	newSnapshot.minIssuer1AskOfferTakerGets = min1AskGets;
	newSnapshot.minIssuer2AskOfferTakerGets = min2AskGets;

	if(newSnapshot.isReady() && xrpBalance != null)
	{
		previousSnapshot.populate(newSnapshot);
		newSnapshot.clear();
		evaluateTradePotential(previousSnapshot);
	}
});

account.requestBalances(config.currency, config.issuer1, config.issuer2);
offerbook.requestBidsAsks(config.currency, config.issuer1, config.issuer2);

function start()
{
	setInterval(function()
	{
		try
		{
			account.requestBalances(config.currency, config.issuer1, config.issuer2);

			if(lockout == true)
			{
				lockoutCount++;

				if(lockoutCount > 3)	//a 3 cycle timeout after making a trade
				{
					lockoutCount = 0;
					lockout = false;
				}
			}
		}
		catch(err)
		{
			logger.log(err.stack);
		}
	}, 4000);
}

function isSnapshotValid(s)
{
	return s.minIssuer1Ask > s.maxIssuer1Bid && s.minIssuer2Ask > s.maxIssuer2Bid;
}

function evaluateTradePotential(s)
{
	var profit = 0.0;
	var balance = issuer1Balance / (issuer1Balance + issuer2Balance);
	var tradeSize = (config.maxTradeSize / 100.0) * (issuer1Balance + issuer2Balance);

	forwardProfit = 100.0 * (s.maxIssuer2Bid - s.minIssuer1Ask) / s.minIssuer1Ask;
	backwardProfit = -100.0 * (s.minIssuer2Ask - s.maxIssuer1Bid) / s.minIssuer2Ask;

	eventManager.emitter.emit('profits', forwardProfit, backwardProfit);

	if(s.minIssuer1Ask < s.maxIssuer2Bid)
	{
		profit = 100.0 * (s.maxIssuer2Bid - s.minIssuer1Ask) / s.minIssuer1Ask;
	}
	else if(s.minIssuer2Ask < s.maxIssuer1Bid)
	{
		profit = 100.0 * (s.minIssuer2Ask - s.maxIssuer1Bid) / s.minIssuer2Ask;
	}

	var status = utils.formatTimestamp(new Date()) + '  ' + s.maxIssuer1Bid.toFixed(2) + '  ' + s.minIssuer1Ask.toFixed(2) + '  ' + s.maxIssuer2Bid.toFixed(2) + '  ' + s.minIssuer2Ask.toFixed(2) + '  bal: ' + balance.toFixed(2) + '  profit: ' + profit.toFixed(3) + '%';
	logger.log(status);

	if(lockout == false && isSnapshotValid(s))
	{
		if(balance > config.balanceBins[8])
		{
			if(profit > config.forwardProfit[9])
			{
				if(tradeSize > issuer2Balance)
				{
					tradeSize = issuer2Balance;
				}
				makeForwardTrade(tradeSize, s);
			}
			else if(profit < (-1.0 * config.backwardProfit[0]))
			{
				makeBackwardTrade(tradeSize, s);
			}
		}
		else if(balance <= config.balanceBins[8] && balance > config.balanceBins[7])
		{
			if(profit > config.forwardProfit[8])
			{
				makeForwardTrade(tradeSize, s);
			}
			else if(profit < (-1.0 * config.backwardProfit[1]))
			{
				makeBackwardTrade(tradeSize, s);
			}
		}
		else if(balance <= config.balanceBins[7] && balance > config.balanceBins[6])
		{
			if(profit > config.forwardProfit[7])
			{
				makeForwardTrade(tradeSize, s);
			}
			else if(profit < (-1.0 * config.backwardProfit[2]))
			{
				makeBackwardTrade(tradeSize, s);
			}
		}
		else if(balance <= config.balanceBins[6] && balance > config.balanceBins[5])
		{
			if(profit > config.forwardProfit[6])
			{
				makeForwardTrade(tradeSize, s);
			}
			else if(profit < (-1.0 * config.backwardProfit[3]))
			{
				makeBackwardTrade(tradeSize, s);
			}
		}
		else if(balance <= config.balanceBins[5] && balance > config.balanceBins[4])
		{
			if(profit > config.forwardProfit[5])
			{
				makeForwardTrade(tradeSize, s);
			}
			else if(profit < (-1.0 * config.backwardProfit[4]))
			{
				makeBackwardTrade(tradeSize, s);
			}
		}
		else if(balance <= config.balanceBins[4] && balance > config.balanceBins[3])
		{
			if(profit < (-1.0 * config.backwardProfit[5]))
			{
				makeBackwardTrade(tradeSize, s);
			}
			else if(profit > config.forwardProfit[4])
			{
				makeForwardTrade(tradeSize, s);
			}
		}
		else if(balance <= config.balanceBins[3] && balance > config.balanceBins[2])
		{
			if(profit < (-1.0 * config.backwardProfit[6]))
			{
				makeBackwardTrade(tradeSize, s);
			}
			else if(profit > config.forwardProfit[3])
			{
				makeForwardTrade(tradeSize, s);
			}
		}
		else if(balance <= config.balanceBins[2] && balance > config.balanceBins[1])
		{
			if(profit < (-1.0 * config.backwardProfit[7]))
			{
				makeBackwardTrade(tradeSize, s);
			}
			else if(profit > config.forwardProfit[2])
			{
				makeForwardTrade(tradeSize, s);
			}
		}
		else if(balance <= config.balanceBins[1] && balance > config.balanceBins[0])
		{
			if(profit < (-1.0 * config.backwardProfit[8]))
			{
				makeBackwardTrade(tradeSize, s);
			}
			else if(profit > config.forwardProfit[1])
			{
				makeForwardTrade(tradeSize, s);
			}
		}
		else if(balance < config.balanceBins[0])
		{
			if(profit < (-1.0 * config.backwardProfit[9]))
			{
				if(tradeSize > issuer1Balance)
				{
					tradeSize = issuer1Balance;
				}
				makeBackwardTrade(tradeSize, s);
			}
			else if(profit > config.forwardProfit[0])
			{
				makeForwardTrade(tradeSize, s);
			}
		}
	}
}

exports.start = start;
exports.getMaxIssuer1Bid = getMaxIssuer1Bid;
exports.getMinIssuer1Ask = getMinIssuer1Ask;
exports.getMaxIssuer2Bid = getMaxIssuer2Bid;
exports.getMinIssuer2Ask = getMinIssuer2Ask;


