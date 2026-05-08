import { ChessBoard } from "./ChessBoard";
import { GameEndModal } from "./GameEndModal";

import "../styles/chess.scss";
import { useEffect, useState } from "react";
import { Board } from "./BoardClass";
import { FenDecoder, FenEncoder, GameStatus, indexToAlgebraic, resolveClickAction, resolveGameResult, resolveGameStatus, turnLabel } from "./utils";
import { PastMoveTable } from "./PastMoveTable";
import { GameResult, IFullTurnMove, IHalfTurnMove, MoveType, PieceColor, PieceType } from "../types";

// exportFEN(board)

// undo(moveTree)

// redo(moveTree)

// getHint(board?)

// resign()

// offerDraw()

interface IGameProps {
	fen: string;
}

export const GameManager = ({ fen }: IGameProps) => {
	const [board, setBoard] = useState(new Board([], PieceColor.WHITE, "", "", 1, 0));
	const [selectedSquare, setSelectedSquare] = useState(null as null | number);
	const [enPassantSquare, setEnPassantSqaure] = useState(null as null | number);

	const [moves, setMoves] = useState([] as number[]);
	const [pastMoves, setPastMoves] = useState([] as IFullTurnMove[]);
	const [futureMoves, setFutureMoves] = useState([] as IHalfTurnMove[]);
	const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
	const [checkSquare, setCheckSquare] = useState<number | null>(null);
	const [gameResult, setGameResult] = useState<GameResult | null>(null);
	const [modalVisible, setModalVisible] = useState(false);

	const whiteAdvantage = 0.5; // when a move is done it should calculate a new position evaluation and return whiteAdvantage
	const height = `${whiteAdvantage * 100}%`;

	useEffect(() => {
		const loadFen = () => {
			setBoard(FenDecoder(fen));
		};

		loadFen();
	}, [fen]);

	const refreshStatus = async (updatedBoard: Board) => {
		const fen = FenEncoder(updatedBoard);
		const [allMoves, inCheck] = await Promise.all([
			window.electronAPI.getLegalMoves(fen),
			window.electronAPI.isInCheck(fen),
		]);
		const status = resolveGameStatus(allMoves.length, inCheck);
		setGameStatus(status);
		const result = resolveGameResult(status, updatedBoard.colorTurn);
		setGameResult(result);
		if (result !== null) setModalVisible(true);
		if (status === "check" || status === "checkmate") {
			const kingIdx = updatedBoard.squares.findIndex(
				s => s.type === PieceType.KING && s.color === updatedBoard.colorTurn
			);
			setCheckSquare(kingIdx >= 0 ? kingIdx : null);
		} else {
			setCheckSquare(null);
		}
	};

	const handleGetMoves = async (index: number) => {
		const fen = FenEncoder(board);
		const allMoves: number[][] = await window.electronAPI.getLegalMoves(fen);
		setMoves(allMoves.filter(pair => pair[0] === index).map(pair => pair[1]));
	};

	const handleSelect = (index: number) => {
		const action = resolveClickAction(board.atPos(index).color, board.colorTurn, selectedSquare, index);
		if (action === "select" || action === "reselect") {
			setSelectedSquare(index);
			handleGetMoves(index);
		} else {
			setSelectedSquare(null);
			setMoves([] as number[]);
		}
	};

	const handleMove = (index: number) => {
		setEnPassantSqaure(null);
		setFutureMoves([]);

		if (selectedSquare === null) return;

		let enPassant = false;
		if (
			index === enPassantSquare &&
			board.squares[selectedSquare].type == PieceType.PAWN &&
			(selectedSquare == index + 9 ||
				selectedSquare == index + 7 ||
				selectedSquare == index - 7 ||
				selectedSquare == index - 9)
		)
			enPassant = true;

		const piece = board.atPos(selectedSquare);
		if (piece.type === PieceType.PAWN && Math.abs(selectedSquare - index) === 16) {
			const direction = piece.color === "w" ? 8 : -8;
			const epIndex = selectedSquare + direction;
			setEnPassantSqaure(epIndex);
			board.enPassant = indexToAlgebraic(epIndex);
		} else {
			board.enPassant = "-";
		}

		const snapshot = {
			castlesBefore: board.castles,
			enPassantBefore: board.enPassant,
			fullTurnBefore: board.fullTurn,
			halfTurnBefore: board.halfTurn,
		};

		const { attacked, movedPiece, moveType } = board.move(selectedSquare, index, enPassant);
		setSelectedSquare(null);
		setMoves([] as number[]);

		const lastMove: IHalfTurnMove = {
			from: selectedSquare,
			to: index,
			piece: movedPiece,
			type: moveType,
			pieceTaken: attacked ?? null,
			...snapshot,
		};

		const tempPastMoves = [...pastMoves];
		if (board.colorTurn === PieceColor.WHITE) {
			tempPastMoves.push({ white: lastMove, black: null });
		} else {
			tempPastMoves[tempPastMoves.length - 1].black = lastMove;
		}
		setPastMoves(tempPastMoves);

		board.swapTurn();
		const newBoard = new Board([...board.squares], board.colorTurn, board.castles, board.enPassant, board.fullTurn, board.halfTurn);
		setBoard(newBoard);
		refreshStatus(newBoard);
	};

	const handleNewGame = () => {
		const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
		setBoard(FenDecoder(startFen));
		setSelectedSquare(null);
		setEnPassantSqaure(null);
		setMoves([]);
		setPastMoves([]);
		setFutureMoves([]);
		setGameStatus("playing");
		setGameResult(null);
		setCheckSquare(null);
		setModalVisible(false);
	};

	const handleUndo = () => {
		if (pastMoves.length === 0) return;

		const last = pastMoves[pastMoves.length - 1];
		let undoneMove: IHalfTurnMove;
		if (last.black !== null) {
			undoneMove = last.black;
			board.undo(last.black);
			const tempPastMoves = [...pastMoves];
			tempPastMoves[tempPastMoves.length - 1] = { ...last, black: null };
			setPastMoves(tempPastMoves);
		} else {
			undoneMove = last.white;
			board.undo(last.white);
			setPastMoves(pastMoves.slice(0, -1));
		}
		setFutureMoves([...futureMoves, undoneMove]);
		const newBoard = new Board([...board.squares], board.colorTurn, board.castles, board.enPassant, board.fullTurn, board.halfTurn);
		setBoard(newBoard);
		refreshStatus(newBoard);
	};

	const handleRedo = () => {
		if (futureMoves.length === 0) return;

		const move = futureMoves[futureMoves.length - 1];
		setFutureMoves(futureMoves.slice(0, -1));

		const isEnPassant = move.type === MoveType.ENPASSANT;
		board.move(move.from, move.to, isEnPassant);

		if (move.piece.type === PieceType.PAWN && Math.abs(move.from - move.to) === 16) {
			const direction = move.piece.color === PieceColor.WHITE ? 8 : -8;
			const epIndex = move.from + direction;
			setEnPassantSqaure(epIndex);
			board.enPassant = indexToAlgebraic(epIndex);
		} else {
			setEnPassantSqaure(null);
			board.enPassant = "-";
		}

		const tempPastMoves = [...pastMoves];
		if (board.colorTurn === PieceColor.WHITE) {
			tempPastMoves.push({ white: move, black: null });
		} else {
			tempPastMoves[tempPastMoves.length - 1].black = move;
		}
		setPastMoves(tempPastMoves);

		board.swapTurn();
		const newBoard = new Board([...board.squares], board.colorTurn, board.castles, board.enPassant, board.fullTurn, board.halfTurn);
		setBoard(newBoard);
		refreshStatus(newBoard);
	};

	return (
		<div className="game">
			{modalVisible && gameResult !== null && (
				<GameEndModal
					gameResult={gameResult}
					onNewGame={handleNewGame}
					onReview={() => setModalVisible(false)}
				/>
			)}
			<ChessBoard
				board={board.squares}
				highlight={selectedSquare}
				moves={moves}
				colorTurn={board.colorTurn}
				checkSquare={checkSquare}
				locked={gameResult !== null}
				handleSelect={handleSelect}
				handleMove={handleMove}
			/>
			<div className="info">
				<div className="points">
					<div className="inner" style={{ height }}></div>
				</div>
				<div>
					<div className={`turn-indicator ${board.colorTurn === PieceColor.WHITE ? "white" : "black"}${gameStatus === "check" ? " in-check" : ""}`}>
						<span className="turn-circle" />
						<span className="turn-text">
							{gameStatus === "check"
								? `${board.colorTurn === PieceColor.WHITE ? "White" : "Black"} is in check`
								: turnLabel(board.colorTurn)}
						</span>
					</div>
					<PastMoveTable pastMoves={pastMoves} />
					<div className="controls">
						<div className="group">
							<h3 className="group-title">Game Controls</h3>
							<button className="control-btn export">Export FEN</button>
							<div className="row">
								<button className="control-btn undo" onClick={handleUndo} disabled={pastMoves.length === 0}>
									Undo
								</button>
								<button className="control-btn redo" onClick={handleRedo} disabled={futureMoves.length === 0}>Redo</button>
							</div>
							<button className="control-btn new-game" onClick={handleNewGame}>New Game</button>
						</div>
						<hr />
						<div className="group">
							<h3 className="group-title">Assistance</h3>
							<div className="row">
								<button className="control-btn hint">Get Hint</button>
								<button className="control-btn">Settings</button>
							</div>
						</div>
						<hr />
						<div className="group">
							<h3 className="group-title">Game Options</h3>
							<button className="control-btn resign">Resign</button>
							<button className="control-btn draw">Offer Draw</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
