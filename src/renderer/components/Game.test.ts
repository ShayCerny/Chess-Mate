import { describe, it, expect } from "vitest";
import { Game } from "./Game";
import { GameMode, MoveType, PieceColor, PieceType } from "../types";

// Index helpers (squares[0]=a8, squares[63]=h1)
// col = file index (a=0..h=7), row = 8 - rank, index = row*8 + col

describe("Game.move — normal", () => {
	it("moves piece to destination and clears source", () => {
		// White rook at a1 (56)
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		const state = game.move(56, 48); // a1 → a2
		expect(state.board[56].type).toBe(PieceType.NONE);
		expect(state.board[48].type).toBe(PieceType.ROOK);
	});

	it("appends move to pastMoves", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		const state = game.move(56, 48);
		expect(state.pastMoves).toHaveLength(1);
		expect(state.pastMoves[0].from).toBe(56);
		expect(state.pastMoves[0].to).toBe(48);
		expect(state.pastMoves[0].type).toBe(MoveType.NORMAL);
	});

	it("swaps the turn after move", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		const state = game.move(56, 48);
		expect(state.colorTurn).toBe(PieceColor.BLACK);
	});

	it("clears futureMoves when a move is made after undo", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		game.move(56, 48);
		game.undo(GameMode.twoPlayer);
		const state = game.move(56, 40); // a1 → a3
		expect(state.futureMoves).toHaveLength(0);
	});
});

describe("Game.move — capture", () => {
	it("sets moveType to ATTACK and records pieceTaken", () => {
		// White rook at a1 (56), black pawn at b1 (57)
		const game = new Game("8/8/8/8/8/8/8/Rp6 w KQkq - 0 1");
		const state = game.move(56, 57);
		expect(state.board[57].type).toBe(PieceType.ROOK);
		expect(state.pastMoves[0].type).toBe(MoveType.ATTACK);
		expect(state.pastMoves[0].pieceTaken?.type).toBe(PieceType.PAWN);
	});
});

describe("Game.move — castling", () => {
	it("kingside: king to g1, rook to f1", () => {
		// King at e1 (60), rook at h1 (63)
		const game = new Game("8/8/8/8/8/8/8/4K2R w K - 0 1");
		const state = game.move(60, 62);
		expect(state.board[60].type).toBe(PieceType.NONE); // e1 clear
		expect(state.board[62].type).toBe(PieceType.KING); // g1 has king
		expect(state.board[63].type).toBe(PieceType.NONE); // h1 clear
		expect(state.board[61].type).toBe(PieceType.ROOK); // f1 has rook
		expect(state.pastMoves[0].type).toBe(MoveType.KCASTLE);
	});

	it("queenside: king to c1, rook to d1", () => {
		// King at e1 (60), rook at a1 (56)
		const game = new Game("8/8/8/8/8/8/8/R3K3 w Q - 0 1");
		const state = game.move(60, 58);
		expect(state.board[60].type).toBe(PieceType.NONE); // e1 clear
		expect(state.board[58].type).toBe(PieceType.KING); // c1 has king
		expect(state.board[56].type).toBe(PieceType.NONE); // a1 clear
		expect(state.board[59].type).toBe(PieceType.ROOK); // d1 has rook
		expect(state.pastMoves[0].type).toBe(MoveType.QCASTLE);
	});

	it("removes both castling rights after king moves", () => {
		const game = new Game("8/8/8/8/8/8/8/4K2R w KQ - 0 1");
		const state = game.move(60, 62);
		// Castles field should be '-' (both rights removed)
		expect(state.fen).toMatch(/ - /);
	});
});

describe("Game.move — en passant", () => {
	it("sets en passant square in FEN after double pawn push", () => {
		const game = new Game(); // standard position
		const state = game.move(52, 36); // e2 → e4 (double push)
		expect(state.fen).toContain("e3"); // ep target square
	});

	it("en passant capture removes the captured pawn", () => {
		// White pawn at e5 (28), black pawn at d5 (27), ep=d6 (19)
		const game = new Game("8/8/8/3pP3/8/8/8/8 w - d6 0 1");
		const state = game.move(28, 19); // e5xd6 en passant
		expect(state.board[19].type).toBe(PieceType.PAWN);   // white pawn at d6
		expect(state.board[19].color).toBe(PieceColor.WHITE);
		expect(state.board[27].type).toBe(PieceType.NONE);    // d5 cleared
		expect(state.board[28].type).toBe(PieceType.NONE);    // e5 cleared
		expect(state.pastMoves[0].type).toBe(MoveType.ENPASSANT);
	});
});

describe("Game.move — promotion", () => {
	it("promotes white pawn to queen at rank 8", () => {
		// White pawn at e7 (12)
		const game = new Game("8/4P3/8/8/8/8/8/8 w - - 0 1");
		const state = game.move(12, 4); // e7 → e8
		expect(state.board[4].type).toBe(PieceType.QUEEN);
		expect(state.board[4].color).toBe(PieceColor.WHITE);
		expect(state.board[12].type).toBe(PieceType.NONE);
		expect(state.pastMoves[0].type).toBe(MoveType.PROMOTION);
	});

	it("promotes black pawn to queen at rank 1", () => {
		// Black pawn at e2 (52)
		const game = new Game("8/8/8/8/8/8/4p3/8 b - - 0 1");
		const state = game.move(52, 60); // e2 → e1
		expect(state.board[60].type).toBe(PieceType.QUEEN);
		expect(state.board[60].color).toBe(PieceColor.BLACK);
		expect(state.pastMoves[0].type).toBe(MoveType.PROMOTION);
	});
});

describe("Game.undo", () => {
	it("twoPlayer: pops 1 half-move and adds to futureMoves", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		game.move(56, 48); // a1 → a2
		const state = game.undo(GameMode.twoPlayer);
		expect(state.pastMoves).toHaveLength(0);
		expect(state.futureMoves).toHaveLength(1);
		expect(state.board[56].type).toBe(PieceType.ROOK); // rook back at a1
		expect(state.board[48].type).toBe(PieceType.NONE); // a2 cleared
		expect(state.colorTurn).toBe(PieceColor.WHITE);    // turn restored
	});

	it("vsComputer: pops 2 half-moves", () => {
		// Two rooks so we can make 2 independent moves
		const game = new Game("8/8/8/8/8/8/8/RR6 w KQkq - 0 1");
		game.move(56, 48); // rook a1 → a2
		game.move(57, 49); // rook b1 → b2
		const state = game.undo(GameMode.vsComputer);
		expect(state.pastMoves).toHaveLength(0);
		expect(state.futureMoves).toHaveLength(2);
		expect(state.board[56].type).toBe(PieceType.ROOK);
		expect(state.board[57].type).toBe(PieceType.ROOK);
	});

	it("does nothing when pastMoves is shorter than movesToUndo", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		game.move(56, 48);
		// Only 1 move in history, but vsComputer wants to pop 2 — should do nothing
		const state = game.undo(GameMode.vsComputer);
		expect(state.pastMoves).toHaveLength(1);
	});
});

describe("Game.redo", () => {
	it("re-applies the last undone move", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		game.move(56, 48);
		game.undo(GameMode.twoPlayer);
		const state = game.redo();
		expect(state.board[48].type).toBe(PieceType.ROOK);
		expect(state.board[56].type).toBe(PieceType.NONE);
		expect(state.pastMoves).toHaveLength(1);
		expect(state.futureMoves).toHaveLength(0);
	});

	it("does nothing when futureMoves is empty", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		const state = game.redo();
		expect(state.pastMoves).toHaveLength(0);
	});

	it("can redo after undo of castling", () => {
		const game = new Game("8/8/8/8/8/8/8/4K2R w K - 0 1");
		game.move(60, 62); // castle kingside
		game.undo(GameMode.twoPlayer);
		const state = game.redo();
		expect(state.board[62].type).toBe(PieceType.KING);
		expect(state.board[61].type).toBe(PieceType.ROOK);
		expect(state.board[60].type).toBe(PieceType.NONE);
		expect(state.board[63].type).toBe(PieceType.NONE);
	});
});

describe("Game.setGameEnded", () => {
	it("setGameEnded(true) is reflected in state", () => {
		const game = new Game();
		game.setGameEnded(true);
		expect(game.state.gameEnded).toBe(true);
	});

	it("setGameEnded(false) clears it", () => {
		const game = new Game();
		game.setGameEnded(true);
		game.setGameEnded(false);
		expect(game.state.gameEnded).toBe(false);
	});

	it("move() resets gameEnded to false", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		game.setGameEnded(true);
		game.move(56, 48);
		expect(game.state.gameEnded).toBe(false);
	});
});

describe("Game.state.fen", () => {
	it("FEN reflects board and turn after move", () => {
		const game = new Game("8/8/8/8/8/8/8/R7 w KQkq - 0 1");
		const state = game.move(56, 48); // rook a1 → a2
		// Rook now at a2; it's black's turn
		expect(state.fen).toContain(" b "); // black to move
	});

	it("initial FEN is the standard starting position", () => {
		const game = new Game();
		expect(game.state.fen).toContain("rnbqkbnr/pppppppp");
	});
});
