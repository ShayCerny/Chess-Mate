declare global {
    interface Window {
        electronAPI: {
            getGameState: (fen: string) => Promise<{ moves: number[][], checkSquare: number | null }>;
            getBestMove: (fen: string, difficulty: number) => Promise<[number, number] | null>;
        };
    }
}

export {};
