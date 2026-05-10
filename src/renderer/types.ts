export enum PieceType {
	PAWN = "p",
	KNIGHT = "n",
	ROOK = "r",
	BISHOP = "b",
	KING = "k",
	QUEEN = "q",
	NONE = "",
}

export enum PieceColor {
	WHITE = "w",
	BLACK = "b",
	NONE = "",
}

export interface IPiece {
	type: PieceType;
	color: PieceColor;
}

export enum MoveType {
	NORMAL = 0,
	ATTACK = 1,
	ENPASSANT = 2,
	QCASTLE = 3,
	KCASTLE = 4,
	PROMOTION = 5,
}

export interface IHalfTurnMove {
	from: number;
	to: number;
	type: MoveType;
	piece: IPiece;
	pieceTaken: IPiece | null;
	castlesBefore: string;
	enPassantBefore: string;
	fullTurnBefore: number;
	halfTurnBefore: number;
}

export type GameResultReason = 'checkmate' | 'stalemate' | 'draw' | 'resign';

export interface GameResult {
	reason: GameResultReason;
	winner?: PieceColor;
}

export enum GameMode {
	twoPlayer = 'twoPlayer',
	vsComputer = 'vsComputer',
}

export enum Difficulty {
	easy = 'easy',
	medium = 'medium',
	hard = 'hard',
}

export enum PlayerColor {
	white = 'white',
	black = 'black',
}

export interface GameConfig {
	mode: GameMode;
	difficulty: Difficulty;
	playerColor: PlayerColor;
}

export interface IBoardProps {
	board: IPiece[];
	highlight: number | null;
	moves: number[];
	colorTurn: PieceColor;
	checkSquare: number | null;
	locked: boolean;
	handleSelect: (index: number) => void;
	handleMove: (index: number) => void;
}
