import { useEffect } from "react";
import Piece from "./Piece";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

const NormalMove = () => {
	return (
		<svg height={100} width={100}>
			<circle r="25%" cx="50%" cy="50%" fill="#41414177"/>
		</svg>
	);
};

const AttackMove = () => {
	return (
		<svg height={100} width={100}>
			<circle r="45%" cx="50%" cy="50%" fill="none" stroke="#41414177" stroke-width="10"/>
		</svg>
	);
};

export const ChessBoard = ({ board, highlight, moves }: IBoardProps) => {
	useEffect(() => {}, [board]);
	return (
		<div className="board">
			{board.map((p, index) => {
				const row = Math.floor(index / 8);
				const col = index % 8;
				const isLight = (row + col) % 2 === 0;
				const file = files[col];
				const rank = 8 - row;
				const spaceCode = `${file}${rank}`;
				return (
					<div
						className={`square ${isLight ? "light" : "dark"} ${
							index == highlight ? "selected" : null
						}`}
						key={index}
					>
						{moves.map((m) =>
							m.square == index ? (
								<div className="move">
									{m.type == 0 ? <NormalMove/> : <AttackMove/>}
								</div>
							) : null
						)}
						<div className="space-code">
							<p>{spaceCode}</p>
						</div>
						{p.type !== "" ? <Piece type={p.type} color={p.color} /> : null}
					</div>
				);
			})}
		</div>
	);
};
