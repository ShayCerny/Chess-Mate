import { IPiece, PieceColor, PieceType } from "../types";
import { Board } from "./BoardClass";

export function resolveClickAction(
	clickedColor: PieceColor,
	currentTurn: PieceColor,
	selectedSquare: number | null,
	clickedIndex: number,
): "select" | "reselect" | "deselect" {
	if (clickedColor === currentTurn && selectedSquare === null) return "select";
	if (clickedColor === currentTurn && selectedSquare !== clickedIndex) return "reselect";
	return "deselect";
}

function isUpper(s: string) {
	return s.toUpperCase() === s;
}

function ParsePiece(p: string) {
	let type;
	const color = isUpper(p) ? PieceColor.WHITE : PieceColor.BLACK;
	switch (p.toLowerCase()) {
		case "p":
			type = PieceType.PAWN;
			break;
		case "r":
			type = PieceType.ROOK;
			break;
		case "n":
			type = PieceType.KNIGHT;
			break;
		case "b":
			type = PieceType.BISHOP;
			break;
		case "k":
			type = PieceType.KING;
			break;
		case "q":
			type = PieceType.QUEEN;
			break;
		default:
			type = PieceType.NONE;
			break;
	}

	return { type, color } as IPiece;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function indexToAlgebraic(index: number): string {
	const col = index % 8;
	const rank = 8 - Math.floor(index / 8);
	return `${FILES[col]}${rank}`;
}

export function FenDecoder(s: string) {
	// split string by ' '
	const parts = s.split(" ");

	const squares = [] as IPiece[];

	parts[0].split("/").map((rank: string) => {
		for (let i = 0; i < rank.length; i++) {
			const char = rank.charAt(i);
			const num = Number(char);

			if (!isNaN(num) && isFinite(num) && num !== 0) {
				for (let j = 0; j < num; j++) {
					squares.push({ type: PieceType.NONE, color: PieceColor.NONE } as IPiece);
				}
			} else {
				squares.push(ParsePiece(char));
			}
		}
	});

	const colorTurn = parts[1] === "w" ? PieceColor.WHITE : PieceColor.BLACK;

	const board = new Board(squares, colorTurn, parts[2], parts[3], Number(parts[4]), Number(parts[5]));
	return board;
}

export function FenEncoder(board: Board) {
	let fen = "";

	let skipCounter = 0;

	for (let rank = 0; rank < 8; rank++) {
		for (let file = 0; file < 8; file++) {
			const piece = board.squares[file + rank * 8];

			if (piece.type == PieceType.NONE) skipCounter++;
			else {
				if (skipCounter > 0) {
					fen += skipCounter.toString();
					skipCounter = 0;
				}

				const firstChar = piece.type;
				const fenChar = piece.color === PieceColor.WHITE ? firstChar.toUpperCase() : firstChar.toLowerCase();

				fen += fenChar;
			}
		}
		if (skipCounter > 0) {
			fen += skipCounter.toString();
			skipCounter = 0;
		}
		if (rank < 7) fen += "/";
	}

	fen += ` ${board.colorTurn} ${board.castles} ${board.enPassant} ${board.fullTurn.toString()} ${board.halfTurn.toString()}`;
	return fen;
}
