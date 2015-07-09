
function getIssuer(issuerName)
{
	switch(issuerName)
	{
		case 'bitstamp':
			return 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B';
		case 'snapswap':
			return 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q';
		case 'ripplemarketjapan':
			return 'rJRi8WW24gt9X85PHAxfWNPCizMMhqUQwg';
		case 'rippletradejapan':
			return 'rMAz5ZnK73nyNUL4foAvaxdreczCkG3vA6';
		default:
			return 'error';
	}
}

exports.getIssuer = getIssuer;