// src/main/main.ts
// Entry point for the main process of the Electron application

import { app, BrowserWindow, shell } from "electron";
import path from "path";

// Create the main application window when Electron is ready
app.on("ready", () => {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		title: "your-app-name",
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			preload: path.join(app.getAppPath(), process.env.NODE_ENV === "development" ? "." : "..", "/dist-electron/preload.cjs"),
		},
	});

	// Load the appropriate URL or file based on the environment
	if (process.env.NODE_ENV === "development") {
		mainWindow.loadURL("http://localhost:5123");
		// Uncomment to open DevTools on startup
		// mainWindow.webContents.openDevTools({ mode:"detach"});
	} else {
		mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
	}


	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		// Open all new window requests in the default browser
		if (url.startsWith("https:")){
			shell.openExternal(url);
			return { action: "deny" };
		}else{
			return { action: "allow" };
		}
	});

});

// Import event handlers
import "./events.js";
