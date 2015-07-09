var Remote = require('ripple-lib').Remote;
var Amount = require('ripple-lib').Amount;
var Seed = require('ripple-lib').Seed;

var eventManager = require('./eventManager');
var login = require('./login');
var logger = require('./logger');

var issuer1Balance = 0.0;
var issuer2Balance = 0.0;
var xrpBalance = 0.0;

var issuer1BalanceFlag = false;
var issuer2BalanceFlag = false;
var xrpBalanceFlag = false;

var issuer1;
var issuer2;
var currency;

var remote = new Remote({
	trusted:        true,
	local_signing:  true,
	servers: [{ host: 's1.ripple.com', port: 443, secure: true}]
});

remote.on('error', function(err) { logger.log('account.js remote.on error'); logger.log(err); });

var remoteOffers = new Remote({
	trusted:        true,
	local_signing:  true,
	servers: [{ host: 's1.ripple.com', port: 443, secure: true}]
});

remoteOffers.on('error', function(err) { logger.log(err); });

function checkForBalancesFinished()
{
	if(issuer1BalanceFlag && issuer2BalanceFlag && xrpBalanceFlag)
	{
		eventManager.emitter.emit('requestBalancesComplete', issuer1Balance, issuer2Balance, xrpBalance);
		remote.disconnect();
	}
}

eventManager.emitter.on('issuer1BalanceReceived', function() { issuer1BalanceFlag = true; checkForBalancesFinished(); });
eventManager.emitter.on('issuer2BalanceReceived', function() { issuer2BalanceFlag = true; checkForBalancesFinished(); });
eventManager.emitter.on('xrpBalanceReceived', function() { xrpBalanceFlag = true; checkForBalancesFinished(); });

function getBalances(data)
{
	for(var i = 0; i < data.lines.length; i++)
	{
		if(data.lines[i].account == issuer1 && data.lines[i].currency == currency)
		{
			issuer1Balance = Number(data.lines[i].balance);
			eventManager.emitter.emit('issuer1BalanceReceived', issuer1Balance);
		}
		if(data.lines[i].account == issuer2 && data.lines[i].currency == currency)
		{
			issuer2Balance = Number(data.lines[i].balance);
			eventManager.emitter.emit('issuer2BalanceReceived', issuer2Balance);
		}
	}
}

function getXRPBalance(data)
{
	xrpBalance = Number(data.account_data.Balance) / 1000000.0;
	eventManager.emitter.emit('xrpBalanceReceived', xrpBalance);
}

function onError(){ remote.disconnect(); }

function requestBalances(curr, issuer_1, issuer_2)
{
	issuer1BalanceFlag = false;
	issuer2BalanceFlag = false;
	xrpBalanceFlag = false;

	issuer1 = issuer_1;
	issuer2 = issuer_2;
	currency = curr;

	remote.connect(function()
	{
		remote.set_secret(login.address, login.secret);

		var balancesRequest = remote.request_account_lines({ account: login.address});
		balancesRequest.on('success', getBalances);
		balancesRequest.on('error', onError);
		balancesRequest.request();

		var xrpRequest = remote.request_account_info({ account: login.address});
		xrpRequest.on('success', getXRPBalance);
		xrpRequest.on('error', onError);
		xrpRequest.request();
	});
}

function readOffers(data)
{
	offers = data.offers;
	if(data.offers.length < 1)
	{
		eventManager.emitter.emit('noOpenOffers');
	}
	remoteOffers.disconnect();
}

function checkOffers()
{
	remoteOffers.connect(function()
	{
		remoteOffers.set_secret(login.address, login.secret);

		var offersRequest = remoteOffers.request_account_offers({ account: login.address});
		offersRequest.on('success', readOffers);
		offersRequest.on('error', function(err) { logger.log(err); });
		offersRequest.request();
	});
}

exports.requestBalances = requestBalances;
exports.checkOffers = checkOffers;