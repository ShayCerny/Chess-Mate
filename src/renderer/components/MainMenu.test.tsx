// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(cleanup);
import { MainMenu } from './MainMenu';
import { Difficulty, GameMode, PlayerColor } from '../types';

describe('MainMenu', () => {
	it('always renders the color selector', () => {
		render(<MainMenu onStart={vi.fn()} />);
		expect(screen.getByLabelText('Play as')).not.toBeNull();
	});

	it('hides difficulty selector in twoPlayer mode (default)', () => {
		render(<MainMenu onStart={vi.fn()} />);
		expect(screen.queryByLabelText('Difficulty')).toBeNull();
	});

	it('shows difficulty selector when vsComputer is selected', () => {
		render(<MainMenu onStart={vi.fn()} />);
		fireEvent.change(screen.getByLabelText('Mode'), { target: { value: GameMode.vsComputer } });
		expect(screen.getByLabelText('Difficulty')).not.toBeNull();
	});

	it('hides difficulty selector when switching back to twoPlayer', () => {
		render(<MainMenu onStart={vi.fn()} />);
		fireEvent.change(screen.getByLabelText('Mode'), { target: { value: GameMode.vsComputer } });
		fireEvent.change(screen.getByLabelText('Mode'), { target: { value: GameMode.twoPlayer } });
		expect(screen.queryByLabelText('Difficulty')).toBeNull();
	});

	it('calls onStart with correct GameConfig on submit', () => {
		const onStart = vi.fn();
		render(<MainMenu onStart={onStart} />);

		fireEvent.change(screen.getByLabelText('Mode'), { target: { value: GameMode.vsComputer } });
		fireEvent.change(screen.getByLabelText('Difficulty'), { target: { value: Difficulty.hard } });
		fireEvent.change(screen.getByLabelText('Play as'), { target: { value: PlayerColor.black } });
		fireEvent.click(screen.getByRole('button', { name: 'Start Game' }));

		expect(onStart).toHaveBeenCalledWith({
			mode: GameMode.vsComputer,
			difficulty: Difficulty.hard,
			playerColor: PlayerColor.black,
		});
	});

	it('submits twoPlayer defaults without changes', () => {
		const onStart = vi.fn();
		render(<MainMenu onStart={onStart} />);
		fireEvent.click(screen.getByRole('button', { name: 'Start Game' }));

		expect(onStart).toHaveBeenCalledWith({
			mode: GameMode.twoPlayer,
			difficulty: Difficulty.medium,
			playerColor: PlayerColor.white,
		});
	});
});
