import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
    getGameState: (fen: string): Promise<{ moves: number[][], checkSquare: number | null }> =>
        ipcRenderer.invoke("chess:get-game-state", fen),
    getBestMove: (fen: string, difficulty: number): Promise<[number, number] | null> =>
        ipcRenderer.invoke("chess:get-best-move", fen, difficulty),
});
