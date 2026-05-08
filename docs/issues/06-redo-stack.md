## What to build

The redo button is wired up with an unlimited redo stack. Undoing a move pushes it onto `futureMoves`; redoing pops it and re-applies it. Making any new move clears `futureMoves`. The game status check (check/checkmate/stalemate) reruns after each redo so indicators stay accurate. The undo and redo buttons are visually disabled when their respective stacks are empty.

## Acceptance criteria

- [ ] Clicking Redo after an undo restores the board to the state before the undo
- [ ] Multiple sequential redos work correctly, stepping forward through all undone moves
- [ ] Making a new move after undoing clears the redo stack (the undone moves are gone)
- [ ] Redo button is disabled when there are no moves to redo
- [ ] Undo button is disabled when there are no moves to undo
- [ ] Check highlight and sidebar message update correctly after a redo
- [ ] Turn indicator updates correctly after a redo

## Blocked by

- Slice #3 (Check Feedback) — redo must rerun `resolveGameStatus` after restoring board state
