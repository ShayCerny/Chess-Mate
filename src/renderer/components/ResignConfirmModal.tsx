import { PieceColor } from "../types";

interface IResignConfirmModalProps {
	colorTurn: PieceColor;
	onConfirm: () => void;
	onCancel: () => void;
}

function opponentLabel(colorTurn: PieceColor): string {
	return colorTurn === PieceColor.WHITE ? "Black" : "White";
}

export const ResignConfirmModal = ({ colorTurn, onConfirm, onCancel }: IResignConfirmModalProps) => {
	return (
		<div className="modal-overlay">
			<div className="modal" role="dialog" aria-modal="true">
				<h2 className="modal-headline">Resign?</h2>
				<p className="modal-subtext">{opponentLabel(colorTurn)} will be declared the winner.</p>
				<div className="modal-actions">
					<button className="modal-btn confirm-resign" onClick={onConfirm}>Confirm Resign</button>
					<button className="modal-btn review" onClick={onCancel}>Cancel</button>
				</div>
			</div>
		</div>
	);
};
