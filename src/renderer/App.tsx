import { useState } from "react";
import { MainMenu } from "./components/MainMenu";
import { GameManager } from "./components/GameManager";
import { GameConfig } from "./types";
import "./styles/app.scss";

function App() {
	const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

	if (gameConfig === null) {
		return <MainMenu onStart={setGameConfig} />;
	}

	return (
		<GameManager
			{...gameConfig}
			onReturnToMenu={() => setGameConfig(null)}
		/>
	);
}

export default App;
