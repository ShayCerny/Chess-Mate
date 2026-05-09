import { IHalfTurnMove, IPiece, MoveType, PieceColor, PieceType } from "../types";

export class Board {
	squares: IPiece[];
	colorTurn: PieceColor;
	castles: string;
	enPassant: string;
	fullTurn: number;
	halfTurn: number;

	constructor(
		squares: IPiece[],
		colorTurn: PieceColor,
		castles: string,
		enPassant: string,
		fullTurn: number,
		halfTurn: number
	) {
		this.squares = squares;
		this.colorTurn = colorTurn;
		this.castles = castles;
		this.enPassant = enPassant;
		this.fullTurn = fullTurn;
		this.halfTurn = halfTurn;
	}

	move(fromIndex: number, toIndex: number, enPassant: boolean) {
		let attacked = null; // default for attacked piece
		let moveType = MoveType.NORMAL;

		if (this.squares[toIndex].type != "") {
			attacked = { ...this.squares[toIndex] };
			moveType = MoveType.ATTACK;
		}

		if (enPassant) {
			const color = this.squares[fromIndex].color;
			const direction = color === "w" ? 8 : -8;

			const attackedSpace = toIndex + direction;
			attacked = { ...this.squares[attackedSpace] };
			this.squares[attackedSpace] = {
				type: PieceType.NONE,
				color: PieceColor.NONE,
			};
			moveType = MoveType.ENPASSANT;
		}

		// move the piece from the from_index toIndex the to_index
		const movedPiece = this.squares[fromIndex];
		this.squares[toIndex] = movedPiece;
		// remove the piece at the from_index
		this.squares[fromIndex] = {
			type: PieceType.NONE,
			color: PieceColor.NONE,
		};
		// Return both the board and the attacked piece
		return { attacked, movedPiece, moveType };
	}

	atPos(index: number) {
		return this.squares[index];
	}

	swapTurn() {
		if (this.colorTurn === PieceColor.WHITE) {
			this.colorTurn = PieceColor.BLACK;
		} else {
			this.colorTurn = PieceColor.WHITE;
		}
	}

	undo(move: IHalfTurnMove | null) {
		if (move === null) return;
		this.squares[move.from] = move.piece;
		if (move.type === MoveType.PROMOTION) {
			this.squares[move.from] = { type: PieceType.PAWN, color: move.piece.color };
			this.squares[move.to] = { type: PieceType.NONE, color: PieceColor.NONE };
		} else if (move.type === MoveType.ATTACK && move.pieceTaken) {
			this.squares[move.to] = move.pieceTaken;
		} else if (move.type === MoveType.KCASTLE) {
			this.squares[move.to] = { type: PieceType.NONE, color: PieceColor.NONE };
			this.squares[move.to - 1] = { type: PieceType.NONE, color: PieceColor.NONE };
			this.squares[move.to + 1] = { type: PieceType.ROOK, color: move.piece.color };
		} else if (move.type === MoveType.QCASTLE) {
			this.squares[move.to] = { type: PieceType.NONE, color: PieceColor.NONE };
			this.squares[move.to + 1] = { type: PieceType.NONE, color: PieceColor.NONE };
			this.squares[move.to - 2] = { type: PieceType.ROOK, color: move.piece.color };
		} else if (move.type === MoveType.ENPASSANT) {
			const enemyColor = move.piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
			const direction = move.piece.color === PieceColor.WHITE ? 8 : -8;
			this.squares[move.to] = { type: PieceType.NONE, color: PieceColor.NONE };
			this.squares[move.to + direction] = { type: PieceType.PAWN, color: enemyColor };
		} else {
			this.squares[move.to] = { type: PieceType.NONE, color: PieceColor.NONE };
		}
		this.castles = move.castlesBefore;
		this.enPassant = move.enPassantBefore;
		this.fullTurn = move.fullTurnBefore;
		this.halfTurn = move.halfTurnBefore;
		this.swapTurn();
	}
}
