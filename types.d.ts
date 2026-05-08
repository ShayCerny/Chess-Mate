declare const APP_VERSION: string;

interface Window {
	electronAPI: {
		getLegalMoves: (fen: string) => Promise<number[][]>;
		getBestMove: (fen: string) => Promise<[number, number] | null>;
	};
}