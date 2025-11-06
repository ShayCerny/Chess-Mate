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
	black: IHalfTurnMove;
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
	pieceTaken?: IPiece;
}

export interface IBoardProps {
	board: IPiece[];
	highlight: number | null; // index or space code of square that should be highlighted
	moves: number[]; // Indices of spaces that should be displayed as moves
	handleSelect: (index: number) => void;
	handleMove: (index: number, enPassant: boolean) => void;
}
