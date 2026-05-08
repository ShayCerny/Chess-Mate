import { describe, it, expect } from "vitest";
import { indexToAlgebraic, FenDecoder, FenEncoder, resolveClickAction, turnLabel } from "./utils";
import { PieceType, PieceColor } from "../types";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("indexToAlgebraic", () => {
	it("converts top-left corner to a8", () => {
		expect(indexToAlgebraic(0)).toBe("a8");
	});

	it("converts bottom-right corner to h1", () => {
		expect(indexToAlgebraic(63)).toBe("h1");
	});

	it("converts e8 (black king start)", () => {
		expect(indexToAlgebraic(4)).toBe("e8");
	});

	it("converts e1 (white king start)", () => {
		expect(indexToAlgebraic(60)).toBe("e1");
	});
});

describe("FenDecoder", () => {
	it("produces a 64-square board", () => {
		const board = FenDecoder(START_FEN);
		expect(board.squares).toHaveLength(64);
	});

	it("parses color turn as white", () => {
		const board = FenDecoder(START_FEN);
		expect(board.colorTurn).toBe(PieceColor.WHITE);
	});

	it("parses castling rights", () => {
		const board = FenDecoder(START_FEN);
		expect(board.castles).toBe("KQkq");
	});

	it("places black rook at a8 (index 0)", () => {
		const board = FenDecoder(START_FEN);
		expect(board.squares[0]).toEqual({ type: PieceType.ROOK, color: PieceColor.BLACK });
	});

	it("places white king at e1 (index 60)", () => {
		const board = FenDecoder(START_FEN);
		expect(board.squares[60]).toEqual({ type: PieceType.KING, color: PieceColor.WHITE });
	});

	it("places empty squares in the middle ranks", () => {
		const board = FenDecoder(START_FEN);
		expect(board.squares[16]).toEqual({ type: PieceType.NONE, color: PieceColor.NONE });
	});

	it("parses black turn", () => {
		const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
		const board = FenDecoder(fen);
		expect(board.colorTurn).toBe(PieceColor.BLACK);
	});
});

describe("turnLabel", () => {
	it("returns White's Turn for white", () => {
		expect(turnLabel(PieceColor.WHITE)).toBe("White's Turn");
	});

	it("returns Black's Turn for black", () => {
		expect(turnLabel(PieceColor.BLACK)).toBe("Black's Turn");
	});
});

describe("resolveClickAction", () => {
	it("selects a friendly piece when nothing is selected", () => {
		expect(resolveClickAction(PieceColor.WHITE, PieceColor.WHITE, null, 12)).toBe("select");
	});

	it("reselects a different friendly piece when one is already selected", () => {
		expect(resolveClickAction(PieceColor.WHITE, PieceColor.WHITE, 8, 12)).toBe("reselect");
	});

	it("deselects when the same piece is clicked again", () => {
		expect(resolveClickAction(PieceColor.WHITE, PieceColor.WHITE, 12, 12)).toBe("deselect");
	});

	it("deselects when an empty square is clicked", () => {
		expect(resolveClickAction(PieceColor.NONE, PieceColor.WHITE, 12, 30)).toBe("deselect");
	});

	it("deselects when an enemy piece is clicked", () => {
		expect(resolveClickAction(PieceColor.BLACK, PieceColor.WHITE, 12, 20)).toBe("deselect");
	});
});

describe("FenEncoder", () => {
	it("round-trips the starting position", () => {
		expect(FenEncoder(FenDecoder(START_FEN))).toBe(START_FEN);
	});

	it("round-trips a mid-game position", () => {
		const fen = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";
		expect(FenEncoder(FenDecoder(fen))).toBe(fen);
	});
});
