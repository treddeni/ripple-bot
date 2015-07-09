function formatTimestamp(d)
{
    return ((d.getDate() < 10) ? "0" : "" ) + d.getDate() + "/" + (((d.getMonth()+1) < 10) ? "0" : "") + (d.getMonth()+1) + "/" + d.getFullYear() + " " +
    	   ((d.getHours() < 10)? "0" : "") + d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "") + d.getMinutes() + ":" + ((d.getSeconds() < 10) ? "0" : "") + d.getSeconds();
}

function formatDateTimeForFilename(d)
{
    var time = d.toTimeString().split(':').join('_').substr(0, 8);
    return getDate('dd_mm_yyyy', d) + '_' + time;
}

function getDate (mode, userdate)
{
    var dte = userdate;
    var d = dte.getDate().toString();
    var m = (dte.getMonth() + 1).toString();
    var yyyy = dte.getFullYear().toString();
    var dd = (d.length < 2) ? '0' + d : d;
    var mm = (m.length < 2) ? '0' + m : m;
    var yy = yyyy.substring(2, 4);

	return yyyy + '_' + mm + '_' + dd;
}

//exports.formatTimestamp = formatTimestamp;