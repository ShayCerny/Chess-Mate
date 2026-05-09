import { useState } from 'react';
import { Difficulty, GameConfig, GameMode, PlayerColor } from '../types';

interface IMainMenuProps {
	onStart: (config: GameConfig) => void;
}

export const MainMenu = ({ onStart }: IMainMenuProps) => {
	const [mode, setMode] = useState<GameMode>(GameMode.twoPlayer);
	const [playerColor, setPlayerColor] = useState<PlayerColor>(PlayerColor.white);
	const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.medium);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onStart({ mode, difficulty, playerColor });
	};

	return (
		<div className="main-menu">
			<h1>ChessMate</h1>
			<form onSubmit={handleSubmit}>
				<div className="field">
					<label htmlFor="mode">Mode</label>
					<select id="mode" value={mode} onChange={(e) => setMode(e.target.value as GameMode)}>
						<option value={GameMode.twoPlayer}>Two Player</option>
						<option value={GameMode.vsComputer}>vs Computer</option>
					</select>
				</div>
				<div className="field">
					<label htmlFor="player-color">Play as</label>
					<select id="player-color" value={playerColor} onChange={(e) => setPlayerColor(e.target.value as PlayerColor)}>
						<option value={PlayerColor.white}>White</option>
						<option value={PlayerColor.black}>Black</option>
					</select>
				</div>
				{mode === GameMode.vsComputer && (
					<div className="field">
						<label htmlFor="difficulty">Difficulty</label>
						<select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
							<option value={Difficulty.easy}>Easy</option>
							<option value={Difficulty.medium}>Medium</option>
							<option value={Difficulty.hard}>Hard</option>
						</select>
					</div>
				)}
				<button type="submit">Start Game</button>
			</form>
		</div>
	);
};
