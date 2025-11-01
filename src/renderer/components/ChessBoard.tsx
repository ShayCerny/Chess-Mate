// Get Starting Board State(FEN)

import Piece from "./Piece";

// Get Moves (pos)

// Move Piece(from, to, special?)
const files = ["a","b","c","d","e","f","g","h"];

export const ChessBoard = () => {
	const emptyBoard: IPiece[] = Array(64).fill({ type: "", color: "" });
	return (
		<div className="board">
			{emptyBoard.map((p, index) => {
                const row = Math.floor(index / 8);
                const col = index % 8;
                const isLight = (row + col) % 2 === 0;
                const file = files[col]
                const rank = 8 - row;
                const spaceCode = `${file}${rank}`
				return (
					<div className={`square ${isLight ? "light" : "dark"}`} key={index}>
						<div className="space-code">
							<p>{spaceCode}</p>
						</div>
						{p.type !== "" ? <Piece type={p.type} color={p.type} /> : null}
					</div>
				);
			})}
		</div>
	);
};
