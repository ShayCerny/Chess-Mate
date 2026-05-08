## What to build

When a player clicks a selected piece again, or clicks an empty square that is not a valid move destination, the move highlights disappear and the selection is cleared. Currently highlights persist until a move is made, leaving the board in a confusing state.

## Acceptance criteria

- [ ] Clicking the currently selected piece again clears all move highlights and deselects it
- [ ] Clicking an empty square that is not in the legal move list clears all move highlights and deselects the active piece
- [ ] Clicking a valid move destination still executes the move (no regression)
- [ ] Clicking a friendly piece when another piece is selected switches selection to the new piece (no regression)

## Blocked by

None — can start immediately.
