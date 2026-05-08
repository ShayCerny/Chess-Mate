## What to build

When `gameResult` becomes non-null due to checkmate or stalemate, a modal overlay appears declaring the result. The modal has two actions: "New Game" resets the board to the starting position and closes the modal; "Review" closes the modal and leaves the board locked so the player can browse the move history.

The modal distinguishes between checkmate ("Checkmate — [Color] wins") and stalemate ("Stalemate — Draw"). It does not appear for resign or draw (those are handled in a later slice).

## Acceptance criteria

- [ ] Checkmate triggers the modal with a headline identifying the winner
- [ ] Stalemate triggers the modal with a draw headline
- [ ] "New Game" resets the board, clears move history, and closes the modal
- [ ] "Review" closes the modal while keeping the board locked and move history intact
- [ ] The modal cannot be dismissed by clicking outside it or pressing Escape (game has ended)
- [ ] The move history panel remains scrollable in Review mode

## Blocked by

- Slice #4 (Game Result State & Board Locking)
