// @vitest-environment jsdom
import { render, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./Piece', () => ({ default: () => null }));
import { GameManager } from './GameManager';
import { Difficulty, GameMode, PlayerColor } from '../types';

afterEach(cleanup);

const defaultProps = {
	mode: GameMode.twoPlayer,
	difficulty: Difficulty.medium,
	playerColor: PlayerColor.white,
	onReturnToMenu: vi.fn(),
};

function setupElectronAPI(moves: number[][] = [], checkSquare: number | null = null) {
	const mockGetGameState = vi.fn().mockResolvedValue({ moves, checkSquare });
	Object.defineProperty(window, 'electronAPI', {
		value: {
			getGameState: mockGetGameState,
			getBestMove: vi.fn().mockResolvedValue(null),
		},
		writable: true,
		configurable: true,
	});
	return mockGetGameState;
}

// Tracer bullet: getGameState is called on mount
describe('GameManager IPC', () => {
	it('calls getGameState on mount', async () => {
		const mockGetGameState = setupElectronAPI();
		render(<GameManager {...defaultProps} />);
		await waitFor(() => expect(mockGetGameState).toHaveBeenCalledTimes(1));
	});

	// White e2 pawn (index 52) moves to e4 (index 36)
	it('calls getGameState exactly once after a move', async () => {
		const mockGetGameState = setupElectronAPI([[52, 36], [52, 44]]);
		const { container } = render(<GameManager {...defaultProps} />);
		await waitFor(() => expect(mockGetGameState).toHaveBeenCalledTimes(1));

		const squares = container.querySelectorAll('.square');
		fireEvent.click(squares[52]);
		fireEvent.click(squares[36].querySelector('.move')!);

		await waitFor(() => expect(mockGetGameState).toHaveBeenCalledTimes(2));
	});

	it('shows moves from cache on piece click without additional IPC call', async () => {
		// e2 pawn (index 52) can reach e3 (44) and e4 (36)
		const mockGetGameState = setupElectronAPI([[52, 36], [52, 44]]);
		const { container } = render(<GameManager {...defaultProps} />);
		await waitFor(() => expect(mockGetGameState).toHaveBeenCalledTimes(1));
		const callsBefore = mockGetGameState.mock.calls.length;

		const squares = container.querySelectorAll('.square');
		fireEvent.click(squares[52]);

		expect(mockGetGameState).toHaveBeenCalledTimes(callsBefore);
		expect(squares[36].querySelector('.move')).not.toBeNull();
		expect(squares[44].querySelector('.move')).not.toBeNull();
	});

	it('marks the check square with in-check class when getGameState returns a checkSquare', async () => {
		// White king starts at index 60; mock a check from the start
		setupElectronAPI([], 60);
		const { container } = render(<GameManager {...defaultProps} />);

		await waitFor(() => {
			const squares = container.querySelectorAll('.square');
			expect(squares[60].classList.contains('in-check')).toBe(true);
		});
	});
});
