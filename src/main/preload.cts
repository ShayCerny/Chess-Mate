import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
    getLegalMoves: (fen: string): Promise<number[][]> =>
        ipcRenderer.invoke("chess:get-legal-moves", fen),
    getBestMove: (fen: string, difficulty: number): Promise<[number, number] | null> =>
        ipcRenderer.invoke("chess:get-best-move", fen, difficulty),
    isInCheck: (fen: string): Promise<boolean> =>
        ipcRenderer.invoke("chess:is-in-check", fen),
});