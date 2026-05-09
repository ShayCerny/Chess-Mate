// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('./Piece', () => ({ default: () => null }));
import { PastMoveTable } from './PastMoveTable';
import { IHalfTurnMove, MoveType, PieceColor, PieceType } from '../types';

const wPawn: IHalfTurnMove = {
	from: 52, to: 36,
	piece: { type: PieceType.PAWN, color: PieceColor.WHITE },
	type: MoveType.NORMAL,
	pieceTaken: null,
	castlesBefore: 'KQkq',
	enPassantBefore: '-',
	fullTurnBefore: 1,
	halfTurnBefore: 0,
};

const bPawn: IHalfTurnMove = {
	from: 12, to: 28,
	piece: { type: PieceType.PAWN, color: PieceColor.BLACK },
	type: MoveType.NORMAL,
	pieceTaken: null,
	castlesBefore: 'KQkq',
	enPassantBefore: 'e6',
	fullTurnBefore: 1,
	halfTurnBefore: 0,
};

const wRook: IHalfTurnMove = {
	from: 56, to: 48,
	piece: { type: PieceType.ROOK, color: PieceColor.WHITE },
	type: MoveType.NORMAL,
	pieceTaken: null,
	castlesBefore: 'KQkq',
	enPassantBefore: '-',
	fullTurnBefore: 2,
	halfTurnBefore: 1,
};

describe('PastMoveTable', () => {
	it('renders no rows for empty move list', () => {
		const { container } = render(<PastMoveTable pastMoves={[]} />);
		const rows = container.querySelectorAll('tbody tr');
		expect(rows.length).toBe(0);
	});

	it('renders one row with white filled and black empty for one half-move', () => {
		const { container } = render(<PastMoveTable pastMoves={[wPawn]} />);
		const rows = container.querySelectorAll('tbody tr');
		expect(rows.length).toBe(1);
		expect(rows[0].querySelectorAll('td')[0].textContent).not.toBe('');
		expect(rows[0].querySelectorAll('td')[1].textContent).toBe('');
	});

	it('renders one row with both columns filled for two half-moves', () => {
		const { container } = render(<PastMoveTable pastMoves={[wPawn, bPawn]} />);
		const rows = container.querySelectorAll('tbody tr');
		expect(rows.length).toBe(1);
		expect(rows[0].querySelectorAll('td')[0].textContent).not.toBe('');
		expect(rows[0].querySelectorAll('td')[1].textContent).not.toBe('');
	});

	it('renders two rows for three half-moves, second row black empty', () => {
		const { container } = render(<PastMoveTable pastMoves={[wPawn, bPawn, wRook]} />);
		const rows = container.querySelectorAll('tbody tr');
		expect(rows.length).toBe(2);
		expect(rows[1].querySelectorAll('td')[0].textContent).not.toBe('');
		expect(rows[1].querySelectorAll('td')[1].textContent).toBe('');
	});

	it('renders two rows with all columns filled for four half-moves', () => {
		const bRook: IHalfTurnMove = { ...bPawn, piece: { type: PieceType.ROOK, color: PieceColor.BLACK } };
		const { container } = render(<PastMoveTable pastMoves={[wPawn, bPawn, wRook, bRook]} />);
		const rows = container.querySelectorAll('tbody tr');
		expect(rows.length).toBe(2);
		expect(rows[1].querySelectorAll('td')[1].textContent).not.toBe('');
	});
});
