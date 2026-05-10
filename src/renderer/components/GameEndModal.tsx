import { GameResult, PieceColor } from "../types";

interface IGameEndModalProps {
	gameResult: GameResult;
	onReturnToMenu: () => void;
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

export const GameEndModal = ({ gameResult, onReturnToMenu, onReview }: IGameEndModalProps) => {
	return (
		<div className="modal-overlay">
			<div className="modal" role="dialog" aria-modal="true">
				<h2 className="modal-headline">{headline(gameResult)}</h2>
				<div className="modal-actions">
					<button className="modal-btn return-to-menu" onClick={onReturnToMenu}>Return to Menu</button>
					<button className="modal-btn review" onClick={onReview}>Review</button>
				</div>
			</div>
		</div>
	);
};
