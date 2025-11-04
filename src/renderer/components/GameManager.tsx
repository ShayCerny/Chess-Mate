import { ChessBoard } from "./ChessBoard";

import "../styles/chess.scss";
import Piece from "./Piece";

// exportFEN(board)

// undo(moveTree)

// redo(moveTree)

// getHint(board?)

// resign()

// offerDraw()

const emptyBoard = Array(64).fill({ type: "", color: "" });

export const GameManager = () => {
	const board = [...emptyBoard];
	board[1] = {type:"pawn", color:"b"};
	board[1+9] = {type:"pawn", color:"w"}

	const highlight = null;
	const moves = [{square:1+9,type:1}, {square:9, type:0}] as IMove[];
	const pastMoveList = [] as ITurnMove[];
	const whiteAdvantage = 0.5; // when a move is done it should calculate a new position evaluation and return whiteAdvantage
	const height = `${whiteAdvantage * 100}%`;
	return (
		<div className="game">
			<ChessBoard board={board} highlight={highlight} moves={moves} />
			<div className="info">
				<div className="points">
					<div className="inner" style={{ height }}></div>
				</div>
				<div>
					<table id="move-tree">
						<thead>
							<tr>
								<th>
									<Piece type="king" color="w" />
								</th>
								<th>
									<Piece type="king" color="b" />
								</th>
							</tr>
						</thead>
						<tbody>
							{pastMoveList.map((item, index) => (
								<tr key={index}>
									<td>
										<p>{item.white}</p>
									</td>
									<td>
										<p>{item.black}</p>
									</td>
								</tr>
							))}
						</tbody>
					</table>
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
