// electron-scraper/utilities.js

// For more common utility functions, use Lodash instead?

// **** Numeric Utilities ****

function isObjectAValidNumber (obj) {
	return Object.prototype.toString.call(obj) === '[object Number]' && !Number.isNaN(obj);
}

function isObjectAValidNonNegativeInteger (obj) {
	return isObjectAValidNumber(obj) && obj >= 0;
}

function isObjectAValidNonNegativeIntegerLessThanN (obj, n) {
	return isObjectAValidNonNegativeInteger(obj) && obj < n;
}

// **** Date and Time Utilities ****

function isObjectAValidDate (obj) {
	return Object.prototype.toString.call(obj) === '[object Date]' && !Number.isNaN(obj.valueOf());
}

function safeStringToDate (str) {
	const date = new Date(str);

	return isObjectAValidDate(date) ? date : undefined;
}

function padToTwoDigits (n) {
	let str = '' + n;

	if (str.length < 2) {
		str = '0' + str;
	}

	return str;
}

function formatUTCDateWithoutTime (date) {
	const year = date.getUTCFullYear();
	const month = padToTwoDigits(date.getUTCMonth() + 1);
	const day = padToTwoDigits(date.getUTCDate());

	return [year, month, day].join('-');
}

function formatUTCHoursAndMinutes (date) {
	const hours = padToTwoDigits(date.getUTCHours());
	const minutes = padToTwoDigits(date.getUTCMinutes());

	return `${hours}:${minutes}`;
}

function formatDate (date) {
	//var d = new Date(date),
	const d = date;
	const year = d.getFullYear();
	const month = padToTwoDigits(d.getMonth() + 1);
	const day = padToTwoDigits(d.getDate());
	const hour = padToTwoDigits(d.getHours());
	const minute = padToTwoDigits(d.getMinutes());
	const second = padToTwoDigits(d.getSeconds());

	return [year, month, day].join('-') + ' ' + [hour, minute, second].join(':');
}

function formatUTCDate (date) {
	const hour = padToTwoDigits(date.getUTCHours());
	const minute = padToTwoDigits(date.getUTCMinutes());
	const second = padToTwoDigits(date.getUTCSeconds());

	return formatUTCDateWithoutTime(date) + ' ' + [hour, minute, second].join(':');
}

function getCurrentDateTimeAsString () {
	let result = new Date().toString();
	const matchNowAsString = (/^(.*[0-9])\s*\(/).exec(result);

	if (matchNowAsString && matchNowAsString[1]) {
		result = matchNowAsString[1];
	}

	return result;
}

function getTimezoneOffsetFromDateAsString (dateAsString) {
	const match = (/GMT([+-])([0-9]{2})([0-9]{2})/).exec(dateAsString);

	return match;
}

function guesstimateQuoteTime2 (quoteHours, quoteMinutes, quoteTimezoneOffsetInMinutes) {
	let localNow = new Date();
	let time = localNow;

	//console.log(`localNow.getTimezoneOffset() is ${localNow.getTimezoneOffset()}`);

	//time.setUTCHours(time.getUTCHours() + 1);
	// time.setUTCHours(quoteHours - 1);	// - 1 because the quote time is in UTC+01:00, and we want UTC.
	// time.setUTCMinutes(quoteMinutes);

	time.setUTCHours(quoteHours);	// - 1 because the quote time is in UTC+01:00, and we want UTC.
	time.setUTCMinutes(quoteMinutes + quoteTimezoneOffsetInMinutes);
	time.setUTCSeconds(0);
	time.setUTCMilliseconds(0);

	//console.log(`time is ${time}`);
	//console.log('time is', time);

	// Invariant: We know that the quote time is in the past.

	// Case 1) : If quoteHours - quoteHourAdjustmentToUTC === time.getUTCHours()
	// Case 2) : Else If quoteHours - quoteHourAdjustmentToUTC === time.getUTCHours() - 1
	// Case 3) : Else If quoteHours - quoteHourAdjustmentToUTC === -1 or 23, and time.getUTCHours() === 0
	// Case 4) : Else return undefined.

	return time;
}

function guesstimateQuoteTimeAsUTCDateTime (regexMatch) {

	if (!regexMatch) {
		return undefined;
	}

	//const timeRegexMatch = match.match(/[0-9]{1,2}\:[0-9]{2}[A|P]M [A-Z]+/);
	const timeRegexMatch = (/[0-9]{1,2}\:[0-9]{2}[A|P]M [A-Z]+/).exec(regexMatch);
	const timeRegexMatch2 = (/([0-9]{1,2})\:([0-9]{2})([A|P]M) [A-Z]+/).exec(regexMatch);

	if (!timeRegexMatch || !timeRegexMatch[0]) {
		return undefined;
	}

	const now = new Date();
	const timeAsString = formatUTCDateWithoutTime(now) + ' ' + timeRegexMatch[0].replace(/BST/, 'GMT+0100').replace(/AM/, ' AM').replace(/PM/, ' PM');

	const match = getTimezoneOffsetFromDateAsString(timeAsString);
	let result;

	// console.log('match is', match);
	// console.log('timeRegexMatch2 is', timeRegexMatch2);

	if (match && match.length && match.length >= 4 && timeRegexMatch2 && timeRegexMatch2.length && timeRegexMatch2.length >= 4) {
		const isPositive = match[1] === '+';
		const timezoneOffsetHours = parseInt(match[2]);
		let timezoneOffsetMinutes = timezoneOffsetHours * 60 + parseInt(match[3]);

		if (isPositive) {
			timezoneOffsetMinutes = -timezoneOffsetMinutes;
		}

		// console.log('timezoneOffsetMinutes is', timezoneOffsetMinutes);

		// console.log(`isNegative is ${isNegative}`);
		// console.log(`quoteHours is ${quoteHours}`);
		// console.log(`quoteMinutes is ${quoteMinutes}`);

		//if (timeRegexMatch2 && timeRegexMatch2.length && timeRegexMatch2.length >= 3) {
		const AMorPM = timeRegexMatch2[3];
		const isPM = AMorPM === 'PM';
		const quoteHoursRaw = parseInt(timeRegexMatch2[1]);
		const quoteHours = (quoteHoursRaw === 12 ? 0 : quoteHoursRaw) + (isPM ? 12 : 0);
		const quoteMinutes = parseInt(timeRegexMatch2[2]);

		const time = guesstimateQuoteTime2(quoteHours, quoteMinutes, timezoneOffsetMinutes);

		result = time;
		//}
	} else {
		//let time = new Date(timeAsString);	// This is the quote time in UTC.

		//return safeStringToDate(timeAsString);
		result = safeStringToDate(timeAsString);

		//result.setMinutes(result.getMinutes() - now.getTimezoneOffset());
	}

	return result;
}

function dateToSimpleLocalDateTimeWithTimeZone (date) {
	let result = date.toString();
	//const match = (/^(.*)\(/).exec(result);
	const match = (/^(.*\S)\s*\(/).exec(result);

	if (match && match.length) {
		result = match[1]; // .trim();
	}

	return result;
}

// **** Regular Expression Utilities ****

function ensureRegex (param) {
	const prototypeAsString = Object.prototype.toString.call(param);

	switch (prototypeAsString) {
		case '[object RegExp]':
			return param;

		case '[object String]':
			// Strip the leading and trailing slashes (if any) from param
			const match = (/^\/(.*)\/$/).exec(param);

			if (match && match.length && match[1]) {
				param = match[1];
			}

			return new RegExp(param);

		default:
			return undefined;
	}
}

module.exports = {
	ensureRegex: ensureRegex,
	formatDate: formatDate,
	formatUTCDate: formatUTCDate,
	formatUTCDateWithoutTime: formatUTCDateWithoutTime,
	formatUTCHoursAndMinutes: formatUTCHoursAndMinutes,
	getCurrentDateTimeAsString: getCurrentDateTimeAsString,
	getTimezoneOffsetFromDateAsString: getTimezoneOffsetFromDateAsString,
	guesstimateQuoteTimeAsUTCDateTime: guesstimateQuoteTimeAsUTCDateTime,
	guesstimateQuoteTime2: guesstimateQuoteTime2,
	dateToSimpleLocalDateTimeWithTimeZone: dateToSimpleLocalDateTimeWithTimeZone,
	isObjectAValidNonNegativeIntegerLessThanN: isObjectAValidNonNegativeIntegerLessThanN
};
