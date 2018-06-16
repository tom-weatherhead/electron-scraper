// This file is required by the index.html file and will be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const electron = require('electron');
// const remote = electron.remote;
const ipc = electron.ipcRenderer;

const matchRegexesInWebPage = require('http-get-regex-capture');

function padToTwoDigits(n) {
	let str = '' + n;
	
	if (str.length < 2) {
		str = '0' + str;
	}
	
	return str;
}

function formatUTCDateWithoutTime(date) {
    var year = date.getUTCFullYear(),
        month = padToTwoDigits(date.getUTCMonth() + 1),
        day = padToTwoDigits(date.getUTCDate());
		
	return [year, month, day].join('-');
}

function formatUTCHoursAndMinutes(date) {
	const hours = padToTwoDigits(date.getUTCHours());
	const minutes = padToTwoDigits(date.getUTCMinutes())
	
	return `${hours}:${minutes}`;
}

/*
function formatDate(date) {
    //var d = new Date(date),
    var d = date,
        year = d.getFullYear(),
        month = padToTwoDigits(d.getMonth() + 1),
        day = padToTwoDigits(d.getDate()),
		hour = padToTwoDigits(d.getHours()),
		minute = padToTwoDigits(d.getMinutes()),
		second = padToTwoDigits(d.getSeconds());
		
	return [year, month, day].join('-') + ' ' + [hour, minute, second].join(':');
}

function formatUTCDate(date) {
    const hour = padToTwoDigits(date.getUTCHours()),
		minute = padToTwoDigits(date.getUTCMinutes()),
		second = padToTwoDigits(date.getUTCSeconds());
		
	return formatUTCDateWithoutTime(date) + ' ' + [hour, minute, second].join(':');
}
*/

function ensureRegex(param) {
	const prototypeAsString = Object.prototype.toString.call(param);

	switch (prototypeAsString) {
		case '[object RegExp]':
			return param;

		case '[object String]':
			// Strip the leading and trailing slashes (if any) from param
			const match = /^\/(.*)\/$/.exec(param);
			
			if (match && match.length && match[1]) {
				param = match[1];
			}

			return new RegExp(param);

		default:
			return undefined;
	}
}

function constructSpecialTimeOfDay(match) {
	//const timeRegexMatch = match.match(/[0-9]{1,2}\:[0-9]{2}[A|P]M [A-Z]+/);
	const timeRegexMatch = /[0-9]{1,2}\:[0-9]{2}[A|P]M [A-Z]+/.exec(match);
	
	if (!timeRegexMatch || !timeRegexMatch[0]) {
		return undefined;
	}

	const now = new Date();
	const timeAsString = formatUTCDateWithoutTime(now) + ' ' + timeRegexMatch[0].replace(/BST/, 'GMT+0100').replace(/AM/, ' AM').replace(/PM/, ' PM');
	let time = new Date(timeAsString);
	
	time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
	return formatUTCHoursAndMinutes(time);
}

function sendHTTPRequest() {
	const defaultSettings = {
		url: "https://nodejs.org/en/",
		regexes: [
			/Download v{0,1}(\S+)\s+Current/
		],
		options: {
			returnHttpResponseStatus: true
		},
		stringificationTemplate: [
			"Current version of Node.js :",
			0
		]
	};

	const settings = require('./settings.json') || defaultSettings;
	//const settings = defaultSettings;

	const url = settings.url;
	const regexes = settings.regexes.map(regex => ensureRegex(regex));
	const options = settings.options;

	matchRegexesInWebPage(url, regexes, options)
		.then(result => {
			ipc.send('consoleLog', `HTTP Response status: ${result.httpResponseStatusCode} ${result.httpResponseStatusMessage}`);

			let outputText = '';
			let separator = '';
			
			settings.stringificationTemplate.forEach(st => {
				// ipc.send('consoleLog', typeof st);
				let stringToAppend;
				
				if (typeof st === 'number' && st >= 0 && st < result.regexMatchResults.length) {
					// ipc.send('consoleLog', 'st is a number');
					// ipc.send('consoleLog', st);
					// ipc.send('consoleLog', settings.specialTimeOfDayIndex);
					
					if (st === settings.specialTimeOfDayIndex) {
						// ipc.send('consoleLog', 'Calling constructSpecialTimeOfDay');
						stringToAppend = constructSpecialTimeOfDay(result.regexMatchResults[st].match);
					} else {
						stringToAppend = result.regexMatchResults[st].match.toString();
					}
				} else {
					stringToAppend = st.toString();
				}
				
				if (stringToAppend) {
					outputText = outputText + separator + stringToAppend;
				}

				separator = ' ';
			});

			document.getElementById('output').innerHTML = outputText;
		})
		.fail(error => {
			document.getElementById('output').innerHTML = 'Error.';
			ipc.send('consoleError', `${error.message || error}`);
		})
		.done();
}

sendHTTPRequest();

// Timers in Node.js : See https://nodejs.org/en/docs/guides/timers-in-node/

const timerIntervalInMilliseconds = 30000;		// === 30 seconds.

/* const intervalObj = */ setInterval(sendHTTPRequest, timerIntervalInMilliseconds);	// Execute sendHTTPRequest() once every 30 seconds.

//clearInterval(intervalObj);	// This cancels the infinite loop in the setInterval() above.
