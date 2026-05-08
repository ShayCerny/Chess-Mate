## Problem Statement

ChessMate players currently lack essential gameplay feedback and control features standard in any chess application. Pieces can be selected and their possible moves highlighted, but these highlights persist incorrectly after deselection. There is no visual indication of whose turn it is, no feedback when a king is in check, no detection of checkmate or stalemate, no way to redo a move after undoing, and the Resign and Offer Draw buttons are unresponsive stubs. Together these gaps make the game feel incomplete and confusing to play.

## Solution

Deliver five interconnected improvements that bring ChessMate to a fully playable state:

1. **Deselect fix** — clear move highlights when a piece is deselected by re-clicking it or clicking an empty non-move square.
2. **Turn indication** — a colored dot + text label in the sidebar and a subtle board-side glow show whose turn it is at all times.
3. **Check feedback** — a red king-square highlight and a sidebar status message appear when the active player's king is in check.
4. **Checkmate & stalemate detection** — when the game ends naturally, a modal declares the result with "New Game" and "Review" actions.
5. **Redo** — an unlimited redo stack lets players replay undone moves; the stack is cleared when a new move is made.
6. **Resign & Draw** — Resign prompts a confirmation dialog then locks the board; Offer Draw immediately locks the board as a draw (faux-accept, naming preserved for future online play).

## User Stories

1. As a player, I want move highlights to disappear when I click my selected piece again, so that I can deselect without confusion.
2. As a player, I want move highlights to disappear when I click an empty square that is not a valid move destination, so that I can cancel a selection naturally.
3. As a player, I want to see a colored indicator and text in the sidebar showing whose turn it is, so that I always know who should move next.
4. As a player, I want the board to display a subtle glow or border highlight on the side belonging to the active player, so that I can orient myself quickly during local two-player games.
5. As a player, I want the active player's king square to turn red when their king is in check, so that I can immediately see the threat.
6. As a player, I want a text status message in the sidebar when my king is in check, so that I do not miss the check if I am not watching the board.
7. As a player, I want the check highlight and message to clear automatically once the check is resolved, so that the UI stays accurate.
8. As a player, I want the game to detect checkmate and display a modal declaring the winner, so that I know when the game has ended.
9. As a player, I want the checkmate modal to tell me who won, so that the result is unambiguous.
10. As a player, I want a "New Game" button in the result modal that resets the board, so that I can start a fresh game without restarting the app.
11. As a player, I want a "Review" button in the result modal that closes the modal and locks the board for browsing, so that I can look back through the move history.
12. As a player, I want the game to detect stalemate and display a modal declaring the draw, so that I know the game ended without a winner.
13. As a player, I want the board to be locked (no moves accepted) after checkmate, stalemate, resign, or draw, so that I cannot accidentally make moves after the game has ended.
14. As a player, I want the redo button to replay the most recently undone move, so that I can step forward through move history after undoing.
15. As a player, I want to redo multiple moves in sequence, so that I can navigate forward through all undone moves.
16. As a player, I want the redo stack to be cleared when I make a new move after undoing, so that the move tree stays linear.
17. As a player, I want the redo button to be disabled (visually inactive) when there are no moves to redo, so that I get clear feedback about what actions are available.
18. As a player, I want the undo button to be disabled when there are no moves to undo, so that the UI remains consistent.
19. As a player, I want to click Resign and be shown a confirmation dialog before the game ends, so that accidental clicks do not forfeit the game.
20. As a player, I want the confirmation dialog to clearly state that resigning will declare the opponent the winner, so that I know the consequences before confirming.
21. As a player, I want clicking "Offer Draw" to immediately declare the game a draw, so that local two-player games can be ended by mutual agreement.
22. As a player, I want the move history panel to remain browsable after the game ends in Review mode, so that I can study the game.
23. As a player, I want the turn indicator to update correctly after undo and redo, so that it always reflects the true current turn.
24. As a player, I want check detection to work for both white and black kings, so that both players receive feedback regardless of which side is in check.
25. As a player, I want the game-end modal to distinguish between checkmate and stalemate, so that I understand how the game ended.

## Implementation Decisions

### Module 1: isInCheck Engine Endpoint

A new `chess:is-in-check` IPC channel will be added to the Electron main process, backed by a new method on the native C++ chess addon. The preload bridge and the global `Window.electronAPI` type declaration will expose `isInCheck(fen: string): Promise<boolean>` to the renderer. This is the only authoritative source of check information; the renderer will not infer check from move data.

### Module 2: Game Status Resolver (pure function)

A pure function with the signature:

```ts
type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';
resolveGameStatus(legalMovesCount: number, isInCheck: boolean): GameStatus
```

- `legalMovesCount === 0 && isInCheck` → `'checkmate'`
- `legalMovesCount === 0 && !isInCheck` → `'stalemate'`
- `legalMovesCount > 0 && isInCheck` → `'check'`
- `legalMovesCount > 0 && !isInCheck` → `'playing'`

Called after every move (and after undo/redo) using the results of `getLegalMoves` and `isInCheck`, parallelised via `Promise.all` since both consume the same FEN.

### Module 3: Game Result State

The GameManager gains a `gameResult` state:

```ts
type GameResultReason = 'checkmate' | 'stalemate' | 'draw' | 'resign';
interface GameResult {
  reason: GameResultReason;
  winner?: PieceColor; // undefined for stalemate and draw
}
```

When `gameResult` is non-null, the board rejects all move inputs (locked state). Reset to `null` on "New Game".

### Module 4: Redo Stack

The GameManager gains a `futureMoves: IFullTurnMove[]` state array.

- On undo: the undone `IFullTurnMove` is pushed onto `futureMoves`.
- On redo: the top of `futureMoves` is popped and re-applied.
- On any new move: `futureMoves` is cleared.

### Module 5: GameEndModal Component

A new modal component receives `gameResult: GameResult | null` and callbacks `onNewGame` and `onReview`. Renders nothing when `gameResult` is null. When shown, displays a result headline and two buttons. Does not manage its own open/close state.

### Module 6: Turn Indicator & Board Glow

The sidebar gains a turn indicator region with a colored circle (white or black fill) and text ("White's Turn" / "Black's Turn"). The board wrapper gains a CSS class that highlights the board edge on the active player's side (bottom for white, top for black in default orientation). Both update reactively from `board.colorTurn`.

### Module 7: Deselect Fix

The `handleSelect` function in GameManager is updated so that:

- Clicking the currently selected square calls `setSelectedSquare(null)` and `setMoves([])`.
- Clicking any square that is not a legal move destination and does not contain a friendly piece also calls `setSelectedSquare(null)` and `setMoves([])`.

### Resign & Draw Flow

- **Resign**: renders an inline or dialog confirmation before acting. On confirmation, sets `gameResult` to `{ reason: 'resign', winner: <opponent color> }`.
- **Offer Draw**: immediately sets `gameResult` to `{ reason: 'draw' }`. Button label stays "Offer Draw" to preserve semantics for future online implementation.

## Testing Decisions

Good tests verify observable behavior from the outside — given inputs, assert outputs — without asserting on internal state shape or implementation details.

**Game Status Resolver** is the highest-priority test target. It is a pure function with no dependencies; every branch (playing, check, checkmate, stalemate) can be verified with a simple unit test table.

**Redo Stack logic** should be tested as a reducer: given a sequence of move/undo/redo actions, assert the resulting `pastMoves` and `futureMoves` arrays contain the correct snapshots in the correct order.

**isInCheck IPC endpoint** should have an integration test that invokes the handler with known FEN strings for positions in check, not in check, and checkmate, asserting the correct boolean result.

There is no existing test infrastructure in the codebase. Vitest is recommended as a lightweight co-located test runner. No prior test art exists to reference.

## Out of Scope

- Online multiplayer draw negotiation (accept/decline flow) — "Offer Draw" is a faux-immediate draw for now.
- Move analysis, blunder detection, and suggested better moves in Review mode — reserved for a future PRD.
- Board flip / perspective toggle.
- Time controls and clocks.
- Opening book or engine evaluation display.
- Promotion piece selection UI.

## Further Notes

- The `isInCheck` and `getLegalMoves` calls after each move can be parallelised via `Promise.all` since both take the same FEN and are independent.
- Undo and redo must re-run the game status check after restoring board state so that check/checkmate indicators stay accurate during history navigation.
- The "Offer Draw" button name is intentionally preserved to avoid a future rename when online play is added.
- Future analysis feature (better moves, blunders) will be added to Review mode via a separate PRD, using the existing `getBestMove(fen)` engine endpoint as a starting point.
