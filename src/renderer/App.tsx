import ReactIcon from "../assets/react.svg?react";
import ViteIcon from "../assets/Vite.js.svg?react";
import ElectronIcon from "../assets/electron.svg?react";

import "./styles/app.scss";

function App() {
	return (
		<div className="app">
			<div className="icons">
				<a id="electron-icon" target="_blank" href="https://www.electronjs.org/docs/latest/">
					<ElectronIcon />
				</a>
				<a id="react-icon" target="_blank" href="https://react.dev/learn">
					<ReactIcon />
				</a>
				<a id="vite-icon" target="_blank" href="https://vite.dev/guide/">
					<ViteIcon />
				</a>
			</div>
			<h1>Click the icons to learn more</h1>
		</div>
	);
}

export default App;
