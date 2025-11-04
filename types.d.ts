// types.d.ts
// Global TypeScript declarations for the Electron application

//Example: Declare a global variable for the application version
declare const APP_VERSION: string;

//Example: Extend the Window interface to include custom properties
interface Window {
  myCustomProperty: string;
}

interface IPiece {
	type: string;
	color: string;
}

interface ITurnMove{
    white: string;
    black: string;
}

interface IBoardProps {
	board: IPiece[];
	highlight: number | null; // index or space code of square that should be highlighted
	moves: IMove[]; // Indices of spaces that should be displayed as moves
}

enum MoveType{
  NORMAL = 0,
  ATTACK = 1
}

interface IMove{
  square: number;
  type: MoveType;
}