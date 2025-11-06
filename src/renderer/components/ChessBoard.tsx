import { IBoardProps, PieceType } from "../types";
import Piece from "./Piece";

import "./board.scss";

const files = ["A", "B", "C", "D", "E", "F", "G", "H"];

const NormalMove = () => {
	return (
		<svg height={100} width={100}>
			<circle r="25%" cx="50%" cy="50%" fill="#41414177" />
		</svg>
	);
};

const AttackMove = () => {
	return (
		<svg height={100} width={100}>
			<circle r="45%" cx="50%" cy="50%" fill="none" stroke="#41414177" strokeWidth="8" />
		</svg>
	);
};

export const ChessBoard = ({ board, highlight, moves, handleSelect, handleMove }: IBoardProps) => {
	return (
		<div className="board">
			{board.map((p, index) => {
				const col = index % 8;
				const file = files[col];
				const rank =  7 - Math.floor(index / 8);

				const isLight = (col + rank) % 2 != 0;
				const spaceCode = `${file}${rank + 1}`;
				const hasPiece = p.type !== "";

				const isMove = moves.includes(index);

				return (
					<div className={`square ${isLight ? "light" : "dark"} ${index == highlight ? "selected" : null} ${hasPiece ? "piece" : null}`} key={index} onClick={() => handleSelect(index)}>
						{isMove && (
							<div className="move" onClick={() => handleMove(index, false)}>
								{board[index].type === "" ? <NormalMove /> : <AttackMove />}
							</div>
						)}
						<div className="space-code">
							<p>{spaceCode}</p>
						</div>
						{p.type !== PieceType.NONE && <Piece type={p.type} color={p.color} />}
					</div>
				);
			})}
		</div>
	);
};
