import { ChessBoard } from "./ChessBoard";
import { GameEndModal } from "./GameEndModal";
import { ResignConfirmModal } from "./ResignConfirmModal";

import "../styles/chess.scss";
import { useState, useEffect } from "react";
import { Board } from "./BoardClass";
import { FenDecoder, FenEncoder, indexToAlgebraic, resolveClickAction, resolveGameResult, resolveGameStatus } from "./utils";
import { PastMoveTable } from "./PastMoveTable";
import { GameConfig, GameResult, IFullTurnMove, IHalfTurnMove, MoveType, PieceColor, PieceType } from "../types";

type IGameProps = GameConfig & { onReturnToMenu: () => void };

const standardFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const GameManager = ({ onReturnToMenu }: IGameProps) => {
	const [board, setBoard] = useState(() => FenDecoder(standardFen));
	const [selectedSquare, setSelectedSquare] = useState(null as null | number);
	const [enPassantSquare, setEnPassantSqaure] = useState(null as null | number);

	const [moves, setMoves] = useState([] as number[]);
	const [allMoves, setAllMoves] = useState<number[][]>([]);
	const [pastMoves, setPastMoves] = useState([] as IFullTurnMove[]);
	const [futureMoves, setFutureMoves] = useState([] as IHalfTurnMove[]);
	const [checkSquare, setCheckSquare] = useState<number | null>(null);
	const [gameResult, setGameResult] = useState<GameResult | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [resignConfirmVisible, setResignConfirmVisible] = useState(false);

	const whiteAdvantage = 0.5; // when a move is done it should calculate a new position evaluation and return whiteAdvantage
	const height = `${whiteAdvantage * 100}%`;

	useEffect(() => {
		const fen = FenEncoder(board);
		window.electronAPI.getGameState(fen).then(({ moves: legalMoves, checkSquare: cs }) => {
			setAllMoves(legalMoves);
			setCheckSquare(cs);
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const refreshStatus = async (updatedBoard: Board) => {
		const fen = FenEncoder(updatedBoard);
		const { moves: legalMoves, checkSquare: cs } = await window.electronAPI.getGameState(fen);
		setAllMoves(legalMoves);
		const status = resolveGameStatus(legalMoves.length, cs !== null);
		const result = resolveGameResult(status, updatedBoard.colorTurn);
		setGameResult(result);
		if (result !== null) setModalVisible(true);
		setCheckSquare(cs);
	};

	const handleGetMoves = (index: number) => {
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

		// Snapshot before updating en passant so undo can restore the correct ep state
		const snapshot = {
			castlesBefore: board.castles,
			enPassantBefore: board.enPassant,
			fullTurnBefore: board.fullTurn,
			halfTurnBefore: board.halfTurn,
		};

		if (piece.type === PieceType.PAWN && Math.abs(selectedSquare - index) === 16) {
			const direction = piece.color === "w" ? -8 : 8;
			const epIndex = selectedSquare + direction;
			setEnPassantSqaure(epIndex);
			board.enPassant = indexToAlgebraic(epIndex);
		} else {
			setEnPassantSqaure(null);
			board.enPassant = "-";
		}

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
		setGameResult(null);
		setCheckSquare(null);
		setModalVisible(false);
		setResignConfirmVisible(false);
	};

	const handleResignClick = () => setResignConfirmVisible(true);

	const handleResignConfirm = () => {
		const opponent = board.colorTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
		setGameResult({ reason: "resign", winner: opponent });
		setModalVisible(true);
		setResignConfirmVisible(false);
	};

	const handleOfferDraw = () => {
		setGameResult({ reason: "draw" });
		setModalVisible(true);
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
			const direction = move.piece.color === PieceColor.WHITE ? -8 : 8;
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
			{resignConfirmVisible && (
				<ResignConfirmModal
					colorTurn={board.colorTurn}
					onConfirm={handleResignConfirm}
					onCancel={() => setResignConfirmVisible(false)}
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
							<button className="control-btn" onClick={onReturnToMenu}>Return to Menu</button>
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
							<button className="control-btn resign" onClick={handleResignClick} disabled={gameResult !== null}>Resign</button>
							<button className="control-btn draw" onClick={handleOfferDraw} disabled={gameResult !== null}>Offer Draw</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
