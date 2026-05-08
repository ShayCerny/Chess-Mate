## What to build

The GameManager gains a `gameResult` state that records how the game ended and who won (if anyone). When `gameResult` is non-null the board rejects all move inputs — no piece can be selected or moved. The state is reset to null when a new game begins.

The `GameResult` shape (from the PRD):

```ts
type GameResultReason = 'checkmate' | 'stalemate' | 'draw' | 'resign';
interface GameResult {
  reason: GameResultReason;
  winner?: PieceColor; // undefined for stalemate and draw
}
```

Checkmate and stalemate are detected automatically using the `resolveGameStatus` result from slice #3: `legalMovesCount === 0 && isInCheck` → checkmate; `legalMovesCount === 0 && !isInCheck` → stalemate.

## Acceptance criteria

- [ ] After checkmate is detected the board immediately stops accepting moves
- [ ] After stalemate is detected the board immediately stops accepting moves
- [ ] `gameResult.winner` is set correctly for checkmate (the player who gave checkmate)
- [ ] `gameResult.winner` is undefined for stalemate
- [ ] Starting a new game resets `gameResult` to null and the board accepts moves again

## Blocked by

- Slice #3 (Check Feedback) — depends on `resolveGameStatus` and `isInCheck` IPC endpoint
