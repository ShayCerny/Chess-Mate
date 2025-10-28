// src/main/events.ts
// Event handlers for the main process of the Electron application

import { ipcMain, BrowserWindow} from "electron";

ipcMain.on("app-close", () => {
	const window = BrowserWindow.getFocusedWindow();
	if (window) window.close();
});

ipcMain.on("app-minimize", () => {
	const window = BrowserWindow.getFocusedWindow();
	if (window) window.minimize();
});

ipcMain.on("app-maximize", () => {
	const window = BrowserWindow.getFocusedWindow();
	if (window) {
		if (window.isMaximized()) {
			window.unmaximize();
		} else {
			window.maximize();
		}
	}
});
