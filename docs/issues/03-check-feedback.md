## What to build

When the active player's king is in check, the king's square turns red and a status message appears in the sidebar ("White is in check" / "Black is in check"). Both clear automatically when the check is resolved. This requires adding an `isInCheck(fen)` endpoint to the native chess engine and wiring it through the IPC layer.

The full vertical:
- Native C++ addon exposes an `isInCheck` method
- Electron main process registers a `chess:is-in-check` IPC handler
- Preload bridge exposes `window.electronAPI.isInCheck(fen): Promise<boolean>`
- After each move, `getLegalMoves` and `isInCheck` are called in parallel
- A pure `resolveGameStatus(legalMovesCount, isInCheck)` function derives the current status:
  - `legalMovesCount > 0 && isInCheck` → `'check'`
  - `legalMovesCount > 0 && !isInCheck` → `'playing'`
  - (checkmate/stalemate cases consumed by a later slice)
- The king square receives a red highlight when status is `'check'`
- The sidebar displays the check message when status is `'check'`

## Acceptance criteria

- [ ] Moving a piece such that the opponent's king is in check causes that king's square to turn red
- [ ] The sidebar displays which player is in check
- [ ] The check highlight and message disappear after the checked player makes a legal move that resolves check
- [ ] Check is detected correctly for both white and black kings
- [ ] `getLegalMoves` and `isInCheck` are called in parallel (not sequentially) after each move

## Blocked by

None — can start immediately.
