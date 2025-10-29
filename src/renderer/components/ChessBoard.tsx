
import '../styles/chess.scss';

const getboard = () => {
    const board = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    for (const rank of ranks) {
        for (const file of files) {
            const squareColor = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0 ? 'light' : 'dark';
            board.push(
                <div key={`${file}${rank}`} className={`square ${squareColor}`} >
                    {/* Placeholder for piece */}
                </div>
            );
        }
    }
    return board;
}

export const ChessBoard = () => {
    return (
        <div className="board">
            {getboard()}
        </div>
    )
}