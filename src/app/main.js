// electron-scraper/src/app/main.js

// Modules to control the application lifecycle and to create a native browser window:
const { app, BrowserWindow, globalShortcut, ipcMain, Tray } = require('electron');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const lowDB_databaseFilePath = 'database/lowdb.json';
const adapter = new FileSync(lowDB_databaseFilePath);
const db = low(adapter);

//const utilities = require('../utilities.js');

const debug = true;
//const debug = false;

const logSeverity_Error = 0;
const logSeverity_Info = 1;

// Keep a global reference of the window object. If you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let tray;

// See https://stackoverflow.com/questions/32780726/how-to-access-dom-elements-in-electron :

/*
Example script in index.html:

var ipc = require('electron').ipcRenderer;
var authButton = document.getElementById('auth-button');
authButton.addEventListener('click', function(){
    ipc.once('actionReply', function(event, response){
        processResponse(response);
    })
    ipc.send('invokeAction', 'someData');
});

And in the main process:

var ipc = require('electron').ipcMain;

ipc.on('invokeAction', function(event, data){
    var result = processData(data);
    event.sender.send('actionReply', result);
});
*/

const settings = require('../settings.js');

ipcMain.on('getSettings', function (event) {
	event.sender.send('actionReply_getSettings', settings);
});

ipcMain.on('minimizeWindow', () => { //function (event, data) {
	// var result = processData(data);
	// event.sender.send('actionReply', result);
	mainWindow.minimize();
});

function connectToDatabase () {
	// const adapter = new FileSync(lowDB_databaseFilePath);
	//const db = low(adapter);

	// Set some defaults
	db.defaults({ quotes: [], log: [], httpErrors: [] })
		.write();
}

function insertQuoteIntoDatabase (symbol, quote, percentChange, bid, ask, quoteTimeAsUTCDateTime, quoteTimeInLocalTimezone) {
	//const adapter = new FileSync(lowDB_databaseFilePath);
	// const db = low(adapter);
	const insertionTime = new Date();

	// Add a post
	db.get('quotes')
		.push({ insertionTime: insertionTime, symbol: symbol, quote: quote, percentChange: percentChange, bid: bid, ask: ask, quoteTimeAsUTCDateTime: quoteTimeAsUTCDateTime, quoteTimeInLocalTimezone: quoteTimeInLocalTimezone })
		.write();
}

function logToDatabase (severity, message) {
	//const adapter = new FileSync(lowDB_databaseFilePath);
	//const db = low(adapter);
	const insertionTime = new Date();

	// Add a post
	db.get('log')
		.push({ insertionTime: insertionTime, severity: severity, message: message })
		.write();
}

function logHttpErrorToDatabase (url, statusCode, statusMessage) {
	//const adapter = new FileSync(lowDB_databaseFilePath);
	//const db = low(adapter);
	const insertionTime = new Date();

	// Add a post
	db.get('httpErrors')
		.push({ insertionTime: insertionTime, url: url, statusCode: statusCode, statusMessage: statusMessage })
		.write();
}

function logErrorToDatabase (message) {
	logToDatabase(logSeverity_Error, message);
}

function logInfoToDatabase (message) {
	logToDatabase(logSeverity_Info, message);
}

ipcMain.on('logError', function (event, data) {
	console.error(data);
	logErrorToDatabase(data);
});

ipcMain.on('logHttpRequestError', function (event, data) {
	const errorMessage = `Error: GET ${data.url} : HTTP Response status: ${data.httpResponseStatusCode} ${data.httpResponseStatusMessage}`;

	console.error(errorMessage);
	logHttpErrorToDatabase(data.url, data.httpResponseStatusCode, data.httpResponseStatusMessage);
});

ipcMain.on('logInfo', function (event, data) {
	console.log(data);
	logInfoToDatabase(data);
});

function consoleLogForDebugOnly (data) {

	if (debug) {
		console.log(data);
	}
}

ipcMain.on('consoleLog', function (event, data) {
	console.log(data);
});

ipcMain.on('consoleLogForDebugOnly', function (event, data) {
	consoleLogForDebugOnly(data);
});

ipcMain.on('consoleError', function (event, data) {
	console.error(data);
});

ipcMain.on('insertQuoteIntoDatabase', function (event, data) {
	insertQuoteIntoDatabase(data.symbol, data.quote, data.percentChange, data.bid, data.ask, data.quoteTimeAsUTCDateTime, data.quoteTimeInLocalTimezone);
});

/*
function constructDateFromQuoteTimeOfDay (quoteTimeOfDayString) {
	let time = utilities.guesstimateQuoteTimeAsUTCDateTime(quoteTimeOfDayString);

	time.setMinutes(time.getMinutes() - time.getTimezoneOffset());

	return time;
}

ipcMain.on('constructDateFromQuoteTimeOfDay', function (event, data) {
	const date = constructDateFromQuoteTimeOfDay(data);

	event.sender.send('actionReply_constructDateFromQuoteTimeOfDay', date);
});
*/

function getNonDebugWindowHeight () {
	const descriptors = settings.descriptors || [];
	const numDescriptors = descriptors.length || 1;

	return numDescriptors * 32;
}

function createWindow () {
	consoleLogForDebugOnly('createWindow() : BEGIN');

	const windowWidth = debug ? 1000 : 375;
	//const windowHeight = debug ? 500 : 32;
	//const windowHeight = debug ? 500 : 64;
	const windowHeight = debug ? 500 : getNonDebugWindowHeight();

	// 45 is an estimate of the height of the Windows taskbar.
	// -> 40px ? See https://www.reddit.com/r/Windows10/comments/6rv7ot/on_a_1920x1080_display_at_native_resolution_how/
	const windows10TaskbarHeight = 40;

	// Create the browser window:
	mainWindow = new BrowserWindow({
		width: windowWidth,
		height: windowHeight,
		frame: debug
	});

	// ... and load the index.html of the app.
	mainWindow.loadFile('src/window/index.html');

	if (debug) {
		// Open the DevTools.
		mainWindow.webContents.openDevTools();
	}

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		consoleLogForDebugOnly('mainWindow.on(\'closed\')');
		// Dereference the window object. Usually you would store windows
		// in an array if your app supports multiple windows. This is the time
		// when you should delete the corresponding elements.
		mainWindow = null;
	});

	/*
	mainWindow.on('window-all-closed', () => {
		consoleLogForDebugOnly('mainWindow.on(\'window-all-closed\')');
	});

	mainWindow.on('blur', () => {
		consoleLogForDebugOnly('mainWindow.on(\'blur\')');
	});
	*/

	const screenDimensions = require('electron').screen.getPrimaryDisplay().size;
	//const screenDimensions = require('electron').screen.getCurrentDisplay().size;	// Error: getCurrentDisplay is not a function.

	console.log(`Primary display: ${screenDimensions.width} x ${screenDimensions.height}`);

	mainWindow.setPosition(screenDimensions.width - windowWidth, screenDimensions.height - windowHeight - windows10TaskbarHeight);

	// For best results on Windows, use an .ico file. See https://electronjs.org/docs/api/tray .
	tray = new Tray('assets/favicon.ico');

	tray.on('click', () => {
		consoleLogForDebugOnly('tray.on(\'click\')');

		if (mainWindow.isVisible()) {
			mainWindow.hide();
		} else {
			mainWindow.show();
		}
	});

	// TODO: Call tray.destroy() when the app is shutting down in order to remove the icon from the system tray
	// See https://electronjs.org/docs/api/tray
	// See https://github.com/electron/electron/commit/f6c66a737498223933d0a34c3113515cc6284f74

	/* These two Tray events are available on macOS only.
	tray.on('mouse-enter', () => {
		mainWindow.show();
	});

	tray.on('mouse-leave', () => {
		mainWindow.hide();
	});
	*/

	/*
	mainWindow.on('show', () => {
		tray.setHighlightMode('always');
	});

	mainWindow.on('hide', () => {
		tray.setHighlightMode('never');
	});
	*/

	connectToDatabase();

	/*
	if (process.platform === 'win32') {
		consoleLogForDebugOnly('process.platform === \'win32\'; readline...');

		const rl = require('readline').createInterface({
			input: process.stdin,
			output: process.stdout
		});

		rl.on('SIGINT', function () {
			consoleLogForDebugOnly('process.emit(\'SIGINT\')');
			process.emit('SIGINT');
		});
	}

	process.on('SIGINT', function () {
		// Graceful shutdown
		consoleLogForDebugOnly('process.on(\'SIGINT\') ; Graceful shutdown...');
		process.exit();
	});
	*/

	// Use a global keyboard shortcut to shut down the app.
	// See https://github.com/electron/electron/blob/master/docs/tutorial/keyboard-shortcuts.md#global-shortcuts

	globalShortcut.register('CommandOrControl+X', () => {
		consoleLogForDebugOnly('CommandOrControl+X is pressed');

		// On OS X it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q

		if (process.platform !== 'darwin') {
			app.quit();
		}
	});

	consoleLogForDebugOnly('createWindow() : END');
}

app.on('activate', function () {
	consoleLogForDebugOnly('app.on(\'activate\')');
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.

	if (mainWindow === null) {
		createWindow();
	}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	consoleLogForDebugOnly('app.on(\'window-all-closed\')');

	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q

	if (process.platform !== 'darwin') {
		app.quit();
	}
});

/*
app.on('before-quit', () => {
	consoleLogForDebugOnly('app.on(\'before-quit\')');

	if (tray) {
		tray.destroy();
		tray = null;
	}
});

app.on('will-quit', () => {
	consoleLogForDebugOnly('app.on(\'will-quit\')');

	if (tray) {
		tray.destroy();
		tray = null;
	}
});
*/

app.on('quit', () => {
	consoleLogForDebugOnly('app.on(\'quit\')');

	if (tray) {
		tray.destroy();		// This removes our application's icon from the system tray.
		tray = null;
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// TODO: Detect Ctrl-C on Windows, and call tray.destroy() when CTRL-C is pressed.
// See https://stackoverflow.com/questions/10021373/what-is-the-windows-equivalent-of-process-onsigint-in-node-js
// See also https://nodejs.org/api/readline.html#readline_event_sigint

/*
if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", function () {
  //graceful shutdown
  process.exit();
});
*/

/*
process.on('SIGINT', () => {
	consoleLogForDebugOnly('SIGINT');
});
*/

// TODO: Consider using https://www.npmjs.com/package/async-exit-hook to catch Ctrl-C on Windows and/or unhandled exceptions on any platform.
