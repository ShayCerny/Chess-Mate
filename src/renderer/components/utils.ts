import { IPiece, PieceColor, PieceType } from "../types";
import { Board } from "./BoardClass";

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

export function FenDecoder(s: string) {
	// split string by ' '
	const parts = s.split(" ");

	const squares = [] as IPiece[];

	parts[0].split("/").map((rank: string) => {
		for (let file = 0; file < rank.length; ) {
			const char = rank.charAt(file); // get the characted in the current rank/file
			const num = Number(char); // attempt to convert the character to a number

			if (!isNaN(num) && isFinite(num)) {
				// if num is a valid finite number
				file += num;

				// add the empty spaces to the board
				for (let i = 1; i <= num; i++) {
					squares.push({ type: PieceType.NONE, color: PieceColor.NONE } as IPiece);
				}

				continue;
			} else {
				squares.push(ParsePiece(rank.charAt(file))); // add the parsed piece to the board
			}

			file++; // increment the file
		}
	});

	const colorTurn = parts[1] === "w" ? PieceColor.WHITE : PieceColor.BLACK;

	const board = new Board(squares, colorTurn, parts[2], parts[3], Number(parts[4]), Number(parts[5]));
	return board;
}

export function FenEncoder(board: Board) {
	const fen = "";

	let skipCounter = 0;

	for (let rank = 0; rank < 8; rank++) {
		for (let file = 0; file < 8; file++) {
			const piece = board.squares[file + rank * 8];

			if (piece.type == PieceType.NONE) skipCounter++; // if space is empty increase the space skip counter by 1
			else {
				if (skipCounter > 0) {
					fen.concat(skipCounter.toString());
					skipCounter = 0;
				}

				const firstChar = piece.type;
				const fenChar = piece.color === PieceColor.WHITE ? firstChar.toUpperCase() : firstChar.toLowerCase();

				fen.concat(fenChar);
			}
		}
		fen.concat("/");
	}

	fen.concat(` ${board.colorTurn} ${board.castles} ${board.enPassant} ${board.fullTurn.toString()} ${board.halfTurn.toString()}`);
	return fen;
}
