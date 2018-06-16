// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, Tray} = require('electron');

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

// Keep a global reference of the window object. If you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

ipcMain.on('minimizeWindow', function(event, data) {
    // var result = processData(data);
    // event.sender.send('actionReply', result);
	mainWindow.minimize();
});

ipcMain.on('consoleLog', function(event, data) {
	console.log(data);
});

ipcMain.on('consoleError', function(event, data) {
	console.error(data);
});

function createWindow () {
	const debug = true;
	//const debug = false;
	const windowWidth = debug ? 1000 : 350;
	const windowHeight = debug ? 500 : 32;

	// 45 is an estimate of the height of the Windows taskbar.
	// -> 40px ? See https://www.reddit.com/r/Windows10/comments/6rv7ot/on_a_1920x1080_display_at_native_resolution_how/
	const windows10TaskbarHeight = 40;

	// Create the browser window:
	mainWindow = new BrowserWindow({width: windowWidth, height: windowHeight, frame: false});

	// ... and load the index.html of the app.
	mainWindow.loadFile('index.html');

	if (debug) {
		// Open the DevTools.
		mainWindow.webContents.openDevTools();
	}

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object. Usually you would store windows
		// in an array if your app supports multiple windows. This is the time
		// when you should delete the corresponding elements.
		mainWindow = null;
	});

	const screenDimensions = require('electron').screen.getPrimaryDisplay().size;
	//const screenDimensions = require('electron').screen.getCurrentDisplay().size;	// Error: getCurrentDisplay is not a function.

	console.log(`Primary display: ${screenDimensions.width} x ${screenDimensions.height}`);

	mainWindow.setPosition(screenDimensions.width - windowWidth, screenDimensions.height - windowHeight - windows10TaskbarHeight);

	// For best results on Windows, use an .ico file. See https://electronjs.org/docs/api/tray .
	const tray = new Tray('./assets/favicon.ico');

	tray.on('click', () => {
		mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
	});

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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
