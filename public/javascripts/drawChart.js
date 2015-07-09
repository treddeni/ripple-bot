function drawChart(issuer1BidData, issuer1AskData, issuer2BidData, issuer2AskData)
{
	var dataTable = new google.visualization.DataTable();
	dataTable.addColumn('number', 'Volume');
	dataTable.addColumn('number', 'Issuer 1');
	dataTable.addColumn('number', 'Issuer 2');

	if(issuer1AskData != null)
	{
		for(var i = issuer1AskData.length-1; i > 0; i = i - 2)
		{
			dataTable.addRow([issuer1AskData[i-1], issuer1AskData[i], null]);
		}

		dataTable.addRow([issuer1AskData[0], 0, null]);
	}

	if(issuer1BidData != null)
	{
		dataTable.addRow([issuer1BidData[0], 0, null]);

		for(var i = 0; i < issuer1BidData.length; i = i + 2)
		{
			dataTable.addRow([issuer1BidData[i], issuer1BidData[i+1], null]);
		}
	}

	if(issuer2AskData != null)
	{
		for(var i = issuer2AskData.length-1; i > 0; i = i - 2)
		{
			dataTable.addRow([issuer2AskData[i-1], null, issuer2AskData[i]]);
		}

		dataTable.addRow([issuer2AskData[0], null, 0]);
	}

	if(issuer2BidData != null)
	{
		dataTable.addRow([issuer2BidData[0], null, 0]);

		for(var i = 0; i < issuer2BidData.length; i = i + 2)
		{
			dataTable.addRow([issuer2BidData[i], null, issuer2BidData[i+1]]);
		}
	}

	var chart;
	if(document.getElementById('hmin').value == '' || document.getElementById('hmax').value == '' || document.getElementById('vmin').value == '' || document.getElementById('vmax').value == '')
	{
		chart = new google.visualization.ChartWrapper({chartType: 'LineChart', containerId: 'offerChart', dataTable: dataTable, options: {
			  legend: {position: 'none'},
			  colors: ['#FF0000', '#0000FF'],
			  chartArea: {backgroundColor: '#000000', left: 0, top: 0, width: '100%', height: '100%'},
			  vAxis: { gridlines: { color: 'transparent' }, textPosition: 'in', textStyle: { color: 'white' } },
			  hAxis: { gridlines: { color: 'transparent' }, textPosition: 'in', textStyle: { color: 'white' } },
			  backgroundColor: '#00FF00'
			}
			});
	}
	else
	{
		var hmin = Number(document.getElementById('hmin').value);
		var hmax = Number(document.getElementById('hmax').value);
		var vmin = Number(document.getElementById('vmin').value);
		var vmax = Number(document.getElementById('vmax').value);

		chart = new google.visualization.ChartWrapper({chartType: 'LineChart', containerId: 'offerChart', dataTable: dataTable, options: {
			  legend: {position: 'none'},
			  colors: ['#FF0000', '#0000FF'],
			  chartArea: {backgroundColor: '#000000', left: 0, top: 0, width: '100%', height: '100%'},
			  vAxis: { gridlines: { color: 'transparent' }, textPosition: 'in', textStyle: { color: 'white' }, viewWindow: { min: vmin, max: vmax } },
			  hAxis: { gridlines: { color: 'transparent' }, textPosition: 'in', textStyle: { color: 'white' }, viewWindow: { min: hmin, max: hmax } },
			  backgroundColor: '#00FF00'
			}
			});
	}

	chart.draw();
}