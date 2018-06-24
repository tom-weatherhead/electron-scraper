// electron-scraper/renderer.js

// This file is required by the index.html file and will be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer /*, remote */ } = require('electron');

const matchRegexesInWebPage = require('http-get-regex-capture');

const utilities = require('./utilities.js');

const defaultTimerIntervalInMilliseconds = 30000;		// === 30 seconds.

let settings;
let logSuccessfulHttpRequests;
let timerIntervalInMilliseconds;

function constructSpecialTimeOfDayFromUTCTime (time) {

	if (!time) {
		return '';
	}

	let copyOfTime = new Date(time);

	copyOfTime.setMinutes(copyOfTime.getMinutes() - copyOfTime.getTimezoneOffset());

	return utilities.formatUTCHoursAndMinutes(copyOfTime);
}

function logHttpRequestError (url, statusCode, statusMessage) {
	ipcRenderer.send('logHttpRequestError', {
		url: url,
		httpResponseStatusCode: statusCode,
		httpResponseStatusMessage: statusMessage
	});
}

function sendHTTPRequest () {
	settings.descriptors.forEach((descriptor, i) => {
		const url = descriptor.url;
		const rawRegexes = descriptor.regexes || settings.descriptors[0].regexes;
		const regexes = rawRegexes.map(regex => utilities.ensureRegex(regex));
		const mapRegexIndexToDatabaseTableColumnName = descriptor.mapRegexIndexToDatabaseTableColumnName || settings.descriptors[0].mapRegexIndexToDatabaseTableColumnName || [];
		const options = descriptor.options || settings.descriptors[0].options;
		const label = descriptor.label || settings.descriptors[0].label || '';
		const stringificationTemplate = descriptor.stringificationTemplate || settings.descriptors[0].stringificationTemplate || [];
		const specialTimeOfDayIndex = descriptor.specialTimeOfDayIndex || settings.descriptors[0].specialTimeOfDayIndex;

		matchRegexesInWebPage(url, regexes, options)
			.then(result => {

				if (result.httpResponseStatusCode !== 200) {
					logHttpRequestError(url, result.httpResponseStatusCode, result.httpResponseStatusMessage);

					return;
				} else if (logSuccessfulHttpRequests) {
					ipcRenderer.send('logInfo', `HTTP Response status: ${result.httpResponseStatusCode} ${result.httpResponseStatusMessage}`);
				}

				let outputText = label ? `${label} ` : '';
				let separator = '';
				let quoteTimeAsUTCDateTime;

				if (utilities.isObjectAValidNonNegativeIntegerLessThanN(specialTimeOfDayIndex, result.regexMatchResults.length)) {
					const quoteTimeRegexMatch = result.regexMatchResults[specialTimeOfDayIndex].match;

					if (quoteTimeRegexMatch) {
						quoteTimeAsUTCDateTime = utilities.guesstimateQuoteTimeAsUTCDateTime(quoteTimeRegexMatch);
					}
				}

				stringificationTemplate.forEach(st => {
					let stringToAppend;

					if (!utilities.isObjectAValidNonNegativeIntegerLessThanN(st, result.regexMatchResults.length)) {
						stringToAppend = st.toString();
					} else if (st === specialTimeOfDayIndex) {
						stringToAppend = constructSpecialTimeOfDayFromUTCTime(quoteTimeAsUTCDateTime);
					} else {
						stringToAppend = result.regexMatchResults[st].match.toString();
					}

					if (stringToAppend) {
						outputText = outputText + separator + stringToAppend;
					}

					separator = ' ';
				});

				document.getElementById(`output${i}`).innerHTML = outputText;

				ipcRenderer.send('consoleLog', outputText);

				let quoteDataForDatabase = {};

				if (stringificationTemplate && stringificationTemplate.length) {
					quoteDataForDatabase.symbol = label;
				}

				if (quoteTimeAsUTCDateTime) {
					quoteDataForDatabase.quoteTimeAsUTCDateTime = quoteTimeAsUTCDateTime;
				}

				if (!mapRegexIndexToDatabaseTableColumnName || !mapRegexIndexToDatabaseTableColumnName.length) {
					ipcRenderer.send('consoleLog', 'Not inserting into database.');
				} else {
					mapRegexIndexToDatabaseTableColumnName.forEach((columnName, j) => {

						if (j === specialTimeOfDayIndex) {
							quoteDataForDatabase[columnName] = utilities.dateToSimpleLocalDateTimeWithTimeZone(quoteTimeAsUTCDateTime);
						} else {
							quoteDataForDatabase[columnName] = result.regexMatchResults[j].match || '';
						}
					});

					ipcRenderer.send('consoleLog', 'Inserting into database...');
					ipcRenderer.send('insertQuoteIntoDatabase', quoteDataForDatabase);
				}
			})
			.fail(error => {
				// TODO: Log the error to the database.
				document.getElementById(`output${i}`).innerHTML = 'Error.';
				ipcRenderer.send('consoleError', `${error.message || error}`);
			})
			.done();
	});
}

ipcRenderer.once('actionReply_getSettings', function (event, response) {
	settings = response || {};

	logSuccessfulHttpRequests = settings.logSuccessfulHttpRequests === true || settings.logSuccessfulHttpRequests === false ? settings.logSuccessfulHttpRequests : true;

	timerIntervalInMilliseconds = settings.timerIntervalInMilliseconds || defaultTimerIntervalInMilliseconds;

	sendHTTPRequest();

	// Timers in Node.js : See https://nodejs.org/en/docs/guides/timers-in-node/

	/* const intervalObj = */ setInterval(sendHTTPRequest, timerIntervalInMilliseconds);	// Execute sendHTTPRequest() once every 30 seconds.

	//clearInterval(intervalObj);	// This cancels the infinite loop in the setInterval() above.
});

ipcRenderer.send('getSettings');
