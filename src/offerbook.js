var Remote = require('ripple-lib').Remote;
var eventManager = require('./eventManager');
var logger = require('./logger');
var config = require('../configs/' + process.argv[2]);
var utils = require('../public/javascripts/utils');

var DROPS_PER_XRP = 1000000;

var maxIssuer1Bid = 0.0;
var minIssuer1Ask = 0.0;
var maxIssuer2Bid = 0.0;
var minIssuer2Ask = 0.0;

var maxIssuer1BidOfferTakerPays = 0.0;
var maxIssuer2BidOfferTakerPays = 0.0;
var minIssuer1AskOfferTakerGets = 0.0;
var minIssuer2AskOfferTakerGets = 0.0;

var issuer1BidData = [];
var issuer1AskData = [];
var issuer2BidData = [];
var issuer2AskData = [];

//this section of the code subscribes to offer book changes
var remote = new Remote({
	//trace:	true,
	trusted:        true,
	local_signing:  true,
	servers: [{
		host:    's1.ripple.com'
		, port:    443
		, secure:  true
	}]
});

function fireBookChangedEvent()
{
	eventManager.emitter.emit('requestBidsAsksComplete', maxIssuer1Bid, minIssuer1Ask, maxIssuer2Bid, minIssuer2Ask,
						  maxIssuer1BidOfferTakerPays, maxIssuer2BidOfferTakerPays, minIssuer1AskOfferTakerGets, minIssuer2AskOfferTakerGets);
}

remote.connect(function()
{
	var issuer1Bids = remote.book('XRP', null, config.currency, config.issuer1);
	var issuer1Asks = remote.book(config.currency, config.issuer1, 'XRP', null);
	var issuer2Bids = remote.book('XRP', null, config.currency, config.issuer2);
	var issuer2Asks = remote.book(config.currency, config.issuer2, 'XRP', null);

	issuer1Bids.on('model', function (offers)
	{
		if(offers.length > 0)
		{
			var maxFound = false;
			var rate;
			var size;
			var sum = 0;
			var offer;
			issuer1BidData = [];
			for(var i = 0; i < offers.length; i++)
			{
				offer = offers[i];

				if(offer.TakerGets != null && offer.TakerPays != null && offer.TakerGets > config.minOfferSize && offer.TakerPays.value > config.minOfferSize)	//filter out bad offers
				{
					rate = Number(offer.TakerGets / offer.TakerPays.value / DROPS_PER_XRP);

					if(offer.taker_pays_funded != null && offer.taker_pays_funded < offer.TakerPays.value)	//limit size to the funded size
					{
						size = Number(offer.taker_pays_funded);
					}
					else
					{
						size = Number(offer.TakerPays.value);
					}

					sum += size;
					issuer1BidData.push(rate, sum);

					if(!maxFound)
					{
						maxFound = true;
						maxIssuer1Bid = rate;
						maxIssuer1BidOfferTakerPays = size;
						maxIssuer1BidFlag = true;
						fireBookChangedEvent();
					}
				}
			}
		}
	});

	issuer1Asks.on('model', function (offers)
	{
		if(offers.length > 0)
		{
			var minFound = false;
			var rate;
			var size;
			var sum = 0;
			var offer;
			issuer1AskData = [];
			for(var i = 0; i < offers.length; i++)
			{
				offer = offers[i];

				if(offer.TakerGets != null && offer.TakerPays != null && offer.TakerPays > config.minOfferSize && offer.TakerGets.value > config.minOfferSize)	//filter out bad offers
				{
					rate = Number(offer.TakerPays / offer.TakerGets.value / DROPS_PER_XRP);

					if(offer.taker_gets_funded != null && offer.taker_gets_funded < offer.TakerGets.value)	//limit size to the funded size
					{
						size = Number(offer.taker_gets_funded);
					}
					else
					{
						size = Number(offer.TakerGets.value);
					}

					sum += size;
					issuer1AskData.push(rate, sum);

					if(!minFound)
					{
						minFound = true;
						minIssuer1Ask = rate;
						minIssuer1AskOfferTakerGets = size;
						minIssuer1AskFlag = true;
						fireBookChangedEvent();
					}
				}
			}
		}
	});

	issuer2Bids.on('model', function (offers)
	{
		if(offers.length > 0)
		{
			var maxFound = false;
			var rate;
			var size;
			var sum = 0;
			var offer;
			issuer2BidData = [];
			for(var i = 0; i < offers.length; i++)
			{
				offer = offers[i];

				if(offer.TakerGets != null && offer.TakerPays != null && offer.TakerGets > config.minOfferSize && offer.TakerPays.value > config.minOfferSize)	//filter out bad offers
				{
					rate = Number(offer.TakerGets / offer.TakerPays.value / DROPS_PER_XRP);

					if(offer.taker_pays_funded != null && offer.taker_pays_funded < offer.TakerPays.value)	//limit size to the funded size
					{
						size = Number(offer.taker_pays_funded);
					}
					else
					{
						size = Number(offer.TakerPays.value);
					}

					sum += size;
					issuer2BidData.push(rate, sum);

					if(!maxFound)
					{
						maxFound = true;
						maxIssuer2Bid = rate;
						maxIssuer2BidOfferTakerPays = size;
						maxIssuer2BidFlag = true;
						fireBookChangedEvent();
					}
				}
			}
		}
	});

	issuer2Asks.on('model', function (offers)
	{
		if(offers.length > 0)
		{
			var minFound = false;
			var rate;
			var size;
			var sum = 0;
			var offer;
			issuer2AskData = [];
			for(var i = 0; i < offers.length; i++)
			{
				offer = offers[i];

				if(offer.TakerGets != null && offer.TakerPays != null && offer.TakerPays > config.minOfferSize && offer.TakerGets.value > config.minOfferSize)	//filter out bad offers
				{
					rate = Number(offer.TakerPays / offer.TakerGets.value / DROPS_PER_XRP);

					if(offer.taker_gets_funded != null && offer.taker_gets_funded < offer.TakerGets.value)	//limit size to the funded size
					{
						size = Number(offer.taker_gets_funded);
					}
					else
					{
						size = Number(offer.TakerGets.value);
					}

					sum += size;
					issuer2AskData.push(rate, sum);

					if(!minFound)
					{
						minFound = true;
						minIssuer2Ask = rate;
						minIssuer2AskOfferTakerGets = size;
						minIssuer2AskFlag = true;
						fireBookChangedEvent();
					}
				}
			}
		}
	});
});

//the code below allows for requesting the current offer book spreads
var maxIssuer1BidFlag = false;
var minIssuer1AskFlag = false;
var maxIssuer2BidFlag = false;
var minIssuer2AskFlag = false;

var remoteIssuer1Bids = new Remote({
	trusted:        true,
	local_signing:  true,
	servers: [{host:'s1.ripple.com', port:443, secure: true}]
});

var remoteIssuer1Asks = new Remote({
	trusted:        true,
	local_signing:  true,
	servers: [{host: 's1.ripple.com', port: 443, secure: true}]
});

var remoteIssuer2Bids = new Remote({
	trusted:        true,
	local_signing:  true,
	servers: [{host: 's1.ripple.com', port: 443, secure: true}]
});

var remoteIssuer2Asks = new Remote({
	trusted:        true,
	local_signing:  true,
	servers: [{host: 's1.ripple.com', port: 443, secure: true}]
});

function requestBidsAsks(currency, issuer1, issuer2)
{
	maxIssuer1BidFlag = false;
	minIssuer1AskFlag = false;
	maxIssuer2BidFlag = false;
	minIssuer2AskFlag = false;
	getIssuer1Bids(currency, issuer1);
	getIssuer1Asks(currency, issuer1);
	getIssuer2Bids(currency, issuer2);
	getIssuer2Asks(currency, issuer2);
}

function checkForFinish()
{
	if(maxIssuer1BidFlag && minIssuer1AskFlag && maxIssuer2BidFlag && minIssuer2AskFlag)
	{
		eventManager.emitter.emit('requestBidsAsksComplete', maxIssuer1Bid, minIssuer1Ask, maxIssuer2Bid, minIssuer2Ask,
								  maxIssuer1BidOfferTakerPays, maxIssuer2BidOfferTakerPays, minIssuer1AskOfferTakerGets, minIssuer2AskOfferTakerGets);
	}
}

eventManager.emitter.on('maxIssuer1BidReceived', function() { maxIssuer1BidFlag = true; checkForFinish(); });
eventManager.emitter.on('minIssuer1AskReceived', function() { minIssuer1AskFlag = true; checkForFinish(); });
eventManager.emitter.on('maxIssuer2BidReceived', function() { maxIssuer2BidFlag = true; checkForFinish(); });
eventManager.emitter.on('minIssuer2AskReceived', function() { minIssuer2AskFlag = true; checkForFinish(); });

function processIssuer1Bids(data)
{
	var minBid = Number.MAX_VALUE;

	for (var i = 0; i < data.offers.length; i++)
	{
		if(data.offers[i].quality < minBid)
		{
			minBid = Number(data.offers[i].quality);
			maxIssuer1BidOfferTakerPays = data.offers[i].TakerPays.value;
		}
	}

	maxIssuer1Bid = (1 / minBid) / 1000000;
	remoteIssuer1Bids.disconnect();
	eventManager.emitter.emit('maxIssuer1BidReceived', maxIssuer1Bid);
}

function processIssuer1Asks(data)
{
	var minAsk = Number.MAX_VALUE;

	for (var i = 0; i < data.offers.length; i++)
	{
		if(data.offers[i].quality < minAsk)
		{
			minAsk = Number(data.offers[i].quality);
			minIssuer1AskOfferTakerGets = data.offers[i].TakerGets.value;
		}
	}

	minIssuer1Ask = minAsk / 1000000;
	remoteIssuer1Asks.disconnect();
	eventManager.emitter.emit('minIssuer1AskReceived', minIssuer1Ask);
}

function processIssuer2Bids(data)
{
	var minBid = Number.MAX_VALUE;

	for (var i = 0; i < data.offers.length; i++)
	{
		if(data.offers[i].quality < minBid)
		{
			minBid = Number(data.offers[i].quality);
			maxIssuer2BidOfferTakerPays = data.offers[i].TakerPays.value;
		}
	}

	maxIssuer2Bid = (1 / minBid) / 1000000;
	remoteIssuer2Bids.disconnect();
	eventManager.emitter.emit('maxIssuer2BidReceived', maxIssuer2Bid);
}

function processIssuer2Asks(data)
{
	var minAsk = Number.MAX_VALUE;

	for (var i = 0; i < data.offers.length; i++)
	{
		if(data.offers[i].quality < minAsk)
		{
			minAsk = Number(data.offers[i].quality);
			minIssuer2AskOfferTakerGets = data.offers[i].TakerGets.value;
		}
	}

	minIssuer2Ask = minAsk / 1000000;
	remoteIssuer2Asks.disconnect();
	eventManager.emitter.emit('minIssuer2AskReceived', minIssuer2Ask);
}

function getIssuer1Bids(currency, issuer)
{
	remoteIssuer1Bids.connect(function()
	{
		var bidsRequest = remoteIssuer1Bids.request_book_offers(
		{
			gets: { 'currency':'XRP' },
			pays: { 'currency': currency, 'issuer': issuer },
			limit: 10
		});

		bidsRequest.on('success', processIssuer1Bids);
		bidsRequest.on('error', onIssuer1BidsError);

		bidsRequest.request();
	});
}

function getIssuer1Asks(currency, issuer)
{
	remoteIssuer1Asks.connect(function()
	{
		var asksRequest = remoteIssuer1Asks.request_book_offers(
		{
			gets: { 'currency': currency, 'issuer': issuer },
			pays: { 'currency':'XRP' },
			limit: 10
		});

		asksRequest.on('success', processIssuer1Asks);
		asksRequest.on('error', onIssuer1AsksError);

		asksRequest.request();
	});
}

function getIssuer2Bids(currency, issuer)
{
	remoteIssuer2Bids.connect(function()
	{
		var bidsRequest = remoteIssuer2Bids.request_book_offers(
		{
			gets: { 'currency':'XRP' },
			pays: { 'currency': currency, 'issuer': issuer },
			limit: 10
		});

		bidsRequest.on('success', processIssuer2Bids);
		bidsRequest.on('error', onIssuer2BidsError);

		bidsRequest.request();
	});
}

function getIssuer2Asks(currency, issuer)
{
	remoteIssuer2Asks.connect(function()
	{
		var asksRequest = remoteIssuer2Asks.request_book_offers(
		{
			gets: {'currency': currency, 'issuer': issuer },
			pays: { 'currency':'XRP' },
			limit: 10
		});

		asksRequest.on('success', processIssuer2Asks);
		asksRequest.on('error', onIssuer2AsksError);

		asksRequest.request();
	});
}

function onIssuer1BidsError(data){ remoteIssuer1Bids.disconnect(); }
function onIssuer1AsksError(data){ remoteIssuer1Asks.disconnect(); }
function onIssuer2BidsError(data){ remoteIssuer2Bids.disconnect(); }
function onIssuer2AsksError(data){ remoteIssuer2Asks.disconnect(); }

function getIssuer1BidData() { return issuer1BidData; }
function getIssuer1AskData() { return issuer1AskData; }
function getIssuer2BidData() { return issuer2BidData; }
function getIssuer2AskData() { return issuer2AskData; }

exports.requestBidsAsks = requestBidsAsks;
exports.getIssuer1BidData = getIssuer1BidData;
exports.getIssuer1AskData = getIssuer1AskData;
exports.getIssuer2BidData = getIssuer2BidData;
exports.getIssuer2AskData = getIssuer2AskData;

