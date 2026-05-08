import { GameResult, PieceColor } from "../types";

interface IGameEndModalProps {
	gameResult: GameResult;
	onNewGame: () => void;
	onReview: () => void;
}

function winnerLabel(color: PieceColor): string {
	return color === PieceColor.WHITE ? "White" : "Black";
}

function headline(gameResult: GameResult): string {
	if (gameResult.reason === "checkmate" && gameResult.winner !== undefined) {
		return `Checkmate — ${winnerLabel(gameResult.winner)} wins`;
	}
	if (gameResult.reason === "resign" && gameResult.winner !== undefined) {
		const loser = gameResult.winner === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
		return `${winnerLabel(loser)} resigned — ${winnerLabel(gameResult.winner)} wins`;
	}
	if (gameResult.reason === "draw") {
		return "Draw agreed";
	}
	return "Stalemate — Draw";
}

export const GameEndModal = ({ gameResult, onNewGame, onReview }: IGameEndModalProps) => {
	return (
		<div className="modal-overlay">
			<div className="modal" role="dialog" aria-modal="true">
				<h2 className="modal-headline">{headline(gameResult)}</h2>
				<div className="modal-actions">
					<button className="modal-btn new-game" onClick={onNewGame}>New Game</button>
					<button className="modal-btn review" onClick={onReview}>Review</button>
				</div>
			</div>
		</div>
	);
};
