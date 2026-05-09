declare global {
    interface Window {
        electronAPI: {
            getLegalMoves: (fen: string) => Promise<number[][]>;
            getBestMove: (fen: string, difficulty: number) => Promise<[number, number] | null>;
            isInCheck: (fen: string) => Promise<boolean>;
        };
    }
}

export {};
