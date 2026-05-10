import { ChessBoard } from "./ChessBoard";
import { GameEndModal } from "./GameEndModal";
import { ResignConfirmModal } from "./ResignConfirmModal";

import "../styles/chess.scss";
import { useState, useEffect, useRef } from "react";
import { Game } from "./Game";
import { resolveClickAction, resolveGameResult, resolveGameStatus } from "./utils";
import { PastMoveTable } from "./PastMoveTable";
import { Difficulty, GameConfig, GameMode, GameResult, IHalfTurnMove, IPiece, PieceColor, PlayerColor } from "../types";

type IGameProps = GameConfig & { onReturnToMenu: () => void };

const DIFFICULTY_LEVEL: Record<Difficulty, number> = {
	[Difficulty.easy]: 0,
	[Difficulty.medium]: 1,
	[Difficulty.hard]: 2,
};

export const GameManager = ({ mode, difficulty, playerColor, onReturnToMenu }: IGameProps) => {
	const gameRef = useRef<Game>(new Game());

	const [board, setBoard] = useState<IPiece[]>(() => gameRef.current.state.board);
	const [colorTurn, setColorTurn] = useState<PieceColor>(() => gameRef.current.state.colorTurn);
	const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
	const [moves, setMoves] = useState<number[]>([]);
	const [allMoves, setAllMoves] = useState<number[][]>([]);
	const [pastMoves, setPastMoves] = useState<IHalfTurnMove[]>([]);
	const [futureMoves, setFutureMoves] = useState<IHalfTurnMove[]>([]);
	const [checkSquare, setCheckSquare] = useState<number | null>(null);
	const [gameResult, setGameResult] = useState<GameResult | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [resignConfirmVisible, setResignConfirmVisible] = useState(false);

	const whiteAdvantage = 0.5;
	const height = `${whiteAdvantage * 100}%`;

	const syncFromGame = () => {
		const gs = gameRef.current.state;
		setBoard(gs.board);
		setColorTurn(gs.colorTurn);
		setPastMoves(gs.pastMoves);
		setFutureMoves(gs.futureMoves);
	};

	const refreshStatus = async (fen: string) => {
		const { moves: legalMoves, checkSquare: cs } = await window.electronAPI.getGameState(fen);
		setAllMoves(legalMoves);
		setCheckSquare(cs);
		const status = resolveGameStatus(legalMoves.length, cs !== null);
		const result = resolveGameResult(status, gameRef.current.state.colorTurn);
		if (result !== null) {
			gameRef.current.setGameEnded(true);
			setGameResult(result);
			setModalVisible(true);
		}
	};

	const scheduleBestMove = (fen: string) => {
		setTimeout(async () => {
			if (gameRef.current.state.gameEnded) return;
			const move = await window.electronAPI.getBestMove(fen, DIFFICULTY_LEVEL[difficulty]);
			if (!move || gameRef.current.state.gameEnded) return;
			const gs = gameRef.current.move(move[0], move[1]);
			syncFromGame();
			setSelectedSquare(null);
			setMoves([]);
			refreshStatus(gs.fen);
		}, 500);
	};

	useEffect(() => {
		const fen = gameRef.current.state.fen;
		window.electronAPI.getGameState(fen).then(({ moves: legalMoves, checkSquare: cs }) => {
			setAllMoves(legalMoves);
			setCheckSquare(cs);
		});
		if (mode === GameMode.vsComputer && playerColor === PlayerColor.black) {
			scheduleBestMove(fen);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleGetMoves = (index: number) => {
		setMoves(allMoves.filter(pair => pair[0] === index).map(pair => pair[1]));
	};

	const handleSelect = (index: number) => {
		const action = resolveClickAction(board[index].color, colorTurn, selectedSquare, index);
		if (action === "select" || action === "reselect") {
			setSelectedSquare(index);
			handleGetMoves(index);
		} else {
			setSelectedSquare(null);
			setMoves([]);
		}
	};

	const handleMove = (index: number) => {
		if (selectedSquare === null) return;
		const gs = gameRef.current.move(selectedSquare, index);
		syncFromGame();
		setSelectedSquare(null);
		setMoves([]);
		refreshStatus(gs.fen);
		if (mode === GameMode.vsComputer) scheduleBestMove(gs.fen);
	};

	const handleResignClick = () => setResignConfirmVisible(true);

	const handleResignConfirm = () => {
		setResignConfirmVisible(false);
		onReturnToMenu();
	};

	const handleOfferDraw = () => {
		setGameResult({ reason: "draw" });
		setModalVisible(true);
	};

	const movesToUndo = mode === GameMode.vsComputer ? 2 : 1;

	const handleUndo = () => {
		const gs = gameRef.current.undo(mode);
		syncFromGame();
		setSelectedSquare(null);
		setMoves([]);
		refreshStatus(gs.fen);
	};

	const handleRedo = () => {
		const gs = gameRef.current.redo();
		syncFromGame();
		setSelectedSquare(null);
		setMoves([]);
		refreshStatus(gs.fen);
	};

	return (
		<div className="game">
			{modalVisible && gameResult !== null && (
				<GameEndModal
					gameResult={gameResult}
					onReturnToMenu={onReturnToMenu}
					onReview={() => setModalVisible(false)}
				/>
			)}
			{resignConfirmVisible && (
				<ResignConfirmModal
					colorTurn={colorTurn}
					onConfirm={handleResignConfirm}
					onCancel={() => setResignConfirmVisible(false)}
				/>
			)}
			<ChessBoard
				board={board}
				highlight={selectedSquare}
				moves={moves}
				colorTurn={colorTurn}
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
								<button className="control-btn undo" onClick={handleUndo} disabled={pastMoves.length < movesToUndo}>
									Undo
								</button>
								<button className="control-btn redo" onClick={handleRedo} disabled={futureMoves.length === 0}>Redo</button>
							</div>
							<button className="control-btn main-menu" onClick={onReturnToMenu}>Main Menu</button>
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
