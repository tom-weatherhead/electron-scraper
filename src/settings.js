// electron-scraper/src/settings.js

const defaultSettings = {
	descriptors: [
		{
			url: 'https://nodejs.org/en/',
			regexes: [
				/Download v{0,1}(\S+)\s+Current/
			],
			mapRegexIndexToDatabaseTableColumnName: [],
			options: {
				returnHttpResponseStatus: true
			},
			label: 'Current version of Node.js :',
			stringificationTemplate: [
				0
			]
		}
	],
	timerIntervalInMilliseconds: 60000,
	logSuccessfulHttpRequests: false
};

/*
function constructHttpErrorCodeTestSettings (httpStatusCode) {
	return {
		descriptors: [
			{
				url: `https://httpbin.org/status/${httpStatusCode}`,
				regexes: defaultSettings.descriptors[0].regexes,
				mapRegexIndexToDatabaseTableColumnName: defaultSettings.descriptors[0].mapRegexIndexToDatabaseTableColumnName,
				options: defaultSettings.descriptors[0].options,
				label: defaultSettings.descriptors[0].label,
				stringificationTemplate: defaultSettings.descriptors[0].stringificationTemplate
			}
		],
		timerIntervalInMilliseconds: defaultSettings.timerIntervalInMilliseconds,
		logSuccessfulHttpRequests: defaultSettings.logSuccessfulHttpRequests
	};
}
*/

const settings = require('../settings/settings.json') || defaultSettings;
//const settings = require('../settings/settings.example.json') || defaultSettings;
//const settings = defaultSettings;
//const settings = constructHttpErrorCodeTestSettings(500);
//const settings = constructHttpErrorCodeTestSettings(403);

module.exports = settings;
