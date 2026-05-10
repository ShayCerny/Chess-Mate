import { ipcMain, BrowserWindow, app } from "electron";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let chessEngine: {
    getGameState: (fen: string) => { moves: number[][], checkSquare: number | null };
    getBestMove: (fen: string, difficulty: number) => [number, number] | null;
} | null = null;

function loadChessEngine() {
    if (chessEngine) return chessEngine;
    try {
        // electron-rebuild outputs to bin/<platform>-<arch>-<napi_version>/
        const tag = `${process.platform}-${process.arch}-${process.versions.modules}`;
        const addonPath = path.join(app.getAppPath(), "bin", tag, "ChessMate.node");
        chessEngine = require(addonPath);
    } catch {
        // addon not yet built — getLegalMoves IPC will return []
    }
    return chessEngine;
}

ipcMain.handle("chess:get-game-state", (_event, fen: string) => {
    const engine = loadChessEngine();
    return engine ? engine.getGameState(fen) : { moves: [], checkSquare: null };
});

ipcMain.handle("chess:get-best-move", (_event, fen: string, difficulty: number) => {
    const engine = loadChessEngine();
    return engine && typeof engine.getBestMove === 'function' ? engine.getBestMove(fen, difficulty) : null;
});

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
