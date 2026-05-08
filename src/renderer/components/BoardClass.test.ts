import { describe, it, expect, beforeEach } from "vitest";
import { Board } from "./BoardClass";
import { IPiece, MoveType, PieceColor, PieceType } from "../types";

const empty: IPiece = { type: PieceType.NONE, color: PieceColor.NONE };

function makeBoard(): Board {
	const squares = Array<IPiece>(64).fill({ ...empty }).map(() => ({ ...empty }));
	return new Board(squares, PieceColor.WHITE, "KQkq", "-", 1, 0);
}

describe("Board.swapTurn", () => {
	it("switches white to black", () => {
		const board = makeBoard();
		board.swapTurn();
		expect(board.colorTurn).toBe(PieceColor.BLACK);
	});

	it("switches black back to white", () => {
		const board = makeBoard();
		board.swapTurn();
		board.swapTurn();
		expect(board.colorTurn).toBe(PieceColor.WHITE);
	});
});

describe("Board.move — normal", () => {
	let board: Board;

	beforeEach(() => {
		board = makeBoard();
		board.squares[0] = { type: PieceType.ROOK, color: PieceColor.WHITE };
	});

	it("clears the source square", () => {
		board.move(0, 16, false);
		expect(board.squares[0]).toEqual(empty);
	});

	it("places the piece at the destination", () => {
		board.move(0, 16, false);
		expect(board.squares[16]).toEqual({ type: PieceType.ROOK, color: PieceColor.WHITE });
	});

	it("returns NORMAL move type", () => {
		const { moveType } = board.move(0, 16, false);
		expect(moveType).toBe(MoveType.NORMAL);
	});

	it("returns null for attacked when destination is empty", () => {
		const { attacked } = board.move(0, 16, false);
		expect(attacked).toBeNull();
	});
});

describe("Board.move — attack", () => {
	let board: Board;

	beforeEach(() => {
		board = makeBoard();
		board.squares[0] = { type: PieceType.ROOK, color: PieceColor.WHITE };
		board.squares[16] = { type: PieceType.PAWN, color: PieceColor.BLACK };
	});

	it("returns ATTACK move type", () => {
		const { moveType } = board.move(0, 16, false);
		expect(moveType).toBe(MoveType.ATTACK);
	});

	it("returns the captured piece", () => {
		const { attacked } = board.move(0, 16, false);
		expect(attacked).toEqual({ type: PieceType.PAWN, color: PieceColor.BLACK });
	});

	it("places the attacker at the destination", () => {
		board.move(0, 16, false);
		expect(board.squares[16]).toEqual({ type: PieceType.ROOK, color: PieceColor.WHITE });
	});
});

describe("Board.undo", () => {
	it("does nothing when given null", () => {
		const board = makeBoard();
		board.squares[0] = { type: PieceType.ROOK, color: PieceColor.WHITE };
		board.undo(null);
		expect(board.squares[0]).toEqual({ type: PieceType.ROOK, color: PieceColor.WHITE });
	});

	it("restores a normal move", () => {
		const board = makeBoard();
		board.squares[0] = { type: PieceType.ROOK, color: PieceColor.WHITE };
		board.move(0, 16, false);

		board.undo({
			from: 0,
			to: 16,
			piece: { type: PieceType.ROOK, color: PieceColor.WHITE },
			type: MoveType.NORMAL,
			pieceTaken: null,
			castlesBefore: "KQkq",
			enPassantBefore: "-",
			fullTurnBefore: 1,
			halfTurnBefore: 0,
		});

		expect(board.squares[0]).toEqual({ type: PieceType.ROOK, color: PieceColor.WHITE });
		expect(board.squares[16]).toEqual(empty);
	});

	it("restores an attack move and returns the captured piece", () => {
		const board = makeBoard();
		board.squares[0] = { type: PieceType.ROOK, color: PieceColor.WHITE };
		board.squares[16] = { type: PieceType.PAWN, color: PieceColor.BLACK };
		board.move(0, 16, false);

		board.undo({
			from: 0,
			to: 16,
			piece: { type: PieceType.ROOK, color: PieceColor.WHITE },
			type: MoveType.ATTACK,
			pieceTaken: { type: PieceType.PAWN, color: PieceColor.BLACK },
			castlesBefore: "KQkq",
			enPassantBefore: "-",
			fullTurnBefore: 1,
			halfTurnBefore: 0,
		});

		expect(board.squares[0]).toEqual({ type: PieceType.ROOK, color: PieceColor.WHITE });
		expect(board.squares[16]).toEqual({ type: PieceType.PAWN, color: PieceColor.BLACK });
	});

	it("swaps the turn back", () => {
		const board = makeBoard();
		board.swapTurn();
		board.undo({
			from: 0,
			to: 16,
			piece: { type: PieceType.ROOK, color: PieceColor.BLACK },
			type: MoveType.NORMAL,
			pieceTaken: null,
			castlesBefore: "KQkq",
			enPassantBefore: "-",
			fullTurnBefore: 1,
			halfTurnBefore: 0,
		});
		expect(board.colorTurn).toBe(PieceColor.WHITE);
	});

	it("restores castles and en passant state", () => {
		const board = makeBoard();
		board.castles = "KQ";
		board.enPassant = "e3";

		board.undo({
			from: 0,
			to: 16,
			piece: { type: PieceType.ROOK, color: PieceColor.WHITE },
			type: MoveType.NORMAL,
			pieceTaken: null,
			castlesBefore: "KQkq",
			enPassantBefore: "-",
			fullTurnBefore: 1,
			halfTurnBefore: 0,
		});

		expect(board.castles).toBe("KQkq");
		expect(board.enPassant).toBe("-");
	});
});
