import { IHalfTurnMove, PieceColor, PieceType } from "../types";
import Piece from "./Piece";

interface IPastMoveTableProps {
	pastMoves: IHalfTurnMove[];
}

const files = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const PastMoveTable = ({ pastMoves }: IPastMoveTableProps) => {
	type ActivePieceColor = Exclude<PieceColor, PieceColor.NONE>;

	const pieces: Record<PieceType, Record<ActivePieceColor, string>> = {
		[PieceType.KING]: { [PieceColor.WHITE]: "♔", [PieceColor.BLACK]: "♚" },
		[PieceType.QUEEN]: { [PieceColor.WHITE]: "♕", [PieceColor.BLACK]: "♛" },
		[PieceType.ROOK]: { [PieceColor.WHITE]: "♖", [PieceColor.BLACK]: "♜" },
		[PieceType.BISHOP]: { [PieceColor.WHITE]: "♗", [PieceColor.BLACK]: "♝" },
		[PieceType.KNIGHT]: { [PieceColor.WHITE]: "♘", [PieceColor.BLACK]: "♞" },
		[PieceType.PAWN]: { [PieceColor.WHITE]: "♙", [PieceColor.BLACK]: "♟" },
		[PieceType.NONE]: { [PieceColor.WHITE]: "", [PieceColor.BLACK]: "" },
	};

	function getNotation(move: IHalfTurnMove) {
		const movedPiece = move.piece;

		if (movedPiece.color === PieceColor.NONE) return null;

		const symbol = pieces[movedPiece.type][movedPiece.color];

		const toSquare = move.to;
		const col = toSquare % 8;
		const file = files[col];
		const rank = Math.floor(toSquare / 8);
		const spaceCode = `${file}${rank + 1}`;

		const isCapture = move.pieceTaken;

		return <p>{`${symbol} ${isCapture ? "x" : ""}${spaceCode}`}</p>;
	}

	const pairs: [IHalfTurnMove, IHalfTurnMove | null][] = [];
	for (let i = 0; i < pastMoves.length; i += 2) {
		pairs.push([pastMoves[i], pastMoves[i + 1] ?? null]);
	}

	return (
		<table id="move-tree">
			<thead>
				<tr>
					<th>
						<Piece type="k" color="w" />
					</th>
					<th>
						<Piece type="k" color="b" />
					</th>
				</tr>
			</thead>
			<tbody>
				{pairs.map(([white, black], index) => (
					<tr key={index}>
						<td>{getNotation(white)}</td>
						<td>{black && getNotation(black)}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};
