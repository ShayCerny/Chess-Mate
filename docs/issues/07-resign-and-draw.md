## What to build

The Resign and Offer Draw buttons are wired up. Clicking Resign shows a confirmation dialog; confirming sets `gameResult` to `{ reason: 'resign', winner: <opponent> }` and locks the board. Clicking Offer Draw immediately sets `gameResult` to `{ reason: 'draw' }` and locks the board (faux-accept for local play; button name preserved for future online implementation). The game-end modal from slice #5 handles display for both outcomes.

## Acceptance criteria

- [ ] Clicking Resign shows a confirmation dialog explaining the opponent will be declared winner
- [ ] Confirming the resign dialog locks the board and triggers the game-end modal showing the result
- [ ] Cancelling the resign dialog does nothing — the game continues
- [ ] Clicking Offer Draw immediately locks the board and triggers the game-end modal showing a draw
- [ ] The Offer Draw button is labelled "Offer Draw" (not renamed)
- [ ] Both outcomes are correctly passed to the game-end modal (resign shows winner, draw shows no winner)

## Blocked by

- Slice #4 (Game Result State & Board Locking)
- Slice #5 (Game-End Modal) — modal must exist to display resign/draw results
