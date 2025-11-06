import { ChessBoard } from "./ChessBoard";

import "../styles/chess.scss";
import { useEffect, useState } from "react";
import { Board } from "./BoardClass";
import { FenDecoder } from "./utils";
import { PastMoveTable } from "./PastMoveTable";
import { IFullTurnMove, PieceColor, PieceType } from "../types";

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

	const whiteAdvantage = 0.5; // when a move is done it should calculate a new position evaluation and return whiteAdvantage
	const height = `${whiteAdvantage * 100}%`;

	useEffect(() => {
		const loadFen = () => {
			setBoard(FenDecoder(fen));
		};

		loadFen();
	}, [fen]);

	const handleGetMoves = async (index: number) => {
		// TODO get the moves from C++ Node Addon
		setMoves([index - 8, index - 16]); 
	};

	const handleSelect = (index: number) => {
		if (board.atPos(index).color === board.colorTurn && selectedSquare === null) {
			// If its the selected colors turn and there is no piece selected
			setSelectedSquare(index);
			handleGetMoves(index);
		} else if (board.atPos(index).color === board.colorTurn && selectedSquare !== index) {
			// If its the selected colors turn and the selected piece is not the currently selected
			setSelectedSquare(index);
			handleGetMoves(index);
		} else {
			// otherwise deselect
			setSelectedSquare(null);
		}
	};

	const handleMove = (index: number) => {
		let enPassant = false;

		if (selectedSquare === null) return; // if no piece is selected

		if (index === enPassantSquare) enPassant = true; // if the selected move is the enPassant available then this is an enPassant move

		const piece = board.atPos(selectedSquare);
		if (piece.type === PieceType.PAWN && Math.abs(selectedSquare - index) > 8) {
			// get the direction
			const direction = piece.color === "w" ? 8 : -8;

			setEnPassantSqaure(selectedSquare + direction);
		}

		const attacked = board.move(selectedSquare, index, enPassant);
		setSelectedSquare(null); // reset the selected square
		setMoves([] as number[]);
		setPastMoves([]);

		board.swapTurn();
		console.log(board.colorTurn);

		console.log(attacked);
	};

	return (
		<div className="game">
			<ChessBoard board={board.squares} highlight={selectedSquare} moves={moves} handleSelect={handleSelect} handleMove={handleMove} />
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
								<button className="control-btn undo">Undo</button>
								<button className="control-btn redo">Redo</button>
							</div>
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
