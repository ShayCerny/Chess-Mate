declare const APP_VERSION: string;

interface Window {
	electronAPI: {
		getGameState: (fen: string) => Promise<{ moves: number[][], checkSquare: number | null }>;
		getBestMove: (fen: string, difficulty: number) => Promise<[number, number] | null>;
	};
}