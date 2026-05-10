// @vitest-environment jsdom
import { render, cleanup, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./Piece', () => ({ default: () => null }));
import { GameManager } from './GameManager';
import { Difficulty, GameMode, PlayerColor } from '../types';

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

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

describe('vsComputer mode', () => {
	it('calls getBestMove after human move', async () => {
		vi.useFakeTimers();
		setupElectronAPI([[52, 36], [52, 44]]);

		const { container } = render(<GameManager {...defaultProps} mode={GameMode.vsComputer} />);
		await act(async () => { await Promise.resolve(); });

		const squares = container.querySelectorAll('.square');
		fireEvent.click(squares[52]);
		fireEvent.click(squares[36].querySelector('.move')!);

		expect(window.electronAPI.getBestMove).not.toHaveBeenCalled();

		await act(async () => {
			vi.advanceTimersByTime(500);
			await Promise.resolve();
		});

		expect(window.electronAPI.getBestMove).toHaveBeenCalled();
	});

	it('does not call getBestMove in twoPlayer mode', async () => {
		vi.useFakeTimers();
		setupElectronAPI([[52, 36], [52, 44]]);

		const { container } = render(<GameManager {...defaultProps} mode={GameMode.twoPlayer} />);
		await act(async () => { await Promise.resolve(); });

		const squares = container.querySelectorAll('.square');
		fireEvent.click(squares[52]);
		fireEvent.click(squares[36].querySelector('.move')!);

		await act(async () => {
			vi.advanceTimersByTime(500);
			await Promise.resolve();
		});

		expect(window.electronAPI.getBestMove).not.toHaveBeenCalled();
	});

	it('calls getBestMove on mount when playing as Black', async () => {
		vi.useFakeTimers();
		setupElectronAPI([[8, 16]]);

		render(<GameManager {...defaultProps} mode={GameMode.vsComputer} playerColor={PlayerColor.black} />);

		expect(window.electronAPI.getBestMove).not.toHaveBeenCalled();

		await act(async () => {
			vi.advanceTimersByTime(500);
			await Promise.resolve();
		});

		expect(window.electronAPI.getBestMove).toHaveBeenCalled();
	});

	it('does not call getBestMove on mount when playing as White', async () => {
		vi.useFakeTimers();
		setupElectronAPI([[52, 36]]);

		render(<GameManager {...defaultProps} mode={GameMode.vsComputer} playerColor={PlayerColor.white} />);

		await act(async () => {
			vi.advanceTimersByTime(500);
			await Promise.resolve();
		});

		expect(window.electronAPI.getBestMove).not.toHaveBeenCalled();
	});
});

describe('Resign', () => {
	it('calls onReturnToMenu after resign confirmation and does not show result modal', async () => {
		const onReturnToMenu = vi.fn();
		setupElectronAPI();
		const { getByText, queryByRole } = render(
			<GameManager {...defaultProps} onReturnToMenu={onReturnToMenu} />
		);
		await waitFor(() => expect(window.electronAPI.getGameState).toHaveBeenCalled());

		fireEvent.click(getByText('Resign'));
		fireEvent.click(getByText('Confirm Resign'));

		expect(onReturnToMenu).toHaveBeenCalled();
		expect(queryByRole('dialog')).toBeNull();
	});
});

describe('Navigation', () => {
	it('result modal has Return to Menu button', async () => {
		setupElectronAPI([], null);
		const { getByText } = render(<GameManager {...defaultProps} />);
		await waitFor(() => expect(window.electronAPI.getGameState).toHaveBeenCalled());

		fireEvent.click(getByText('Offer Draw'));

		expect(getByText('Return to Menu')).toBeTruthy();
	});

	it('sidebar has Main Menu button that calls onReturnToMenu', async () => {
		const onReturnToMenu = vi.fn();
		setupElectronAPI();
		const { getAllByText } = render(<GameManager {...defaultProps} onReturnToMenu={onReturnToMenu} />);
		await waitFor(() => expect(window.electronAPI.getGameState).toHaveBeenCalled());

		fireEvent.click(getAllByText('Main Menu')[0]);

		expect(onReturnToMenu).toHaveBeenCalled();
	});
});
