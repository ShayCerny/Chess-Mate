import { GameMode, IHalfTurnMove, IPiece, MoveType, PieceColor, PieceType } from "../types";
import { Board } from "./BoardClass";
import { FenDecoder, FenEncoder, indexToAlgebraic } from "./utils";

const STANDARD_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function algebraicToIndex(sq: string): number {
	if (!sq || sq === "-" || sq.length < 2) return -1;
	const col = sq.charCodeAt(0) - "a".charCodeAt(0);
	const rank = parseInt(sq[1]);
	const row = 8 - rank;
	return row * 8 + col;
}

export interface GameState {
	board: IPiece[];
	pastMoves: IHalfTurnMove[];
	futureMoves: IHalfTurnMove[];
	colorTurn: PieceColor;
	gameEnded: boolean;
	fen: string;
}

export class Game {
	private board: Board;
	private _pastMoves: IHalfTurnMove[] = [];
	private _futureMoves: IHalfTurnMove[] = [];
	private _gameEnded = false;

	constructor(fen: string = STANDARD_FEN) {
		this.board = FenDecoder(fen);
	}

	get state(): GameState {
		return {
			board: [...this.board.squares],
			pastMoves: [...this._pastMoves],
			futureMoves: [...this._futureMoves],
			colorTurn: this.board.colorTurn,
			gameEnded: this._gameEnded,
			fen: FenEncoder(this.board),
		};
	}

	// Applies the move to the board. Does NOT touch _pastMoves or _futureMoves.
	private executeMove(from: number, to: number): { moveType: MoveType; pieceTaken: IPiece | null } {
		const piece = this.board.squares[from];

		// Detect en passant before updating board.enPassant
		const epIndex = algebraicToIndex(this.board.enPassant);
		const isEnPassant =
			to === epIndex &&
			epIndex !== -1 &&
			piece.type === PieceType.PAWN &&
			Math.abs(from % 8 - to % 8) === 1;

		// Update en passant target for the NEXT move
		if (piece.type === PieceType.PAWN && Math.abs(from - to) === 16) {
			const direction = piece.color === PieceColor.WHITE ? -8 : 8;
			this.board.enPassant = indexToAlgebraic(from + direction);
		} else {
			this.board.enPassant = "-";
		}

		// Handle castling (king moves exactly 2 squares)
		if (piece.type === PieceType.KING && Math.abs(to - from) === 2) {
			const isKingside = to > from;
			const moveType = isKingside ? MoveType.KCASTLE : MoveType.QCASTLE;

			this.board.squares[to] = piece;
			this.board.squares[from] = { type: PieceType.NONE, color: PieceColor.NONE };

			if (isKingside) {
				// Rook: h-file (+3) → f-file (+1)
				this.board.squares[from + 1] = this.board.squares[from + 3];
				this.board.squares[from + 3] = { type: PieceType.NONE, color: PieceColor.NONE };
			} else {
				// Rook: a-file (-4) → d-file (-1)
				this.board.squares[from - 1] = this.board.squares[from - 4];
				this.board.squares[from - 4] = { type: PieceType.NONE, color: PieceColor.NONE };
			}

			this.updateCastlingRights(piece, from, to);
			this.board.swapTurn();
			return { moveType, pieceTaken: null };
		}

		// Regular move (normal, attack, en passant)
		const { attacked, moveType: rawMoveType } = this.board.move(from, to, isEnPassant);
		let moveType: MoveType = rawMoveType;
		const pieceTaken = attacked ?? null;

		// Auto-promote pawn reaching the back rank
		if (piece.type === PieceType.PAWN) {
			const toRow = Math.floor(to / 8);
			const isPromotion =
				(piece.color === PieceColor.WHITE && toRow === 0) ||
				(piece.color === PieceColor.BLACK && toRow === 7);
			if (isPromotion) {
				this.board.squares[to] = { type: PieceType.QUEEN, color: piece.color };
				moveType = MoveType.PROMOTION;
			}
		}

		this.updateCastlingRights(piece, from, to);
		this.board.swapTurn();
		return { moveType, pieceTaken };
	}

	private updateCastlingRights(piece: IPiece, from: number, to: number): void {
		// King move removes all rights for that color
		if (piece.type === PieceType.KING) {
			if (piece.color === PieceColor.WHITE) {
				this.board.castles = this.board.castles.replace("K", "").replace("Q", "");
			} else {
				this.board.castles = this.board.castles.replace("k", "").replace("q", "");
			}
		}
		// Rook move or capture on a corner square removes the specific right
		const strip = (idx: number, ch: string) => {
			if (from === idx || to === idx) {
				this.board.castles = this.board.castles.replace(ch, "");
			}
		};
		strip(63, "K"); // White kingside rook (h1)
		strip(56, "Q"); // White queenside rook (a1)
		strip(7, "k");  // Black kingside rook (h8)
		strip(0, "q");  // Black queenside rook (a8)

		if (this.board.castles === "") this.board.castles = "-";
	}

	move(from: number, to: number): GameState {
		this._futureMoves = [];
		this._gameEnded = false;

		const piece = { ...this.board.squares[from] };
		const snapshot: Pick<IHalfTurnMove, "castlesBefore" | "enPassantBefore" | "fullTurnBefore" | "halfTurnBefore"> = {
			castlesBefore: this.board.castles,
			enPassantBefore: this.board.enPassant,
			fullTurnBefore: this.board.fullTurn,
			halfTurnBefore: this.board.halfTurn,
		};

		const { moveType, pieceTaken } = this.executeMove(from, to);

		this._pastMoves.push({ from, to, piece, type: moveType, pieceTaken, ...snapshot });
		return this.state;
	}

	undo(mode: GameMode): GameState {
		const movesToUndo = mode === GameMode.vsComputer ? 2 : 1;
		if (this._pastMoves.length < movesToUndo) return this.state;

		for (let i = 0; i < movesToUndo; i++) {
			const undoneMove = this._pastMoves.pop()!;
			this.board.undo(undoneMove);
			this._futureMoves.push(undoneMove);
		}

		this._gameEnded = false;
		return this.state;
	}

	redo(): GameState {
		if (this._futureMoves.length === 0) return this.state;

		const move = this._futureMoves[this._futureMoves.length - 1];
		this._futureMoves = this._futureMoves.slice(0, -1);

		// Board state is already correct from undo() — just re-execute the move
		this.executeMove(move.from, move.to);
		this._pastMoves.push(move);
		this._gameEnded = false;
		return this.state;
	}

	setGameEnded(ended: boolean): void {
		this._gameEnded = ended;
	}
}
