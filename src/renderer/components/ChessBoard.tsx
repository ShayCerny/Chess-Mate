import { useState } from 'react';
import '../styles/chess.scss';
import Piece from './Piece';


interface Pos{
    file: string;
    rank: number;
}

const getBoard = (selectedPos: Pos|null, handleSetSelectedSpace:(f:string,r:number)=>void)=>{
    const board = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    
    for (const rank of ranks) {
        for (const file of files) {
            let squareColor = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0 ? 'light' : 'dark';
            
            if (selectedPos && selectedPos.file === file && selectedPos.rank === rank) squareColor += ' selected';
            
            board.push(
                <div key={`${file}${rank}`} className={`square ${squareColor}`} onClick={()=>{handleSetSelectedSpace(file, rank)}} >
                    <Piece type="pawn" color="w"/>
                    <div className="space-code"><p>{file}{rank}</p></div>
                </div>
            );
        }
    }
    
    return board;
}

export const ChessBoard = () => {
    // const [board, setBoard] = useState([])
    const [selectedSpace, setSelectedSpace] = useState(null as Pos|null);
    
    function handleSetSelectedSpace(f:string, r:number){
        const pos:Pos = {file:f, rank:r};
        setSelectedSpace(pos);
    }
    
    return (
        <div className="board">
            {getBoard(selectedSpace, handleSetSelectedSpace)}
        </div>
    )
}