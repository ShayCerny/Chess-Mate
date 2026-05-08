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

export interface IFullTurnMove {
	white: IHalfTurnMove;
	black: IHalfTurnMove | null;
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

export interface IBoardProps {
	board: IPiece[];
	highlight: number | null;
	moves: number[];
	colorTurn: PieceColor;
	checkSquare: number | null;
	handleSelect: (index: number) => void;
	handleMove: (index: number) => void;
}
