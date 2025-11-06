import { IPiece, PieceColor, PieceType } from "../types";

export class Board {
	squares: IPiece[];
	colorTurn: PieceColor;
	castles: string;
	enPassant: string;
	fullTurn: number;
	halfTurn: number;

	constructor(squares: IPiece[], colorTurn: PieceColor, castles: string, enPassant: string, fullTurn: number, halfTurn: number) {
		this.squares = squares;
		this.colorTurn = colorTurn;
		this.castles = castles;
		this.enPassant = enPassant;
		this.fullTurn = fullTurn;
		this.halfTurn = halfTurn;
	}

	move(fromIndex: number, toIndex: number, enPassant: boolean) {
		let attacked = null; // default for attacked piece

		if (this.squares[toIndex].type != "") {
			// if the to_index of board is not empty set attacked piece
			attacked = this.squares[toIndex].type;
		}

		if (enPassant) {
			const color = this.squares[fromIndex].color;
			const direction = color === "w" ? -8 : 8;

			const attackedSpace = toIndex + direction;
			attacked = this.squares[attackedSpace].type;
			this.squares[attackedSpace] = {
				type: PieceType.NONE,
				color: PieceColor.NONE,
			};
		}

		// move the piece from the from_index toIndex the to_index
		this.squares[toIndex] = this.squares[fromIndex];
		// remove the piece at the from_index
		this.squares[fromIndex] = {
			type: PieceType.NONE,
			color: PieceColor.NONE,
		};
		// Return both the board and the attacked piece
		return attacked;
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
}
