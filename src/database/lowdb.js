// electron-scraper/src/database/lowdb.js

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const lowDB_databaseFilePath = 'database/lowdb.json';
const adapter = new FileSync(lowDB_databaseFilePath);
const db = low(adapter);

const logSeverity_Error = 0;
const logSeverity_Info = 1;

function connect () {
	// const adapter = new FileSync(lowDB_databaseFilePath);
	//const db = low(adapter);

	// Set some defaults
	db.defaults({ quotes: [], log: [], httpErrors: [] })
		.write();
}

function insertQuote (symbol, quote, percentChange, bid, ask, quoteTimeAsUTCDateTime, quoteTimeInLocalTimezone) {
	//const adapter = new FileSync(lowDB_databaseFilePath);
	// const db = low(adapter);
	const insertionTime = new Date();

	// Add a post
	db.get('quotes')
		.push({ insertionTime: insertionTime, symbol: symbol, quote: quote, percentChange: percentChange, bid: bid, ask: ask, quoteTimeAsUTCDateTime: quoteTimeAsUTCDateTime, quoteTimeInLocalTimezone: quoteTimeInLocalTimezone })
		.write();
}

function log (severity, message) {
	//const adapter = new FileSync(lowDB_databaseFilePath);
	//const db = low(adapter);
	const insertionTime = new Date();

	// Add a post
	db.get('log')
		.push({ insertionTime: insertionTime, severity: severity, message: message })
		.write();
}

function logError (message) {
	log(logSeverity_Error, message);
}

function logInfo (message) {
	log(logSeverity_Info, message);
}

function logHttpError (url, statusCode, statusMessage) {
	//const adapter = new FileSync(lowDB_databaseFilePath);
	//const db = low(adapter);
	const insertionTime = new Date();

	// Add a post
	db.get('httpErrors')
		.push({ insertionTime: insertionTime, url: url, statusCode: statusCode, statusMessage: statusMessage })
		.write();
}

module.exports = {
	connect: connect,
	insertQuote: insertQuote,
	log: log,
	logError: logError,
	logInfo: logInfo,
	logHttpError: logHttpError
};
